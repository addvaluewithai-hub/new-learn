import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { testDb } from './db';
import { addLesson, createCourse, updateCourse, updateLesson } from '../server/authoring/store';
import { putBoard } from '../server/authoring/boardStore';
import { addFeedback } from '../server/authoring/feedback';
import {
  enrol,
  orderLessons,
  publicCourse,
  publishCourse,
  publishedLesson,
  selfCheck,
  withdrawCourse,
} from '../server/publish/store';
import { readCourseProgress, saveCourseProgress } from '../server/publish/progress';
import { saveOutline, teacherCourse, teacherCourses } from '../server/publish/teach';
import { myCourses } from '../server/publish/library';
import { serverText } from '../server/i18n';

const teacher = { id: 'teacher-1', name: 'أستاذة منى' };
const student = 'student-1';
const lesson = (title: string, board?: string) => ({
  title,
  scenes: [
    {
      id: 'one',
      title: 'الأول',
      board,
      steps: [{ text: 'المية بتغلي عند ١٠٠ درجة.' }, { text: 'وبتتجمد عند صفر.' }],
      question: {
        kind: 'choice' as const,
        arabic: 'المية بتغلي عند كام؟',
        options: ['١٠٠', 'صفر'],
        answer: { arabic: '١٠٠' },
        feedback: [{ text: 'أيوه، ١٠٠ درجة.' }],
      },
    },
  ],
  goals: [{ text: 'تعرف درجة الغليان', sceneIds: ['one'] }],
});
const snapshot = (sceneId: string, phase: 'narration' | 'complete', step = 0) => ({
  schemaVersion: 1,
  sceneId,
  phase,
  frame: 0,
  step,
  reachedSceneIds: [sceneId],
  attempts: [],
});

test('a draft becomes a numbered version students read; edits wait for the next publish', async () => {
  const db = await testDb();
  const { id: courseId } = await createCourse(db, teacher.id, { title: 'المية', subject: 'علوم' });
  assert.equal((await selfCheck(db, teacher.id, courseId)).ready, false, 'no lessons yet');
  await assert.rejects(publishCourse(db, teacher, courseId), { key: 'publish.noLessons' });
  const wire = new URL('../../../fixtures/board-probe/boards/wire/', import.meta.url);
  await putBoard(db, teacher.id, {
    'board.json': await readFile(new URL('board.json', wire), 'utf8'),
    'index.html': await readFile(new URL('index.html', wire), 'utf8'),
  });
  const a = await addLesson(db, teacher.id, courseId, lesson('الغليان'));
  const b = await addLesson(db, teacher.id, courseId, lesson('التجمد', 'probe-wire'));
  await updateCourse(db, teacher.id, courseId, {
    parts: [{ title: 'الأساس', lessonIds: [b.lessonId, a.lessonId] }],
  });
  assert.equal((await selfCheck(db, teacher.id, courseId)).ready, true);
  await assert.rejects(publishCourse(db, { id: 'someone', name: 'x' }, courseId), /not found/);
  assert.deepEqual(await publishCourse(db, teacher, courseId), {
    courseId,
    version: 1,
    lessons: 2,
    review: null,
  });
  const seen = await publicCourse(db, courseId);
  assert.equal(seen?.teacher, teacher.name);
  assert.deepEqual(
    seen?.lessons.map((l) => [l.title, l.position]),
    [
      ['التجمد', 1],
      ['الغليان', 2],
    ],
    'lessons follow the parts',
  );
  const pub = await publishedLesson(db, courseId, b.lessonId);
  assert.equal(pub.package.lessonId, `pub:${b.lessonId}`);
  assert.equal(pub.package.contentRevision, `pub-${courseId}-v1`);
  assert.equal(Object.keys(pub.boards).length, 1, 'the board it draws with comes along');
  // The draft moves on; students keep version 1 until the teacher publishes again.
  await updateLesson(db, teacher.id, a.lessonId, lesson('الغليان والتبخر'));
  assert.equal((await publicCourse(db, courseId))?.lessons[1].title, 'الغليان');
  const [mine] = await teacherCourses(db, teacher.id);
  assert.equal(mine.published?.version, 1);
  assert.equal(mine.published?.stale, true, 'the draft is newer than the published version');
  assert.deepEqual(await publishCourse(db, teacher, courseId), {
    courseId,
    version: 2,
    lessons: 2,
    review: null,
  });
  assert.equal((await publicCourse(db, courseId))?.lessons[1].title, 'الغليان والتبخر');
  assert.equal((await teacherCourses(db, teacher.id))[0].published?.stale, false);
});

