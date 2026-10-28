import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { LessonController } from '@learn/lesson-runtime';
import { lessonControl } from '../src/features/nova/lesson/lessonControl';

function host(open: boolean, moving = true) {
  const log: string[] = [];
  const controller = {
    pause: () => undefined,
    getContext: () => ({}) as never,
    next: () => void log.push('next'),
    back: () => void log.push('back'),
    skip: () => (log.push('skip'), open),
    reveal: () => (log.push('reveal'), open),
  } satisfies LessonController;
  return {
    log,
    host: {
      controller,
      context: { line: 'السطر ده' } as never,
      moving,
      pause: () => void log.push('pause'),
      carryOn: () => void log.push('carry'),
    },
  };
}

test('skip and show_answer act only on an open question, then the lesson carries on', () => {
  const on = host(true);
  assert.deepEqual(lessonControl({ action: 'skip_question' }, on.host), { ok: true });
  assert.deepEqual(lessonControl({ action: 'show_answer' }, on.host), { ok: true });
  assert.deepEqual(on.log, ['skip', 'carry', 'reveal', 'carry']);
  const off = host(false);
  assert.ok('error' in lessonControl({ action: 'skip_question' }, off.host));
  assert.ok(!off.log.includes('carry'), 'nothing happened, so nothing carries on');
});

test('pause waits; repeat re-reads a moving lesson, else gives Nova the line to say', () => {
  const moving = host(true);
  lessonControl({ action: 'pause' }, moving.host);
  lessonControl({ action: 'repeat' }, moving.host);
  assert.deepEqual(moving.log, ['pause', 'carry']);
  const manual = host(true, false);
  assert.deepEqual(lessonControl({ action: 'repeat' }, manual.host), {
    ok: true,
    line: 'السطر ده',
  });
  assert.ok('error' in lessonControl({ action: 'dance' }, manual.host));
});
