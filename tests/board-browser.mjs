// Live boards (docs/boards.md) through the real reading lesson: a sandboxed board on its own
// origin follows the steps, the learner changes it, our code grades the board answer, and a
// hostile board cannot leave the sandbox. At 1280px and 390px.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const app = 'http://127.0.0.1:5186';
const boards = 'http://127.0.0.1:5174';
const servers = [
  spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'preview', '--config', 'apps/platform/vite.config.ts'].concat(
      ['--host', '127.0.0.1', '--port', '5186', '--strictPort'],
    ),
    { stdio: 'ignore' },
  ),
  spawn(process.execPath, ['tools/serve-boards.mjs'], { stdio: 'ignore' }),
];
let browser;
async function poll(check, label, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await check().catch(() => false)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out: ${label}`);
}
const next = (page) => page.locator('.rl-dock .rl-next').click();
const back = (page) => page.getByRole('button', { name: 'الخطوة اللي فاتت' }).click();
const board = (page) => page.frameLocator('.html-board iframe');
const loadText = (page) => board(page).locator('#load-text').textContent();
const until = (page, text) => poll(async () => (await loadText(page)) === text, `load ${text}`);
async function slide(page, value) {
  await board(page)
    .locator('#load')
    .evaluate((node, v) => {
      node.value = String(v);
      node.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
}
const inert = (page) =>
  board(page)
    .locator('body')
    .evaluate((body) => body.inert);

/** The fixed canvas has the lesson's layout and sits entirely inside the board frame. */
async function canvasFits(page, layout) {
  let last = {};
  const fits = async () => {
    const frame = await page.locator('.html-board iframe').boundingBox();
    const canvas = await board(page).locator('body').boundingBox();
    const shown = await board(page).locator('html').getAttribute('data-layout');
    last = { shown, frame, canvas };
    const inside =
      canvas.x >= frame.x - 1 &&
      canvas.y >= frame.y - 1 &&
      canvas.x + canvas.width <= frame.x + frame.width + 1 &&
      canvas.y + canvas.height <= frame.y + frame.height + 1;
    const fills = canvas.width >= frame.width - 2 || canvas.height >= frame.height - 2;
    return shown === layout && inside && fills;
  };
  // The frame eases in when a scene opens; measure once it has settled.
  await poll(fits, `canvas fits (${layout}): ${JSON.stringify(last)}`, 5000);
}

async function run(width, height, answer) {
  const page = await browser.newPage({ locale: 'ar-EG', viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${app}/?preview=board`);
  await page.locator('.html-board[data-ready]').waitFor({ timeout: 15000 });
  const src = await page.locator('.html-board iframe').getAttribute('src');
  assert.match(src, /^http:\/\/127\.0\.0\.1:5174\/e\/[0-9a-f]{64}\/index\.html$/);
  assert.equal(await page.locator('.html-board iframe').getAttribute('sandbox'), 'allow-scripts');
  await canvasFits(page, width > 650 ? 'landscape' : 'portrait');
  // The one board font (served from the board origin) loads inside the sandbox.
  const fonts = await board(page)
    .locator('body')
    .evaluate(() =>
      [...document.fonts]
        .map((f) => `${f.family}:${f.status}`)
        .filter((f) => f.includes('NL Sans')),
    );
  assert.ok(fonts.includes('"NL Sans":loaded') || fonts.includes('NL Sans:loaded'), fonts.join());

  // Step 1: the lesson sets the board; it is locked and highlights the wire.
  await until(page, '0 N');
  assert.equal(await inert(page), true);
  await poll(() => board(page).locator('#wire.nl-highlight').count(), 'highlight');
  await next(page);
  await until(page, '200 N');
  await poll(() => board(page).locator('.nl-note').count(), 'note');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `test-results/board-wire-${width}.png` });
  // Step 3 is open: the learner's value reaches the lesson and the tutor's context.
  await next(page);
  await poll(async () => !(await inert(page)), 'open input');
  // Dragging the weight is measured in canvas pixels, so it is right at the phone's scale.
  const scale = await board(page)
    .locator('body')
    .evaluate(() => NewLearnBoard.canvas.scale);
  const weight = await board(page).locator('#weight').boundingBox();
  await page.mouse.move(weight.x + weight.width / 2, weight.y + weight.height / 2);
  await page.mouse.down();
  await page.mouse.move(weight.x + weight.width / 2, weight.y + weight.height / 2 + 40, {
    steps: 8,
  });
  await page.mouse.up();
  await until(page, `${Math.min(500, Math.round((200 + 80 / scale) / 10) * 10)} N`);
  await slide(page, 350);
  await poll(
    async () => (await page.locator('.html-board-said').textContent()).includes('350 N'),
    'observation',
  );
  await next(page);
  await until(page, '200 N');
  assert.equal(await board(page).locator('#material').inputValue(), 'copper');
  // Going back shows the learner's own value again: the board is a function of the page.
  await back(page);
  await until(page, '350 N');
  await next(page);
  await next(page);

  // The board question: the answer is what the board shows; our code grades it.
  await page.locator('.rl-board-ask').waitFor();
  await until(page, '0 N');
  assert.equal(await inert(page), false);
  await slide(page, answer);
  await until(page, `${answer} N`);
  await page.getByRole('button', { name: 'ابعت إجابتي' }).click();
  const verdict = page.locator('.rl-verdict');
  await verdict.waitFor();
  assert.equal(await verdict.getAttribute('data-correct'), String(answer === 300));
  assert.match(await page.locator('.rl-yours').textContent(), new RegExp(`Load = ${answer} N`));
  await until(page, `${answer} N`);
  await next(page);
  await until(page, '300 N');

  // A hostile board: every way out of the sandbox is blocked.
  await next(page);
  const report = board(page).locator('#report');
  await poll(async () => (await report.textContent()).startsWith('{'), 'escape report');
  const results = JSON.parse(await report.textContent());
  assert.deepEqual(Object.keys(results).sort(), [
    'cookie',
    'externalImage',
    'localStorage',
    'network',
    'parentDocument',
    'popup',
    'sameOrigin',
    'topLocation',
  ]);
  for (const [name, result] of Object.entries(results)) assert.equal(result, 'blocked', name);
  assert.equal(page.url(), `${app}/?preview=board`, 'the board cannot navigate the lesson');
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    'no horizontal scroll',
  );
  await page.screenshot({ path: `test-results/board-${width}.png` });
  assert.deepEqual(errors, []);
  await page.close();
}

try {
  await mkdir('test-results', { recursive: true });
  await poll(async () => (await fetch(app)).ok, 'app server');
  await poll(async () => (await fetch(`${boards}/`)).ok, 'board server');
  // The board origin's own headers forbid the network and framing by other sites.
  const headers = (await fetch(`${boards}/lib/newlearn-board@1/board.js`)).headers;
  const csp = headers.get('content-security-policy');
  for (const rule of ["connect-src 'none'", "default-src 'none'", 'frame-ancestors '])
    assert.ok(csp.includes(rule), rule);
  browser = await chromium.launch({ headless: true });
  await run(1280, 900, 300);
  await run(390, 844, 310);
  console.log('Live board browser checks passed at 1280px and 390px.');
} finally {
  await browser?.close();
  for (const server of servers) server.kill('SIGTERM');
}
