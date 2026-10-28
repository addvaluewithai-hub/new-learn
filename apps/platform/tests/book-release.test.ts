import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PgDialect } from 'drizzle-orm/pg-core';
import { validateReadingPackage } from '@learn/lesson-runtime/core';
import { bookCourse, bookPins } from '../../../content/book-guided/published';
import { bookReadingPackages } from '../../../content/book-guided/packages';
import { curriculumAvailable } from '../../../content/availability';
import { curriculumVisibility } from '../server/content';
import { supportedEdition } from '../server/moduleAvailability';
import { nextImported, goalsOf } from '../src/features/catalog/plan';
import registry from '../../../content/imported/registry.json';
import { readingOutline, validateSnapshot } from '../server/progress/snapshot';
import { fromReading, resolveReadingPosition, teachingInstruction } from '../server/nova/context';

test('only the physics book and How AI works are enabled, also for direct lesson access', () => {
  assert.equal(curriculumAvailable(bookCourse.id), true);
  assert.equal(curriculumAvailable('how-ai-works'), true);
  for (const id of [
    'chemistry-gas-laws',
    'engineering-math-1',
    'engineering-mechanics-statics-y1',
    'manhaj-almarifa',
    'mathematics-i-algebra',
    'physics-1-mechanics-waves',
  ])
    assert.equal(curriculumAvailable(id), false);
  const query = new PgDialect().sqlToQuery(curriculumVisibility()!);
  assert.deepEqual(query.params, ['published', bookCourse.id, 'how-ai-works']);
  assert.match(query.sql, /curricula.*visibility/);
  assert.match(query.sql, /curricula.*id/);
});

test('both chapters are pinned normal reading editions with progress, goals and Nova context', async () => {
  assert.deepEqual(
    bookCourse.lessons.map((l) => l.order),
    [1, 2],
  );
  for (const item of bookCourse.lessons) {
    const lesson = (await bookReadingPackages[item.moduleId as keyof typeof bookReadingPackages]())
      .default;
    assert.equal(
      validateReadingPackage(lesson, new Set(lesson.scenes.map((s) => s.visual.renderer))),
      lesson,
    );
    assert.equal(lesson.curriculumId, bookCourse.id);
    assert.equal(lesson.lessonId, item.id);
    assert.notEqual(lesson.lessonId, item.previewLessonId);
    assert.equal(lesson.contentRevision, item.contentRevision);
    const pin = { ...bookPins[item.moduleId], moduleId: item.moduleId };
    assert.equal(supportedEdition(pin), true);
    assert.equal(supportedEdition({ ...pin, manifestHash: '0'.repeat(64) }), false);
    assert.deepEqual(goalsOf(bookCourse.id, item.id), lesson.goals);
    const state = {
      schemaVersion: 1,
      sceneId: lesson.scenes[0].id,
      phase: 'narration',
      step: 1,
      frame: 0,
      reachedSceneIds: [lesson.scenes[0].id],
      attempts: [],
    };
    assert.equal(validateSnapshot(readingOutline(lesson), state).step, 1);
    const position = resolveReadingPosition(lesson, { ...state });
    const context = { lesson: fromReading(lesson), position, student: { name: 'طالب' } };
    assert.match(teachingInstruction(context), /Read original English source/);
    assert.match(teachingInstruction(context), /Doppler effect/);
    for (const scene of context.lesson.scenes)
      if (scene.question) assert.ok(!('answer' in scene.question));
  }
  assert.equal(nextImported(bookCourse.id, bookCourse.lessons[0].id)?.id, bookCourse.lessons[1].id);
  assert.equal(nextImported(bookCourse.id, bookCourse.lessons[1].id), undefined);
});

test('release pins still bind the exact source, renderer and served image/font bytes', async () => {
  await promisify(execFile)(process.execPath, [
    '--import',
    'tsx',
    'tools/book-release.mjs',
    '--check',
  ]);
});

test('publication sync is non-destructive and only writes the enabled courses', async () => {
  const result = await promisify(execFile)(process.execPath, ['tools/sync-content.mjs', '--json']);
  const statements = JSON.parse(result.stdout) as Array<{ text: string; params: unknown[] }>;
  assert.equal(
    statements.filter((s) => s.text.startsWith('INSERT INTO learn_app.curricula')).length,
    2,
  );
  // One release per published lesson of the enabled courses: the book's pinned lessons plus
  // every ready lesson of the other enabled imported courses (counted, so new lessons don't break this).
  const imported = (
    registry.curricula as Array<{ id: string; lessons: Array<{ contentRevision?: string }> }>
  )
    .filter((c) => c.id !== bookCourse.id && curriculumAvailable(c.id))
    .reduce((sum, c) => sum + c.lessons.filter((l) => l.contentRevision).length, 0);
  assert.equal(
    statements.filter((s) => s.text.startsWith('INSERT INTO learn_app.lesson_releases')).length,
    Object.keys(bookPins).length + imported,
  );
  assert.ok(
    statements.every(
      (s) =>
        !s.text.includes('DELETE') &&
        !s.text.includes('DROP') &&
        !s.text.includes('TRUNCATE') &&
        !s.text.includes('lesson_progress') &&
        !s.text.includes('lesson_enrollments'),
    ),
  );
  assert.ok(!JSON.stringify(statements).includes('phys1-young-axial-stiffness'));
});
