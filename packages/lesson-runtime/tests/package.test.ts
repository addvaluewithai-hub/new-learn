import { test } from 'node:test';
import assert from 'node:assert/strict';
import { probeLesson } from '../../../fixtures/runtime-probe/lesson';
import { validateLessonPackage } from '../src/validate';
import { cueIsVisible, visibleQuestionParts } from '../src/cues';
import { canSubmitAttempt } from '../src/flow';
import { recordingFor } from '../src/recording';

const renderers = new Set(['runtime-probe']);
const validate = (data: unknown) => validateLessonPackage(data, renderers);
test('structural validation permits explicitly unapproved preview fixtures', () => {
  assert.equal(validate(probeLesson), probeLesson);
  assert.equal(probeLesson.recordings[0].contentAudit.faithful, false);
});
test('unknown custom renderer and bad screen ratio fail before playback', () => {
  const unknown = structuredClone(probeLesson);
  unknown.scenes[0].visual.renderer = 'missing';
  assert.throws(() => validate(unknown), /unsupported visual/);
  const wrong = structuredClone(probeLesson);
  wrong.dimensions.portrait = { width: 540, height: 540 };
  assert.throws(() => validate(wrong), /dimensions portrait/);
});
test('semantic cue disclosure reverses when seeking backwards', () => {
  const r = probeLesson.recordings[0];
  assert.equal(cueIsVisible(r, 'second-group', 29, 30), false);
  assert.equal(cueIsVisible(r, 'second-group', 30, 30), true);
  assert.equal(cueIsVisible(r, 'second-group', 0, 30), false);
  assert.throws(() => cueIsVisible(r, 'guessed', 40, 30), /Missing semantic cue/);
});
test('English question and Arabic support appear at their individual anchors', () => {
  const q = probeLesson.scenes[1].question!;
  const r = recordingFor(probeLesson, 'question');
  assert.equal(visibleQuestionParts(q, r, 29, 30).length, 0);
  assert.equal(visibleQuestionParts(q, r, 30, 30)[0].text, q.english);
  assert.equal(visibleQuestionParts(q, r, 60, 30).length, 2);
  assert.equal(visibleQuestionParts(q, r, 0, 30).length, 0);
});
test('question parts require real word-start references, not guessed offsets', () => {
  const bad = structuredClone(probeLesson);
  bad.scenes[1].question!.readingParts![1].atMs = 2020;
  assert.throws(() => validate(bad), /question part anchor/);
});
test('first question clause cannot be delayed past the declared question onset', () => {
  const bad = structuredClone(probeLesson);
  bad.scenes[1].question!.readingParts![0].atMs = 2000;
  assert.throws(() => validate(bad), /question first onset/);
});
test('semantic cues must be bound to a word start', () => {
  const bad = structuredClone(probeLesson);
  bad.recordings[0].cues[0].atMs = 1020;
  assert.throws(() => validate(bad), /cues/);
});
test('feedback recording cannot be used as teaching before the attempt', () => {
  const bad = structuredClone(probeLesson);
  bad.scenes[0].recordingId = 'feedback';
  assert.throws(() => validate(bad), /feedback isolation/);
});
test('bad, missing and non-monotonic word timestamps are rejected', () => {
  const bad = structuredClone(probeLesson);
  bad.recordings[0].words![1].start_ms = -1;
  assert.throws(() => validate(bad), /words/);
  bad.recordings[0].words = [];
  assert.throws(() => validate(bad), /timings/);
});
test('custom question boards and feedback clauses require known visuals and word anchors', () => {
  const bad = structuredClone(probeLesson);
  bad.scenes[1].question!.readingVisual = { renderer: 'unknown', params: {} };
  assert.throws(() => validate(bad), /unsupported visual/);
  delete bad.scenes[1].question!.readingVisual;
  bad.scenes[1].question!.feedbackParts = [{ text: 'Five', language: 'en', atMs: 555 }];
  assert.throws(() => validate(bad), /feedback part anchor/);
});
test('written and combined attempts require real writing and valid choice', () => {
  const q = { ...probeLesson.scenes[1].question!, attempt: 'choice-and-written' as const };
  assert.equal(canSubmitAttempt(q, 1, '   '), false);
  assert.equal(canSubmitAttempt(q, 99, 'Five'), false);
  assert.equal(canSubmitAttempt(q, 1, 'Five'), true);
  assert.equal(canSubmitAttempt({ ...q, attempt: 'written' }, undefined, 'خمسة'), true);
});
