// The "make a course" page through the real app (docs/builder-server.md): choices, a file,
// the request it sends, the builder's steps as they arrive, and the draft link when done.
// At 1280px and 390px, against a mocked API.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { serveOrigin } from '../tools/boards/serve.mjs';

const app = 'http://127.0.0.1:5189';
const jobId = '99999999-8888-7777-6666-555555555555';
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--config', 'apps/platform/vite.config.ts'].concat([
    '--host',
    '127.0.0.1',
    '--port',
    '5189',
    '--strictPort',
  ]),
  { stdio: 'ignore' },
);
// The board origin, with one board the builder "uploaded" (served by its hash, like a draft's).
const wire = 'fixtures/board-probe/boards/wire/';
const files = {
  'board.json': await readFile(`${wire}board.json`, 'utf8'),
  'index.html': await readFile(`${wire}index.html`, 'utf8'),
};
const made = {
  boardId: 'probe-wire',
  hash: 'a'.repeat(64),
  title: 'السلك',
  manifest: JSON.parse(files['board.json']),
};
const boards = await serveOrigin(new URL('../boards/dist', import.meta.url).pathname, 5174, {
  teacher: async (h, path) => (h === made.hash ? (files[path] ?? null) : null),
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
  const job = (status, steps, result = {}, made = []) => ({
    id: jobId,
    status,
    topic: store.sent?.topic ?? '',
    choices: store.sent?.choices ?? {},
    steps: steps.map((title, i) => ({ at: `2026-10-28T10:0${i}:00Z`, title })),
    result,
    error: '',
    createdAt: '2026-10-28T10:00:00Z',
    finishedAt: status === 'done' ? '2026-10-28T10:09:00Z' : null,
    boards: made,
  });
  return async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const send = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/me')
      return send({ user: { id: 't', name: 'أستاذة منى', email: 't@example.com' } });
    if (path === '/api/studio/jobs' && request.method() === 'POST') {
      store.sent = request.postDataJSON();
      return send(job('queued', []), 201);
    }
    if (path === '/api/studio/jobs') return send({ jobs: [] });
    if (path === `/api/studio/jobs/${jobId}`) {
      store.polls += 1;
      if (store.polls === 1) return send(job('queued', []));
      if (store.polls === 2)
        return send(job('running', ['بجهّز ملفاتك', 'بقرا دليل الكتابة'], {}, [made]));
      return send(
        job(
          'done',
          ['بجهّز ملفاتك', 'بقرا دليل الكتابة', 'بكتب درس: الفلوس بتكبر'],
          {
            courseId: 'c1',
            lessonId: 'l1',
            message: 'عملت درس واحد عن الفايدة المركبة.',
          },
          [made],
        ),
      );
    }
    return send({ error: 'not here' }, 404);
  };
}

async function run(width, height) {
  const store = { sent: null, polls: 0 };
  const page = await browser.newPage({ locale: 'ar-EG', viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(`${app}/api/**`, api(store));
  await page.goto(`${app}/?studio`);
  await page.getByRole('heading', { name: 'اعمل درس تفاعلي من فكرة' }).waitFor({ timeout: 20000 });

  // An empty request is stopped on the page.
  await page.getByRole('button', { name: 'ابدأ البناء' }).click();
  assert.equal(await page.getByRole('alert').innerText(), 'اكتب الكورس عن إيه.');
  await page.getByLabel('الكورس عن إيه؟').fill('الفايدة المركبة لطلاب أولى تجارة');
  // The topic picks looks that suit it.
  await page.locator('[data-look="chalk"] .look-fits').waitFor();
  await page.locator('input[type=file]').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Interest on interest.'),
  });
  await page.locator('.composer-files', { hasText: 'notes.txt' }).waitFor();
  // A look's live board opens in a dialog, and choosing it there selects its card.
  await page.locator('[data-look="chalk"] .look-try').click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('.html-board[data-ready]').waitFor({ timeout: 20000 });
  await page.screenshot({ path: `test-results/studio-look-${width}.png` });
  await dialog.getByRole('button', { name: 'اختار الشكل ده' }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('input[name=look][value=chalk]').isChecked(), true);
  // Who it is for changes the questions: a learner is asked about themselves, a teacher about the class.
  await page.getByText('أول مرة أسمع عنه').first().waitFor({ state: 'attached' });
  await page.getByRole('radio', { name: /لطلابي/ }).check();
  await page.getByLabel('مستوى الطلاب').waitFor();
  await page.getByText('تفاصيل أكتر').click();
  const chip = (name) => page.getByRole('button', { name, exact: true });
  await chip('حكاية الأول').click();
  await chip('أمثلة محلولة').click();
  await chip('خطوة بخطوة').click();
  await page.getByLabel('البوردات').selectOption('most');
  await page.getByLabel('الحجم').selectOption('3');
  assert.equal(await chip('حكاية الأول').getAttribute('aria-pressed'), 'true');
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(scroll <= width, `no sideways scroll at ${width}px (${scroll})`);
  await page.screenshot({ path: `test-results/studio-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'ابدأ البناء' }).click();

  // The request carries the choices and the file's bytes; the page follows the job.
  await page.waitForURL(`${app}/?studio&job=${jobId}`);
  assert.deepEqual(store.sent.choices, {
    level: 'beginner',
    language: 'egyptian',
    style: 'story,examples',
    boards: 'most',
    questions: 'key',
    size: '3',
    look: 'chalk',
    audience: 'students',
    goal: 'understand',
    age: '7-9',
  });
  assert.equal(store.sent.webSearch, true);
  assert.deepEqual(store.sent.files, [
    { name: 'notes.txt', mime: 'text/plain', data: btoa('Interest on interest.') },
  ]);
  await page.locator('.build-steps li.now', { hasText: 'بقرا دليل الكتابة' }).waitFor();
  // The storyboard shows the board the builder made, live, and a place for the next one.
  await page.locator('.build-board .html-board[data-ready]').waitFor({ timeout: 15000 });
  assert.equal(await page.locator('.build-board strong').innerText(), 'السلك');
  assert.equal(await page.locator('.build-board-next').count(), 1);
  await page.screenshot({ path: `test-results/studio-progress-${width}.png` });
  const open = page.getByRole('link', { name: 'افتح أول درس' });
  await open.waitFor({ timeout: 10000 });
  assert.equal(await open.getAttribute('href'), '/?draft=l1');
  assert.match(await page.locator('.build-done').innerText(), /عملت درس واحد/);
  assert.equal(await page.locator('.build-steps li.now').count(), 0, 'no step is pending');
  assert.equal(await page.locator('.build-board-next').count(), 0, 'nothing more is coming');
  const polls = store.polls;
  await page.waitForTimeout(3500);
  assert.equal(store.polls, polls, 'a finished job is not polled');
  assert.deepEqual(errors, []);
  await page.close();
}

try {
  await mkdir('test-results', { recursive: true });
  await poll(async () => (await fetch(app)).ok, 'app server');
  browser = await chromium.launch({ headless: true });
  await run(1280, 900);
  await run(390, 844);
  console.log('Make-a-course form, request, progress and draft link passed at 1280px and 390px.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  boards.server.close();
}
