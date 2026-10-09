import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { handleRequest } from '../apps/platform/server/app.ts';
import { parse } from 'jsonc-parser';
const config = parse(await readFile('wrangler.jsonc', 'utf8'));
let local = '';
try {
  local = await readFile('.dev.vars', 'utf8');
} catch {}
const localVars = Object.fromEntries(
  local
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => {
      const at = line.indexOf('=');
      return [line.slice(0, at), line.slice(at + 1)];
    }),
);
const env = { ...config.vars, ...localVars };
const server = createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const response = await handleRequest(request, env);
    res.statusCode = response.status;
    for (const [key, value] of response.headers)
      if (key !== 'set-cookie') res.setHeader(key, value);
    res.setHeader('set-cookie', response.headers.getSetCookie());
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'تعذر تنفيذ الطلب.' }));
  }
});
server.listen(8787, '127.0.0.1', () => console.log('Platform API on http://127.0.0.1:8787'));
process.on('SIGTERM', () => server.close());
