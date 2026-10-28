import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// @ts-expect-error: a plain .mjs tool without types
import { buildStyles, OUT } from '../../../tools/style-guides.mjs';
import { styleFor, STYLE_IDS } from '../server/styles/styles';
import { LOOKS } from '../server/builds/looks';

test('every look has a style guide and a reference board, and the bundle is up to date', async () => {
  assert.deepEqual(STYLE_IDS.sort(), Object.keys(LOOKS).sort());
  const fresh = await buildStyles();
  const bundled = JSON.parse(await readFile(OUT, 'utf8'));
  assert.deepEqual(bundled, fresh, 'run npm run styles:build after changing a guide or demo board');
  for (const id of STYLE_IDS) {
    const style = styleFor(id) as {
      guide: string;
      referenceBoard: { files: Record<string, string> };
    };
    assert.match(style.guide, /## Palette/, `${id}: the guide has a palette`);
    assert.ok(style.referenceBoard.files['board.json'] && style.referenceBoard.files['index.html']);
  }
});

test('get_style lists the looks, and refuses one it does not know', () => {
  const list = styleFor(undefined) as { looks: Array<{ id: string; summary: string }> };
  assert.equal(list.looks.length, STYLE_IDS.length);
  assert.ok(list.looks.every((look) => look.summary.length > 10));
  assert.throws(() => styleFor('neon'), /Unknown look/);
});
