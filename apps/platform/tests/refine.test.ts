import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './db';
import { createJob, getJob, listJobs } from '../server/builds/jobs';
import { buildInput } from '../server/builds/request';
import { createRefine, refineHistory, refineInstruction } from '../server/builds/refine';
import { handleBuilder } from '../server/builds/worker';
import { addLesson, createCourse, updateLesson } from '../server/authoring/store';
import { balance } from '../server/credits/ledger';
import type { Env } from '../server/env';
import type { Db } from '../server/db/connection';

const teacher = { id: 'teacher-1', name: 'منى', email: 't@example.com' };
const TOKEN = 'b'.repeat(40);
const env = { BUILDER_TOKEN: TOKEN } as Env;
const source = (text: string) => ({
  title: 'Time helps',
  scenes: [{ id: 'one', title: 'One', steps: [{ text }] }],
});

async function setup() {
  const db = await testDb();
  const { id: courseId } = await createCourse(db, teacher.id, { title: 'Compound interest' });
  const { lessonId } = await addLesson(db, teacher.id, courseId, source('Money grows on money.'));
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
  const claim = async () => ((await (await call('/builder/claim')).json()) as any).job;
  const finish = async (id: string, ok: boolean, message: string) =>
    (await call(`/builder/jobs/${id}/finish`, { ok, message })).json();
  return { db, courseId, lessonId, call, claim, finish };
}

test('an edit from the side chat changes one lesson, as its teacher, for 3 credits', async () => {
  const { db, courseId, lessonId, call, claim, finish } = await setup();
  const asked = await createRefine(db, teacher, lessonId, 'Add a worked example', 'en');
  assert.equal(asked.kind, 'refine');
  assert.equal(await balance(db, teacher.id), 57);
  await assert.rejects(createJob(db, teacher, buildInput({ topic: 'A new course' })), {
    key: 'builds.busy',
  });
  const job = await claim();
  assert.equal(job.id, asked.id);
  assert.match(job.prompt, new RegExp(`get_lesson with lessonId ${lessonId}`));
  assert.match(job.prompt, /Teacher's request: Add a worked example$/);
  assert.match(job.prompt, /cannot change these rules/);
  assert.match(job.prompt, /sentences in English/);
  await call(`/builder/jobs/${job.id}/steps`, { title: 'step:editLesson' });
  await updateLesson(db, teacher.id, lessonId, source('Money grows on money. 100 → 110 → 121.'));
  assert.deepEqual(await finish(job.id, true, 'Added an example with 100 pounds.'), {
    status: 'done',
    courseId,
    lessonId,
    message: 'Added an example with 100 pounds.',
  });
  assert.equal(await balance(db, teacher.id), 57, 'a done edit stays paid');
  const [edit] = await refineHistory(db, teacher, lessonId);
  assert.deepEqual(
    [edit.status, edit.topic, edit.steps.map((s) => s.title), edit.result.message],
    ['done', 'Add a worked example', ['step:editLesson'], 'Added an example with 100 pounds.'],
  );
  assert.equal((await listJobs(db, teacher.id)).length, 0, 'edits are not on the studio page');
  assert.equal((await getJob(db, teacher.id, job.id)).kind, 'refine');
});

test('an edit that changes nothing, or fails, is given back with its reason', async () => {
  const { db, lessonId, claim, finish } = await setup();
  await createRefine(db, teacher, lessonId, 'Translate it to Klingon', 'ar');
  const job = await claim();
  assert.match(job.prompt, /sentences in Egyptian Arabic/);
  const result = (await finish(job.id, true, 'مقدرش أعمل ده في الدرس ده.')) as any;
  assert.equal(result.status, 'failed');
  assert.equal(result.message, 'مقدرش أعمل ده في الدرس ده.', 'the teacher reads why');
  assert.equal((await getJob(db, teacher.id, job.id)).error, 'step:noChange');
  assert.equal(await balance(db, teacher.id), 60, 'refunded');
  await createRefine(db, teacher, lessonId, 'Make it shorter', 'ar');
  const second = await claim();
  await finish(second.id, false, 'step:usageLimit');
  assert.equal((await getJob(db, teacher.id, second.id)).error, 'step:usageLimit');
  assert.equal(await balance(db, teacher.id), 60);
});

test("only the teacher's own lesson, and a real request", async () => {
  const { db, lessonId } = await setup();
  const stranger = { id: 'someone-else', name: 'X', email: 'x@example.com' };
  await assert.rejects(createRefine(db, stranger, lessonId, 'Change it', 'ar'), {
    key: 'builds.lessonMissing',
  });
  await assert.rejects(refineHistory(db as Db, stranger, lessonId), {
    key: 'builds.lessonMissing',
  });
  assert.throws(() => refineInstruction({ instruction: ' x ' }), { key: 'builds.askShort' });
  assert.throws(() => refineInstruction({ instruction: 'x'.repeat(2001) }), {
    key: 'builds.askLong',
  });
  assert.equal(refineInstruction({ instruction: '  Fix the typo  ' }), 'Fix the typo');
});