test('a student enrols, saves progress by lesson, and sees the course in the library', async () => {
  const db = await testDb();
  const { id: courseId } = await createCourse(db, teacher.id, { title: 'المية' });
  const a = await addLesson(db, teacher.id, courseId, lesson('الغليان'));
  await publishCourse(db, teacher, courseId);
  assert.deepEqual(await myCourses(db, student), { courses: [] });
  await enrol(db, student, courseId);
  assert.equal((await readCourseProgress(db, student, a.lessonId)).revision, null);
  const first = await saveCourseProgress(db, student, a.lessonId, {
    contentRevision: `pub-${courseId}-v1`,
    revision: null,
    state: snapshot('one', 'narration', 1),
  });
  assert.equal(first.status, 200);
  const stale = await saveCourseProgress(db, student, a.lessonId, {
    contentRevision: `pub-${courseId}-v1`,
    revision: 5,
    state: snapshot('one', 'narration', 1),
  });
  assert.equal(stale.status, 409, 'a wrong revision is a conflict, never a silent overwrite');
  const done = await saveCourseProgress(db, student, a.lessonId, {
    contentRevision: `pub-${courseId}-v1`,
    revision: 0,
    state: snapshot('one', 'complete'),
  });
  assert.equal(((await done.json()) as { completed: boolean }).completed, true);
  await assert.rejects(
    saveCourseProgress(db, student, a.lessonId, {
      contentRevision: 'pub-old',
      revision: 1,
      state: snapshot('one', 'complete'),
    }),
    { key: 'progress.courseChanged' },
  );
  const library = await myCourses(db, student);
  assert.equal(library.courses[0].lessons[0].status, 'completed');
  const work = await teacherCourse(db, teacher.id, courseId);
  assert.equal(work.published?.students, 1);
  assert.deepEqual(work.progress, [{ lessonId: a.lessonId, started: 1, completed: 1 }]);
  await withdrawCourse(db, teacher.id, courseId);
  assert.equal(await publicCourse(db, courseId), null);
  assert.deepEqual(await myCourses(db, student), { courses: [] });
  await assert.rejects(enrol(db, 'another', courseId), { key: 'publish.courseMissing' });
});

test('the outline editor regroups lessons and keeps the ones it left out; notes count as open', async () => {
  const db = await testDb();
  const { id: courseId } = await createCourse(db, teacher.id, { title: 'المية' });
  const a = await addLesson(db, teacher.id, courseId, lesson('أ'));
  const b = await addLesson(db, teacher.id, courseId, lesson('ب'));
  const c = await addLesson(db, teacher.id, courseId, lesson('ج'));
  const saved = await saveOutline(db, teacher.id, courseId, {
    title: 'المية وحالاتها',
    parts: [{ title: 'البداية', lessonIds: [c.lessonId, a.lessonId] }],
  });
  assert.equal(saved.title, 'المية وحالاتها');
  assert.deepEqual(saved.parts, [
    { title: 'البداية', lessonIds: [c.lessonId, a.lessonId] },
    { title: serverText('ar', 'publish.otherLessons'), lessonIds: [b.lessonId] },
  ]);
  assert.deepEqual(orderLessons([a.lessonId, b.lessonId, c.lessonId], saved.parts), [
    c.lessonId,
    a.lessonId,
    b.lessonId,
  ]);
  await assert.rejects(
    saveOutline(db, teacher.id, courseId, { parts: [{ title: 'x', lessonIds: ['not-a-lesson'] }] }),
    { key: 'publish.partsEveryLesson' },
  );
  await addFeedback(db, teacher.id, a.lessonId, {
    sceneId: 'one',
    phase: 'narration',
    step: 0,
    note: 'وضّح بمثال',
  });
  const work = await teacherCourse(db, teacher.id, courseId);
  assert.equal(work.openNotes, 1);
  assert.equal(work.notes.length, 1);
  assert.equal(work.check.warnings[1].ok, false, 'open notes are a warning, not a stop');
  assert.equal(work.check.ready, true);
  // The self-check reads in the teacher's language, counts filled in.
  assert.deepEqual(work.check.checks[0], { ok: true, text: '3 دروس جاهزة' });
  assert.deepEqual(work.check.warnings[1], { ok: false, text: '1 ملاحظة لسه مفتوحة' });
});
