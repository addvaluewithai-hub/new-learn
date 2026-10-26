import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { testDb } from './db';
import { LessonProblems, type AuthorLesson } from '../server/authoring/format';
import { BoardProblems, checkBoardFiles } from '../server/authoring/boardFiles';
import {
  addLesson,
  createCourse,
  getLesson,
  listCourses,
  updateCourse,
  updateLesson,
} from '../server/authoring/store';
import {
  addBoardReport,
  boardFilesByHash,
  getBoard,
  putBoard,
} from '../server/authoring/boardStore';
import { addFeedback, boardReports, listFeedback, setFeedback } from '../server/authoring/feedback';

const wire = new URL('../../../fixtures/board-probe/boards/wire/', import.meta.url);
const wireFiles = async () => ({
  'board.json': await readFile(new URL('board.json', wire), 'utf8'),
  'index.html': await readFile(new URL('index.html', wire), 'utf8'),
});
const textLesson: AuthorLesson = {
  title: 'الكسور',
  scenes: [
    {
      id: 'intro',
      title: 'يعني إيه كسر',
      steps: [{ text: 'الكسر جزء من كل.' }, { text: 'نص = 1/2.' }],
    },
    {
      id: 'check',
      title: 'اختبر نفسك',
      steps: [{ text: 'سؤال سريع.' }],
      question: {
        kind: 'choice',
        arabic: 'كام ربع في النص؟',
        options: ['1', '2', '3'],
        answer: { arabic: '2' },
        feedback: [{ text: 'ربعين يساووا نص.' }],
      },
    },
  ],
  goals: [{ text: 'تفهم الكسر', sceneIds: ['intro', 'check'] }],
};
const boardLesson: AuthorLesson = {
  title: 'سلك',
  scenes: [
    {
      id: 'wire',
      title: 'سلك بيتمط',
      board: 'probe-wire',
      steps: [{ text: 'حمل 200 نيوتن.', board: { state: { load: 200 }, highlight: ['#wire'] } }],
      question: {
        kind: 'board',
        arabic: 'اضبط 300 نيوتن.',
        answer: { arabic: '300' },
        board: { check: { variable: 'load', kind: 'number', target: 300, tolerance: 0 } },
        feedback: [{ text: 'دي 300 نيوتن.', board: { state: { load: 300 } } }],
      },
    },
  ],
};

test('a teacher builds a course of draft lessons with saved revisions', async () => {
  const db = await testDb();
  const course = await createCourse(db, 'teacher-a', { title: 'رياضة' });
  const saved = await addLesson(db, 'teacher-a', course.id, textLesson);
  assert.equal(saved.revision, 1);
  const got = await getLesson(db, 'teacher-a', saved.lessonId);
  assert.equal(got.package.lessonId, `draft:${saved.lessonId}`);
  assert.equal(got.package.scenes[0].visual.renderer, 'text-board');
  assert.deepEqual(got.package.goals?.[0].questionIds, ['check-q']);
  const edited = structuredClone(textLesson);
  edited.scenes[0].steps[0].text = 'الكسر جزء من الكل.';
  assert.equal(
    (await updateLesson(db, 'teacher-a', saved.lessonId, edited, 'wording')).revision,
    2,
  );
  const first = await getLesson(db, 'teacher-a', saved.lessonId, 1);
  assert.equal(first.package.scenes[0].steps[0].text, 'الكسر جزء من كل.', 'old revision kept');
  const [listed] = await listCourses(db, 'teacher-a');
  assert.equal(listed.lessons[0].revision, 2);
});

test('a rejected lesson explains every problem and leaves nothing behind', async () => {
  const db = await testDb();
  const course = await createCourse(db, 'teacher-a', { title: 'فيزيا' });
  const bad = {
    title: '',
    scenes: [{ id: 'Bad Id', title: 'x', steps: [] }],
  } as unknown as AuthorLesson;
  await assert.rejects(addLesson(db, 'teacher-a', course.id, bad), (e: LessonProblems) => {
    assert.ok(e.problems.length >= 3, e.message);
    return true;
  });
  await assert.rejects(addLesson(db, 'teacher-a', course.id, boardLesson), /put_board/);
  await assert.rejects(createCourse(db, 'teacher-a', { title: 'x'.repeat(121) }), /title/);
  await assert.rejects(
    updateCourse(db, 'teacher-a', course.id, { parts: 'all' as never }),
    /parts/,
  );
  assert.equal((await listCourses(db, 'teacher-a'))[0].lessons.length, 0);
});

test('drafts belong to their teacher only', async () => {
  const db = await testDb();
  const course = await createCourse(db, 'teacher-a', { title: 'رياضة' });
  const saved = await addLesson(db, 'teacher-a', course.id, textLesson);
  await assert.rejects(getLesson(db, 'teacher-b', saved.lessonId), /not found/);
  await assert.rejects(updateLesson(db, 'teacher-b', saved.lessonId, textLesson), /not found/);
  await assert.rejects(updateCourse(db, 'teacher-b', course.id, { title: 'x' }), /not found/);
  await assert.rejects(addLesson(db, 'teacher-b', course.id, textLesson), /not found/);
  assert.deepEqual(await listCourses(db, 'teacher-b'), []);
});

