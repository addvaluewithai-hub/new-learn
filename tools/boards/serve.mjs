// Serve a built board origin over HTTP with the headers from its _headers file, exactly as
// the production board origin does. Used by serve-boards (dev, tests) and check-board.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { BOARD_HEADERS, TYPES } from '../../boards/headers.mjs';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};

async function rulesOf(dir) {
  const rules = [];
  for (const line of (await readFile(join(dir, '_headers'), 'utf8')).split('\n')) {
    if (line.startsWith('/')) {
      const glob = line
        .trim()
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      rules.push({ pattern: new RegExp(`^${glob}$`), headers: {} });
    } else if (line.trim() && rules.length) {
      const at = line.indexOf(':');
      rules.at(-1).headers[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }
  }
  return rules;
}

/**
 * Start serving `dir` on 127.0.0.1:`port` (0 picks a free port); resolves with the URL.
 * `teacher(hash, path)` serves uploaded boards at /u/<hash>/<path>, as the board site's
 * function does (boards/functions/u).
 */
export async function serveOrigin(dir, port, { teacher } = {}) {
  const rules = await rulesOf(dir);
  const headersFor = (path) =>
    Object.assign({}, ...rules.filter((r) => r.pattern.test(path)).map((r) => r.headers));
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname);
    const upload = /^\/u\/([a-f0-9]{64})\/([A-Za-z0-9_./-]{1,200})$/.exec(path);
    if (upload && teacher && !upload[2].includes('..')) {
      const body = await teacher(upload[1], upload[2]);
      const type = TYPES[upload[2].split('.').pop()];
      if (typeof body === 'string' && type)
        response.writeHead(200, { ...BOARD_HEADERS, 'Content-Type': type }).end(body);
      else response.writeHead(404, BOARD_HEADERS).end('Not found');
      return;
    }
    const file = normalize(join(dir, path.endsWith('/') ? `${path}index.html` : path));
    if (!file.startsWith(dir + sep)) {
      response.writeHead(400).end();
      return;
    }
    try {
      const body = await readFile(file);
      const type = types[extname(file)] ?? 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': type, ...headersFor(path) }).end(body);
    } catch {
      response.writeHead(404, headersFor(path)).end('Not found');
    }
  });
  await new Promise((done) => server.listen(port, '127.0.0.1', done));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}
