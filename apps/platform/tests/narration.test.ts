import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './db';
import { addLesson, createCourse, updateCourse, updateLesson } from '../server/authoring/store';
import { createJob, getJob, listJobs } from '../server/builds/jobs';
import { buildInput } from '../server/builds/request';
import { handleBuilder } from '../server/builds/worker';
import { createNarration, narrationPlan } from '../server/media/narration';
import { hashLine, lessonLines, DEFAULT_VOICE } from '../server/media/lines';
import { lessonAudioMap } from '../server/media/playback';
import { serveMedia } from '../server/media/serve';
import { publishCourse, publishedLesson } from '../server/publish/store';
import { courseLessonView } from '../server/publish/progress';
import { balance } from '../server/credits/ledger';
import type { Env, MediaStore } from '../server/env';
import type { Db } from '../server/db/connection';
import type { ReadingPackage } from '@learn/lesson-runtime/core';

const teacher = { id: 'teacher-1', name: 'منى', email: 't@example.com' };
const TOKEN = 'b'.repeat(40);

/** An R2 bucket in a Map. */
function fakeMedia(): MediaStore & { keys: () => string[] } {
  const files = new Map<string, Uint8Array>();
  return {
    keys: () => [...files.keys()],
    put: async (key, value) => {
      files.set(key, value instanceof Uint8Array ? value : new Uint8Array(value));
    },
    get: async (key) => {
      const bytes = files.get(key);
      if (!bytes) return null;
      return { body: new Blob([Buffer.from(bytes)]).stream(), size: bytes.length };
    },
  };
}

const wav = () => {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  return Buffer.concat([header, Buffer.alloc(480)]).toString('base64');
};

const source = {
  title: 'The Sun',
  scenes: [
    {
      id: 'one',
      title: 'A star',
      steps: [
        { text: 'The Sun is a star.', tone: 'slowly, with wonder' },
        { text: 'It is very far away.' },
      ],
      question: {
        kind: 'choice' as const,
        english: 'What is the Sun?',
        options: ['A star', 'A planet'],
        answer: { english: 'A star' },
        feedback: [{ text: 'Yes, a star.' }],
      },
    },
  ],
};

