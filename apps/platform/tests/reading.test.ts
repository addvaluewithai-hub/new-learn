import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { validateReadingPackage, type ReadingPackage } from '@learn/lesson-runtime/core';
import { fromReading, resolveReadingPosition, teachingInstruction } from '../server/nova/context';
import pins from '../content-modules.json';
import registry from '../../../content/imported/registry.json';
import { readingPackages } from '../../../content/imported/packages';

const root = new URL('../../../content/imported/', import.meta.url);
const ready = registry.curricula.flatMap((c) =>
  c.lessons.filter((l) => 'moduleId' in l && l.moduleId),
) as Array<{ id: string; curriculumId: string; moduleId: string; manifestHash: string }>;
const load = async (moduleId: string) =>
  (await readingPackages[moduleId as keyof typeof readingPackages]())
    .default as unknown as ReadingPackage;

test('every imported reading lesson is pinned, allowlisted and structurally valid', async () => {
  assert.ok(ready.length > 0);
  for (const lesson of ready) {
    const pin = (
      pins as Record<string, { lessonId: string; manifestHash: string; delivery?: string }>
    )[lesson.moduleId];
    assert.equal(pin?.lessonId, lesson.id);
    assert.equal(pin.manifestHash, lesson.manifestHash);
    assert.equal(pin.delivery, 'reading');
    const meta = JSON.parse(
      await readFile(new URL(`${lesson.curriculumId}/${lesson.id}/lesson.json`, root), 'utf8'),
    );
    validateReadingPackage(await load(lesson.moduleId), new Set(Object.keys(meta.renderers)));
  }
});
test('reading position is the step, and forged positions are rejected', async () => {
  const pkg = await load(ready[0].moduleId);
  const scene = pkg.scenes[0];
  const context = resolveReadingPosition(pkg, { sceneId: scene.id, phase: 'narration', step: 1 });
  assert.equal(context.delivery, 'reading');
  assert.equal(context.step, 1);
  assert.ok(context.excerpt.includes(scene.steps[1].text));
  for (const bad of [
    { sceneId: 'made-up', phase: 'narration', step: 0 },
    { sceneId: scene.id, phase: 'narration', step: 999 },
    { sceneId: scene.id, phase: 'feedback', step: 0 },
    { sceneId: scene.id, phase: 'narration', step: -1 },
  ])
    assert.throws(() => resolveReadingPosition(pkg, bad));
});
test('the tutor sees questions but never the model answers of a reading lesson', async () => {
  const pkg = await load(ready[0].moduleId);
  const asked = pkg.scenes.find((s) => s.question)!;
  const position = resolveReadingPosition(pkg, { sceneId: asked.id, phase: 'attempt', step: 0 });
  const instruction = teachingInstruction({
    lesson: fromReading(pkg),
    position,
    student: { name: 'طالب' },
  });
  assert.ok(instruction.includes(JSON.stringify(asked.question!.english).slice(1, -1)));
  for (const step of asked.question!.feedback.steps)
    assert.ok(!instruction.includes(JSON.stringify(step.text).slice(1, -1)));
});
