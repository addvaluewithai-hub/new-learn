import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  boardViewAt,
  clampValues,
  decodeBoardAnswer,
  describeValues,
  encodeBoardAnswer,
  gradeBoard,
  readBoardMessage,
  validateBoardManifest,
  type BoardCheck,
  type BoardManifest,
  type StepBoard,
} from '../src/board';
import { readingBoardView, validateLessonBoards } from '../src/reading/board';
import { readingPages } from '../src/reading/model';
import type { ReadingPackage } from '../src/reading/types';

const manifest = validateBoardManifest({
  apiVersion: 1,
  id: 'wire',
  title: 'Stretch a wire',
  description: 'A slider sets the load; the wire stretches.',
  libraries: [],
  variables: {
    load: { type: 'number', min: 0, max: 500, step: 10, unit: 'N', label: 'Load', default: 0 },
    material: { type: 'choice', options: ['steel', 'copper'], default: 'steel' },
  },
  targets: ['#wire', '#ruler'],
}) as BoardManifest;

test('board manifests reject what the contract does not allow', () => {
  const bad = (change: object, allowed?: Set<string>) =>
    assert.throws(() => validateBoardManifest({ ...manifest, ...change }, allowed));
  bad({ apiVersion: 2 });
  bad({ id: 'Bad Id' });
  bad({ targets: ['.wire'] });
  bad({ targets: ['#a, body'] });
  bad({ libraries: ['three@latest'] });
  bad({ libraries: ['three@0.170.0'] }, new Set(['katex@0.16.22']));
  bad({ variables: { load: { type: 'number', min: 5, max: 1, default: 3 } } });
  bad({ variables: { pick: { type: 'choice', options: ['a', 'a'], default: 'a' } } });
});

test('values from a board are forced into the declared variables', () => {
  assert.deepEqual(clampValues(manifest, { load: 999, material: 'gold', other: 1 }), {
    load: 500,
  });
  assert.deepEqual(clampValues(manifest, { load: 123, material: 'copper' }), {
    load: 120,
    material: 'copper',
  });
  assert.deepEqual(clampValues(manifest, { load: '300' }), {});
  assert.equal(describeValues(manifest, { load: 300 }), 'Load = 300 N');
});

test('our code grades board answers; the board never does', () => {
  const near: BoardCheck = { variable: 'load', kind: 'number', target: 300, tolerance: 10 };
  assert.equal(gradeBoard(near, { load: 310 }), true);
  assert.equal(gradeBoard(near, { load: 320 }), false);
  assert.equal(gradeBoard(near, { load: '300' }), false);
  const both: BoardCheck = {
    kind: 'set',
    checks: [
      { variable: 'load', kind: 'number', target: 300, tolerance: 10 },
      { variable: 'material', kind: 'choice', value: 'copper' },
    ],
  };
  assert.equal(gradeBoard(both, { load: 300, material: 'copper' }), true);
  assert.equal(gradeBoard(both, { load: 300, material: 'steel' }), false);
  const saved = encodeBoardAnswer({ values: { load: 300 }, text: 'Load = 300 N' });
  assert.deepEqual(decodeBoardAnswer(saved), { values: { load: 300 }, text: 'Load = 300 N' });
  assert.equal(decodeBoardAnswer(''), null);
  assert.equal(decodeBoardAnswer('{broken'), null);
});

test('a step shows the merged state, and only its own highlights', () => {
  const steps: Array<{ board?: StepBoard }> = [
    { board: { state: { load: 100 }, highlight: ['#wire'] } },
    { board: { state: { material: 'copper' } } },
    { board: { input: 'open' } },
  ];
  const view = boardViewAt(steps, 2, 'teach', { load: 0 });
  assert.deepEqual(view.variables, { load: 100, material: 'copper' });
  assert.deepEqual(view.highlight, []);
  assert.equal(view.input, 'open');
  assert.deepEqual(boardViewAt(steps, 0, 'teach').highlight, ['#wire']);
});

