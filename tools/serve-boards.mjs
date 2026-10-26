// Local board origin for development and browser tests: serves dist-boards on its own port
// (a different origin from the app) with the same headers as production (_headers).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(new URL('../dist-boards', import.meta.url).pathname);
const port = Number(process.env.BOARD_PORT ?? 5174);
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
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};

/** The headers of every `_headers` block whose path pattern matches. */
function headersFor(rules, path) {
  const out = {};
  for (const rule of rules)
    if (
      new RegExp(
        `^${rule.pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`,
      ).test(path)
    )
      Object.assign(out, rule.headers);
  return out;
}
const rules = [];
for (const line of (await readFile(join(root, '_headers'), 'utf8')).split('\n')) {
  if (line.startsWith('/')) rules.push({ pattern: line.trim(), headers: {} });
  else if (line.trim() && rules.length) {
    const at = line.indexOf(':');
    rules.at(-1).headers[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
}

createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname);
  const file = normalize(join(root, path.endsWith('/') ? `${path}index.html` : path));
  if (!file.startsWith(root + sep)) {
    response.writeHead(400).end();
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      ...headersFor(rules, path),
    });
    response.end(body);
  } catch {
    response.writeHead(404, headersFor(rules, path)).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Board origin on http://127.0.0.1:${port}`));
