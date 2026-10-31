import type { ReadingPackage } from '@learn/lesson-runtime/core';
import type { CourseVoice } from '../db/authoring';

// The lines of a lesson that narration records (docs/voice-agent.md): every step of every
// scene, the question, and the feedback steps, each with the hash of what is said and how.
// The hash is the clip's name in R2 and in lesson_audio: the same words in the same voice,
// tone and language are one clip, in any lesson.

/** A line as the media worker records it and the player finds it again. */
export type Line = { id: string; text: string; tone: string; hash: string };

/** The voice a course without one of its own records in. */
export const DEFAULT_VOICE: CourseVoice = { voice: 'Kore', pace: 'normal', persona: '' };

/** Lines a teacher can record in one job; a lesson has at most 40 scenes × 20 steps. */
export const LINE_LIMITS = { perJob: 800, seconds: 180, words: 600, wavBytes: 8_000_000 };

/** Spoken Arabic and English both run near twelve characters a second. */
export const estimateSeconds = (text: string) => Math.max(1, text.length / 12);

export async function hashLine(
  voice: CourseVoice,
  language: string,
  text: string,
  tone: string,
): Promise<string> {
  const data = new TextEncoder().encode(
    JSON.stringify([voice.voice, voice.pace, voice.persona, language, text, tone]),
  );
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The lines of a package in reading order; `id` is where the line sits in the lesson. */
export async function lessonLines(
  pkg: ReadingPackage,
  voice: CourseVoice | null,
  language: string,
): Promise<Line[]> {
  const v = voice ?? DEFAULT_VOICE;
  const out: Line[] = [];
  const add = async (id: string, text: string, tone = '') => {
    const clean = text.trim();
    if (clean) out.push({ id, text: clean, tone, hash: await hashLine(v, language, clean, tone) });
  };
  for (const scene of pkg.scenes) {
    for (const [i, step] of scene.steps.entries())
      await add(`${scene.id}:n:${i}`, step.text, step.tone ?? '');
    const q = scene.question;
    if (!q) continue;
    await add(`${scene.id}:q`, language === 'ar' ? q.arabic || q.english : q.english || q.arabic);
    for (const [i, step] of q.feedback.steps.entries())
      await add(`${scene.id}:f:${i}`, step.text, step.tone ?? '');
  }
  return out;
}
