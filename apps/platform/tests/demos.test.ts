import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { validateBoardManifest, validateReadingPackage } from '@learn/lesson-runtime/core';
import { DEMOS } from '../../../fixtures/demos';

// Demo courses (docs/visuals/demos.md): every one is a valid reading lesson whose steps set
// only variables its board declares, with values the board accepts.
const editions = JSON.parse(
  await readFile(
    new URL('../src/features/boards/editions.generated.json', import.meta.url),
    'utf8',
  ),
) as Record<string, { manifest: unknown }>;

for (const demo of DEMOS.filter((d) => d.load))
  test(`demo course "${demo.id}" is a valid lesson on its own board`, async () => {
    const lesson = validateReadingPackage(await demo.load!(), new Set(['html-board']));
    for (const scene of lesson.scenes) {
      const id = String(scene.visual.params?.board);
      assert.ok(editions[id], `${scene.id}: board ${id} is built`);
      const { variables } = validateBoardManifest(editions[id].manifest);
      const states = [
        ...scene.steps.map((s) => s.board?.state),
        scene.question?.board?.state,
        ...(scene.question?.feedback.steps ?? []).map((s) => s.board?.state),
      ];
      for (const state of states)
        for (const [name, value] of Object.entries(state ?? {})) {
          const spec = variables[name];
          assert.ok(spec, `${scene.id}: ${name} is declared by ${id}`);
          if (spec.type === 'choice')
            assert.ok(spec.options.includes(value as string), `${name}=${value}`);
          if (spec.type === 'number')
            assert.ok(Number(value) >= spec.min && Number(value) <= spec.max);
        }
      const check = scene.question?.board?.check;
      if (check && 'variable' in check)
        assert.ok(variables[check.variable], `${scene.id}: checks ${check.variable}`);
      if (scene.question?.attempt === 'choice')
        assert.ok(
          scene.question.options.includes(scene.question.answer.arabic),
          `${scene.id}: answer is an option`,
        );
    }
  });
