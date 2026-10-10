import type { LessonContext } from '@learn/lesson-runtime';
export type NovaMode = 'chat' | 'voice';
export type NovaPurpose = 'help' | 'quiz';
export type Message = { id: string; role: 'user' | 'assistant'; text: string };
export type Position = Pick<
  LessonContext,
  'lessonId' | 'contentRevision' | 'sceneId' | 'phase' | 'frame'
>;
export type PracticeQuestion = {
  english: string;
  arabic: string;
  options: string[];
  correct: number;
  explanation: string;
  englishAnswer: string;
  sceneId: string;
};
export type Quiz = {
  questions: PracticeQuestion[];
  answers: number[];
  index: number;
  revealed: boolean;
};
export const positionOf = (context: LessonContext): Position => ({
  lessonId: context.lessonId,
  contentRevision: context.contentRevision,
  sceneId: context.sceneId,
  phase: context.phase,
  frame: context.frame,
});
