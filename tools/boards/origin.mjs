// The board origin (docs/boards.md): validate and hash board folders, and lay them out with
// the allowed libraries and the security headers. Shared by build-boards and check-board.
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, resolve, sep } from 'node:path';
import { validateBoardManifest } from '../../packages/lesson-runtime/src/board/manifest.ts';

export const root = resolve(new URL('../..', import.meta.url).pathname);
const FILE = /\.(?:html|js|css|json|svg|png|jpe?g|webp|woff2?|mp3|ogg)$/;
export const MAX_BOARD = 2 * 1024 * 1024;
export const MAX_HTML = 256 * 1024;
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const { libraries } = JSON.parse(
  await readFile(join(root, 'boards/libraries.json'), 'utf8'),
);

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
const HEADERS = [
  '/*',
  `  Content-Security-Policy: ${CSP}`,
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: no-referrer',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  // Fonts are fetched with CORS, and a sandboxed board has an opaque origin.
  '/lib/*',
  '  Access-Control-Allow-Origin: *',
  '/e/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
].join('\n');

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

/** One board folder, checked statically: manifest, file types, sizes. Throws on a problem. */
export async function readBoard(folder) {
  const label = relative(root, folder);
  const manifest = validateBoardManifest(
    JSON.parse(await readFile(join(folder, 'board.json'), 'utf8')),
    new Set(Object.keys(libraries)),
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
      throw new Error(`${label}: index.html is ${bytes.length} bytes (limit ${MAX_HTML})`);
    lines.push(`${name}\0${sha(bytes)}`);
  }
  if (size > MAX_BOARD) throw new Error(`${label}: ${size} bytes (limit ${MAX_BOARD})`);
  return { folder, manifest, hash: sha(lines.join('\n')), size };
}

/** Write an origin with these boards at /e/<hash>/, the libraries at /lib/, and _headers. */
export async function buildOrigin(out, boards) {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  for (const board of boards)
    await cp(board.folder, join(out, 'e', board.hash), { recursive: true });
  await cp(join(root, 'boards/lib'), join(out, 'lib'), { recursive: true });
  for (const [id, library] of Object.entries(libraries))
    for (const file of library.files) {
      const from = join(root, library.from, file);
      await stat(from);
      await cp(from, join(out, 'lib', id, file), { recursive: true });
    }
  await writeFile(join(out, '_headers'), HEADERS);
  await writeFile(join(out, 'index.html'), '<!doctype html><title>New Learn boards</title>\n');
  // With a 404 page, Pages answers unknown paths with 404 instead of the index page.
  await writeFile(join(out, '404.html'), '<!doctype html><title>Not found</title>\n');
}
