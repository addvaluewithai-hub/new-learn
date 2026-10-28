// ?settings through the real app with a fake API: the account changes go to the auth routes
// with only what they need, and the lesson and Nova settings stay on the device and reach the
// keys the lesson reads. At 1280px and 390px.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const app = 'http://127.0.0.1:5195';
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--config', 'apps/platform/vite.config.ts'].concat([
    '--host',
    '127.0.0.1',
    '--port',
    '5195',
    '--strictPort',
  ]),
  { stdio: 'ignore' },
);
let browser;

async function run(width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const user = { id: 'u1', name: 'منى', email: 'mona@example.com' };
  const sent = [];
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().postDataJSON?.() ?? null;
    if (path === '/api/me') return route.fulfill({ json: { user } });
    if (path === '/api/auth/update-user') {
      sent.push([path, body]);
      user.name = body.name;
      return route.fulfill({ json: { status: true } });
    }
    if (path === '/api/auth/change-password') {
      sent.push([path, body]);
      return body.currentPassword === 'right-pass'
        ? route.fulfill({ json: { token: null } })
        : route.fulfill({ status: 400, json: { error: 'كلمة السر الحالية مش صح.' } });
    }
    return route.fulfill({ status: 404, json: { error: 'مش موجود' } });
  });
  await page.goto(`${app}/?settings`);
  await page.getByRole('heading', { name: 'الإعدادات', level: 1 }).waitFor({ timeout: 20000 });
  assert.equal(
    await page.getByRole('link', { name: 'الإعدادات' }).first().getAttribute('aria-current'),
    'page',
  );
  // The name is saved to the account and the page shows the new one.
  await page.getByLabel('اسمك').fill('منى أحمد');
  await page.getByRole('button', { name: 'احفظ الاسم' }).click();
  await page.getByRole('status').filter({ hasText: 'اسمك اتغيّر' }).waitFor();
  assert.deepEqual(sent.shift(), ['/api/auth/update-user', { name: 'منى أحمد' }]);
  // A wrong current password shows the service's answer, never a success.
  await page.getByLabel('كلمة السر الحالية').fill('wrong-pass');
  await page.getByLabel('كلمة السر الجديدة').fill('new-pass-123');
  await page.getByRole('button', { name: 'غيّر كلمة السر' }).click();
  await page.getByRole('alert').filter({ hasText: 'مش صح' }).waitFor();
  await page.getByLabel('كلمة السر الحالية').fill('right-pass');
  await page.getByRole('button', { name: 'غيّر كلمة السر' }).click();
  await page.getByRole('status').filter({ hasText: 'كلمة السر اتغيّرت' }).waitFor();
  // Lesson and Nova settings land in the keys the lesson and Nova read.
  await page.getByRole('radio', { name: 'وريني الإجابة' }).click();
  await page.getByRole('radio', { name: 'لوحده بهدوء' }).click();
  await page.getByRole('switch', { name: /الشرح بالصوت/ }).click();
  await page.getByLabel('صوت Nova').selectOption('Puck');
  const stored = await page.evaluate(() => ({
    flow: JSON.parse(localStorage.getItem('learn.lesson.flow')),
    voice: JSON.parse(localStorage.getItem('learn.nova.voice')),
  }));
  assert.equal(stored.flow.questions, 'show');
  assert.equal(stored.flow.pace, 'slower');
  assert.equal(stored.flow.narration, true);
  assert.equal(stored.voice.voice, 'Puck');
  // Coming back keeps them.
  await page.reload();
  await page.getByRole('heading', { name: 'الإعدادات', level: 1 }).waitFor();
  assert.equal(
    await page.getByRole('radio', { name: 'وريني الإجابة' }).getAttribute('aria-checked'),
    'true',
  );
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(scroll <= width, `no sideways scroll at ${width}px (${scroll})`);
  await page.screenshot({ path: `test-results/settings-${width}.png`, fullPage: true });
  assert.deepEqual(errors, []);
  await page.close();
}

try {
  await mkdir('test-results', { recursive: true });
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    if (
      await fetch(app).then(
        (r) => r.ok,
        () => false,
      )
    )
      break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  browser = await chromium.launch();
  await run(1280, 900);
  await run(390, 844);
  console.log('Settings page passed at 1280px and 390px.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
