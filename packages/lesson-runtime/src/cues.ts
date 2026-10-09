import type { LessonRecording } from './types';

export function cueIsVisible(recording: LessonRecording, id: string, frame: number, fps: number) {
  const cue = recording.cues.find((item) => item.id === id);
  if (!cue) throw new Error(`Missing semantic cue: ${id}`);
  return (frame * 1000) / fps >= cue.atMs;
}

export function visibleQuestionParts(
  question: import('./types').LessonQuestion,
  recording: LessonRecording,
  frame: number,
  fps: number,
) {
  const ms = (frame * 1000) / fps;
  // Existing packages can show the English question at their measured onset.
  // Additional clauses/translations require explicit delivered-word anchors.
  const parts = question.readingParts ?? [
    {
      text: question.english,
      atMs: recording.questionAtMs!,
      language: 'en' as const,
    },
  ];
  return parts.filter((part) => ms >= part.atMs);
}
