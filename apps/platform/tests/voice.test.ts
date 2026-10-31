import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './db';
import { courseVoiceInput } from '../server/authoring/voice';
import { addLesson, createCourse, updateCourse } from '../server/authoring/store';
import { buildPackage, LessonProblems } from '../server/authoring/format';
import { publishCourse } from '../server/publish/store';
import { courseLessonView } from '../server/publish/progress';
import { readMessage } from '../src/features/nova/lesson/teach';
import { lessonControl } from '../src/features/nova/lesson/lessonControl';
import { LESSON_ACTIONS } from '../server/nova/live';

const teacher = { id: 't1', name: 'أستاذة منى', email: 't@example.com' };
const astronomer = { voice: 'Algenib', pace: 'slow', persona: 'عالم فلك صوته عميق' };
const lesson = {
  title: 'الشمس',
  scenes: [
    {
      id: 'sun',
      title: 'الشمس',
      steps: [{ text: 'الشمس نجم.', tone: 'slowly, with wonder' }, { text: 'وهي أقرب نجم لينا.' }],
    },
  ],
};
const ctx = { lessonId: 'l', courseId: 'c', courseTitle: 'الفضاء', order: 1, revision: 1 };

test("a course's voice is checked, kept with the draft and copied to what students get", async () => {
  assert.equal(courseVoiceInput(undefined), undefined);
  assert.equal(courseVoiceInput(null), null);
  assert.deepEqual(courseVoiceInput({ voice: 'Puck' }), {
    voice: 'Puck',
    pace: 'normal',
    persona: '',
  });
  assert.deepEqual(
    courseVoiceInput({ voice: 'Algenib', pace: 'slow', persona: '  deep «voice»  ' }),
    {
      voice: 'Algenib',
      pace: 'slow',
      persona: 'deep voice',
    },
  );
  assert.throws(() => courseVoiceInput({ voice: 'Morgan' }), /voice\.voice/);
  assert.throws(() => courseVoiceInput({ voice: 'Puck', persona: 'x'.repeat(121) }), /persona/);

  const db = await testDb();
  const { id } = await createCourse(db, teacher.id, { title: 'الفضاء', voice: astronomer });
  const { lessonId } = await addLesson(db, teacher.id, id, lesson);
  await publishCourse(db, teacher, id);
  const view = await courseLessonView(db, id, lessonId);
  assert.deepEqual(view.voice, astronomer, 'students get the voice the teacher chose');
  assert.equal(view.package.scenes[0].steps[0].tone, 'slowly, with wonder');
  assert.equal(view.package.scenes[0].steps[1].tone, undefined);
  // Back to the learners' own settings: the next publish carries null.
  assert.equal((await updateCourse(db, teacher.id, id, { voice: null })).voice, null);
  await publishCourse(db, teacher, id);
  assert.equal((await courseLessonView(db, id, lessonId)).voice, null);
});

test('a tone is a few words, and becomes a silent direction on the READ line', () => {
  assert.throws(
    () =>
      buildPackage(
        {
          ...lesson,
          scenes: [{ ...lesson.scenes[0], steps: [{ text: 'x', tone: 'y'.repeat(121) }] }],
        },
        ctx,
        {},
      ),
    LessonProblems,
  );
  assert.equal(readMessage({ n: 0, text: 'الشمس نجم.', question: false }), 'READ:\nالشمس نجم.');
  assert.equal(
    readMessage({ n: 0, text: 'الشمس نجم.', question: false, tone: ' slowly,\n(with) wonder ' }),
    'READ (slowly, with wonder):\nالشمس نجم.',
  );
  assert.equal(
    readMessage({ n: 1, text: 'كام كوكب؟', question: true, tone: 'curious' }),
    'READ QUESTION (curious):\nكام كوكب؟',
  );
});

test('Nova can jump to a scene and back', () => {
  const calls: unknown[] = [];
  const host = {
    controller: {
      pause() {},
      getContext: () => ({}) as never,
      goTo: (at: unknown) => calls.push(at),
    },
    context: null,
    moving: true,
    pause: () => calls.push('pause'),
    carryOn: () => calls.push('carry'),
  };
  assert.ok(LESSON_ACTIONS.includes('go_to_scene'));
  assert.deepEqual(lessonControl({ action: 'go_to_scene', sceneId: ' moon ' }, host), { ok: true });
  assert.deepEqual(calls, [{ sceneId: 'moon', phase: 'narration', step: 0 }, 'carry']);
  assert.match(String(lessonControl({ action: 'go_to_scene' }, host).error), /sceneId/);
});
