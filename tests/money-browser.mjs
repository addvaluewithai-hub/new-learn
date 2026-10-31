// Credits and paid courses (docs/credits.md), against a mocked API at 1280 and 390: the
// credits page (balance, prices, packs waiting for payments, history, a staff grant), the
// studio's cost line and its block when short, pricing a course for review, a student facing
// a paid course, and staff reviewing it with the AI's first pass.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const app = 'http://127.0.0.1:5199';
const courseId = '11111111-2222-4333-8444-555555555555';
const lessonId = 'aaaaaaaa-2222-4333-8444-555555555555';
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--config', 'apps/platform/vite.config.ts'].concat([
    '--host',
    '127.0.0.1',
    '--port',
    '5199',
    '--strictPort',
  ]),
  { stdio: 'ignore' },
);
const prices = [
  { id: 'course.build', credits: 30, unit: 'each', status: 'live' },
  { id: 'voice.minute', credits: 2, unit: 'minute', status: 'soon' },
  { id: 'marketing.landing', credits: 15, unit: 'each', status: 'soon' },
];
const pkg = {
  scenes: [
    {
      id: 'one',
      title: 'الأول',
      steps: [{ text: 'المية بتغلي عند ١٠٠ درجة.' }],
      question: {
        id: 'Q1',
        arabic: 'المية بتغلي عند كام؟',
        english: '',
        options: ['١٠٠', 'صفر'],
        answer: { arabic: '١٠٠', english: '' },
        feedback: { steps: [{ text: 'أيوه.' }] },
      },
    },
  ],
};

function api(store) {
  return (route) => {
    const request = route.request();
    const path = decodeURIComponent(new URL(request.url()).pathname);
    const method = request.method();
    const send = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/me')
      return send({ user: { id: 'u', name: 'منى', email: 'mona@example.com', staff: true } });
    if (path === '/api/credits')
      return send({
        balance: store.balance,
        starter: 60,
        entries: [
          {
            id: 'e1',
            amount: 60,
            kind: 'starter',
            action: '',
            note: '',
            at: '2026-10-31T09:00:00Z',
          },
          ...store.extra,
        ],
        prices,
        packs: [{ id: 'small', credits: 100, priceCents: 1000 }],
        payments: { connected: false },
      });
    if (path === '/api/credits/grant') {
      store.granted.push(request.postDataJSON());
      store.extra.push({
        id: 'e2',
        amount: 50,
        kind: 'grant',
        action: '',
        note: 'beta',
        at: '2026-10-31T10:00:00Z',
      });
      return send({ email: 'ali@example.com', balance: 110 });
    }
    if (path === '/api/studio/jobs') return send({ jobs: [] });
    if (path === '/api/courses') return send({ courses: [] });
    if (path === `/api/courses/${courseId}` && method === 'GET')
      return send({
        id: courseId,
        title: 'المية',
        subject: 'علوم',
        description: '',
        language: 'ar',
        teacher: 'أستاذة منى',
        version: 1,
        priceCents: 1500,
        currency: 'USD',
        access: false,
        publishedAt: '2026-10-31T10:00:00Z',
        parts: [],
        lessons: [{ id: lessonId, title: 'الغليان', position: 1, goals: [], scenes: 1 }],
      });
    if (path === `/api/courses/${courseId}/buy`)
      return send({ error: 'الدفع لسه بيتجهّز. هيفتح قريب.' }, 503);
    if (path === '/api/review/queue')
      return send({
        reviews: store.decided
          ? []
          : [
              {
                courseId,
                version: 2,
                title: 'المية',
                teacher: 'أستاذة منى',
                priceCents: 1500,
                currency: 'USD',
                submittedAt: '2026-10-31T10:00:00Z',
                aiDone: Boolean(store.ai),
              },
            ],
      });
    if (path === `/api/review/courses/${courseId}/2/ai`) {
      store.ai = {
        summary: 'نقطة واحدة.',
        findings: [
          {
            severity: 'high',
            kind: 'accuracy',
            lesson: 'الغليان',
            where: 'one',
            note: 'عند مستوى سطح البحر.',
          },
        ],
        at: '2026-10-31T10:05:00Z',
      };
      return send(store.ai);
    }
    if (path === `/api/review/courses/${courseId}/2` && method === 'POST') {
      store.decided = request.postDataJSON();
      return send({ status: store.decided.status });
    }
    if (path === `/api/review/courses/${courseId}/2`)
      return send({
        courseId,
        version: 2,
        title: 'المية',
        subject: 'علوم',
        description: '',
        teacher: 'أستاذة منى',
        language: 'ar',
        priceCents: 1500,
        currency: 'USD',
        status: store.decided ? store.decided.status : 'pending',
        notes: '',
        aiReport: store.ai ?? null,
        lessons: [{ id: lessonId, title: 'الغليان', position: 1, package: pkg }],
      });
    return send({ error: 'not here' }, 404);
  };
}