test('course parts regroup lessons, each exactly once', async () => {
  const db = await testDb();
  const course = await createCourse(db, 'teacher-a', { title: 'رياضة' });
  const a = await addLesson(db, 'teacher-a', course.id, textLesson);
  const b = await addLesson(db, 'teacher-a', course.id, { ...textLesson, title: 'تاني' });
  await assert.rejects(
    updateCourse(db, 'teacher-a', course.id, {
      parts: [{ title: 'جزء', lessonIds: [a.lessonId] }],
    }),
    /exactly once/,
  );
  const parts = [
    { title: 'الأول', lessonIds: [b.lessonId] },
    { title: 'التاني', lessonIds: [a.lessonId] },
  ];
  assert.deepEqual((await updateCourse(db, 'teacher-a', course.id, { parts })).parts, parts);
});

test('an updated board moves its lessons to a new revision; old ones keep the old board', async () => {
  const db = await testDb();
  const course = await createCourse(db, 'teacher-a', { title: 'فيزيا' });
  const first = await putBoard(db, 'teacher-a', await wireFiles());
  const saved = await addLesson(db, 'teacher-a', course.id, boardLesson);
  const r1 = await getLesson(db, 'teacher-a', saved.lessonId);
  assert.equal(r1.package.scenes[0].visual.params.board, `u:${first.hash}`);
  const files = await wireFiles();
  files['index.html'] = files['index.html'].replace('<title>', '<title>v2 ');
  const second = await putBoard(db, 'teacher-a', files);
  assert.notEqual(second.hash, first.hash);
  assert.deepEqual(second.lessons, [{ lessonId: saved.lessonId, revision: 2 }]);
  assert.equal(
    (await getLesson(db, 'teacher-a', saved.lessonId)).package.scenes[0].visual.params.board,
    `u:${second.hash}`,
  );
  assert.equal(
    (await getLesson(db, 'teacher-a', saved.lessonId, 1)).package.scenes[0].visual.params.board,
    `u:${first.hash}`,
  );
  assert.equal((await getBoard(db, 'teacher-a', 'probe-wire')).hash, second.hash);
  assert.ok((await boardFilesByHash(db, first.hash))?.['index.html']);
  await assert.rejects(getBoard(db, 'teacher-b', 'probe-wire'), /not found/);
});

test('uploaded boards are checked before they are stored', async () => {
  const files = await wireFiles();
  const problems = async (change: (f: Record<string, string>) => void) => {
    const copy = { ...files };
    change(copy);
    try {
      await checkBoardFiles(copy);
      return [];
    } catch (error) {
      return (error as BoardProblems).problems;
    }
  };
  assert.deepEqual(await problems(() => undefined), []);
  assert.match(
    (
      await problems(
        (f) =>
          (f['index.html'] = f['index.html'].replace('/lib/newlearn-board@1/board.js', '/x.js')),
      )
    ).join(),
    /must load/,
  );
  assert.match(
    (await problems((f) => (f['index.html'] += '<script>fetch("/x")</script>'))).join(),
    /no network/,
  );
  assert.match((await problems((f) => (f['../evil.html'] = 'x'))).join(), /allowed are/);
  assert.match((await problems((f) => delete f['board.json'])).join(), /board.json/);
});

test('teacher notes point at a step; the AI marks them for review; reports are kept', async () => {
  const db = await testDb();
  const course = await createCourse(db, 'teacher-a', { title: 'رياضة' });
  const saved = await addLesson(db, 'teacher-a', course.id, textLesson);
  const note = await addFeedback(db, 'teacher-a', saved.lessonId, {
    sceneId: 'intro',
    phase: 'narration',
    step: 1,
    note: 'وضّح بمثال بيتزا',
  });
  await assert.rejects(
    addFeedback(db, 'teacher-a', saved.lessonId, {
      sceneId: 'intro',
      phase: 'narration',
      step: 9,
      note: 'x',
    }),
    /not in the lesson/,
  );
  const [listed] = await listFeedback(db, 'teacher-a', { status: ['open'] });
  assert.equal(listed.currentText, 'نص = 1/2.');
  await assert.rejects(setFeedback(db, 'teacher-b', note.id, { status: 'done' }), /not found/);
  await setFeedback(db, 'teacher-a', note.id, { status: 'review', resolution: 'أضفت مثال' });
  assert.deepEqual(await listFeedback(db, 'teacher-a', { status: ['open'] }), []);
  const board = await putBoard(db, 'teacher-a', await wireFiles());
  await addBoardReport(db, 'teacher-a', board.hash, {
    layout: 'portrait',
    width: 360,
    problems: [{ check: 'text-size', element: '#x', detail: 'small', extra: 'dropped' }],
  });
  const [report] = await boardReports(db, 'teacher-a');
  assert.deepEqual(report.reports[0].problems, [
    { check: 'text-size', element: '#x', detail: 'small' },
  ]);
});
