// A course link opened without an account (M7, docs/marketplace.md): the course page for
// visitors, its first scene played for free with nothing saved and no tutor calls, and the
// end screen leading to sign-up. At 1280px and 390px, against a mocked API.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { buildPackage } from '../apps/platform/server/authoring/format.ts';

const app = 'http://127.0.0.1:5197';
const courseId = '11111111-2222-4333-8444-555555555555';
const lessonA = 'aaaaaaaa-2222-4333-8444-555555555555';
const full = buildPackage(
  {
    title: 'الحالات',
    goals: [{ text: 'تعرف درجة الغليان', sceneIds: ['one'] }],
    scenes: [
      { id: 'one', title: 'الغليان', steps: [{ text: 'المية بتغلي.' }, { text: 'عند 100 درجة.' }] },
      { id: 'two', title: 'التجمد', steps: [{ text: 'وبتتجمد عند صفر.' }] },
    ],
  },
  { lessonId: lessonA, courseId, courseTitle: 'المية', order: 1, revision: 1 },
  {},
);
const course = {
  id: courseId,
  title: 'المية',
  subject: 'علوم',
  description: 'حالات المية.',
  language: 'ar',
  teacher: 'أستاذة منى',
  version: 1,
  priceCents: 0,
  currency: 'USD',
  publishedAt: '2026-10-31T10:00:00Z',
  parts: [],
  lessons: [
    {
      id: lessonA,
      title: 'الحالات',
      position: 1,
      goals: [{ id: 'g', text: 'تعرف درجة الغليان' }],
      scenes: 2,
    },
    {
      id: 'bbbbbbbb-2222-4333-8444-555555555555',
      title: 'التبخر',
      position: 2,
      goals: [],
      scenes: 1,
    },
  ],
};
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--config', 'apps/platform/vite.config.ts'].concat([
    '--host',
    '127.0.0.1',
    '--port',
    '5197',
    '--strictPort',
  ]),
  { stdio: 'ignore' },
);

function api(calls) {
  return async (route) => {
    const path = new URL(route.request().url()).pathname;
    calls.push(path);
    const send = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/me') return send({ error: 'سجّل دخولك للمتابعة.' }, 401);
    const lesson = { id: lessonA, title: 'الحالات', scenes: 2 };
    if (path === `/api/public/courses/${courseId}`) return send({ course, lesson });
    if (path === `/api/public/courses/${courseId}/preview`)
      // What the server sends: the first scene only (server/market/preview.ts).
      return send({
        course,
        lesson: { ...lesson, package: { ...full, scenes: full.scenes.slice(0, 1) }, boards: {} },
      });
    return send({ error: 'not here' }, 404);
  };
}

async function run(browser, width, height) {
  const calls = [];
  const page = await browser.newPage({ locale: 'ar-EG', viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/**', api(calls));
  // The link, without an account: the course, its lessons, and the free first part.
  await page.goto(`${app}/?course=${courseId}`);
  await page.getByRole('heading', { name: 'المية', level: 1 }).waitFor({ timeout: 20000 });
  assert.equal(await page.locator('.course-lessons li').count(), 2);
  await page.locator('.course-lessons li').first().getByText('مجاني للتجربة').waitFor();
  assert.equal(
    await page.getByRole('link', { name: 'اعمل حساب مجاني وابدأ' }).getAttribute('href'),
    `/?course=${courseId}&auth=signup`,
  );
  const safe = async () =>
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  await safe();
  await page.screenshot({ path: `test-results/preview-course-${width}.png`, fullPage: true });
  // The first scene plays, then the end names what follows and asks for an account.
  await page.getByRole('link', { name: 'جرّب أول جزء ببلاش' }).click();
  await page.locator('.rl').waitFor({ timeout: 20000 });
  await page.getByText('معاينة مجانية').waitFor();
  const next = () => page.locator('.rl-dock .rl-next').click();
  await next();
  await next();
  const more = page.locator('.rl-complete a.rl-next');
  await more.waitFor({ timeout: 15000 });
  assert.match(await more.innerText(), /باقي «الحالات»/);
  assert.equal(await more.getAttribute('href'), `/?course=${courseId}&auth=signup`);
  await safe();
  await page.screenshot({ path: `test-results/preview-end-${width}.png` });
  await more.click();
  await page.waitForURL(`${app}/?course=${courseId}&auth=signup`);
  await page.locator('form').waitFor();
  // Nothing is saved and no tutor is called for a visitor.
  assert.deepEqual(
    calls.filter((p) => /progress|nova|enrol/.test(p)),
    [],
  );
  assert.deepEqual(errors, []);
  await page.close();
}

let browser;
try {
  await mkdir('test-results', { recursive: true });
  for (let i = 0; i < 150; i++) {
    if (
      await fetch(app).then(
        (r) => r.ok,
        () => false,
      )
    )
      break;
    await new Promise((r) => setTimeout(r, 200));
  }
  browser = await chromium.launch();
  await run(browser, 1280, 900);
  await run(browser, 390, 844);
  console.log('Visitor course page, free first scene and sign-up passed at 1280px and 390px.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
