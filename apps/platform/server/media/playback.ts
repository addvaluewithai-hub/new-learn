import type { ReadingPackage } from '@learn/lesson-runtime/core';
import type { Db } from '../db/connection';
import type { CourseVoice } from '../db/authoring';
import type { AudioWord } from '../db/media';
import { lessonLines } from './lines';
import { recordedClips } from './narration';

// What a player needs to play a lesson's recorded narration (docs/voice-agent.md): for each
// line that has a clip, the clip's hash, its length and its word timings. Lines without a
// clip are absent, and the player reads them live.

export type LessonAudio = Record<string, { hash: string; seconds: number; words: AudioWord[] }>;

export async function lessonAudioMap(
  db: Db,
  pkg: ReadingPackage,
  voice: CourseVoice | null,
  language: string,
): Promise<LessonAudio> {
  const lines = await lessonLines(pkg, voice, language);
  const clips = await recordedClips(
    db,
    lines.map((l) => l.hash),
  );
  const byHash = new Map(clips.map((c) => [c.hash, c]));
  const out: LessonAudio = {};
  for (const line of lines) {
    const clip = byHash.get(line.hash);
    if (clip) out[line.id] = { hash: clip.hash, seconds: clip.seconds, words: clip.words };
  }
  return out;
}
