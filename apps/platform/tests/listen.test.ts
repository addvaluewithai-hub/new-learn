import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canSee,
  lessonScript,
  listenCourses,
  listenOutline,
  listenProblems,
  sceneScript,
} from '../../../content/listen/courses';
import { listenConfig, listenInstruction } from '../server/listen/instruction';
import { listenRoute, listenSpot } from '../server/listen/routes';
import { wakeVerdict, wakeWav } from '../server/listen/wake';
import { DEFAULT_STYLE } from '../server/nova/style';
import { HeardTracker, joinPcm } from '../src/features/listen/pcmJoin';
import { SpeechDetector } from '../src/features/listen/speech';

const course = listenCourses['manhaj-almarifa'];

test('the audio course has ten structurally complete lessons', () => {
  assert.deepEqual(listenProblems(course), []);
  assert.equal(course.lessons.length, 10);
  for (const lesson of course.lessons) {
    assert.ok(lesson.scenes.length >= 3, lesson.id);
    assert.ok(
      lesson.scenes.some((scene) => scene.check),
      `${lesson.id} asks something`,
    );
  }
});

test('the student app gets titles only, never notes or expected answers', () => {
  const text = JSON.stringify(listenOutline(course));
  const scene = course.lessons[0].scenes[0];
  assert.ok(text.includes(scene.title));
  assert.ok(!text.includes(scene.lines[0]));
  assert.ok(!text.includes(scene.check!.answer));
});

test('positions resolve only against the server course', () => {
  const spot = listenSpot({ courseId: course.id, lessonId: 'lesson-02', sceneId: 'luck' });
  assert.equal(spot.lessonIndex, 1);
  assert.equal(spot.sceneIndex, 1);
  assert.throws(() => listenSpot({ courseId: 'nope', lessonId: 'lesson-01', sceneId: 'why' }));
  assert.throws(() => listenSpot({ courseId: course.id, lessonId: 'lesson-01', sceneId: 'x' }));
  assert.throws(() => listenSpot({ courseId: course.id, lessonId: 'lesson-99', sceneId: 'why' }));
});

test('the tutor reads the script exactly, keeps the answer private and has the lesson', () => {
  const spot = listenSpot({ courseId: course.id, lessonId: 'lesson-01', sceneId: 'kinds' });
  const instruction = listenInstruction(spot, 'Ahmed', DEFAULT_STYLE);
  assert.ok(instruction.includes('EXACTLY as written'));
  assert.ok(instruction.includes('never say it before the learner has tried'));
  assert.ok(instruction.includes(spot.scene.check!.answer));
  // The whole current lesson is in context, not just this scene, but no other answers.
  for (const scene of spot.lesson.scenes) assert.ok(instruction.includes(scene.lines[0]));
  assert.ok(!instruction.includes(spot.lesson.scenes[0].check!.answer));
  assert.ok(instruction.includes('← CURRENT SCENE'));
  const config = listenConfig(instruction, DEFAULT_STYLE);
  assert.deepEqual(config.realtimeInputConfig, { automaticActivityDetection: { disabled: true } });
  assert.deepEqual(
    config.tools[0].functionDeclarations.map((t) => t.name),
    ['check_done', 'resume_lesson', 'get_lesson'],
  );
});

test('every question has scripted feedback, and the scene script hides the answer', () => {
  for (const lesson of course.lessons)
    for (const scene of lesson.scenes)
      if (scene.check) assert.ok(scene.check.feedback, `${lesson.id}/${scene.id}`);
  const scene = course.lessons[0].scenes[1];
  const script = sceneScript(scene);
  assert.deepEqual(script.lines, scene.lines);
  assert.equal(script.ask, scene.check!.ask);
  assert.ok(!JSON.stringify(script).includes(scene.check!.answer));
  const lesson = lessonScript(course.lessons[1]);
  assert.ok(!JSON.stringify(lesson).includes(course.lessons[1].scenes[0].check!.answer));
  const spoken = {
    ...course,
    lessons: [{ ...course.lessons[0], scenes: [{ ...scene, lines: ['قول نوفا'] }] }],
  };
  assert.ok(listenProblems(spoken).some((p) => p.includes('wake word')));
});

