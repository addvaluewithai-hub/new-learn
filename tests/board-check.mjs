// board:check checks itself: the sample wire board passes with its lesson, and a board that
// breaks every rule fails on each one, with a report an AI can act on.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

function check(folder, ...extra) {
  const out = `test-results/board-check-self/${folder.split('/').pop()}`;
  const run = spawnSync(
    process.execPath,
    ['--import', 'tsx', 'tools/check-board.mjs', folder, '--out', out, ...extra],
    { encoding: 'utf8' },
  );
  return { status: run.status, output: run.stdout + run.stderr, out };
}
const reportOf = async (out) => JSON.parse(await readFile(`${out}/report.json`, 'utf8'));

const good = check(
  'fixtures/board-probe/boards/wire',
  '--lesson',
  'fixtures/board-probe/lesson.ts',
);
assert.equal(good.status, 0, good.output);
const passed = await reportOf(good.out);
assert.equal(passed.passed, true);
assert.equal(passed.board, 'probe-wire');
assert.match(passed.hash, /^[0-9a-f]{64}$/);
assert.ok(passed.states >= 10, 'lesson pages and the generic sweep');
assert.ok(passed.screenshots.some((s) => s.layout === 'portrait'));

const bad = check('fixtures/board-probe/broken/everything');
assert.equal(bad.status, 1, bad.output);
const failed = await reportOf(bad.out);
assert.equal(failed.passed, false);
const at = (check, element) =>
  failed.problems.some((p) => p.check === check && (!element || p.element === element));
for (const [rule, element] of [
  ['inside-canvas', '#far'],
  ['text-size', '#tiny'],
  ['font', '#system'],
  ['text-edge', '#edge'],
  ['control-size', '#button'],
  ['network'],
  ['console'],
  ['deterministic'],
  ['variables'],
  ['observation'],
])
  assert.ok(at(rule, element), `board:check reports ${rule} ${element ?? ''}`);
assert.ok(!at('text-edge', '#far'), 'an element outside the canvas is reported once');
assert.ok(!at('text-size', '#system') && !at('font', '#tiny'), 'only real problems');

const missing = check('fixtures/board-probe/broken/no-such-board');
assert.equal(missing.status, 1);
assert.equal((await reportOf(missing.out)).problems[0].check, 'files');
console.log('board:check self-test passed: a clean board passes, every rule catches its break.');
