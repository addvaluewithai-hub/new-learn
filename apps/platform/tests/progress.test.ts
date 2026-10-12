import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ReadingPackage } from '@learn/lesson-runtime/core';
import {
  carryOver,
  mergeSnapshots,
  readingOutline,
  summarize,
  validateSnapshot,
} from '../server/progress/snapshot';
import { resumeTarget } from '../server/progress/summary';
import { readingPackages } from '../../../content/imported/packages';

const pkg = (await readingPackages['reading:math1-bridge-fractions']())
  .default as unknown as ReadingPackage;
const outline = readingOutline(pkg);
const asked = pkg.scenes.find((s) => s.question)!;
const snap = (extra: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  sceneId: pkg.scenes[0].id,
  phase: 'narration',
  frame: 0,
  step: 1,
  reachedSceneIds: [pkg.scenes[0].id],
  attempts: [],
  ...extra,
});

test('a reading snapshot is accepted only with real scenes, steps and questions', () => {
  assert.equal(validateSnapshot(outline, snap()).step, 1);
  for (const bad of [
    snap({ sceneId: 'made-up' }),
    snap({ step: 999 }),
    snap({ step: undefined }),
    snap({ phase: 'feedback' }),
    snap({ reachedSceneIds: ['nope'] }),
    snap({ attempts: [{ id: 'a', sceneId: pkg.scenes[0].id, questionId: 'Q9', written: '' }] }),
    snap({
      attempts: [
        { id: 'a', sceneId: asked.id, questionId: asked.question!.id, written: 'x'.repeat(2001) },
      ],
    }),
    { ...snap(), schemaVersion: 2 },
  ])
    assert.throws(() => validateSnapshot(outline, bad), /بيانات التقدم/);
});
test('merging keeps every attempt and reached scene; the cursor follows the newest save', () => {
  const answer = { id: 'q1', sceneId: asked.id, questionId: asked.question!.id, written: '7/12' };
  const saved = validateSnapshot(
    outline,
    snap({
      sceneId: asked.id,
      phase: 'feedback',
      step: 0,
      reachedSceneIds: pkg.scenes.slice(0, 5).map((s) => s.id),
      attempts: [answer],
    }),
  );
  const rewound = validateSnapshot(outline, snap());
  const merged = mergeSnapshots(outline, saved, rewound);
  assert.equal(merged.sceneId, pkg.scenes[0].id);
  assert.deepEqual(merged.attempts, [answer]);
  assert.equal(merged.reachedSceneIds.length, 5);
});
test('goals count as met once their questions were attempted', () => {
  const goals = [
    { id: 'G1', text: 'a', sceneIds: [], questionIds: [asked.question!.id] },
    { id: 'G2', text: 'b', sceneIds: [], questionIds: ['other'] },
  ];
  const state = validateSnapshot(
    outline,
    snap({
      attempts: [{ id: 'q1', sceneId: asked.id, questionId: asked.question!.id, written: '' }],
    }),
  );
  const summary = summarize(goals, state, false, new Date('2026-10-12T10:00:00Z'));
  assert.deepEqual([summary.goalsDone, summary.goalsTotal, summary.status], [1, 2, 'started']);
});
test('continue points at the latest unfinished lesson, else the next available one', () => {
  const p = (status: 'started' | 'completed', at: string) => ({
    status,
    goalsDone: 0,
    goalsTotal: 0,
    updatedAt: at,
  });
  const course = (
    lessons: Array<{ id: string; availability: string; progress?: ReturnType<typeof p> }>,
  ) => [{ id: 'c', lessons }];
  assert.equal(resumeTarget(course([{ id: 'a', availability: 'published' }])), null);
  assert.deepEqual(
    resumeTarget(
      course([
        { id: 'a', availability: 'published', progress: p('started', '2026-10-01') },
        { id: 'b', availability: 'published', progress: p('started', '2026-10-05') },
      ]),
    ),
    { curriculumId: 'c', lessonId: 'b', kind: 'continue' },
  );
  assert.deepEqual(
    resumeTarget(
      course([
        { id: 'a', availability: 'published', progress: p('completed', '2026-10-05') },
        { id: 'b', availability: 'published' },
        { id: 'c2', availability: 'coming-soon' },
      ]),
    ),
    { curriculumId: 'c', lessonId: 'b', kind: 'next' },
  );
});
test('a save from an older edition keeps what still exists and restarts a lost position', () => {
  const answer = { id: 'a1', sceneId: asked.id, questionId: asked.question!.id, written: '7/12' };
  const gone = { id: 'a2', sceneId: 'S99', questionId: 'Q99', written: 'x' };
  const old = {
    ...validateSnapshot(outline, snap({ step: 1 })),
    reachedSceneIds: [pkg.scenes[0].id, 'S99'],
    attempts: [answer, gone],
  };
  const kept = carryOver(outline, old)!;
  assert.equal(kept.sceneId, pkg.scenes[0].id);
  assert.equal(kept.step, 1);
  assert.deepEqual(kept.reachedSceneIds, [pkg.scenes[0].id]);
  assert.deepEqual(kept.attempts, [answer]);
  // The scene the learner stood on was removed: start at the top, answers stay.
  const moved = carryOver(outline, { ...old, sceneId: 'S99' })!;
  assert.equal(moved.sceneId, pkg.scenes[0].id);
  assert.equal(moved.step, 0);
  assert.deepEqual(moved.attempts, [answer]);
});
