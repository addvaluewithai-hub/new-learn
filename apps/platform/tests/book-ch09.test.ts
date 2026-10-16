import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import katex from 'katex';
import { validateReadingPackage } from '@learn/lesson-runtime/core';
import { bookParts, sourceById } from '../../../content/book-guided/physics-ch09';
import {
  readingLesson as lesson,
  BOOK_RENDERER,
  checkpoints,
  spoken,
} from '../../../content/book-guided/physics-ch09/reading/package';
import { referenceParts, referencePart } from '../../../content/book-guided/physics-ch09/reference';
import figures from '../../../content/book-guided/physics-ch09/figure-assets.json';
import { plainMath } from '../../../content/book-guided/physics-ch08/reading/text';
import { assistantContext, teachingInstruction } from '../server/nova/context';
import type { Env } from '../server/env';

test('Chapter 9 follows all supplied pages in order in the existing reading contract', () => {
  assert.equal(validateReadingPackage(lesson, new Set([BOOK_RENDERER])), lesson);
  assert.deepEqual(
    lesson.scenes.filter((s) => !s.id.endsWith('-check')).map((s) => s.id),
    bookParts.map((p) => p.id),
  );
  assert.deepEqual(
    [...new Set(bookParts.map((p) => p.page))],
    Array.from({ length: 16 }, (_, i) => i + 134),
  );
  assert.equal(bookParts.length, 41);
  assert.deepEqual(
    lesson.scenes.filter((s) => s.question?.attempt === 'written').map((s) => s.id),
    ['P139-Q1', 'P140-Q2', 'P140-Q3', 'P141-Q4', 'P145-Q5', 'P148-Q6', 'P149-Q7'],
  );
});

test('every portion reads the complete visible source before explaining or asking', () => {
  for (const part of bookParts) {
    const scene = lesson.scenes.find((s) => s.id === part.id)!;
    assert.deepEqual(
      scene.steps.slice(0, part.quotes.length).map((s) => s.text),
      part.quotes,
    );
    const count = part.quotes.length + (part.formula ? 1 : 0);
    assert.equal(scene.visual.params.sourceStepCount, count);
    if (part.formula) {
      assert.equal(scene.steps[part.quotes.length].text, plainMath(part.formula));
      assert.doesNotThrow(() => katex.renderToString(part.formula!, { throwOnError: true }));
    }
    if (part.question) {
      assert.equal(scene.question!.english, part.quotes.join(' '));
      assert.equal(scene.steps.length, count + 1);
      assert.deepEqual(
        scene.question!.feedback.steps.map((s) => s.text),
        part.question.solution.map(spoken),
      );
      assert.ok(!JSON.stringify(scene.visual).includes(part.question.answer));
    } else
      assert.deepEqual(
        scene.steps.slice(count).map((s) => s.text),
        part.explanation.map(spoken),
      );
  }
});

test('twenty native MCQs follow their concepts and explain the selected answer after attempt', () => {
  assert.equal(checkpoints.length, 20);
  for (const check of checkpoints) {
    const index = lesson.scenes.findIndex((s) => s.id === `${check.after}-check`);
    assert.equal(lesson.scenes[index - 1].id, check.after);
    const scene = lesson.scenes[index],
      question = scene.question!;
    assert.equal(question.attempt, 'choice');
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.equal(question.answer.english, check.options[check.correct]);
    assert.ok(question.answer.arabic.length > 0);
    assert.ok(!JSON.stringify(scene.visual).includes(check.why));
  }
});

