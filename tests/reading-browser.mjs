// Reading lessons through the real platform UI with a controlled API: catalog → lesson →
// steps → question locked until an attempt → model answer → completion, 1280 and 390px.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const url = 'http://127.0.0.1:5185';
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--config', 'apps/platform/vite.config.ts'].concat([
    '--host',
    '127.0.0.1',
    '--port',
    '5185',
  ]),
  { stdio: 'ignore' },
);
const pins = JSON.parse(await readFile('apps/platform/content-modules.json', 'utf8'));
const { curricula } = JSON.parse(await readFile('content/imported/registry.json', 'utf8'));
const course = curricula[0];
const catalog = {
  curricula: [
    {
      ...course,
      lessons: course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        subtitle: l.subtitle,
        position: l.order,
        availability: l.moduleId ? 'published' : 'coming-soon',
      })),
    },
  ],
};
let browser;
try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    if (i > 150) throw new Error('Preview unavailable');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const id = decodeURIComponent(path.split('/').pop());
      const pin = pins[`reading:${id}`];
      const body =
        path === '/api/me'
          ? { user: { id: 'u', name: 'طالب', email: 's@example.com' } }
          : path === '/api/catalog'
            ? catalog
            : pin && path.startsWith('/api/lessons/')
              ? { ...pin, moduleId: `reading:${id}`, stage: 'published' }
              : null;
      await route.fulfill({ status: body ? 200 : 404, json: body ?? { error: 'غير موجود' } });
    });
    await page.goto(`${url}/?curriculum=${course.id}`);
    await page.getByRole('link', { name: 'افتح الدرس', exact: true }).first().click();
    await page.locator('.reading-lesson').waitFor();
    assert.equal(await page.locator('.reading-board').count(), 1);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({ path: `test-results/reading-${width}.png`, fullPage: true });
    while (!(await page.locator('.reading-attempt').count()))
      await page.getByRole('button', { name: 'التالي' }).click();
    assert.equal(await page.getByRole('button', { name: 'التالي' }).count(), 0, 'locked');
    assert.equal(await page.locator('.reading-tag').count(), 0, 'no answer before attempt');
    await page.getByRole('button', { name: 'معرفتش، وريني الحل' }).click();
    await page.locator('.reading-tag', { hasText: 'الإجابة النموذجية' }).waitFor();
    await page.screenshot({ path: `test-results/reading-feedback-${width}.png`, fullPage: true });
    for (
      let guard = 0;
      guard < 300 && !(await page.locator('.reading-complete').count());
      guard++
    ) {
      if (await page.locator('.reading-attempt').count())
        await page.getByRole('button', { name: 'معرفتش، وريني الحل' }).click();
      else await page.locator('.reading-nav .reading-primary').click();
    }
    await page.getByRole('heading', { name: 'خلّصت الدرس' }).waitFor();
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    'Reading browser: catalog → lesson → locked question → feedback → completion passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
