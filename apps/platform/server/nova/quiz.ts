import { HttpError } from '../http';
export type PracticeQuestion = {
  english: string;
  arabic: string;
  options: string[];
  correct: number;
  explanation: string;
  englishAnswer: string;
  sceneId: string;
};
export const quizSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      minItems: 10,
      maxItems: 10,
      items: {
        type: 'object',
        properties: {
          english: { type: 'string' },
          arabic: { type: 'string' },
          options: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
          correct: { type: 'integer', minimum: 0, maximum: 3 },
          explanation: { type: 'string' },
          englishAnswer: { type: 'string' },
          sceneId: { type: 'string' },
        },
        required: [
          'english',
          'arabic',
          'options',
          'correct',
          'explanation',
          'englishAnswer',
          'sceneId',
        ],
      },
    },
  },
  required: ['questions'],
};
export function validateQuiz(value: unknown, sceneIds: Set<string>): PracticeQuestion[] {
  const questions = (value as { questions?: unknown })?.questions;
  if (!Array.isArray(questions) || questions.length !== 10)
    throw new HttpError(502, 'الاختبار لم يكتمل. جرّب تاني.');
  const seen = new Set<string>();
  for (const q of questions) {
    if (
      !q ||
      !['english', 'arabic', 'explanation', 'englishAnswer', 'sceneId'].every(
        (k) => typeof q[k] === 'string' && q[k].trim() && q[k].length <= 1500,
      ) ||
      !sceneIds.has(q.sceneId) ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      !q.options.every((s: unknown) => typeof s === 'string' && s.trim() && s.length <= 400) ||
      new Set(q.options).size !== 4 ||
      !Number.isInteger(q.correct) ||
      q.correct < 0 ||
      q.correct > 3 ||
      seen.has(q.english.trim().toLowerCase())
    )
      throw new HttpError(502, 'أسئلة الاختبار محتاجة إعادة تجهيز. جرّب تاني.');
    seen.add(q.english.trim().toLowerCase());
  }
  return questions as PracticeQuestion[];
}
