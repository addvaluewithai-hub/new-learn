import { validateBoardManifest, type BoardManifest } from '@learn/lesson-runtime/core';
import libraries from '../../../../boards/libraries.json';

// A board uploaded through the connector (docs/boards.md): text files only, checked statically
// here. Drawing checks (canvas fit, text, sizes) run in the teacher's preview, on the board
// origin, and come back as reports.

export const MAX_BOARD_BYTES = 2 * 1024 * 1024;
const MAX_HTML = 256 * 1024;
const MAX_FILES = 40;
const PATH =
  /^(?:[a-z0-9][a-z0-9_-]{0,63}\/){0,3}[a-z0-9][a-z0-9_.-]{0,63}\.(?:html|js|css|json|svg)$/i;
const HELPER = '/lib/newlearn-board@1/board.js';
/** What a board cannot do inside the sandbox anyway; said up front so the AI fixes it. */
const NETWORK: Array<[RegExp, string]> = [
  [/\bfetch\s*\(/, 'fetch() is blocked: boards have no network'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest is blocked: boards have no network'],
  [/\bnew\s+WebSocket\b/, 'WebSocket is blocked: boards have no network'],
  [/\bEventSource\b/, 'EventSource is blocked: boards have no network'],
  [/sendBeacon/, 'sendBeacon is blocked: boards have no network'],
  [
    /(?:src|href)\s*=\s*["']https?:/i,
    'load files from the board itself or /lib/, not http(s) URLs',
  ],
  [/@import\s+url\(\s*["']?https?:/i, 'CSS @import from the internet is blocked'],
  [/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/, 'storage is unavailable in the sandbox'],
];

export type CheckedBoard = {
  manifest: BoardManifest;
  files: Record<string, string>;
  hash: string;
  size: number;
};
export class BoardProblems extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join('\n'));
  }
}

const hex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
export const sha256 = async (text: string) =>
  hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));

/** The same content hash tools/boards/origin.mjs gives a board folder. */
export async function boardHash(files: Record<string, string>) {
  const lines: string[] = [];
  for (const path of Object.keys(files).sort()) lines.push(`${path}\0${await sha256(files[path])}`);
  return sha256(lines.join('\n'));
}

/** Validate an uploaded board; throws BoardProblems listing everything to fix. */
export async function checkBoardFiles(input: unknown): Promise<CheckedBoard> {
  const problems: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new BoardProblems(['files must be an object of path -> text content']);
  const files = input as Record<string, unknown>;
  const paths = Object.keys(files);
  if (paths.length > MAX_FILES) problems.push(`at most ${MAX_FILES} files`);
  let size = 0;
  for (const path of paths) {
    if (!PATH.test(path) || path.includes('..'))
      problems.push(`${path}: allowed are .html .js .css .json .svg with simple names`);
    if (typeof files[path] !== 'string') problems.push(`${path}: content must be text`);
    else size += new TextEncoder().encode(files[path] as string).length;
  }
  if (size > MAX_BOARD_BYTES) problems.push(`board is ${size} bytes (limit ${MAX_BOARD_BYTES})`);
  const html = files['index.html'];
  if (typeof html !== 'string') problems.push('index.html is required');
  else {
    if (html.length > MAX_HTML) problems.push(`index.html is over ${MAX_HTML} bytes`);
    if (!html.includes(HELPER)) problems.push(`index.html must load <script src="${HELPER}">`);
    if (!/NewLearnBoard\.start\s*\(/.test(html))
      problems.push('call NewLearnBoard.start({ onState })');
  }
  let manifest: BoardManifest | null = null;
  try {
    manifest = validateBoardManifest(
      JSON.parse(String(files['board.json'] ?? '')),
      new Set(Object.keys(libraries.libraries)),
    );
  } catch (error) {
    problems.push(
      error instanceof SyntaxError ? 'board.json is missing or not JSON' : (error as Error).message,
    );
  }
  for (const path of paths.filter((p) => /\.(?:html|js|css)$/.test(p)))
    for (const [pattern, why] of NETWORK)
      if (typeof files[path] === 'string' && pattern.test(files[path] as string))
        problems.push(`${path}: ${why}`);
  if (manifest && Object.keys(manifest.variables).length && typeof html === 'string')
    if (!/NewLearnBoard\.observe\s*\(/.test(html))
      problems.push('call NewLearnBoard.observe(summary) so the tutor knows what the board shows');
  if (problems.length || !manifest) throw new BoardProblems(problems);
  const clean = files as Record<string, string>;
  return { manifest, files: clean, hash: await boardHash(clean), size };
}