test('wake clips become a 16 kHz mono WAV; bad clips and verdicts are refused', () => {
  const pcm = Buffer.alloc(32000).toString('base64');
  const wav = Buffer.from(wakeWav(pcm), 'base64');
  assert.equal(wav.subarray(0, 4).toString(), 'RIFF');
  assert.equal(wav.readUInt32LE(24), 16000);
  assert.equal(wav.length, 44 + 32000);
  assert.throws(() => wakeWav('short'));
  assert.throws(() => wakeWav(Buffer.alloc(200000).toString('base64')));
  assert.equal(wakeVerdict('{"heard":"يا نوفا","wake":true}'), true);
  assert.equal(wakeVerdict('{"wake":"yes"}'), false);
  assert.equal(wakeVerdict('nonsense'), false);
});

test('pcm chunks join up to a byte limit', () => {
  const a = Buffer.alloc(6, 1).toString('base64'),
    b = Buffer.alloc(6, 2).toString('base64');
  assert.deepEqual([...Buffer.from(joinPcm([a, b], 8), 'base64')], [1, 1, 1, 1, 1, 1, 2, 2]);
});

test('heard text follows the audio that has started, not what has arrived', () => {
  const heard = new HeardTracker();
  heard.said('أول جملة. ');
  heard.queued(0);
  heard.said('تاني جملة.');
  heard.queued(30);
  assert.equal(heard.heard(), 'أول جملة.');
});

test('speech detection ignores clinks, keeps the first word and ends after quiet', () => {
  const events: string[] = [];
  let preroll = 0;
  const speech = new SpeechDetector({
    start: (chunks) => {
      preroll = chunks.length;
      events.push('start');
    },
    chunk: () => {},
    end: () => events.push('end'),
  });
  const feed = (level: number, count: number) => {
    for (let i = 0; i < count; i++) speech.feed('AAAA', level);
  };
  feed(0.001, 20);
  feed(0.3, 1); // a single clink
  feed(0.001, 5);
  assert.deepEqual(events, []);
  feed(0.2, 10);
  assert.deepEqual(events, ['start']);
  assert.equal(preroll, 12);
  feed(0.001, 40);
  assert.deepEqual(events, ['start', 'end']);
});

test('a course limited to named accounts is invisible to everyone else', async () => {
  const env = {} as Parameters<typeof listenRoute>[1];
  const owner = { id: 'o', name: 'Owner', email: 'AddValueWithAI@gmail.com' };
  const other = { id: 'x', name: 'Other', email: 'someone@example.com' };
  const get = (path: string) => new Request(`https://app.test/api/listen/${path}`);
  assert.ok(canSee(course, owner.email));
  assert.ok(!canSee(course, other.email));
  const mine = await (await listenRoute(get(''), env, owner, '')).json();
  assert.deepEqual(
    mine.courses.map((c: { id: string }) => c.id),
    [course.id],
  );
  const theirs = await (await listenRoute(get(''), env, other, '')).json();
  assert.deepEqual(theirs.courses, []);
  assert.equal((await listenRoute(get(course.id), env, owner, course.id)).status, 200);
  await assert.rejects(listenRoute(get(course.id), env, other, course.id), { status: 404 });
  const live = new Request('https://app.test/api/listen/live', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ courseId: course.id, lessonId: 'lesson-01', sceneId: 'why' }),
  });
  await assert.rejects(listenRoute(live, env, other, 'live'), { status: 404 });
  const lesson = await listenRoute(
    get(`${course.id}/lessons/2`),
    env,
    owner,
    `${course.id}/lessons/2`,
  );
  assert.equal((await lesson.json()).title, course.lessons[1].title);
  await assert.rejects(listenRoute(get('x'), env, other, `${course.id}/lessons/2`), {
    status: 404,
  });
  await assert.rejects(listenRoute(get('x'), env, owner, `${course.id}/lessons/99`), {
    status: 404,
  });
});

test('the tutor states terms in both languages and waits for answers', () => {
  const spot = listenSpot({ courseId: course.id, lessonId: 'lesson-01', sceneId: 'jtb' });
  const instruction = listenInstruction(spot, 'Ahmed', DEFAULT_STYLE);
  assert.ok(instruction.includes('followed by its standard English term'));
  assert.ok(instruction.includes('wait for the learner, however long it takes'));
  assert.ok(!instruction.includes('give the answer simply yourself'));
});
