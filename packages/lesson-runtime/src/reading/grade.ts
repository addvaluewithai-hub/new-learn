import type { ReadingQuestion } from './types';

const plain = (text: string) => text.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * A choice answer, graded by our code like a board answer: right when it is the one option that
 * matches the model answer (Arabic or English, ignoring spacing and case). No grade when the
 * question is not a plain choice or its model answer does not name exactly one option, so a
 * loosely worded answer is never marked wrong.
 */
export function gradeChoice(question: ReadingQuestion, answer: string | undefined) {
  if (question.attempt !== 'choice' || !answer) return undefined;
  const model = [question.answer.arabic, question.answer.english].filter(Boolean).map(plain);
  const right = question.options.filter((option) => model.includes(plain(option)));
  if (right.length !== 1) return undefined;
  return plain(answer) === plain(right[0]);
}
