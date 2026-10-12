import assert from 'node:assert/strict';
import test from 'node:test';
import { SETTLE_MS, STEP_MS } from '../src/reading/model';
import {
  READING_TRANSITION_MS,
  readingTransitionStart,
  readingTransitionTime,
} from '../src/reading/transition';

test('Next starts at the current unit cue and settles in 350ms, not the 10s ordering slot', () => {
  for (const step of [1, 2, 8]) {
    const target = step * STEP_MS + SETTLE_MS;
    const start = readingTransitionStart(target - STEP_MS, target, false);
    assert.equal(start, step * STEP_MS);
    assert.ok(readingTransitionTime(start, target, 16) >= step * STEP_MS);
    assert.equal(readingTransitionTime(start, target, READING_TRANSITION_MS), target);
    assert.ok(readingTransitionTime(start, target, 100000) < (step + 1) * STEP_MS);
  }
});

test('reduced motion, first render and backward jumps show the settled current page', () => {
  assert.equal(readingTransitionStart(1600, 11600, true), 11600);
  assert.equal(readingTransitionStart(null, 11600, false), 11600);
  assert.equal(readingTransitionStart(21600, 11600, false), 11600);
  assert.equal(readingTransitionTime(10000, 11600, -1), 10000);
});
