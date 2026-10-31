import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/connection';
import { buildJobs } from '../db/builds';
import { lessonAudio, type AudioWord } from '../db/media';
import { HttpError } from '../http';
import type { MediaStore } from '../env';
import { DEFAULT_VOICE, LINE_LIMITS } from './lines';
import { linesOf, recordedClips } from './narration';

// The media worker's side of a voice job (docs/worker-cloud-run.md): the lines to record,
// and each clip as it comes back, kept in R2 by its hash and noted in lesson_audio.

export const clipKey = (hash: string) => `audio/${hash}.wav`;
const HASH = /^[0-9a-f]{64}$/;

async function voiceJob(db: Db, jobId: string) {
  const [job] = await db.select().from(buildJobs).where(eq(buildJobs.id, jobId));
  if (!job?.request.voice) throw HttpError.plain(404, 'Unknown voice job.');
  if (job.status !== 'running') throw HttpError.plain(409, 'The job is not running.');
  return job;
}

/** What the worker records: the course's voice and language, and the lines without a clip. */
export async function voiceLines(db: Db, jobId: string) {
  const job = await voiceJob(db, jobId);
  const target = job.request.voice!;
  const { lines, voice, language } = await linesOf(
    db,
    job.ownerId,
    target.lessonId,
    target.revision,
  );
  const have = new Set(
    (
      await recordedClips(
        db,
        lines.map((l) => l.hash),
      )
    ).map((c) => c.hash),
  );
  return {
    voice: voice ?? DEFAULT_VOICE,
    language,
    lines: lines
      .filter((l) => !have.has(l.hash))
      .map(({ id, text, tone, hash }) => ({ id, text, tone, hash })),
  };
}

/** A clip as the worker sends it, checked. */
export function clipInput(value: Record<string, unknown>) {
  const hash = String(value.hash ?? '');
  if (!HASH.test(hash)) throw HttpError.plain(400, 'hash: 64 hex characters.');
  const wav = typeof value.wav === 'string' ? value.wav : '';
  if (!wav || wav.length > (LINE_LIMITS.wavBytes * 4) / 3 + 4)
    throw HttpError.plain(400, 'wav: base64 audio up to 8 MB.');
  const seconds = Number(value.seconds);
  if (!(seconds > 0 && seconds <= LINE_LIMITS.seconds))
    throw HttpError.plain(400, `seconds: 0-${LINE_LIMITS.seconds}.`);
  const words = Array.isArray(value.words) ? value.words : [];
  if (words.length > LINE_LIMITS.words) throw HttpError.plain(400, 'words: too many.');
  const clean: AudioWord[] = words.map((w) => {
    const word = w as Record<string, unknown>;
    const t0 = Number(word.t0),
      t1 = Number(word.t1);
    if (typeof word.w !== 'string' || !(t0 >= 0) || !(t1 >= t0))
      throw HttpError.plain(400, 'words: {w, t0, t1} each.');
    return { w: word.w.slice(0, 80), t0, t1 };
  });
  const score = value.score === null || value.score === undefined ? null : Number(value.score);
  if (score !== null && !(score >= 0 && score <= 1)) throw HttpError.plain(400, 'score: 0-1.');
  return {
    hash,
    wav,
    seconds,
    words: clean,
    heard: String(value.heard ?? '').slice(0, 4000),
    score,
    flagged: value.flagged === true,
    model: String(value.model ?? '').slice(0, 80),
  };
}

/** Keep one clip: the audio in R2 under its hash, the timings and the check in the table. */
export async function saveClip(
  db: Db,
  media: MediaStore | undefined,
  jobId: string,
  clip: ReturnType<typeof clipInput>,
) {
  if (!media) throw HttpError.plain(503, 'No media store is bound.');
  const job = await voiceJob(db, jobId);
  const target = job.request.voice!;
  const { lines } = await linesOf(db, job.ownerId, target.lessonId, target.revision);
  if (!lines.some((l) => l.hash === clip.hash))
    throw HttpError.plain(400, 'hash: not a line of this job.');
  const bytes = Uint8Array.from(atob(clip.wav), (c) => c.charCodeAt(0));
  if (bytes.length < 44 || String.fromCharCode(...bytes.subarray(0, 4)) !== 'RIFF')
    throw HttpError.plain(400, 'wav: not a WAV file.');
  await media.put(clipKey(clip.hash), bytes, { httpMetadata: { contentType: 'audio/wav' } });
  const row = {
    ownerId: job.ownerId,
    seconds: clip.seconds,
    words: clip.words,
    heard: clip.heard,
    score: clip.score,
    flagged: clip.flagged,
    model: clip.model,
  };
  await db
    .insert(lessonAudio)
    .values({ hash: clip.hash, ...row })
    .onConflictDoUpdate({ target: lessonAudio.hash, set: row });
  const [count] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(lessonAudio)
    .where(and(eq(lessonAudio.ownerId, job.ownerId), eq(lessonAudio.hash, clip.hash)));
  return { ok: true, saved: count.n };
}
