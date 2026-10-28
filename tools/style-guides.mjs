// Bundles each look's style guide (docs/visuals/styles/<look>.md) with its reference demo board
// (fixtures/demos/boards/<folder>) for the get_style MCP tool, into
// apps/platform/server/styles/styles.generated.json. Run after changing a guide or a demo board:
//   npm run styles:build
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
export const OUT = join(root, 'apps/platform/server/styles/styles.generated.json');
export const STYLE_BOARDS = {
  chalk: 'interest-chalk',
  watercolour: 'plants-painted',
  crt: 'ai-crt',
  space3d: 'seasons-3d',
  seachart: 'suez-map',
  shadow: 'pyramid-shadow',
  blueprint: 'circuit-blueprint',
  crayon: 'fractions-crayon',
  calligraphy: 'grammar-ink',
  pixel: 'robot-pixel',
};

async function filesOf(dir, prefix = '') {
  const files = {};
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(files, await filesOf(join(dir, entry.name), `${path}/`));
    else files[path] = await readFile(join(dir, entry.name), 'utf8');
  }
  return files;
}

/** Every look: its guide, and its reference board's id and files. */
export async function buildStyles() {
  const looks = {};
  for (const [look, folder] of Object.entries(STYLE_BOARDS)) {
    const guide = await readFile(join(root, 'docs/visuals/styles', `${look}.md`), 'utf8');
    const files = await filesOf(join(root, 'fixtures/demos/boards', folder));
    const boardId = JSON.parse(files['board.json']).id;
    looks[look] = { guide, boardId, files };
  }
  return { looks };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(join(root, 'apps/platform/server/styles'), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(await buildStyles(), null, 1)}\n`);
  console.log(`Wrote ${OUT}`);
}
