import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './db';
import { HttpError } from '../server/http';
import { LIMITS, rateLimit } from '../server/ops/limits';
import { countUsage, logError, recentErrors, usageSince } from '../server/ops/record';
import type { Db } from '../server/db/connection';

const tooMany = (e: unknown) =>
  e instanceof HttpError && e.status === 429 && e.key === 'http.tooMany';

test('a limit lets its requests through, then answers 429 until the window ends', async () => {
  const db = await testDb();
  const { max, seconds } = LIMITS['auth.signup'];
  const now = Date.UTC(2026, 9, 31, 10, 0, 1);
  for (let i = 0; i < max; i++) await rateLimit(db, 'auth.signup', '1.2.3.4', now);
  await assert.rejects(rateLimit(db, 'auth.signup', '1.2.3.4', now), tooMany);
  // Someone else, and the same caller in the next window, start again.
  await rateLimit(db, 'auth.signup', '5.6.7.8', now);
  await rateLimit(db, 'auth.signup', '1.2.3.4', now + seconds * 1000);
});

test('usage is counted per day and kind, with a rough cost', async () => {
  const db = await testDb();
  await countUsage(db, 'nova.chat');
  await countUsage(db, 'nova.chat', 2);
  await countUsage(db, 'build.job');
  const usage = await usageSince(db);
  const chat = usage.find((u) => u.kind === 'nova.chat');
  assert.equal(chat?.count, 3);
  assert.equal(chat?.cents, 0.3);
  assert.equal(usage.find((u) => u.kind === 'build.job')?.cents, 250);
});

test('errors are kept short, newest first', async () => {
  const db = await testDb();
  await logError(db, { source: 'browser', place: '/?teach', message: 'first' });
  await logError(db, {
    source: 'server',
    place: 'POST /api/nova/chat',
    status: 500,
    message: 'x'.repeat(5000),
    detail: { stack: 'y'.repeat(9000), extra: { deep: true } },
  });
  const [newest, older] = await recentErrors(db);
  assert.equal(newest.message.length, 1000);
  assert.equal((newest.detail as Record<string, string>).stack.length, 4000);
  assert.equal((newest.detail as Record<string, string>).extra, '{"deep":true}');
  assert.equal(older.message, 'first');
});

test('recording never breaks the request that tried it', async () => {
  const broken = {
    insert: () => {
      throw new Error('database down');
    },
  } as unknown as Db;
  const quiet = console.error;
  console.error = () => undefined;
  try {
    await countUsage(broken, 'mcp.call');
    await logError(broken, { source: 'server', place: 'here', message: 'boom' });
  } finally {
    console.error = quiet;
  }
});
