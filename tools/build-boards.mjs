// Build the board origin (docs/boards.md): every board folder is validated, hashed and
// copied to dist-boards/e/<hash>/; allowed libraries go to /lib/; _headers carries the CSP.
// Also writes the app's board editions (id -> hash and manifest). Runs before dev, test, build.
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { validateBoardManifest } from '../packages/lesson-runtime/src/board/manifest.ts';

const root = resolve(new URL('..', import.meta.url).pathname);
const out = join(root, 'dist-boards');
const editionsFile = join(root, 'apps/platform/src/features/boards/editions.generated.json');
const sources = [join(root, 'fixtures/board-probe/boards')];
const FILE = /\.(?:html|js|css|json|svg|png|jpe?g|webp|woff2?|mp3|ogg)$/;
const MAX_BOARD = 2 * 1024 * 1024;
const MAX_HTML = 256 * 1024;
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const { libraries } = JSON.parse(await readFile(join(root, 'boards/libraries.json'), 'utf8'));
const allowed = new Set(Object.keys(libraries));

/** Origins allowed to frame boards: the app, its preview deployments and local hosts. */
export const FRAME_ANCESTORS =
  'https://new-learn.pages.dev https://*.new-learn.pages.dev http://127.0.0.1:* http://localhost:*';
export const CSP = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self'",
  "connect-src 'none'",
  "frame-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  `frame-ancestors ${FRAME_ANCESTORS}`,
].join('; ');

async function files(folder) {
  const found = [];
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, item.name);
    if (item.isSymbolicLink()) throw new Error(`Board symlink: ${relative(root, path)}`);
    if (item.isDirectory()) found.push(...(await files(path)));
    else found.push(path);
  }
  return found;
}

async function board(folder) {
  const label = relative(root, folder);
  const manifest = validateBoardManifest(
    JSON.parse(await readFile(join(folder, 'board.json'), 'utf8')),
    allowed,
  );
  const all = (await files(folder)).sort();
  if (!all.includes(join(folder, 'index.html'))) throw new Error(`${label}: no index.html`);
  let size = 0;
  const lines = [];
  for (const path of all) {
    const name = relative(folder, path).split(sep).join('/');
    if (!FILE.test(name)) throw new Error(`${label}: file type not allowed: ${name}`);
    const bytes = await readFile(path);
    size += bytes.length;
    if (name === 'index.html' && bytes.length > MAX_HTML)
      throw new Error(`${label}: index.html too large`);
    lines.push(`${name}\0${sha(bytes)}`);
  }
  if (size > MAX_BOARD) throw new Error(`${label}: ${size} bytes (limit ${MAX_BOARD})`);
  const hash = sha(lines.join('\n'));
  await cp(folder, join(out, 'e', hash), { recursive: true });
  return { manifest, hash };
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const editions = {};
for (const source of sources) {
  const found = await readdir(source, { withFileTypes: true }).catch(() => []);
  for (const item of found.filter((i) => i.isDirectory())) {
    const { manifest, hash } = await board(join(source, item.name));
    if (editions[manifest.id]) throw new Error(`Duplicate board id ${manifest.id}`);
    editions[manifest.id] = { hash, manifest };
  }
}
await cp(join(root, 'boards/lib'), join(out, 'lib'), { recursive: true });
for (const [id, library] of Object.entries(libraries))
  for (const file of library.files) {
    const from = join(root, library.from, file);
    await stat(from);
    await cp(from, join(out, 'lib', id, file), { recursive: true });
  }
const headers = [
  '/*',
  `  Content-Security-Policy: ${CSP}`,
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: no-referrer',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  '/e/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
].join('\n');
await writeFile(join(out, '_headers'), headers);
await writeFile(join(out, 'index.html'), '<!doctype html><title>New Learn boards</title>\n');
await mkdir(dirname(editionsFile), { recursive: true });
await writeFile(editionsFile, `${JSON.stringify(editions, null, 2)}\n`);
console.log(
  `Built ${Object.keys(editions).length} boards and ${allowed.size} libraries in dist-boards.`,
);
