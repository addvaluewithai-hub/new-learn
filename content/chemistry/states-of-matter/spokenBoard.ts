import type { LessonRecording, TimedWord } from '@learn/lesson-runtime/core';

export type SpokenChunk = { atMs: number; endMs: number; text: string; language: 'ar' | 'en' };
const languageOf = (word: TimedWord) => (/[\u0600-\u06ff]/u.test(word.text) ? 'ar' : 'en');

// Read delivered word timing, never guess pacing from the requested script.
// Keep whole clauses legible; disclose only the clause currently being spoken.
export function spokenChunks(recording: LessonRecording, fromMs = 0): SpokenChunk[] {
  if (!recording.words?.length) throw new Error('Missing delivered word timing');
  let previous = -1;
  for (const word of recording.words) {
    if (
      !word.text.trim() ||
      !Number.isFinite(word.start_ms) ||
      !Number.isFinite(word.end_ms) ||
      word.start_ms < previous ||
      word.end_ms <= word.start_ms ||
      word.end_ms > recording.durationMs
    )
      throw new Error('Invalid delivered word timing');
    previous = word.start_ms;
  }
  const words = recording.words.filter((word) => word.start_ms >= fromMs);
  const chunks: SpokenChunk[] = [];
  let pending: TimedWord[] = [];
  const flush = () => {
    if (!pending.length) return;
    chunks.push({
      atMs: pending[0].start_ms,
      endMs: pending.at(-1)!.end_ms,
      text: pending.map((word) => word.text).join(' '),
      language: pending.some((word) => languageOf(word) === 'ar') ? 'ar' : 'en',
    });
    pending = [];
  };
  for (const word of words) {
    const language = languageOf(word);
    // Embedded English scientific terms stay with their Arabic sentence.
    if (pending.length && language === 'ar' && pending.every((w) => languageOf(w) === 'en'))
      flush();
    pending.push(word);
    const limit = pending.some((w) => languageOf(w) === 'ar') ? 15 : 19;
    if (/[.!?؟]$/u.test(word.text) || pending.length >= limit) flush();
  }
  flush();
  return chunks;
}

export function spokenChunkAt(
  recording: LessonRecording,
  frame: number,
  fromMs = 0,
  fps = 30,
): SpokenChunk | undefined {
  const ms = (frame / fps) * 1000;
  if (ms < fromMs) return undefined;
  let current: SpokenChunk | undefined;
  for (const chunk of spokenChunks(recording, fromMs)) {
    if (chunk.atMs > ms) break;
    current = chunk;
  }
  return current;
}

export function questionIsReading(recording: LessonRecording, frame: number, fps = 30) {
  return recording.questionAtMs != null && (frame / fps) * 1000 >= recording.questionAtMs;
}
