import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeChoice } from '../src/reading/grade';
import type { ReadingQuestion } from '../src/reading/types';

const question = (over: Partial<ReadingQuestion>): ReadingQuestion =>
  ({
    id: 'Q1',
    english: 'Why?',
    arabic: 'ليه؟',
    attempt: 'choice',
    options: ['عشان يبرّدوا الحجر', 'عشان يقللوا الاحتكاك'],
    answer: { english: 'To reduce the friction', arabic: 'عشان يقللوا  الاحتكاك' },
    ...over,
  }) as ReadingQuestion;

test('a choice is graded only when the model answer names exactly one option', () => {
  assert.equal(gradeChoice(question({}), 'عشان يقللوا الاحتكاك'), true);
  assert.equal(gradeChoice(question({}), 'عشان يبرّدوا الحجر'), false);
  assert.equal(gradeChoice(question({}), ''), undefined, 'no answer, no grade');
  assert.equal(
    gradeChoice(question({ answer: { english: 'It is cheaper', arabic: 'أرخص' } }), 'أرخص'),
    undefined,
    'a model answer that is not an option never marks the learner wrong',
  );
  assert.equal(
    gradeChoice(
      question({ options: ['Melting', 'melting '], answer: { english: 'Melting', arabic: '' } }),
      'Melting',
    ),
    undefined,
    'two matching options are ambiguous',
  );
  assert.equal(
    gradeChoice(question({ attempt: 'choice-and-written' }), 'عشان يقللوا الاحتكاك'),
    undefined,
  );
  assert.equal(
    gradeChoice(
      question({
        options: ['Melting', 'Freezing'],
        answer: { english: 'melting', arabic: 'انصهار' },
      }),
      'Melting',
    ),
    true,
    'English answers match regardless of case',
  );
});
