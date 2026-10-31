import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './db';
import { account, balance, grant, refund, spend } from '../server/credits/ledger';
import { claimJob, createJob, finishJob } from '../server/builds/jobs';
import { buildInput } from '../server/builds/request';
import { ACTIONS, STARTER_CREDITS, validPrice } from '../src/features/credits/pricing';

const mona = { id: 'u-mona', name: 'Mona', email: 'Mona@Example.com' };
const staff = { id: 'u-staff', name: 'Staff', email: 'staff@example.com' };
const BUILD = ACTIONS['course.build'].credits;

test('every account starts with its credits once; charges and refunds happen once per thing', async () => {
  const db = await testDb();
  assert.equal((await account(db, mona)).balance, STARTER_CREDITS);
  assert.equal((await account(db, mona)).balance, STARTER_CREDITS, 'the starter is given once');
  await spend(db, mona, 'course.build', 'job-1');
  await spend(db, mona, 'course.build', 'job-1'); // a retried request
  assert.equal(await balance(db, mona.id), STARTER_CREDITS - BUILD, 'one charge per job');
  assert.equal(await refund(db, mona.id, 'job-1'), true);
  assert.equal(await refund(db, mona.id, 'job-1'), false, 'one refund per job');
  assert.equal(await refund(db, mona.id, 'never-charged'), false);
  assert.equal(await balance(db, mona.id), STARTER_CREDITS);
  const history = (await account(db, mona)).entries.map((e) => [e.kind, e.amount]);
  assert.deepEqual(history.sort(), [
    ['refund', BUILD],
    ['spend', -BUILD],
    ['starter', STARTER_CREDITS],
  ]);
});

test('a short balance refuses with what it costs and what is left', async () => {
  const db = await testDb();
  const runs = Math.floor(STARTER_CREDITS / BUILD);
  for (let i = 0; i < runs; i++) await spend(db, mona, 'course.build', `job-${i}`);
  await spend(db, mona, 'course.build', 'job-0'); // a retry of a paid job still goes through
  await assert.rejects(spend(db, mona, 'course.build', 'one-more'), {
    status: 402,
    key: 'credits.notEnough',
    vars: { cost: BUILD, balance: STARTER_CREDITS - runs * BUILD },
  });
});

test('staff grant credits by e-mail to an account that has opened the app', async () => {
  const db = await testDb();
  await assert.rejects(grant(db, staff, { email: 'mona@example.com', amount: 50, note: '' }), {
    key: 'credits.unknownAccount',
  });
  await account(db, mona);
  const done = await grant(db, staff, { email: ' MONA@example.com ', amount: 50, note: 'beta' });
  assert.equal(done.balance, STARTER_CREDITS + 50);
  await assert.rejects(grant(db, staff, { email: mona.email, amount: 0, note: '' }), {
    key: 'credits.badAmount',
  });
  const [row] = (await account(db, mona)).entries.filter((e) => e.kind === 'grant');
  assert.equal(row.note, 'beta');
});

test('a course build is charged when queued and given back when it fails', async () => {
  const db = await testDb();
  const job = await createJob(db, mona, buildInput({ topic: 'Compound interest' }));
  assert.equal(await balance(db, mona.id), STARTER_CREDITS - BUILD);
  const claimed = await claimJob(db);
  assert.equal(claimed?.job.id, job.id);
  await finishJob(db, job.id, { ok: false, message: '' });
  assert.equal(await balance(db, mona.id), STARTER_CREDITS, 'a failed build costs nothing');
  // With too few credits the job is not queued at all.
  for (let i = 0; i * BUILD < STARTER_CREDITS; i++) await spend(db, mona, 'course.build', `x${i}`);
  await assert.rejects(createJob(db, mona, buildInput({ topic: 'Another' })), {
    key: 'credits.notEnough',
  });
});

test('course prices: free, or within the currency’s limits in whole minor units', () => {
  assert.equal(validPrice(0, 'USD'), true);
  assert.equal(validPrice(999, 'USD'), true);
  assert.equal(validPrice(50, 'USD'), false, 'below the lowest price');
  assert.equal(validPrice(9.5, 'USD'), false);
  assert.equal(validPrice(5000, 'EGP'), true);
  assert.equal(validPrice(1000, 'XYZ'), false);
});
