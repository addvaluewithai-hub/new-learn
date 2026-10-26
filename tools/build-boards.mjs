// Build the board origin into dist-boards/ (docs/boards.md) from every board folder, and
// write the app's board editions (id -> content hash and manifest). Runs before dev, test
// and build.
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { buildOrigin, libraries, readBoard, root } from './boards/origin.mjs';

const out = join(root, 'dist-boards');
const editionsFile = join(root, 'apps/platform/src/features/boards/editions.generated.json');
const sources = [join(root, 'fixtures/board-probe/boards')];

const boards = [];
for (const source of sources) {
  const found = await readdir(source, { withFileTypes: true }).catch(() => []);
  for (const item of found.filter((i) => i.isDirectory()))
    boards.push(await readBoard(join(source, item.name)));
}
const editions = {};
for (const { manifest, hash } of boards) {
  if (editions[manifest.id]) throw new Error(`Duplicate board id ${manifest.id}`);
  editions[manifest.id] = { hash, manifest };
}
await buildOrigin(out, boards);
await mkdir(dirname(editionsFile), { recursive: true });
await writeFile(editionsFile, `${JSON.stringify(editions, null, 2)}\n`);
console.log(
  `Built ${boards.length} boards and ${Object.keys(libraries).length} libraries in dist-boards.`,
);
