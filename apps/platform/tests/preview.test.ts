import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './db';
import { addLesson, createCourse } from '../server/authoring/store';
import { publishCourse, withdrawCourse } from '../server/publish/store';
import { publicApi } from '../server/market/preview';
import type { Env } from '../server/env';
import type { Db } from '../server/db/connection';

const teacher = { id: 't1', name: 'أستاذة منى', email: 't@example.com' };
const env = {} as Env;
const lesson = (title: string) => ({
  title,
  goals: [
    { text: 'تعرف درجة الغليان', sceneIds: ['one'] },
    { text: 'تعرف التجمد', sceneIds: ['two'] },
  ],
  scenes: [
    {
      id: 'one',
      title: 'الغليان',
      steps: [{ text: 'المية بتغلي عند 100 درجة.' }],
      question: {
        kind: 'choice' as const,
        arabic: 'بتغلي عند كام؟',
        options: ['100', 'صفر'],
        answer: { arabic: '100' },
        feedback: [{ text: 'أيوه.' }],
      },
    },
    { id: 'two', title: 'التجمد', steps: [{ text: 'وبتتجمد عند صفر.' }] },
  ],
});
const get = (db: Db, path: string) =>
  publicApi(new Request(`https://learn.test${path}`), env, path, { db });

test('a visitor without an account sees the course and plays only the first scene', async () => {
  const db = await testDb();
  const { id } = await createCourse(db, teacher.id, { title: 'المية' });
  const first = await addLesson(db, teacher.id, id, lesson('الحالات'));
  await addLesson(db, teacher.id, id, lesson('التانية'));
  await publishCourse(db, teacher, id);

  const card = (await (await get(db, `/api/public/courses/${id}`)).json()) as any;
  assert.deepEqual(
    [card.course.title, card.course.lessons.length, card.lesson.id, card.lesson.scenes],
    ['المية', 2, first.lessonId, 2],
  );
  assert.equal(card.lesson.package, undefined, 'the card carries no lesson content');

  const play = (await (await get(db, `/api/public/courses/${id}/preview`)).json()) as any;
  assert.deepEqual(
    play.lesson.package.scenes.map((s: { id: string }) => s.id),
    ['one'],
  );
  assert.deepEqual(
    play.lesson.package.goals.map((g: { text: string }) => g.text),
    ['تعرف درجة الغليان'],
    'only the goals of that scene',
  );
  assert.ok(play.lesson.package.scenes[0].question, 'its question comes with it');

  await withdrawCourse(db, teacher.id, id);
  await assert.rejects(get(db, `/api/public/courses/${id}/preview`), {
    key: 'publish.courseGone',
  });
  await assert.rejects(get(db, '/api/public/courses/nope'), { key: 'http.notFound' });
  await assert.rejects(
    publicApi(
      new Request(`https://learn.test/x`, { method: 'POST' }),
      env,
      `/api/public/courses/${id}`,
      {
        db,
      },
    ),
    { key: 'http.notAllowed' },
  );
});
