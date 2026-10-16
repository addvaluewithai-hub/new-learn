import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { checkpoints } from '../../../content/book-guided/physics-ch08/reading/checkpoints';
import { bookSource } from '../../../content/book-guided/physics-ch08/board/source';
import { validateReadingPackage } from '@learn/lesson-runtime/core';
import katex from 'katex';
import { bookSections } from '../../../content/book-guided/physics-ch08';
import {
  readingLesson as lesson,
  BOOK_RENDERER,
} from '../../../content/book-guided/physics-ch08/reading/package';
import { lessonText, plainMath } from '../../../content/book-guided/physics-ch08/reading/text';
import { assistantContext } from '../server/nova/context';
import type { Env } from '../server/env';
import { parseBookDraft } from '../../../tools/import-book-draft.mjs';

test('book chapter uses the existing reading contract, in source order with four original exercises', () => {
  assert.equal(validateReadingPackage(lesson, new Set([BOOK_RENDERER])), lesson);
  assert.deepEqual(
    lesson.scenes
      .filter((s) => !s.id.endsWith('-intro') && !s.id.endsWith('-check'))
      .map((s) => s.id),
    bookSections.map((s) => s.id),
  );
  assert.deepEqual(
    lesson.scenes.filter((s) => s.question?.attempt === 'written').map((s) => s.question!.id),
    ['P130-Q1', 'P131-Q2', 'P132-Q3', 'P133-Q4'],
  );
  assert.deepEqual(
    [...new Set(bookSections.map((s) => s.page))],
    Array.from({ length: 13 }, (_, i) => 121 + i),
  );
  assert.ok(
    lesson.scenes
      .find((s) => s.id === 'P130-Q1')!
      .question!.answer.arabic.includes('لا نكتب رقمًا نهائيًا'),
  );
  assert.ok(
    lesson.scenes.find((s) => s.id === 'P131-Q2')!.question!.answer.arabic.includes('خارج المرفق'),
  );
});

test('question visual data contains the prompt without the worked solution', () => {
  for (const scene of lesson.scenes.filter((s) => s.question)) {
    const raw = scene.visual.params.rawSteps as string[];
    assert.equal(raw.length, scene.question!.attempt === 'written' ? 2 : 0);
    assert.ok(!('answer' in scene.visual.params));
    if (scene.question!.attempt === 'written')
      assert.notDeepEqual(scene.question!.feedback.visual!.params.rawSteps, raw);
    assert.ok(scene.question!.answer.arabic);
  }
});

test('captions and live narration contain readable math, and all board equations parse', () => {
  assert.equal(plainMath('\\frac{FL_0}{A\\mathrm{Y}}'), '(FL₀)/(AY)');
  assert.equal(plainMath('4.2\\times10^{10}\\,\\mathrm{Pa}'), '4.2 × 10¹⁰ Pa');
  assert.equal(lessonText('$$\\Delta V=-\\frac{V_0\\Delta P}{B}$$'), '$ΔV=-(V₀ΔP)/(B)$');
  for (const scene of lesson.scenes) {
    for (const step of [...scene.steps, ...(scene.question?.feedback.steps ?? [])]) {
      assert.ok(!/\\[A-Za-z]|\$\$|\*\*/.test(step.text), step.text);
    }
  }
  for (const section of bookSections)
    for (const block of [...section.blocks, ...section.solution]) {
      for (const m of block.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g)) {
        assert.doesNotThrow(() =>
          katex.renderToString(m[1] ?? m[2], { throwOnError: true, strict: 'ignore' }),
        );
      }
    }
});

const user = { id: 'test-user', name: 'طالب', email: 'test@example.com' };
const position = {
  lessonId: lesson.lessonId,
  contentRevision: lesson.contentRevision,
  sceneId: lesson.scenes[0].id,
  phase: 'narration',
  step: 0,
  frame: 0,
};
test('Nova resolves this compiled book edition without a release or client-supplied text', async () => {
  const context = await assistantContext({} as Env, user, {
    ...position,
    text: 'forged text',
    lesson: { scenes: [] },
  });
  assert.equal(context.position.line, lesson.scenes[0].steps[0].text);
  assert.equal(context.lesson.scenes.length, lesson.scenes.length);
  assert.ok(!('answer' in context.lesson.scenes.find((s) => s.question)!.question!));
  await assert.rejects(
    assistantContext({} as Env, user, { ...position, contentRevision: 'forged' }),
    /نسخة التجربة/,
  );
  await assert.rejects(
    assistantContext({} as Env, user, { ...position, sceneId: 'invented' }),
    /موضع الدرس/,
  );
  await assert.rejects(assistantContext({} as Env, user, { ...position, step: 999 }), /موضع الدرس/);
  await assert.rejects(
    assistantContext({} as Env, user, { ...position, phase: 'feedback' }),
    /مرحلة الدرس/,
  );
});

test('import separates reviewer notes and model answers from the prompt', () => {
  const [q] = parseBookDraft(
    '## P130-Q1 مسألة\n\n**تنبيه نسخ للمراجع:** رقم ناقص\n\nالسؤال\n\n### P130-A1a الحل\n\nالإجابة\n\n## مرجع الإضافات\n\nمرجع',
  );
  assert.deepEqual(q.blocks, ['السؤال']);
  assert.ok(q.notes[0].includes('رقم ناقص'));
  assert.ok(q.solution.includes('الإجابة'));
  assert.ok(!q.solution.includes('مرجع'));
});

test('preview has no catalog release pin', async () => {
  const pins = await readFile(new URL('../content-modules.json', import.meta.url), 'utf8');
  assert.ok(!pins.includes(lesson.lessonId));
});

test('sixteen native choice checks follow their concepts, without answer-bearing prompt data', () => {
  assert.equal(checkpoints.length, 16);
  for (const check of checkpoints) {
    const index = lesson.scenes.findIndex((s) => s.id === `${check.after}-check`);
    assert.equal(lesson.scenes[index - 1].id, check.after);
    const question = lesson.scenes[index].question!;
    assert.equal(question.attempt, 'choice');
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.equal(question.answer.english, question.options[check.correct]);
    assert.ok(question.answer.arabic.length > 70);
    assert.ok(!JSON.stringify(lesson.scenes[index].visual).includes(check.why));
  }
});

test('source excerpts are narrated verbatim before explanation and source figures match receipts', async () => {
  for (const [id, source] of Object.entries(bookSource)) {
    const scene = lesson.scenes.find((s) => s.id === id)!;
    if (scene.question) assert.equal(scene.question.english, source.quotes.join(' '));
    else
      for (const quote of source.quotes)
        assert.ok(
          scene.steps.some((s) => s.text === quote),
          id,
        );
    for (const formula of [source.formula, source.teacherFormula].filter(Boolean))
      assert.doesNotThrow(() => katex.renderToString(formula!, { throwOnError: true }));
  }
  const receipt = JSON.parse(
    await readFile(
      new URL(
        '../../../content/book-guided/physics-ch08/board/source-assets.json',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  for (const asset of receipt.assets) {
    const bytes = await readFile(new URL(`../public/book-ch08/${asset.file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
  }
  assert.ok(lessonText('الإجهاد والانفعال ومعامل يونج').includes('Young’s modulus'));
});
