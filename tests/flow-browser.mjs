// How a reading lesson moves on its own: a reading pace fills the Next button and turns the
// page; pause holds it; Nova narration reads line after line in one session (each line asked
// for ahead of time, its page turned when its audio starts), stops at the question, never
// starts by itself when a lesson opens, and the lesson pauses when the learner talks.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const url = 'http://127.0.0.1:5191';
const args = ['--config', 'apps/platform/vite.config.ts', '--host', '127.0.0.1', '--port', '5191'];
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', ...args], {
  stdio: 'ignore',
});
const pins = JSON.parse(await readFile('apps/platform/content-modules.json', 'utf8'));
const { curricula } = JSON.parse(await readFile('content/imported/registry.json', 'utf8'));
const course = curricula[0];
const lesson = course.lessons.find((l) => l.moduleId);
const pcm = Buffer.alloc(24000 * 2 * 0.2).toString('base64');
const say = (ws, content) => ws.send(JSON.stringify({ serverContent: content }));

let browser;
try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    if (i > 150) throw new Error('Preview unavailable');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 860 },
    permissions: ['microphone'],
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const id = decodeURIComponent(path.split('/').pop());
    if (path === '/api/me')
      return route.fulfill({ json: { user: { id: 'u', name: 'طالب', email: 's@e.com' } } });
    if (path.endsWith('/progress'))
      return route.fulfill({
        json:
          request.method() === 'GET'
            ? { revision: null, state: null, completed: false }
            : { revision: 0 },
      });
    if (path === '/api/nova/live')
      return route.fulfill({ json: { token: 't', model: 'm', config: {} } });
    return route.fulfill({
      json: { ...pins[`reading:${id}`], moduleId: `reading:${id}`, stage: 'published' },
    });
  });
  const reads = [];
  const log = [];
  await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (ws) => {
    ws.onMessage((raw) => {
      const message = JSON.parse(raw);
      if (message.setup) ws.send(JSON.stringify({ setupComplete: {} }));
      const text = message.clientContent?.turns?.[0]?.parts?.[0]?.text ?? '';
      if (message.realtimeInput?.activityStart) log.push('start');
      if (text.startsWith('READ')) {
        reads.push(text);
        setTimeout(() => {
          say(ws, {
            modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: pcm } }] },
          });
          say(ws, { turnComplete: true });
        }, 120);
      }
      if (message.realtimeInput?.activityEnd) {
        say(ws, { outputTranscription: { text: 'رد قصير.' } });
        say(ws, { turnComplete: true });
      }
    });
  });
  await page.goto(`${url}/?lesson=${lesson.id}&curriculum=${course.id}`);
  await page.locator('.rl').waitFor();
  const line = () => page.locator('.rl-caption-text').innerText();
  const settings = page.getByRole('button', { name: 'طريقة مشي الدرس' });

  // Default: nothing moves alone.
  const first = await line();
  await page.waitForTimeout(3500);
  assert.equal(await line(), first, 'manual by default');
  assert.equal(await page.locator('.rl-flow').count(), 0);

  // A reading pace fills Next and turns the page; pause holds it.
  await settings.click();
  await page.getByRole('radio', { name: 'أسرع' }).click();
  await page.keyboard.press('Escape');
  await page.locator('.rl-next-fill').waitFor();
  await page.waitForFunction((text) => {
    const now = document.querySelector('.rl-caption-text')?.textContent;
    return now && now !== text;
  }, first);
  await page.getByRole('button', { name: 'وقّف التقليب' }).click();
  const held = await line();
  await page.waitForTimeout(4000);
  assert.equal(await line(), held, 'paused');
  await page.getByRole('button', { name: 'كمّل لوحده' }).click();

  // Narration: line after line in one session, up to the question, then it waits.
  await settings.click();
  await page.getByRole('switch', { name: /Nova تقرا الدرس/ }).check();
  await page.keyboard.press('Escape');
  await page.locator('.rl-question').waitFor({ timeout: 60000 });
  assert.ok(reads.length >= 2, 'several lines read');
  assert.ok(
    reads.slice(0, -1).every((r) => r.startsWith('READ:\n')),
    'lines verbatim',
  );
  assert.match(reads.at(-1), /^READ QUESTION:\n/, 'stops at the question');
  const atQuestion = reads.length;
  await page.waitForTimeout(2500);
  assert.equal(reads.length, atQuestion, 'waits for the answer');
  assert.ok(await page.locator('.rl-question').isVisible());

  // Opening a lesson never starts the narration by itself: it waits for play.
  await page.reload();
  await page.locator('.rl').waitFor();
  const before = reads.length;
  await page.waitForTimeout(2500);
  assert.equal(reads.length, before, 'no reading before play');
  await page.getByRole('button', { name: 'كمّل لوحده' }).waitFor();

  // Talking to Nova pauses the lesson.
  await page.locator('.rl-stage').click();
  await page.keyboard.down('Space');
  await page.locator('.rl-t-note[data-role="learner"]').waitFor();
  await page.keyboard.up('Space');
  await page.locator('.rl-t-note[data-role="tutor"]', { hasText: 'رد قصير' }).waitFor();
  assert.equal(await page.locator('.rl-question').count(), 1);
  assert.ok(log.includes('start'));
  assert.deepEqual(errors, []);
  console.log(
    'Flow: manual default, reading pace, pause, narration, question stop, talk pause passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
