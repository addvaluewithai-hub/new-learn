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
import { threadItems, type ThreadNote } from '../src/reading/thread';
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
  // One board contract for every curriculum: boards made for recorded lessons find the
  // question and answer where they look for them, shown at once; reading boards get lines.
  assert.deepEqual(
    ask.question?.readingParts?.map((p) => [p.language, p.atMs]),
    [
      ['en', 0],
      ['ar', 0],
    ],
  );
  assert.equal(ask.question?.readingParts?.[0].text, 'Find 1/2 + 1/3.');
  assert.equal(ask.recording.questionAtMs, 0);
  assert.deepEqual(
    fb.answer?.parts?.map((p) => p.text),
    ['5/6', 'خمسة على ستة.'],
  );
  assert.equal(fb.recording.questionAtMs, null);
  assert.deepEqual(fb.reading?.steps, [{ text: '$5/6$', atMs: 0 }]);
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
test('the lesson thread interleaves lines, the answer and notes at the step they were asked', () => {
  const pages = readingPages(lesson);
  const note = (id: string, at: ThreadNote['at']): ThreadNote => ({
    id,
    role: 'tutor',
    text: id,
    at,
  });
  const notes = [
    note('on-step-2', { sceneId: 'S01', phase: 'narration', step: 1 }),
    note('on-feedback', { sceneId: 'S02', phase: 'feedback', step: 0 }),
  ];
  const items = threadItems(lesson, pages, pages.length - 1, { Q1: '5/6' }, notes);
  assert.deepEqual(
    items.map((i) => (i.kind === 'note' ? i.note.id : i.kind)),
    [
      'scene',
      'line',
      'line',
      'on-step-2',
      'scene',
      'line',
      'question',
      'answer',
      'line',
      'on-feedback',
    ],
  );
  const last = items.filter((i) => i.kind === 'line').at(-1);
  assert.equal(last?.kind === 'line' && last.label, 'الإجابة النموذجية');
  assert.equal(last?.kind === 'line' && last.current, true);
  // Back on the first step: nothing ahead is shown, but later notes are kept, not lost.
  const back = threadItems(lesson, pages, 0, {}, notes);
  assert.deepEqual(
    back.map((i) => (i.kind === 'note' ? i.note.id : i.kind)),
    ['scene', 'line', 'on-step-2', 'on-feedback'],
  );
});
test('a reading pace waits longer for longer lines, within bounds', async () => {
  const { readingMs } = await import('../src/reading/stage/flow');
  const short = readingMs('نص', 'normal');
  const long = readingMs(Array(60).fill('كلمة').join(' '), 'normal');
  assert.equal(short, 2500);
  assert.ok(long > short && long <= 20000);
  assert.ok(
    readingMs('a b c d e f g h i j k l m n o p', 'slower') >
      readingMs('a b c d e f g h i j k l m n o p', 'faster'),
  );
});
test('a sentence split across steps shows its start before the current step', async () => {
  const { sentenceLead } = await import('../src/reading/stage/Caption');
  const steps = [
    { text: 'عندك بيتزا، قطعتها حتتين.' },
    { text: 'بعدين' },
    { text: 'اللي معاك اسمه نص:' },
    { text: 'واحد فوق الخط.' },
  ];
  assert.equal(sentenceLead(steps, 0), '');
  assert.equal(sentenceLead(steps, 1), '');
  assert.equal(sentenceLead(steps, 2), 'بعدين');
  assert.equal(sentenceLead(steps, 3), 'بعدين اللي معاك اسمه نص:');
});

test('goals count real attempts only: "I don\'t know" and skipped questions do not', async () => {
  const { attempted, goalProgress } = await import('../src/reading/goals');
  const goals = [{ id: 'G', text: 'g', sceneIds: ['S01'], questionIds: ['Q1'] }];
  assert.deepEqual(attempted({ Q1: ' ', Q2: 'x' }), ['Q2']);
  assert.equal(goalProgress(goals, attempted({ Q1: '' })).done, 0);
  assert.equal(goalProgress(goals, attempted({})).done, 0, 'skipped: no answer at all');
  assert.equal(goalProgress(goals, attempted({ Q1: 'my answer' })).done, 1);
});
