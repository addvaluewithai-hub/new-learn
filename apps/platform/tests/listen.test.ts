import assert from 'node:assert/strict';
import { test } from 'node:test';
import { listenCourses, listenOutline, listenProblems } from '../../../content/listen/courses';
import { listenConfig, listenInstruction } from '../server/listen/instruction';
import { listenSpot } from '../server/listen/routes';
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

test('one session teaches one scene, keeps the answer private and can move on', () => {
  const spot = listenSpot({ courseId: course.id, lessonId: 'lesson-01', sceneId: 'why' });
  const instruction = listenInstruction(spot, 'Ahmed', DEFAULT_STYLE);
  assert.ok(instruction.includes(spot.scene.lines[0]));
  assert.ok(instruction.includes(spot.scene.check!.ask));
  assert.ok(instruction.includes('never say it before the learner has tried'));
  assert.ok(instruction.includes('greet the learner'));
  const config = listenConfig(instruction, DEFAULT_STYLE);
  assert.deepEqual(config.realtimeInputConfig, { automaticActivityDetection: { disabled: true } });
  assert.equal(config.tools[0].functionDeclarations[0].name, 'scene_done');
  const later = listenSpot({ courseId: course.id, lessonId: 'lesson-01', sceneId: 'recap' });
  assert.ok(listenInstruction(later, 'Ahmed', DEFAULT_STYLE).includes('has no check'));
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
