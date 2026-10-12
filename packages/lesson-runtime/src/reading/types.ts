import type { LessonLayout, VisualSpec } from '../types';

// Text-first lesson: the learner advances one semantic unit at a time and reads the
// written version while the lesson's own board shows the state reached after that unit.
// No audio, no timing evidence. Text may mark symbols as $…$ (rendered left-to-right).
export type ReadingStep = { unitIds: string[]; text: string; written?: boolean };
export type ReadingQuestion = {
  id: string;
  english: string;
  arabic: string;
  attempt: 'written' | 'choice' | 'choice-and-written';
  options: string[];
  answer: { english: string; arabic: string };
  feedback: { clipId: string; steps: ReadingStep[]; visual: VisualSpec | null };
};
export type ReadingScene = {
  id: string;
  title: string;
  clipId: string;
  visual: VisualSpec;
  steps: ReadingStep[];
  question?: ReadingQuestion;
};
export type ReadingPackage = {
  schemaVersion: 1;
  delivery: 'reading';
  lessonId: string;
  curriculumId: string;
  contentRevision: string;
  title: string;
  englishTitle: string;
  curriculumTitle: string;
  lessonOrder: number;
  fps: number;
  dimensions: Record<LessonLayout, { width: number; height: number }>;
  scenes: ReadingScene[];
  glossary: Array<{ term: string; meaning: string }>;
  /** Learning goals: taught in `sceneIds`, checked by the questions in `questionIds`. */
  goals?: ReadingGoal[];
};
export type ReadingGoal = { id: string; text: string; sceneIds: string[]; questionIds: string[] };
/** One screen of the reading flow. `attempt` is the answer form of a question scene. */
export type ReadingPage = {
  scene: number;
  kind: 'teach' | 'ask' | 'attempt' | 'feedback';
  step: number;
};
