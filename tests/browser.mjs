import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:5175';
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--config',
    'apps/platform/vite.config.ts',
    '--host',
    '127.0.0.1',
    '--port',
    '5175',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
let logs = '';
server.stdout.on('data', (data) => {
  logs += data;
});
server.stderr.on('data', (data) => {
  logs += data;
});
let browser;
async function poll(check, label, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out: ${label}`);
}
async function mode(page, value) {
  await page.locator(`.lesson-preview[data-mode="${value}"]`).waitFor();
}
async function assertSafeBounds(page) {
  const overflow = await page.evaluate(() => {
    const stage = document.querySelector('.lesson-stage').getBoundingClientRect();
    return [...document.querySelectorAll('[data-safe-element]')]
      .filter((node) => {
        const box = node.getBoundingClientRect();
        return (
          box.left < stage.left - 2 ||
          box.right > stage.right + 2 ||
          box.top < stage.top - 2 ||
          box.bottom > stage.bottom + 2
        );
      })
      .map((node) => node.textContent);
  });
  assert.deepEqual(overflow, [], 'visible board elements must stay inside the board');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}

try {
  await poll(async () => {
    if (server.exitCode != null) throw new Error(`Vite exited: ${logs}`);
    try {
      return (await fetch(url)).ok;
    } catch {
      return false;
    }
  }, 'preview server');
  browser = await chromium.launch({ headless: true });
  await mkdir('test-results', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const unexpected = [];
  page.on('pageerror', (error) => unexpected.push(error.message));
  await page.goto(url);
  await page.locator('.lesson-preview[data-layout="landscape"]').waitFor();
  assert.equal(await page.locator('[data-count="3"]').count(), 0);
  await assertSafeBounds(page);
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });

  // Paused seeking must reverse authored disclosure without an extra clock.
  const seek = page.getByLabel('موضع التشغيل');
  await seek.focus();
  await seek.press('End');
  await page.locator('[data-count="3"]').waitFor();
  await seek.press('Home');
  await poll(
    async () => (await page.locator('[data-count="3"]').count()) === 0,
    'reverse cue disclosure',
  );
  await page.getByRole('button', { name: 'ابدأ الشرح', exact: true }).click();
  await page.locator('[data-count="3"]').waitFor();
  await page.getByRole('button', { name: 'إيقاف مؤقت', exact: true }).click();
  const paused = await seek.inputValue();
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(await seek.inputValue(), paused, 'pausing freezes the visual clock');
  await page.getByRole('button', { name: 'كمّل الشرح', exact: true }).click();
  await page.locator('.lesson-preview[data-scene="try"]').waitFor();
  await page.locator('[data-board-phase="question-reading"]').waitFor();
  assert.equal(await page.locator('.lesson-preview').getAttribute('data-mode'), 'narration');
  assert.equal(
    await page.getByText('How many counters are there altogether?', { exact: true }).count(),
    1,
  );
  assert.equal(
    await page.getByText('There are five counters altogether.', { exact: true }).count(),
    0,
  );
  await mode(page, 'attempt');
  await page.getByRole('radio').nth(1).check();
  await page.getByRole('button', { name: 'اسمع التعقيب ونكمل' }).click();
  await mode(page, 'feedback');
  await page.locator('[data-board-phase="feedback"]').waitFor();
  await page.getByText('There are five counters altogether.', { exact: true }).waitFor();
  await page.locator('.lesson-preview[data-scene="closing"][data-mode="narration"]').waitFor();
  await mode(page, 'complete');
  assert.deepEqual(unexpected, [], 'no unhandled browser errors in the normal lesson flow');
  console.log(
    'Browser: progressive board, pause/seek, question onset, submit/feedback/next, completion passed.',
  );

  for (const width of [390, 320]) {
    const mobile = await browser.newPage({
      viewport: { width, height: 844 },
      reducedMotion: 'reduce',
    });
    await mobile.goto(url);
    await mobile.locator('.lesson-preview[data-layout="portrait"]').waitFor();
    const ratio = await mobile
      .locator('.lesson-stage')
      .evaluate((node) => node.clientWidth / node.clientHeight);
    assert.ok(Math.abs(ratio - 9 / 16) < 0.01);
    await mobile.getByLabel('موضع التشغيل').focus();
    await mobile.getByLabel('موضع التشغيل').press('End');
    await mobile.locator('[data-count="3"]').waitFor();
    await assertSafeBounds(mobile);
    await mobile.screenshot({ path: `test-results/mobile-${width}.png`, fullPage: true });
    await mobile.getByRole('button', { name: '2. نجرب سؤال', exact: true }).click();
    await mobile.getByRole('button', { name: 'ابدأ الشرح', exact: true }).click();
    await mobile.locator('[data-board-phase="question-reading"]').waitFor();
    await assertSafeBounds(mobile);
    await mobile.close();
  }
  console.log('Browser: 9:16, 320/390px, reduced-motion, question and diagram safe bounds passed.');

  const broken = await browser.newPage();
  await broken.route('**/fixtures/teach.wav', (route) => route.abort());
  await broken.goto(url);
  await broken.getByRole('alert').waitFor();
  assert.equal(await broken.locator('.lesson-preview').getAttribute('data-scene'), 'combine');
  await broken.unroute('**/fixtures/teach.wav');
  await broken.getByRole('button', { name: 'حاول تاني', exact: true }).click();
  await poll(
    async () => (await broken.getByRole('alert').count()) === 0,
    'audio retry clears the error',
  );
  await broken.locator('.lesson-preview[data-scene="try"]').waitFor();
  await broken.close();
  console.log('Browser: failed audio blocks progression; retry uses the same scene and recovers.');
} finally {
  await browser?.close();
  server.kill();
}