async function setup() {
  const db = await testDb();
  const media = fakeMedia();
  const env = { BUILDER_TOKEN: TOKEN, MEDIA: media } as unknown as Env;
  const { id: courseId } = await createCourse(db, teacher.id, {
    title: 'Space',
    language: 'en',
    voice: { voice: 'Algenib', pace: 'slow', persona: 'an old astronomer' },
  });
  const { lessonId } = await addLesson(db, teacher.id, courseId, source);
  const call = (path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') =>
    handleBuilder(
      new Request(`https://learn.test${path}`, {
        method,
        headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      env,
      { db },
    );
  const claim = async (kinds?: string[]) =>
    ((await (await call('/builder/claim', kinds ? { kinds } : {})).json()) as any).job;
  return { db, media, env, courseId, lessonId, call, claim };
}

test('lines: every step, the question and the feedback, hashed by words, tone, voice and language', async () => {
  const { db, lessonId } = await setup();
  const { lines } = await (
    await import('../server/media/narration')
  ).linesOf(db, teacher.id, lessonId);
  assert.deepEqual(
    lines.map((l) => [l.id, l.text, l.tone]),
    [
      ['one:n:0', 'The Sun is a star.', 'slowly, with wonder'],
      ['one:n:1', 'It is very far away.', ''],
      ['one:q', 'What is the Sun?', ''],
      ['one:f:0', 'Yes, a star.', ''],
    ],
  );
  const voice = { voice: 'Algenib', pace: 'slow', persona: 'an old astronomer' };
  assert.equal(
    lines[0].hash,
    await hashLine(voice, 'en', 'The Sun is a star.', 'slowly, with wonder'),
  );
  assert.notEqual(
    lines[0].hash,
    await hashLine(voice, 'en', 'The Sun is a star.', ''),
    'the tone counts',
  );
  assert.notEqual(
    lines[0].hash,
    await hashLine(DEFAULT_VOICE, 'en', 'The Sun is a star.', 'slowly, with wonder'),
  );
  assert.match(lines[0].hash, /^[0-9a-f]{64}$/);
});

test('a recording: the plan prices the missing lines, the media worker records them, the lesson plays them', async () => {
  const { db, media, courseId, lessonId, call, claim } = await setup();
  const before = await narrationPlan(db, teacher.id, courseId);
  assert.deepEqual(
    before.lessons.map((l) => [l.lines, l.recorded, l.toRecord, l.minutes, l.credits, l.job]),
    [[4, 0, 4, 1, 2, null]],
  );
  const asked = await createNarration(db, teacher, lessonId);
  assert.equal(asked.kind, 'voice');
  assert.equal(await balance(db, teacher.id), 58, 'one minute, two credits');
  await assert.rejects(createNarration(db, teacher, lessonId), { key: 'builds.busy' });
  // A build can still be asked: it runs on the other worker.
  const build = await createJob(db, teacher, buildInput({ topic: 'Another course' }));
  assert.equal(build.kind, 'build');
  assert.equal(
    (await listJobs(db, teacher.id)).map((j) => j.id).includes(asked.id),
    false,
    'not on the studio page',
  );
  // The builder never sees the voice job; the media worker never sees the build.
  const builderGot = await claim();
  assert.equal(builderGot.id, build.id);
  const job = await claim(['voice']);
  assert.deepEqual(job, { id: asked.id, kind: 'voice' });
  assert.equal(await claim(['voice']), null);
  const lines = (await (await call(`/builder/jobs/${job.id}/lines`)).json()) as any;
  assert.deepEqual(lines.voice, { voice: 'Algenib', pace: 'slow', persona: 'an old astronomer' });
  assert.equal(lines.language, 'en');
  assert.equal(lines.lines.length, 4);
  // A clip must be one of the job's lines, and a WAV.
  const bad = await call(`/builder/jobs/${job.id}/clips`, {
    hash: 'f'.repeat(64),
    wav: wav(),
    seconds: 1,
  });
  assert.equal(bad.status, 400);
  for (const [i, line] of lines.lines.entries()) {
    const saved = await call(`/builder/jobs/${job.id}/clips`, {
      hash: line.hash,
      wav: wav(),
      seconds: 1.5,
      words: line.text
        .split(' ')
        .map((w: string, k: number) => ({ w, t0: k * 0.3, t1: k * 0.3 + 0.25 })),
      heard: line.text.toLowerCase(),
      score: i === 1 ? 0.5 : 1,
      flagged: i === 1,
      model: 'gemini-2.5-flash-tts',
    });
    assert.equal(saved.status, 200, await saved.text());
  }
  assert.equal(media.keys().length, 4);
  assert.ok(media.keys().every((k) => /^audio\/[0-9a-f]{64}\.wav$/.test(k)));
  const done = (await (
    await call(`/builder/jobs/${job.id}/finish`, { ok: true, message: 'flagged:1' })
  ).json()) as any;
  assert.equal(done.status, 'done');
  assert.equal(await balance(db, teacher.id), 28, 'the recording and the build stay paid');
  const after = await narrationPlan(db, teacher.id, courseId);
  assert.deepEqual(
    after.lessons.map((l) => [
      l.recorded,
      l.toRecord,
      l.flagged,
      l.seconds,
      l.credits,
      l.job?.status,
    ]),
    [[4, 0, 1, 6, 0, 'done']],
  );
  await assert.rejects(createNarration(db, teacher, lessonId), { key: 'voice.nothingToRecord' });
  // Students get the clips with the published lesson.
  await publishCourse(db, teacher, courseId, { priceCents: 0, currency: 'USD' } as never);
  const view = await courseLessonView(db, courseId, lessonId);
  assert.deepEqual(Object.keys(view.audio).sort(), ['one:f:0', 'one:n:0', 'one:n:1', 'one:q']);
  assert.equal(view.audio['one:n:0'].seconds, 1.5);
  assert.equal(view.audio['one:n:0'].words[0].w, 'The');
  // The clip is served by its hash, immutable.
  const hash = view.audio['one:n:0'].hash;
  const served = await serveMedia(new Request(`https://learn.test/media/audio/${hash}.wav`), media);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal((await served.arrayBuffer()).byteLength, 524);
  assert.equal(
    (await serveMedia(new Request(`https://learn.test/media/audio/${'0'.repeat(64)}.wav`), media))
      .status,
    404,
  );
  assert.equal((await serveMedia(new Request('https://learn.test/media/../x'), media)).status, 404);
  // An edited line is the only one recorded again; the others keep their clips.
  await updateLesson(db, teacher.id, lessonId, {
    ...source,
    scenes: [
      {
        ...source.scenes[0],
        steps: [source.scenes[0].steps[0], { text: 'It is 150 million km away.' }],
      },
    ],
  });
  const edited = await narrationPlan(db, teacher.id, courseId);
  assert.deepEqual([edited.lessons[0].recorded, edited.lessons[0].toRecord], [3, 1]);
  // A new voice means every line again.
  await updateCourse(db, teacher.id, courseId, {
    voice: { voice: 'Kore', pace: 'normal', persona: '' },
  });
  assert.equal((await narrationPlan(db, teacher.id, courseId)).lessons[0].toRecord, 4);
});

test('a recording that stops early fails and is given back; the draft preview has no audio yet', async () => {
  const { db, lessonId, call, claim } = await setup();
  const asked = await createNarration(db, teacher, lessonId);
  const job = await claim(['voice']);
  const lines = (await (await call(`/builder/jobs/${job.id}/lines`)).json()) as any;
  await call(`/builder/jobs/${job.id}/clips`, {
    hash: lines.lines[0].hash,
    wav: wav(),
    seconds: 1,
  });
  const result = (await (
    await call(`/builder/jobs/${job.id}/finish`, { ok: true, message: '' })
  ).json()) as any;
  assert.equal(result.status, 'failed');
  assert.equal((await getJob(db, teacher.id, asked.id)).error, 'step:incomplete');
  assert.equal(await balance(db, teacher.id), 60, 'refunded');
  // The one clip that arrived is kept: the next recording skips it.
  const again = await createNarration(db, teacher, lessonId);
  assert.equal(again.kind, 'voice');
  const next = await claim(['voice']);
  const rest = (await (await call(`/builder/jobs/${next.id}/lines`)).json()) as any;
  assert.equal(rest.lines.length, 3);
  // Without a media store the worker is told so, not left guessing.
  const noStore = await handleBuilder(
    new Request(`https://learn.test/builder/jobs/${next.id}/clips`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ hash: rest.lines[0].hash, wav: wav(), seconds: 1 }),
    }),
    { BUILDER_TOKEN: TOKEN } as Env,
    { db },
  );
  assert.equal(noStore.status, 503);
  // Kinds the server does not know are refused.
  const odd = await call('/builder/claim', { kinds: ['pictures'] });
  assert.equal(odd.status, 400);
});

test('the audio map of a package without clips is empty, and a published lesson carries its language', async () => {
  const { db, courseId, lessonId } = await setup();
  await publishCourse(db, teacher, courseId, { priceCents: 0, currency: 'USD' } as never);
  const row = await publishedLesson(db, courseId, lessonId);
  assert.equal(row.language, 'en');
  assert.deepEqual(
    await lessonAudioMap(db as Db, row.package as ReadingPackage, row.voice, row.language),
    {},
  );
});