async function run(width, height) {
  const store = { balance: 60, extra: [], granted: [], ai: null, decided: null };
  const page = await browser.newPage({ locale: 'ar-EG', viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/**', api(store));
  const safe = async () =>
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  // Credits: balance, the price list with what is coming, packs waiting for payments.
  await page.goto(`${app}/?credits`);
  await page.getByRole('heading', { name: 'رصيدك', level: 1 }).waitFor({ timeout: 20000 });
  await page.locator('.credits-balance strong').getByText('60 كريدت', { exact: true }).waitFor();
  assert.equal(await page.locator('.credits-prices li[data-soon]').count(), 2);
  assert.equal(await page.locator('.credits-pack button').isDisabled(), true);
  await page.getByText('الدفع لسه بيتجهّز').first().waitFor();
  // Staff give credits by e-mail; the history shows it.
  await page.getByLabel('إيميل الحساب').fill('ali@example.com');
  await page.getByLabel('ملحوظة').fill('beta');
  await page.getByRole('button', { name: 'ضيف الكريدت' }).click();
  await page.getByRole('status').filter({ hasText: 'ali@example.com' }).waitFor();
  assert.deepEqual(store.granted[0], { email: 'ali@example.com', amount: 50, note: 'beta' });
  await safe();
  await page.screenshot({ path: `test-results/credits-${width}.png`, fullPage: true });
  // The studio says what a build costs; with too little the start waits for a top-up.
  await page.goto(`${app}/?studio`);
  await page.getByText('البناء ده بـ30 كريدت · معاك 60').waitFor({ timeout: 20000 });
  store.balance = 10;
  await page.reload();
  await page.getByText('رصيدك مش مكفي للبناء ده.').waitFor({ timeout: 20000 });
  assert.equal(await page.getByRole('button', { name: 'ابدأ البناء' }).isDisabled(), true);
  // A student on a paid course without access sees its price and a buy button.
  await page.goto(`${app}/?course=${courseId}`);
  await page.getByRole('button', { name: /اشتري الكورس/ }).waitFor({ timeout: 20000 });
  assert.equal(await page.getByRole('button', { name: 'ابدأ الكورس' }).count(), 0);
  await page.getByRole('button', { name: /اشتري الكورس/ }).click();
  await page.getByRole('alert').filter({ hasText: 'الدفع لسه بيتجهّز' }).waitFor();
  await safe();
  await page.screenshot({ path: `test-results/paid-course-${width}.png`, fullPage: true });
  // Staff review: the queue, the AI's first pass, the lessons, and approval.
  await page.goto(`${app}/?review`);
  await page.getByRole('link', { name: 'افتح' }).click();
  await page.getByRole('heading', { name: 'المية', level: 1 }).waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: 'شغّل مراجعة الـAI' }).click();
  await page.getByText('عند مستوى سطح البحر.').waitFor();
  await page.getByText('الإجابة الصح: ١٠٠').waitFor();
  await page.getByLabel('ملاحظات للمدرس').fill('تمام.');
  await page.getByRole('button', { name: 'وافق وانشر' }).click();
  await page.getByRole('status').filter({ hasText: 'اتوافق عليه' }).waitFor();
  assert.deepEqual(store.decided, { status: 'approved', notes: 'تمام.' });
  await safe();
  await page.screenshot({ path: `test-results/review-${width}.png`, fullPage: true });
  assert.deepEqual(errors, []);
  await page.close();
}

let browser;
try {
  await mkdir('test-results', { recursive: true });
  for (
    let i = 0;
    i < 150 &&
    !(await fetch(app).then(
      (r) => r.ok,
      () => false,
    ));
    i++
  )
    await new Promise((r) => setTimeout(r, 200));
  browser = await chromium.launch();
  await run(1280, 900);
  await run(390, 844);
  console.log('Credits, the studio cost, a paid course and its review passed at 1280 and 390.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
