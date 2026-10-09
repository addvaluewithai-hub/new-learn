import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:5180';
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--config',
    'apps/platform/vite.config.ts',
    '--host',
    '127.0.0.1',
    '--port',
    '5180',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
const root = 'content/chemistry/states-of-matter';
const manifest = JSON.parse(await readFile(`${root}/data/manifest.json`, 'utf8'));
const lock = JSON.parse(await readFile(`${root}/data/media-lock.json`, 'utf8'));
let browser;
async function poll(check, label, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out: ${label}`);
}
async function seekTo(page, ms) {
  await page.getByLabel('موضع التشغيل').evaluate(
    (node, frame) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(node, String(frame));
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
    },
    Math.ceil((ms / 1000) * 30),
  );
}
async function safeBounds(page) {
  const overflow = await page.evaluate(() => {
    const stage = document.querySelector('.lesson-stage').getBoundingClientRect();
    return [...document.querySelectorAll('[data-safe-element]')]
      .filter((node) => {
        const b = node.getBoundingClientRect();
        return (
          b.left < stage.left - 2 ||
          b.right > stage.right + 2 ||
          b.top < stage.top - 2 ||
          b.bottom > stage.bottom + 2
        );
      })
      .map((node) => node.textContent);
  });
  assert.deepEqual(overflow, []);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}
try {
  await poll(async () => {
    try {
      return (await fetch(url)).ok;
    } catch {
      return false;
    }
  }, 'built app');
  for (const asset of lock.assets) {
    const response = await fetch(`${url}/${asset.file}`);
    assert.equal(response.status, 200, asset.file);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.file);
  }
  browser = await chromium.launch({ headless: true });
  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.getByRole('heading', { name: 'حالات المادة', exact: true }).waitFor();
    await page.locator('.lesson-preview').waitFor();
    const ratio = await page
      .locator('.lesson-stage')
      .evaluate((node) => node.clientWidth / node.clientHeight);
    assert.ok(Math.abs(ratio - (width > 650 ? 16 / 9 : 9 / 16)) < 0.01);
    for (let i = 0; i < manifest.beats.length; i++) {
      const beat = manifest.beats[i];
      await page
        .getByRole('navigation', { name: 'مشاهد الدرس' })
        .getByRole('button')
        .nth(i)
        .click();
      const board = JSON.parse(await readFile(`${root}/data/board/${beat.id}.json`, 'utf8'));
      for (const phase of board.phases) {
        await seekTo(page, phase.atMs);
        await safeBounds(page);
      }
    }
    await page.getByRole('navigation', { name: 'مشاهد الدرس' }).getByRole('button').nth(0).click();
    await seekTo(page, 26000);
    await page.screenshot({ path: `test-results/chemistry-${width}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.goto(url);
  await page.getByRole('navigation', { name: 'مشاهد الدرس' }).getByRole('button').nth(7).click();
  const beat = manifest.beats.find((b) => b.id === 'S07');
  await seekTo(page, beat.questionAtMs);
  await page.locator('[data-board-phase="question-reading"]').waitFor();
  assert.equal(await page.locator('.lesson-preview').getAttribute('data-mode'), 'narration');
  await page.getByRole('button', { name: 'ابدأ الشرح', exact: true }).click();
  await poll(
    async () =>
      Number(await page.getByLabel('موضع التشغيل').inputValue()) >
      Math.ceil((beat.questionAtMs / 1000) * 30) + 5,
    'real MP3 playback advances',
  );
  await page.getByLabel('موضع التشغيل').focus();
  await page.getByLabel('موضع التشغيل').press('End');
  await page.locator('.lesson-preview[data-mode="attempt"]').waitFor();
  await page.getByRole('radio').nth(2).check();
  await page.getByRole('button', { name: 'اسمع التعقيب ونكمل' }).click();
  await page.locator('.lesson-preview[data-mode="feedback"]').waitFor();
  await poll(
    async () => Number(await page.getByLabel('موضع التشغيل').inputValue()) > 5,
    'feedback auto-start',
  );
  await page.getByLabel('موضع التشغيل').focus();
  await page.getByLabel('موضع التشغيل').press('End');
  await page.locator('.lesson-preview[data-scene="S08"][data-mode="narration"]').waitFor();
  console.log(
    'Chemistry: built app, exact media hashes, all board phases/ratios, real audio, question, feedback and automatic next passed.',
  );
} finally {
  await browser?.close();
  server.kill();
}
