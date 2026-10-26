// board:check (docs/boards.md): open a board the way students get it (its own origin, the
// production headers, a sandboxed iframe) and fail it on anything that breaks the rules.
// Usage: npm run board:check -- <board folder> [--lesson <lesson module>] [--out <dir>]
// Writes <out>/report.json and screenshots; exits 1 when a problem was found.
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { buildOrigin, readBoard, root } from './boards/origin.mjs';
import { serveOrigin } from './boards/serve.mjs';
import { inspectCanvas } from './boards/inspect.mjs';
import { genericStates, lessonStates, loadLesson } from './boards/states.mjs';

const CHECKER = 'board-check@1';
// Lesson frames: a laptop in landscape and a 390px phone in portrait (scale ≈ 0.44).
const FRAMES = [
  { layout: 'landscape', width: 1100, height: 619, minText: 24 },
  { layout: 'portrait', width: 316, height: 562, minText: 32 },
];
const RULES = { minControl: 88, edge: 8 };
const READY_MS = 5000;

const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const folder = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!folder) throw new Error('Usage: board:check -- <board folder> [--lesson <module>]');
const out = resolve(option('--out') ?? join(root, 'test-results/board-check', basename(folder)));
const found = new Map();
/** One entry per problem, listing every layout/language and state it appeared in. */
const fail = (check, detail, where = {}) => {
  const key = [check, where.element, detail].join('|');
  const entry = found.get(key) ?? { check, element: where.element, detail, in: [], states: [] };
  const seen = [where.layout, where.lang].filter(Boolean).join(' ');
  if (seen && !entry.in.includes(seen)) entry.in.push(seen);
  if (where.state && !entry.states.includes(where.state)) entry.states.push(where.state);
  found.set(key, entry);
};
const report = { checker: CHECKER, board: null, hash: null, states: 0, screenshots: [] };

async function finish() {
  const problems = [...found.values()];
  await mkdir(out, { recursive: true });
  await writeFile(
    join(out, 'report.json'),
    `${JSON.stringify({ ...report, passed: !problems.length, problems }, null, 2)}\n`,
  );
  if (!problems.length) {
    console.log(
      `board:check passed: ${report.board} (${report.hash.slice(0, 12)}), ${report.states} states, ` +
        `${FRAMES.length} layouts, Arabic and English. Report: ${join(out, 'report.json')}`,
    );
    return;
  }
  console.error(`board:check failed: ${problems.length} problem(s) in ${report.board ?? folder}`);
  for (const p of problems) {
    const states = p.states.length > 3 ? `${p.states.length} states` : p.states.join('; ');
    const where = [p.element, p.in.join(' / '), states].filter(Boolean).join(', ');
    console.error(`- [${p.check}] ${where ? `${where}: ` : ''}${p.detail}`);
  }
  process.exitCode = 1;
}

const settle = (frame) =>
  frame
    .evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
    .then(() => new Promise((done) => setTimeout(done, 150)));

