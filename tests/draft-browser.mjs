// A teacher's draft through the real app (docs/connector.md): the text board, an uploaded
// board served by hash from the board origin, notes on a step, the board's own drawing
// check, a board question, and the connector's consent screen. At 1280px and 390px.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { serveOrigin } from '../tools/boards/serve.mjs';
import { boardHash } from '../apps/platform/server/authoring/boardFiles.ts';
import { buildPackage } from '../apps/platform/server/authoring/format.ts';

const app = 'http://127.0.0.1:5188';
const lessonId = '11111111-2222-3333-4444-555555555555';
const wire = 'fixtures/board-probe/boards/wire/';
const files = {
  'board.json': await readFile(`${wire}board.json`, 'utf8'),
  'index.html': await readFile(`${wire}index.html`, 'utf8'),
};
const hash = await boardHash(files);
const manifest = JSON.parse(files['board.json']);
const pkg = buildPackage(
  {
    title: 'درس تجريبي',
    scenes: [
      { id: 'intro', title: 'مقدمة', steps: [{ text: 'خطوة أولى.' }, { text: 'خطوة تانية.' }] },
      {
        id: 'wire',
        title: 'السلك',
        board: 'probe-wire',
        steps: [{ text: 'حمل 200 نيوتن.', board: { state: { load: 200 } } }],
        question: {
          kind: 'board',
          arabic: 'اضبط 300 نيوتن.',
          answer: { arabic: '300' },
          board: { check: { variable: 'load', kind: 'number', target: 300, tolerance: 0 } },
          feedback: [{ text: 'كده مظبوط.' }],
        },
      },
    ],
  },
  { lessonId, courseId: 'c', courseTitle: 'كورس', order: 1, revision: 1 },
  { 'probe-wire': { key: `u:${hash}`, manifest } },
);
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--config', 'apps/platform/vite.config.ts'].concat([
    '--host',
    '127.0.0.1',
    '--port',
    '5188',
    '--strictPort',
  ]),
  { stdio: 'ignore' },
);
const boards = await serveOrigin(new URL('../boards/dist', import.meta.url).pathname, 5174, {
  teacher: async (h, path) => (h === hash ? (files[path] ?? null) : null),
});
let browser;
const poll = async (check, label, timeout = 15000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (
      await Promise.resolve()
        .then(check)
        .catch(() => false)
    )
      return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Timed out: ${label}`);
};

function api(store) {
  return async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const send = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/me')
      return send({ user: { id: 't', name: 'أستاذة منى', email: 't@example.com' } });
    if (path === `/api/authoring/lessons/${lessonId}`)
      return send({
        lessonId,
        revision: 1,
        package: pkg,
        boards: { [`u:${hash}`]: { hash, manifest } },
        feedback: store.notes,
      });
    if (path === `/api/authoring/lessons/${lessonId}/feedback`) {
      const body = request.postDataJSON();
      store.posted.push(body);
      const note = {
        id: `n${store.notes.length}`,
        position: { sceneId: body.sceneId, phase: body.phase, step: body.step },
        kind: body.kind,
        note: body.note,
        status: 'open',
        resolution: '',
      };
      store.notes.push(note);
      return send(note, 201);
    }
    if (path === `/api/authoring/boards/${hash}/report`) {
      store.reports.push(request.postDataJSON());
      return send({});
    }
    if (path === '/api/oauth/consent') return send({ name: 'Claude', redirectHost: 'claude.ai' });
    if (path === '/api/oauth/approve') {
      store.approved.push(request.postDataJSON());
      return send({ redirect: 'https://claude.ai/api/mcp/auth_callback?code=abc&state=s' });
    }
    return send({ error: 'not here' }, 404);
  };
}

async function run(width, height, layout) {
  const store = { notes: [], posted: [], reports: [], approved: [] };
  const page = await browser.newPage({ locale: 'ar-EG', viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(`${app}/api/**`, api(store));
  await page.goto(`${app}/?draft=${lessonId}`);
  await page.locator('.text-board h2', { hasText: 'مقدمة' }).waitFor({ timeout: 20000 });
  assert.match(await page.locator('.text-board li[data-current]').innerText(), /خطوة أولى/);
  await page.locator('.draft-notes-toggle').click();
  await page.getByLabel('الملاحظة', { exact: true }).fill('وضّح بمثال من البيت');
  await page.getByRole('button', { name: 'ابعت الملاحظة' }).click();
  await page.locator('.draft-notes li', { hasText: 'وضّح بمثال من البيت' }).waitFor();
  assert.deepEqual(store.posted[0], {
    sceneId: 'intro',
    phase: 'narration',
    step: 0,
    kind: 'text',
    note: 'وضّح بمثال من البيت',
  });
  await page.locator('.draft-notes-toggle').click();
  const next = () => page.locator('.rl-dock .rl-next').click();
  await next();
  await next();
  await page.locator('.html-board[data-ready]').waitFor({ timeout: 15000 });
  assert.match(
    await page.locator('.html-board iframe').getAttribute('src'),
    new RegExp(`/u/${hash}/index.html$`),
  );
  // The board checks its own drawing on this screen and the preview reports it.
  await poll(() => store.reports.some((r) => r.layout === layout), `${layout} report`, 20000);
  const report = store.reports.find((r) => r.layout === layout);
  assert.deepEqual(report.problems, [], JSON.stringify(report.problems));
  await next();
  await page.locator('.rl-board-ask').waitFor();
  await page
    .frameLocator('.html-board iframe')
    .locator('#load')
    .evaluate((node) => {
      node.value = '300';
      node.dispatchEvent(new Event('input', { bubbles: true }));
    });
  await page.getByRole('button', { name: 'ابعت إجابتي' }).click();
  assert.equal(await page.locator('.rl-verdict').getAttribute('data-correct'), 'true');
  await page.screenshot({ path: `test-results/draft-${width}.png` });

  // The connector's consent screen sends the teacher back to the AI app with a code.
  await page.route('https://claude.ai/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>back</p>' }),
  );
  const consent = new URLSearchParams({
    oauth: 'consent',
    client_id: 'c'.repeat(32),
    redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
    code_challenge: 'x'.repeat(43),
    state: 's',
  });
  await page.goto(`${app}/?${consent}`);
  await page.getByRole('heading', { name: /Claude/ }).waitFor();
  await page.screenshot({ path: `test-results/consent-${width}.png` });
  await page.getByRole('button', { name: 'اسمح' }).click();
  await page.waitForURL(/claude\.ai\/api\/mcp\/auth_callback\?code=abc/);
  assert.equal(store.approved[0].client_id, 'c'.repeat(32));
  assert.deepEqual(errors, []);
  await page.close();
}

try {
  await mkdir('test-results', { recursive: true });
  await poll(async () => (await fetch(app)).ok, 'app server');
  browser = await chromium.launch({ headless: true });
  await run(1280, 900, 'landscape');
  await run(390, 844, 'portrait');
  console.log(
    'Draft preview, notes, board self-check, board question and consent passed at 1280px and 390px.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  boards.server.close();
}