test('board messages are read defensively', () => {
  assert.equal(readBoardMessage({ type: 'ready', apiVersion: 1 }), null);
  assert.deepEqual(readBoardMessage({ nl: 1, type: 'ready', apiVersion: 1 }), {
    type: 'ready',
    apiVersion: 1,
  });
  assert.equal(readBoardMessage({ nl: 1, type: 'variables', values: [1] }), null);
  const huge = {
    nl: 1,
    type: 'observation',
    observation: { summary: 'x', details: 'y'.repeat(9000) },
  };
  assert.equal(readBoardMessage(huge), null);
  assert.equal(
    readBoardMessage({ nl: 1, type: 'observation', observation: { summary: ' ' } }),
    null,
  );
  assert.equal(readBoardMessage({ nl: 1, type: 'unknown' }), null);
});

const live = { renderer: 'html-board', params: { board: 'wire' } };
const lesson: ReadingPackage = {
  schemaVersion: 1,
  delivery: 'reading',
  lessonId: 'board-probe',
  curriculumId: 'probe',
  contentRevision: 'rev-1',
  title: 'بورد',
  englishTitle: 'Board',
  curriculumTitle: 'Probe',
  lessonOrder: 1,
  fps: 30,
  dimensions: { landscape: { width: 960, height: 540 }, portrait: { width: 540, height: 960 } },
  glossary: [],
  scenes: [
    {
      id: 'S01',
      title: 'Load',
      clipId: 'C01',
      visual: live,
      steps: [
        { unitIds: ['u1'], text: 'Hang 100 N.', board: { state: { load: 100 } } },
        { unitIds: ['u2'], text: 'Try it.', board: { input: 'open' } },
        { unitIds: ['u3'], text: 'Now 200 N.', board: { state: { load: 200 } } },
      ],
      question: {
        id: 'Q1',
        english: 'Set 300 N.',
        arabic: 'اضبط 300 نيوتن.',
        attempt: 'board',
        options: [],
        answer: { english: '300 N', arabic: '300 نيوتن' },
        board: {
          state: { load: 0 },
          check: { variable: 'load', kind: 'number', target: 300, tolerance: 10 },
        },
        feedback: {
          clipId: 'F01',
          steps: [{ unitIds: ['f1'], text: 'It is 300 N.' }],
          visual: live,
        },
      },
    },
  ],
};
const pages = readingPages(lesson);

test('a learner value lasts until a later page sets that variable again', () => {
  const learner = { load: { value: 150, page: 1 } };
  const at = (index: number) =>
    readingBoardView(lesson, pages, index, {}, learner, manifest).variables.load;
  assert.equal(at(0), 100);
  assert.equal(at(1), 150);
  assert.equal(at(2), 200);
  assert.equal(at(3), 0, 'the attempt starts from the question state');
});

test('feedback shows the learner board answer until feedback sets its own', () => {
  const answers = { Q1: encodeBoardAnswer({ values: { load: 310 }, text: '' }) };
  const view = readingBoardView(lesson, pages, 4, answers, {}, manifest);
  assert.equal(view.phase, 'feedback');
  assert.equal(view.variables.load, 310);
  assert.equal(view.variables.material, 'steel');
});

test('lesson boards must match their manifests', () => {
  const boards = { wire: manifest };
  assert.equal(validateLessonBoards(lesson, boards), lesson);
  assert.throws(() => validateLessonBoards(lesson, {}), /unknown board/);
  const edit = (change: (l: ReadingPackage) => void) => {
    const copy = structuredClone(lesson);
    change(copy);
    return () => validateLessonBoards(copy, boards);
  };
  assert.throws(
    edit((l) => (l.scenes[0].steps[0].board = { state: { mass: 1 } })),
    /mass/,
  );
  assert.throws(
    edit((l) => (l.scenes[0].steps[0].board = { highlight: ['#x'] })),
    /#x/,
  );
  assert.throws(
    edit(
      (l) =>
        (l.scenes[0].question!.board!.check = { variable: 'mass', kind: 'choice', value: 'a' }),
    ),
    /mass/,
  );
});
