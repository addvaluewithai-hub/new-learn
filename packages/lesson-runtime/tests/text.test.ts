import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RUNTIME_TEXT, fill } from '../src/text';
import { describeValues } from '../src/board/manifest';

test('runtime texts are whole, non-empty messages; placeholders fill by name', () => {
  for (const [key, text] of Object.entries(RUNTIME_TEXT)) assert.ok(text.trim(), key);
  assert.equal(fill(RUNTIME_TEXT.sceneNumber, { number: 2 }), 'مشهد 2');
  assert.equal(
    fill(RUNTIME_TEXT.answeredMany, { answered: 2, questions: 3 }),
    'جاوبت 2 من 3 أسئلة',
  );
  assert.equal(fill('{a} {b}', { a: 1 }), '1 {b}');
});
test('choice keys are one letter each, and board answers join with the given separator', () => {
  assert.deepEqual([...RUNTIME_TEXT.choiceLetters], ['أ', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح']);
  const manifest = {
    id: 'b',
    variables: {
      a: { type: 'number', label: 'A', min: 0, max: 9, default: 1 },
      b: { type: 'number', label: 'B', min: 0, max: 9, default: 2 },
    },
  } as unknown as Parameters<typeof describeValues>[0];
  assert.equal(
    describeValues(manifest, { a: 1, b: 2 }, RUNTIME_TEXT.listSeparator),
    'A = 1، B = 2',
  );
});
