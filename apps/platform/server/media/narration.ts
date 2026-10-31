import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '../db/connection';
import { authorCourses } from '../db/authoring';
import { buildJobs, type BuildRequest } from '../db/builds';
import { lessonAudio } from '../db/media';
import { HttpError } from '../http';
import type { AuthUser } from '../env';
import { courseLessons, getLesson, lessonRow } from '../authoring/store';
import { ACTIONS } from '../../src/features/credits/pricing';
import { createJob, view } from '../builds/jobs';
import { estimateSeconds, lessonLines, LINE_LIMITS, type Line } from './lines';

// Recording a lesson's narration (docs/voice-agent.md): the teacher sees what it would cost,
// asks, and a `voice` job goes to the media worker (docs/worker-cloud-run.md), which records
// only the lines that have no clip yet. Charged per estimated minute (`voice.minute`).

/** The clips that exist for these hashes. */
export async function recordedClips(db: Db, hashes: string[]) {
  if (!hashes.length) return [];
  return db.select().from(lessonAudio).where(inArray(lessonAudio.hash, hashes));
}

/** The lesson's lines at one revision, in its course's voice and language. */
export async function linesOf(db: Db, owner: string, lessonId: string, revision?: number) {
  const got = await getLesson(db, owner, lessonId, revision);
  const [course] = await db
    .select({ voice: authorCourses.voice, language: authorCourses.language })
    .from(authorCourses)
    .where(eq(authorCourses.id, got.lesson.courseId));
  const voice = course?.voice ?? null;
  const language = course?.language ?? 'ar';
  const lines = await lessonLines(got.package, voice, language);
  return { lines, voice, language, revision: got.revision, courseId: got.lesson.courseId };
}

export const minutesFor = (lines: Line[]) =>
  Math.max(1, Math.ceil(lines.reduce((s, l) => s + estimateSeconds(l.text), 0) / 60));

/** Where one lesson's narration stands: recorded, to record, flagged, and the price. */
async function lessonPlan(db: Db, owner: string, lessonId: string) {
  const { lines, revision } = await linesOf(db, owner, lessonId);
  const clips = await recordedClips(
    db,
    lines.map((l) => l.hash),
  );
  const have = new Set(clips.map((c) => c.hash));
  const missing = lines.filter((l) => !have.has(l.hash));
  const minutes = missing.length ? minutesFor(missing) : 0;
  return {
    lessonId,
    revision,
    lines: lines.length,
    recorded: lines.length - missing.length,
    toRecord: missing.length,
    flagged: clips.filter((c) => c.flagged).length,
    seconds: Math.round(clips.reduce((s, c) => s + c.seconds, 0)),
    minutes,
    credits: minutes * ACTIONS['voice.minute'].credits,
  };
}

/** Every lesson of the course with its narration plan and its latest voice job. */
export async function narrationPlan(db: Db, owner: string, courseId: string) {
  const lessons = await courseLessons(db, owner, courseId);
  const jobs = await db
    .select()
    .from(buildJobs)
    .where(
      and(
        eq(buildJobs.ownerId, owner),
        sql`${buildJobs.request}->'voice'->>'courseId' = ${courseId}`,
      ),
    )
    .orderBy(sql`${buildJobs.createdAt} desc`);
  const out = [];
  for (const lesson of lessons) {
    const job = jobs.find((j) => j.request.voice?.lessonId === lesson.id);
    out.push({
      ...(await lessonPlan(db, owner, lesson.id)),
      title: lesson.title,
      job: job ? view(job) : null,
    });
  }
  return { lessons: out, pricePerMinute: ACTIONS['voice.minute'].credits };
}

/** Queue the recording of one lesson's missing lines; nothing to record is a 409. */
export async function createNarration(db: Db, user: AuthUser, lessonId: string) {
  const lesson = await lessonRow(db, user.id, lessonId).catch(() => {
    throw new HttpError(404, 'builds.lessonMissing');
  });
  const plan = await lessonPlan(db, user.id, lessonId);
  if (!plan.toRecord) throw new HttpError(409, 'voice.nothingToRecord');
  if (plan.toRecord > LINE_LIMITS.perJob) throw new HttpError(400, 'voice.tooManyLines');
  const request: BuildRequest = {
    topic: lesson.title,
    choices: {},
    webSearch: false,
    voice: { courseId: lesson.courseId, lessonId, revision: lesson.revision, lines: plan.toRecord },
  };
  return createJob(db, user, { request, files: [] }, 'voice.minute', plan.minutes);
}

/**
 * A voice job is done when every line of its lesson revision has a clip. The worker's own
 * message says how many it flagged (`flagged:N`).
 */
export async function voiceMade(db: Db, job: typeof buildJobs.$inferSelect) {
  const target = job.request.voice!;
  const { lines } = await linesOf(db, job.ownerId, target.lessonId, target.revision).catch(() => ({
    lines: [] as Line[],
  }));
  if (!lines.length) return false;
  const clips = await recordedClips(
    db,
    lines.map((l) => l.hash),
  );
  return clips.length === lines.length;
}