test('all extracted portions and figures match their immutable crop receipts', async () => {
  assert.deepEqual(
    Object.keys(referenceParts),
    bookParts.map((p) => p.id),
  );
  for (const part of bookParts) {
    const receipt = referenceParts[part.id];
    assert.equal(referencePart(`${part.id}-check`).id, part.id);
    assert.equal(receipt.questionOnly, Boolean(part.question));
    assert.ok(receipt.focus.every((n) => n >= 0 && n <= 1));
    for (const suffix of [part.id, `${part.id}-check`]) assert.ok(referencePart(suffix).part);
    const images = Array.isArray(part.image) ? part.image : part.image ? [part.image] : [];
    for (const name of images) assert.ok(name in figures);
    const bytes = await readFile(
      new URL(`../public/book-ch09/reference/${receipt.file}`, import.meta.url),
    );
    assert.equal(createHash('sha256').update(bytes).digest('hex'), receipt.sha256);
  }
  for (const receipt of Object.values(figures)) {
    const bytes = await readFile(new URL(`../public/book-ch09/${receipt.file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), receipt.sha256);
  }
});

test('the textbook errors remain quoted and get an explicit teacher correction', () => {
  assert.match(sourceById['P138-D'].quotes.join(' '), /20-200 Hz/);
  assert.match(sourceById['P138-D'].note!, /أقل من 20 Hz/);
  assert.match(sourceById['P138-D'].explanation.join(' '), /غلط/);
  assert.match(sourceById['P144-B'].quotes.join(' '), /only if/);
  assert.match(sourceById['P144-B'].explanation.join(' '), /مقارب/);
  assert.match(sourceById['P136-A'].note!, /Pressure amplitude/);
  assert.match(sourceById['P143-C'].explanation.join(' '), /بنفس التردد/);
  assert.match(sourceById['P147-B'].explanation.join(' '), /لوحدها/);
});

test('worked results agree with the source quantities, units and explicit assumptions', () => {
  const near = (actual: number, expected: number, tolerance: number) =>
    assert.ok(Math.abs(actual - expected) < tolerance);
  near(1e-12 * 10 ** (75 / 10), 3.16227766e-5, 1e-13);
  near(10 ** 0.3, 2, 0.005);
  near(75 + 10 * Math.log10(4), 81, 0.03);
  near(140 + 20 * Math.log10(30 / 300), 120, 1e-10);
  near(Math.sqrt(2 * 1e-12 * 1.29 * 330), 2.918e-5, 1e-8);
  near(1600 / (1 - 25 / 343), 1725.79, 0.01);
  near(1600 / (1 + 25 / 343), 1491.3, 0.01);
  near((5000 * (343 + 3.5)) / (343 - 3.5), 5103.0928, 0.0001);
  assert.match(sourceById['P140-Q2'].question!.solution.join(' '), /6 dB/);
  assert.match(sourceById['P140-Q3'].question!.solution.join(' '), /مستقلة/);
  assert.match(sourceById['P141-Q4'].question!.arabic, /الانتشار الكروي/);
  assert.match(sourceById['P148-Q6'].question!.arabic, /343.*الحل المطبوع/);
  assert.match(sourceById['P149-Q7'].question!.arabic, /3.50.*الرسم/);
});

test('all spoken math is readable and all feedback math typesets without errors', () => {
  assert.equal(plainMath('P_0=\\sqrt{2I\\rho v}'), 'P₀=√(2Iρv)');
  for (const scene of lesson.scenes) {
    for (const step of [...scene.steps, ...(scene.question?.feedback.steps ?? [])])
      assert.ok(!/\\[a-zA-Z]+|\$\$/.test(step.text), step.text);
    for (const raw of (scene.question?.feedback.visual?.params.rawSteps ?? []) as string[])
      for (const math of raw.matchAll(/\$([^$]+)\$/g))
        assert.doesNotThrow(() => katex.renderToString(math[1], { throwOnError: true }));
  }
  const text = lesson.scenes
    .flatMap((s) => [...s.steps, ...(s.question?.feedback.steps ?? [])])
    .map((s) => s.text)
    .join(' ');
  assert.ok(
    !/سؤال تدريبي من المعلّم|English model answer|(?:Frequency|Intensity|Amplitude)[ ،]+(?:Frequency|Intensity|Amplitude)\b/.test(
      text,
    ),
  );
});

const user = { id: 'test', name: 'طالب', email: 'test@example.com' };
const position = {
  lessonId: lesson.lessonId,
  contentRevision: lesson.contentRevision,
  sceneId: lesson.scenes[0].id,
  phase: 'narration',
  step: 0,
};
test('normal Nova accepts only compiled Chapter 9 positions and withholds answer fields', async () => {
  const context = await assistantContext({} as Env, user, { ...position, text: 'forged text' });
  assert.equal(context.position.line, lesson.scenes[0].steps[0].text);
  assert.match(teachingInstruction(context), /Doppler effect/);
  assert.match(teachingInstruction(context), /teacher correction/);
  assert.ok(!JSON.stringify(context).includes('forged text'));
  for (const scene of context.lesson.scenes)
    if (scene.question) assert.ok(!('answer' in scene.question));
  await assert.rejects(
    assistantContext({} as Env, user, { ...position, contentRevision: 'old' }),
    /نسخة التجربة/,
  );
  await assert.rejects(
    assistantContext({} as Env, user, { ...position, sceneId: 'P121-A' }),
    /موضع الدرس/,
  );
  await assert.rejects(assistantContext({} as Env, user, { ...position, step: 999 }), /موضع الدرس/);
});

test('Chapter 9 preview creates no catalog release pin', async () => {
  const pins = await readFile(new URL('../content-modules.json', import.meta.url), 'utf8');
  assert.ok(!pins.includes(lesson.lessonId));
});
