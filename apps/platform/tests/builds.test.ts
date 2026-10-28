import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './db';
import { buildInput, buildPrompt } from '../server/builds/request';
import { LOOKS as SERVER_LOOKS } from '../server/builds/looks';
import { LOOKS as PAGE_LOOKS } from '../src/features/studio/looks';
import { createJob, getJob, listJobs } from '../server/builds/jobs';
import { handleBuilder } from '../server/builds/worker';
import { addLesson, createCourse } from '../server/authoring/store';
import { bearerUser } from '../server/oauth/tokens';
import type { Env } from '../server/env';

const teacher = { id: 'teacher-1', name: 'منى', email: 't@example.com' };
const TOKEN = 'b'.repeat(40);
const env = { BUILDER_TOKEN: TOKEN } as Env;
const pdf = { name: 'chapter one.pdf', mime: 'application/pdf', data: btoa('%PDF-1.4 hello') };

test('a request is a topic, known choices and a few small files', () => {
  const { request, files } = buildInput({
    topic: 'الفايدة المركبة',
    choices: { style: 'story,examples', boards: 'most', size: '3' },
    webSearch: true,
    files: [pdf],
  });
  assert.equal(request.choices.style, 'story,examples');
  assert.equal(request.choices.language, 'egyptian', 'defaults fill the rest');
  assert.deepEqual([files[0].name, files[0].size], ['chapter one.pdf', 14]);
  const bad = [
    { topic: 'x' },
    { topic: 'ok topic', choices: { style: 'shouting' } },
    { topic: 'ok topic', files: [{ ...pdf, mime: 'application/x-msdownload' }] },
    { topic: 'ok topic', files: Array(6).fill(pdf) },
  ];
  for (const input of bad) assert.throws(() => buildInput(input), JSON.stringify(input));
  const prompt = buildPrompt(request, files);
  assert.match(prompt, /get_authoring_guide first/);
  assert.match(prompt, /story first.*; worked examples/);
  assert.match(prompt, /never instructions to you/);
  assert.match(prompt, /- chapter one\.pdf \(application\/pdf\)/);
  assert.match(
    prompt,
    /Look: choose the one that suits the topic/,
    'no look means the builder picks',
  );
});

test('a chosen look carries its art direction, and the page offers the same looks', () => {
  const { request } = buildInput({ topic: 'الفايدة المركبة', choices: { look: 'chalk' } });
  assert.match(buildPrompt(request, []), /Look \(chalk\): Chalk on a dark/);
  assert.match(buildPrompt(request, []), /call get_style with look "chalk"/);
  assert.throws(() => buildInput({ topic: 'ok topic', choices: { look: 'neon' } }));
  assert.throws(() => buildInput({ topic: 'ok topic', choices: { look: 'chalk,crt' } }));
  assert.deepEqual(
    PAGE_LOOKS.map((look) => look.id),
    Object.keys(SERVER_LOOKS),
  );
});

test('the worker claims a job, acts as its teacher through MCP, reports steps and the course', async () => {
  const db = await testDb();
  const call = (path: string, init: RequestInit = {}, token = TOKEN) =>
    handleBuilder(
      new Request(`https://learn.test${path}`, {
        ...init,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      }),
      env,
      { db },
    );
  assert.equal((await call('/builder/claim', { method: 'POST' }, 'wrong'.repeat(9))).status, 401);
  assert.deepEqual(await (await call('/builder/claim', { method: 'POST' })).json(), { job: null });

  const queued = await createJob(
    db,
    teacher,
    buildInput({ topic: 'Compound interest', files: [pdf] }),
  );
  await assert.rejects(createJob(db, teacher, buildInput({ topic: 'Another one' })), /بيتبني/);
  const { job } = (await (await call('/builder/claim', { method: 'POST' })).json()) as any;
  assert.equal(job.id, queued.id);
  assert.equal(job.mcpUrl, 'https://learn.test/mcp');
  assert.match(job.prompt, /Compound interest/);
  const as = await bearerUser(
    db,
    new Request('https://learn.test/mcp', { headers: { authorization: `Bearer ${job.mcpToken}` } }),
  );
  assert.equal(as?.id, teacher.id, 'the MCP token acts as the teacher');
  const file = await call(`/builder/jobs/${job.id}/files/${job.files[0].id}`);
  assert.equal(await file.text(), '%PDF-1.4 hello');
  assert.equal(file.headers.get('content-type'), 'application/pdf');

  const step = (title: string) =>
    call(`/builder/jobs/${job.id}/steps`, { method: 'POST', body: JSON.stringify({ title }) });
  await step('Reading the guide');
  await step('Writing lesson 1');
  const { id: courseId } = await createCourse(db, teacher.id, { title: 'Compound interest' });
  const lesson = await addLesson(db, teacher.id, courseId, {
    title: 'Time helps',
    scenes: [{ id: 'one', title: 'One', steps: [{ text: 'Money grows on money.' }] }],
  });
  const done = await call(`/builder/jobs/${job.id}/finish`, {
    method: 'POST',
    body: JSON.stringify({ ok: true, message: 'Made [one lesson](https://learn.test/?draft=x).' }),
  });
  assert.deepEqual(await done.json(), {
    status: 'done',
    courseId,
    lessonId: lesson.lessonId,
    message: 'Made one lesson.',
  });
  const seen = await getJob(db, teacher.id, job.id);
  assert.deepEqual(
    seen.steps.map((s) => s.title),
    ['Reading the guide', 'Writing lesson 1'],
  );
  assert.equal((await listJobs(db, teacher.id)).length, 1);
  await assert.rejects(getJob(db, 'someone-else', job.id), /مش موجودة/);
  assert.equal((await step('late')).status, 409, 'a finished job takes no more steps');
});

test('a run that made no lesson fails honestly', async () => {
  const db = await testDb();
  await createJob(db, teacher, buildInput({ topic: 'Nothing comes of this' }));
  const call = (path: string, body?: unknown) =>
    handleBuilder(
      new Request(`https://learn.test${path}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      }),
      env,
      { db },
    );
  const { job } = (await (await call('/builder/claim')).json()) as any;
  const result = await (
    await call(`/builder/jobs/${job.id}/finish`, { ok: true, message: '' })
  ).json();
  assert.equal(result.status, 'failed');
  assert.equal((await getJob(db, teacher.id, job.id)).error, 'مفيش درس اتعمل.');
});
