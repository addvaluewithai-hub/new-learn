import { test } from 'node:test';
import assert from 'node:assert/strict';
import { errorForCurrentAudio } from '../src/audioError';

const base = 'https://preview.example.test/lesson/';
const question = '/lesson-assets/question.wav';
const teaching = '/lesson-assets/teaching.wav';

function media(src: string, currentSrc: string, code: number | null) {
  return {
    src,
    currentSrc,
    error: code == null ? null : ({ code } as MediaError),
  };
}

test('a stale pooled-audio failure never disables a loaded question recording', () => {
  const element = media(question, question, null);
  // A previously retired Html5Audio callback may report a stale error. The
  // native tag is ready for the new recording and has no current media error.
  assert.equal(errorForCurrentAudio(element, question, base), null);
});

test('a delayed old-source error is ignored even if src has changed', () => {
  const element = media(question, teaching, 4);
  assert.equal(errorForCurrentAudio(element, question, base), null);
});

test('a real failure in the active recording is still reported', () => {
  const element = media(question, question, 4);
  assert.match(errorForCurrentAudio(element, question, base)?.message ?? '', /media code 4/);
});

test('a current error before currentSrc selection is still reportable', () => {
  const element = media(question, '', 3);
  assert.match(errorForCurrentAudio(element, question, base)?.message ?? '', /media code 3/);
});

test('never attribute missing or stale audio source to the current recording', () => {
  assert.equal(errorForCurrentAudio(media('', '', 4), question, base), null);
  assert.equal(errorForCurrentAudio(media(teaching, teaching, 4), question, base), null);
});
