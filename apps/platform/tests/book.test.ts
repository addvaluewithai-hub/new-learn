import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { bookSections } from '../../../content/book-guided/physics-ch08';
import { bookSteps, allowedStep } from '../src/features/book/model';
import { sourcePosition } from '../src/features/book/source';
import { parseBookDraft } from '../../../tools/import-book-draft.mjs';

test('book review retains source order, original questions, and numeric caveats', () => {
  const pages = [...new Set(bookSections.map((s) => s.page))];
  assert.deepEqual(
    pages,
    Array.from({ length: 13 }, (_, i) => 121 + i),
  );
  const questions = bookSections.filter((s) => s.question);
  assert.deepEqual(
    questions.map((q) => q.id),
    ['P130-Q1', 'P131-Q2', 'P132-Q3', 'P133-Q4'],
  );
  assert.ok(questions.every((q) => q.blocks.length && q.solution.length));
  assert.ok(questions[0].notes.some((n) => n.includes('الأسّ')));
  assert.ok(questions[0].solution.some((n) => n.includes('لا نكتب رقمًا نهائيًا')));
  assert.ok(questions[1].solution.some((n) => n.includes('خارج المرفق')));
});

test('unattempted solutions cannot be reached by a direct jump or Next', () => {
  const steps = bookSteps(bookSections);
  for (const q of bookSections.filter((s) => s.question)) {
    const attempt = steps.findIndex((s) => s.section.id === q.id && s.phase === 'attempt');
    const solutions = steps
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.section.id === q.id && s.phase === 'solution');
    for (const { i } of solutions) {
      assert.equal(allowedStep(steps, i, {}), attempt);
      assert.equal(allowedStep(steps, i, { [q.id]: 'محاولتي' }), i);
    }
  }
});

test('opposite printed pages map to the same PDF spread with distinct crops', () => {
  const left = sourcePosition(122, 'P122-A', {});
  const right = sourcePosition(123, 'P123-B', {});
  assert.equal(left.pdfPage, 6);
  assert.equal(right.pdfPage, 6);
  assert.equal(left.rotation, 270);
  assert.deepEqual(sourcePosition(122, 'P122-C', {}).crop, [0, 0, 1, 1]);
  assert.notDeepEqual(left.crop, right.crop);
  assert.equal(sourcePosition(121, 'P121-A', {}).rotation, 0);
  assert.equal(sourcePosition(133, 'P133-Q4', {}).pdfPage, 11);
});

test('import separates teacher notes and solution text from the question', () => {
  const input =
    '## P130-Q1 مسألة\n\n**الموضع:** صفحة 130\n\n**تنبيه نسخ للمراجع:** رقم ناقص\n\nالسؤال\n\n### P130-A1a الحل\n\nالإجابة المخفية\n\n## مرجع الإضافات\n\nمرجع خارجي';
  const [q] = parseBookDraft(input);
  assert.deepEqual(q.blocks, ['السؤال']);
  assert.ok(q.notes[0].includes('رقم ناقص'));
  assert.ok(q.solution.includes('الإجابة المخفية'));
  assert.ok(!q.solution.includes('مرجع خارجي'));
});

test('experiment introduces no database release pin', async () => {
  const pins = await readFile(new URL('../content-modules.json', import.meta.url), 'utf8');
  assert.ok(!pins.includes('book-ch08'));
});
