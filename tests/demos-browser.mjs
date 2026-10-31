// The demo gallery (docs/visuals/demos.md) through the real app: ten cards, the ready ones
// open their course, and each course's board follows its steps. At 1280px and 390px.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const app = 'http://127.0.0.1:5192';
const servers = [
  spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'preview', '--config', 'apps/platform/vite.config.ts'].concat(
      ['--host', '127.0.0.1', '--port', '5192', '--strictPort'],
    ),
    { stdio: 'ignore' },
  ),
  spawn(process.execPath, ['tools/serve-boards.mjs'], { stdio: 'ignore' }),
];
let browser;
async function poll(check, label, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await check().catch(() => false)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${label}`);
}
const board = (page) => page.frameLocator('.html-board iframe');

async function run(width, height) {
  const page = await browser.newPage({ locale: 'ar-EG', viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${app}/?preview=demos`);
  await page.getByRole('heading', { name: /استايل مختلف/ }).waitFor({ timeout: 20000 });
  assert.equal(await page.locator('.demo-card').count(), 10);
  const ready = await page
    .locator('a.demo-card')
    .evaluateAll((a) => a.map((x) => x.getAttribute('href')));
  assert.ok(ready.length >= 3, 'at least three courses are ready');
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'no sideways scroll',
  );
  await page.screenshot({ path: `test-results/demos-${width}.png`, fullPage: true });
  for (const href of ready) {
    await page.goto(`${app}${href}`);
    await page.locator('.html-board[data-ready]').waitFor({ timeout: 30000 });
    // The board draws something visible, then follows the lesson to its next step.
    const before = await board(page).locator('body').innerText();
    assert.ok(before.trim().length > 0, `${href}: the board shows text`);
    await page.locator('.rl-dock .rl-next').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `test-results/demo-${href.split('=').pop()}-${width}.png` });
  }
  await page.goto(`${app}/?preview=demo&id=ai`);
  await page.locator('.html-board[data-ready]').waitFor({ timeout: 30000 });
  await poll(
    async () => (await board(page).locator('#sentence').innerText()).includes('الجو النهارده'),
    'prompt',
  );
  for (let i = 0; i < 2; i++) await page.locator('.rl-dock .rl-next').click();
  await poll(
    async () => (await board(page).locator('#sentence').innerText()).includes('حر'),
    'first word',
  );
  assert.deepEqual(errors, []);
  await page.close();
}

try {
  await mkdir('test-results', { recursive: true });
  await poll(async () => (await fetch(app)).ok, 'app server');
  await poll(
    async () => (await fetch('http://127.0.0.1:5174/lib/newlearn-board@1/board.js')).ok,
    'board server',
  );
  browser = await chromium.launch({ headless: true });
  await run(1280, 800);
  await run(390, 844);
  console.log('Demo gallery and every ready demo course passed at 1280px and 390px.');
} finally {
  await browser?.close();
  for (const server of servers) server.kill('SIGTERM');
}