async function run(board, states, originUrl) {
  const src = `${originUrl}/e/${board.hash}/index.html`;
  const harness = createServer((request, response) => {
    const q = new URL(request.url ?? '/', 'http://x').searchParams;
    const [w, h] = ['w', 'h'].map((k) => Math.max(1, Math.min(4000, Number(q.get(k)) || 1)));
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(
      `<!doctype html><body style="margin:20px;background:#777">
<iframe id="b" sandbox="allow-scripts" allow="" src="${src}"
  style="display:block;border:0;width:${w}px;height:${h}px"></iframe>
<script>window.got = []; const b = document.getElementById('b');
addEventListener('message', (e) => { if (e.source === b.contentWindow) got.push(e.data); });
window.send = (m) => b.contentWindow.postMessage(m, '*');</script>`,
    );
  });
  await new Promise((done) => harness.listen(0, '127.0.0.1', done));
  const host = `http://127.0.0.1:${harness.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const declared = new Set(Object.keys(board.manifest.variables));
  try {
    for (const f of FRAMES)
      for (const lang of ['ar', 'en']) {
        const at = { layout: f.layout, lang };
        const page = await browser.newPage({
          viewport: { width: f.width + 40, height: f.height + 40 },
        });
        page.on('console', (m) => {
          const text = m.text();
          if (/Refused to|Content Security Policy/i.test(text))
            fail('network', text.slice(0, 300), at);
          else if (m.type() === 'error') fail('console', text.slice(0, 300), at);
        });
        page.on('pageerror', (e) => fail('error', e.message.slice(0, 300), at));
        page.on('request', (r) => {
          const url = r.url();
          if (!url.startsWith(originUrl) && !url.startsWith(host) && !url.startsWith('data:'))
            fail('network', `requested ${url.slice(0, 200)}`, at);
        });
        await page.goto(`${host}/?w=${f.width}&h=${f.height}`);
        const element = await page.waitForSelector('#b');
        const frame = await element.contentFrame();
        await frame.waitForLoadState('load');
        await page.evaluate((env) => send(env), {
          nl: 1,
          type: 'init',
          apiVersion: 1,
          lang,
          dir: lang === 'ar' ? 'rtl' : 'ltr',
          theme: 'dark',
          reducedMotion: true,
          layout: f.layout,
        });
        const ready = await page
          .waitForFunction(() => got.some((m) => m?.nl === 1 && m.type === 'ready'), null, {
            timeout: READY_MS,
          })
          .then(
            () => true,
            () => false,
          );
        if (!ready) {
          fail('ready', `no "ready" within ${READY_MS / 1000}s (use the board helper)`, at);
          await page.close();
          continue;
        }
        for (const [i, state] of states.entries()) {
          await page.evaluate((view) => send({ nl: 1, type: 'state', view }), state.view);
          await settle(frame);
          const problems = await frame.evaluate(inspectCanvas, { ...RULES, minText: f.minText });
          for (const p of problems)
            fail(p.check, p.detail, { element: p.element, ...at, state: state.label });
          if (lang === 'ar') {
            const path = join(out, `${f.layout}-${String(i + 1).padStart(2, '0')}.png`);
            await element.screenshot({ path });
            report.screenshots.push({ path, layout: f.layout, state: state.label });
          }
        }
        // Same state, same picture (reduced motion holds continuous animation still).
        const first = { nl: 1, type: 'state', view: states[0].view };
        await page.evaluate((m) => send(m), first);
        await settle(frame);
        const a = await element.screenshot();
        await page.waitForTimeout(400);
        await page.evaluate((m) => send(m), first);
        await settle(frame);
        if (!a.equals(await element.screenshot()))
          fail('deterministic', 'the same state drew a different picture', at);
        if (declared.size) {
          // An open board can be reached from the keyboard.
          await page.evaluate((view) => send({ nl: 1, type: 'state', view }), {
            ...states[0].view,
            input: 'open',
          });
          await settle(frame);
          await element.focus();
          await page.keyboard.press('Tab');
          const focused = await frame.evaluate(
            () => document.activeElement && document.activeElement !== document.body,
          );
          if (!focused) fail('keyboard', 'Tab reaches no control on an open board', at);
        }
        const got = await page.evaluate(() => got);
        for (const m of got.filter((m) => m?.nl === 1)) {
          if (m.type === 'error') fail('board-error', String(m.message).slice(0, 300), at);
          if (m.type === 'variables')
            for (const name of Object.keys(m.values ?? {}))
              if (!declared.has(name)) fail('variables', `reports undeclared "${name}"`, at);
        }
        if (declared.size && !got.some((m) => m?.type === 'observation'))
          fail('observation', 'never tells the tutor what it shows (NewLearnBoard.observe)', at);
        await page.close();
      }
  } finally {
    await browser.close();
    harness.close();
  }
}

let board = null;
try {
  board = await readBoard(resolve(folder));
} catch (error) {
  fail('files', error.message);
}
if (board) {
  report.board = board.manifest.id;
  report.hash = board.hash;
  const lesson = option('--lesson');
  const states = [
    ...(lesson ? lessonStates(await loadLesson(resolve(lesson)), board.manifest) : []),
    ...genericStates(board.manifest),
  ];
  report.states = states.length;
  const origin = join(out, 'origin');
  await buildOrigin(origin, [board]);
  const { server, url } = await serveOrigin(origin, 0);
  try {
    await run(board, states, url);
  } finally {
    server.close();
  }
}
await finish();
