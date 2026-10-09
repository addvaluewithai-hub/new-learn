import { test } from 'node:test';
import assert from 'node:assert/strict';
import { probeLesson } from '../../../fixtures/runtime-probe/lesson';
import { initialSession, reduceSession } from '../src/session';

const reduce = (
  state: ReturnType<typeof initialSession>,
  action: Parameters<typeof reduceSession>[2],
) => reduceSession(probeLesson, state, action);
function atQuestion() {
  const state = reduce(initialSession(), { type: 'navigate', index: 1 });
  return reduce(state, { type: 'ended', epoch: state.epoch });
}

test('teaching completion automatically starts the next scene', () => {
  const next = reduce(initialSession(), { type: 'ended', epoch: 0 });
  assert.equal(next.index, 1);
  assert.equal(next.autoStart, true);
  assert.equal(next.mode, 'narration');
});

test('question reading finishes into an attempt, without revealing feedback', () => {
  const state = atQuestion();
  assert.equal(state.mode, 'attempt');
  assert.equal(state.frame, 89);
  assert.deepEqual(state.answers, {});
  assert.equal(state.autoStart, false);
});

test('pre-reading, empty and duplicate submissions cannot start feedback', () => {
  const initial = initialSession();
  assert.equal(reduce(initial, { type: 'submit' }), initial);
  const attempt = atQuestion();
  assert.equal(reduce(attempt, { type: 'submit' }), attempt);
  const drafted = reduce(attempt, { type: 'draft', draft: { choice: 1, written: '' } });
  const feedback = reduce(drafted, { type: 'submit' });
  assert.equal(feedback.mode, 'feedback');
  assert.equal(feedback.autoStart, true);
  assert.equal(reduce(feedback, { type: 'submit' }), feedback);
});

test('a valid attempt starts feedback, whose completion starts next teaching', () => {
  const drafted = reduce(atQuestion(), { type: 'draft', draft: { choice: 0, written: '' } });
  const feedback = reduce(drafted, { type: 'submit' });
  assert.deepEqual(feedback.answers.try, { choice: 0, written: '' });
  // Self-review is not a mastery grade, even for an incorrect selected choice.
  const next = reduce(feedback, { type: 'ended', epoch: feedback.epoch });
  assert.equal(next.index, 2);
  assert.equal(next.mode, 'narration');
  assert.equal(next.autoStart, true);
});

test('events from abandoned scenes/retries cannot move the active scene', () => {
  const next = reduce(initialSession(), { type: 'navigate', index: 1 });
  for (const action of [
    { type: 'ended', epoch: 0 },
    { type: 'frame', epoch: 0, frame: 70 },
    { type: 'error', epoch: 0, message: 'old failure' },
  ] as const)
    assert.equal(reduce(next, action), next);
});

test('audio failure blocks progression; retry restarts the same recording', () => {
  const failed = reduce(initialSession(), { type: 'error', epoch: 0, message: 'failed' });
  assert.equal(reduce(failed, { type: 'ended', epoch: 0 }), failed);
  const retry = reduce(failed, { type: 'retry' });
  assert.equal(retry.index, 0);
  assert.equal(retry.error, null);
  assert.equal(retry.frame, 0);
  assert.equal(retry.autoStart, true);
  assert.equal(retry.recovery, 1);
  assert.equal(reduce(retry, { type: 'ended', epoch: 0 }), retry);
});

test('replay retires feedback and keeps answers as history without leaking them', () => {
  const draft = reduce(atQuestion(), { type: 'draft', draft: { choice: 1, written: '' } });
  const feedback = reduce(draft, { type: 'submit' });
  const replay = reduce(feedback, { type: 'navigate', index: 1 });
  assert.equal(replay.mode, 'narration');
  assert.equal(replay.frame, 0);
  assert.deepEqual(replay.draft, { written: '' });
  assert.deepEqual(replay.answers, feedback.answers);
});

test('completion and duplicate end cannot advance beyond the last scene', () => {
  const final = reduce(initialSession(), { type: 'navigate', index: 2 });
  const complete = reduce(final, { type: 'ended', epoch: final.epoch });
  assert.equal(complete.mode, 'complete');
  assert.equal(reduce(complete, { type: 'ended', epoch: final.epoch }), complete);
  const restart = reduce(complete, { type: 'restart' });
  assert.equal(restart.index, 0);
  assert.deepEqual(restart.answers, {});
});
