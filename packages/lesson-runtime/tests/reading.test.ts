import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReadingPackage } from '../src/reading/validate';
import {
  boardTimeMs,
  readingBoardProps,
  readingContext,
  readingPages,
  STEP_MS,
} from '../src/reading/model';
import type { ReadingPackage } from '../src/reading/types';

const board = { renderer: 'probe-board', params: { scene: 'S01' } };
const lesson: ReadingPackage = {
  schemaVersion: 1,
  delivery: 'reading',
  lessonId: 'probe-reading',
  curriculumId: 'probe',
  contentRevision: 'rev-1',
  title: 'جمع الكسور',
  englishTitle: 'Adding fractions',
  curriculumTitle: 'Probe',
  lessonOrder: 1,
  fps: 30,
  dimensions: { landscape: { width: 960, height: 540 }, portrait: { width: 540, height: 960 } },
  glossary: [],
  scenes: [
    {
      id: 'S01',
      title: 'Teach',
      clipId: 'N01',
      visual: board,
      steps: [
        { unitIds: ['U1'], text: 'نص: $1/2$' },
        { unitIds: ['U2', 'U3'], text: 'وتلت: $1/3$' },
      ],
    },
    {
      id: 'S02',
      title: 'Try',
      clipId: 'N02',
      visual: board,
      steps: [{ unitIds: ['UQ'], text: 'Find $1/2 + 1/3$.' }],
      question: {
        id: 'Q1',
        english: 'Find $1/2 + 1/3$.',
        arabic: 'اجمع الكسرين.',
        attempt: 'written',
        options: [],
        answer: { english: '5/6', arabic: 'خمسة على ستة.' },
        feedback: { clipId: 'F01', steps: [{ unitIds: ['UF'], text: '$5/6$' }], visual: board },
      },
    },
  ],
};
const renderers = new Set(['probe-board']);

test('a reading package validates without any recording or audio', () => {
  assert.equal(validateReadingPackage(lesson, renderers), lesson);
});
test('unknown boards, empty steps and recorded delivery are rejected', () => {
  assert.throws(() => validateReadingPackage(lesson, new Set()), /unsupported visual/);
  const empty = structuredClone(lesson);
  empty.scenes[0].steps[1].text = ' ';
  assert.throws(() => validateReadingPackage(empty, renderers), /S01 step/);
  const recorded = { ...structuredClone(lesson), delivery: 'recorded' };
  assert.throws(() => validateReadingPackage(recorded, renderers), /schema\/delivery/);
});
test('pages run teaching steps, the question, the attempt and then feedback', () => {
  assert.deepEqual(
    readingPages(lesson).map((p) => `${p.scene}:${p.kind}:${p.step}`),
    ['0:teach:0', '0:teach:1', '1:ask:0', '1:attempt:0', '1:feedback:0'],
  );
});
test('the board settles on a step without revealing the next unit', () => {
  const page = { scene: 0, kind: 'teach' as const, step: 0 };
  const props = readingBoardProps(lesson.scenes[0], page, 'landscape', 30, false)!;
  const at = boardTimeMs(page);
  const shown = props.recording.cues.filter((cue) => cue.atMs <= at).map((cue) => cue.id);
  assert.deepEqual(shown, ['U1']);
  assert.ok(at < STEP_MS);
  assert.equal(props.answer, undefined);
});
test('feedback board receives the answer; question board never does', () => {
  const ask = readingBoardProps(
    lesson.scenes[1],
    { scene: 1, kind: 'ask', step: 0 },
    'portrait',
    30,
    true,
  )!;
  assert.equal(ask.answer, undefined);
  assert.equal(ask.phase, 'question-reading');
  const fb = readingBoardProps(
    lesson.scenes[1],
    { scene: 1, kind: 'feedback', step: 0 },
    'portrait',
    30,
    true,
  )!;
  assert.equal(fb.answer?.english, '5/6');
  assert.equal(fb.recording.id, 'F01');
});
test('assistant context names the step and the written text instead of a clock', () => {
  const context = readingContext(lesson, { scene: 0, kind: 'teach', step: 1 }, false);
  assert.equal(context.delivery, 'reading');
  assert.equal(context.phase, 'narration');
  assert.deepEqual(context.visibleCueIds, ['U1', 'U2', 'U3']);
  assert.match(context.excerpt, /وتلت/);
  const attempt = readingContext(lesson, { scene: 1, kind: 'attempt', step: 0 }, false);
  assert.equal(attempt.phase, 'attempt');
  assert.equal(attempt.questionVisible, true);
});
