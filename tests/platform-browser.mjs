import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const url = 'http://127.0.0.1:5182';
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
    '5182',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
let logs = '';
server.stdout.on('data', (data) => (logs += data));
server.stderr.on('data', (data) => (logs += data));
const modules = JSON.parse(await readFile('apps/platform/content-modules.json', 'utf8'));
const user = { id: 'browser-test-user', name: 'طالب المراجعة', email: 'review@example.com' };
const curriculum = {
  id: 'chemistry-gas-laws',
  title: 'الكيمياء · قوانين الغازات',
  description: 'من حالات المادة إلى قوانين الغازات، خطوة بخطوة.',
  subject: 'Chemistry — الكيمياء',
  lessons: [
    {
      id: 'chem-gas-states-matter',
      title: 'States of Matter — حالات المادة: الخصائص',
      subtitle: 'نلاحظ ونقارن.',
      position: 1,
      availability: 'review',
    },
    {
      id: 'chem-gas-phase-changes',
      title: 'Phase Changes — تغيرات الحالة',
      subtitle: 'قريبًا',
      position: 2,
      availability: 'coming-soon',
    },
  ],
};
let browser;
async function safe(page) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    'no horizontal overflow',
  );
}
try {
  const end = Date.now() + 15000;
  while (true) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    if (Date.now() > end) throw new Error('Preview unavailable');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  await mkdir('test-results', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  let signedIn = false,
    failCatalog = false,
    failLogout = false;
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let status = 200,
      body = {};
    if (path === '/api/me') {
      status = signedIn ? 200 : 401;
      body = signedIn ? { user } : { error: 'سجّل دخولك للمتابعة.' };
    } else if (path.endsWith('/sign-up/email') || path.endsWith('/sign-in/email')) {
      if (route.request().postDataJSON().password === 'wrong-pass') {
        status = 401;
        body = { code: 'INVALID_EMAIL_OR_PASSWORD' };
      } else {
        signedIn = true;
        body = { user };
      }
    } else if (path.endsWith('/sign-out')) {
      if (failLogout) {
        status = 503;
        body = { error: 'تعذر تسجيل الخروج.' };
      } else signedIn = false;
    } else if (path.endsWith('/reset-password')) {
      body = { status: true };
    } else if (path.endsWith('/request-password-reset')) body = { status: true };
    else if (path === '/api/catalog') {
      status = failCatalog ? 503 : 200;
      body = failCatalog ? { error: 'تعذر تحميل المناهج حاليًا.' } : { curricula: [curriculum] };
    } else if (path === '/api/lessons/chem-gas-states-matter')
      body = {
        ...modules['states-of-matter-review'],
        moduleId: 'states-of-matter-review',
        stage: 'review',
      };
    else {
      status = 404;
      body = { error: 'غير موجود' };
    }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto(url);
  await page.getByRole('heading', { name: 'رحلتك تبدأ من هنا.' }).waitFor();
  assert.equal(
    await page
      .locator('.auth-layout')
      .evaluate((n) => getComputedStyle(n).fontFamily.includes('IBM Plex Sans Arabic')),
    true,
  );
  await safe(page);
  await page.screenshot({ path: 'test-results/signup-desktop.png', fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    await safe(page);
    assert.equal(await page.locator('.auth-story').isVisible(), false);
    await page.screenshot({ path: `test-results/signup-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'سجّل دخولك', exact: true }).click();
  await page.getByLabel('البريد الإلكتروني').fill(user.email);
  await page.getByLabel('كلمة المرور').fill('wrong-pass');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'البريد أو كلمة المرور غير صحيحة.' }).waitFor();
  await page.getByRole('button', { name: 'نسيت كلمة المرور؟' }).click();
  await page.getByRole('button', { name: 'إرسال رابط الاستعادة' }).click();
  await page.getByRole('status').filter({ hasText: 'لو البريد مسجّل' }).waitFor();
  await page.goto(`${url}/?auth=reset&token=test-token`);
  await page.getByRole('heading', { name: 'كلمة مرور جديدة.' }).waitFor();
  await page.getByLabel('كلمة المرور').fill('New-test-password');
  await page.getByRole('button', { name: 'حفظ كلمة المرور' }).click();
  await page.getByRole('heading', { name: 'نكمّل من مكاننا؟' }).waitFor();
  assert.equal(new URL(page.url()).searchParams.has('token'), false);
  await page.getByRole('button', { name: 'اعمل حساب', exact: true }).click();
  await page.getByLabel('اسمك', { exact: true }).fill(user.name);
  await page.getByLabel('البريد الإلكتروني').fill(user.email);
  await page.getByLabel('كلمة المرور').fill('Valid-password');
  await page.getByRole('button', { name: 'إنشاء حساب', exact: true }).click();
  await page.getByRole('heading', { name: 'مناهجي', exact: true }).waitFor();
  await safe(page);
  await page.screenshot({ path: 'test-results/catalog-320.png', fullPage: true });
  failCatalog = true;
  await page.reload();
  await page.getByRole('alert').filter({ hasText: 'تعذر تحميل المناهج' }).waitFor();
  failCatalog = false;
  await page.getByRole('button', { name: 'حاول تاني' }).click();
  await page.getByRole('heading', { name: 'مناهجي', exact: true }).waitFor();
  await page.getByRole('link', { name: 'افتح المنهج', exact: true }).click();
  await page.getByRole('heading', { name: curriculum.title, exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'قريبًا', exact: true }).isDisabled(), true);
  await safe(page);
  await page.screenshot({ path: 'test-results/curriculum-320.png', fullPage: true });
  await page.getByRole('link', { name: 'افتح الدرس', exact: true }).click();
  await page.locator('.lesson-preview').waitFor();
  assert.equal(await page.locator('.lesson-preview').getAttribute('data-mode'), 'narration');
  await safe(page);
  await page.getByRole('link', { name: 'Learn، ارجع للمنهج' }).click();
  await page.getByRole('heading', { name: curriculum.title, exact: true }).waitFor();
  await page.getByRole('button', { name: 'افتح القائمة' }).click();
  failLogout = true;
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'تعذر تسجيل الخروج' }).waitFor();
  assert.equal(
    await page.getByRole('heading', { name: curriculum.title, exact: true }).isVisible(),
    true,
  );
  failLogout = false;
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await page.getByRole('heading', { name: 'رحلتك تبدأ من هنا.' }).waitFor();
  await page.setViewportSize({ width: 1280, height: 1000 });
  signedIn = true;
  await page.goto(url);
  await page.getByRole('heading', { name: 'مناهجي', exact: true }).waitFor();
  await safe(page);
  await page.screenshot({ path: 'test-results/catalog-desktop.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    'Platform browser (controlled API): account modes, errors, session restore, logout, catalog retry, lesson navigation, 320/390/1280 layouts passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
