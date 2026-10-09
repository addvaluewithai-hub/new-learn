import type { LessonPackage, LessonQuestion } from './types';
export type Completion =
  | { type: 'await-attempt' }
  | { type: 'next'; index: number }
  | { type: 'review' };
export function completionFor(pkg: LessonPackage, index: number, feedback: boolean): Completion {
  const scene = pkg.scenes[index];
  if (!scene) throw new Error('Scene outside lesson');
  if (!feedback && scene.question) return { type: 'await-attempt' };
  return index + 1 < pkg.scenes.length ? { type: 'next', index: index + 1 } : { type: 'review' };
}
export function canSubmitAttempt(
  question: LessonQuestion,
  choice: number | undefined,
  written: string,
) {
  const validChoice =
    choice !== undefined &&
    Number.isInteger(choice) &&
    choice >= 0 &&
    choice < question.options.length;
  const hasWriting = /[\p{L}\p{N}]/u.test(written.trim());
  return question.attempt === 'choice'
    ? validChoice
    : question.attempt === 'written'
      ? hasWriting
      : validChoice && hasWriting;
}
export function nextQuestionIndex(pkg: LessonPackage, index: number) {
  return pkg.scenes.findIndex((scene, i) => i >= index && scene.question);
}
