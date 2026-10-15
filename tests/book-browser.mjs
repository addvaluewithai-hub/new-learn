import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const url = 'http://127.0.0.1:5193';
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
    '5193',
  ],
  { stdio: 'ignore' },
);
const next = (page) => page.locator('.bk-dock .bk-primary').click();
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
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: process.env.CHROMIUM_PATH
      ? [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--no-zygote',
          '--single-process',
          '--in-process-gpu',
          '--use-gl=angle',
          '--use-angle=swiftshader',
          '--enable-unsafe-swiftshader',
        ]
      : [],
  });
  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [],
      api = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (r) => {
      if (r.url().includes('/api/') || r.method() !== 'GET') api.push(`${r.method()} ${r.url()}`);
    });
    await page.goto(`${url}/?preview=book-ch08`);
    await page.locator('.bk-lesson h2').waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.bk-location span').first().innerText(), 'صفحة 121');
    await page.screenshot({ path: `test-results/book-${width}.png`, fullPage: true });
    const total = Number((await page.locator('.bk-progress span').innerText()).split(' من ')[1]);
    let questions = 0,
      equations = 0;
    for (let index = 0; index < total; index++) {
      assert.equal(await page.locator('.bk-progress span').innerText(), `${index + 1} من ${total}`);
      assert.equal(await page.locator('.katex-error').count(), 0, 'all math parses');
      equations += await page.locator('.bk-explanation .katex').count();
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `no horizontal overflow at ${width}, step ${index}`,
      );
      if (await page.locator('.bk-attempt').count()) {
        questions++;
        assert.equal(await page.locator('.bk-location', { hasText: 'الحل خطوة خطوة' }).count(), 0);
        assert.ok(await page.locator('.bk-dock .bk-primary').isDisabled());
        await page.keyboard.press('ArrowLeft');
        assert.equal(
          await page.locator('.bk-attempt').count(),
          1,
          'keyboard cannot bypass attempt',
        );
        if (questions === 1) {
          await page
            .getByLabel('اكتب محاولتك أو أول خطوة وصلت لها')
            .fill('أختار قانون معامل يونج؛ معامل المادة غير مذكور.');
          await page.getByRole('button', { name: 'شوف الحل بعد محاولتي' }).click();
        } else await page.getByRole('button', { name: 'معرفتش، ورّيني الحل' }).click();
        await page.locator('.bk-location', { hasText: 'الحل خطوة خطوة' }).waitFor();
        assert.equal(await page.locator('.bk-attempt').count(), 0);
      } else await next(page);
    }
    await page.locator('.bk-complete').waitFor();
    assert.equal(questions, 4);
    assert.ok(equations > 80);
    await page.getByRole('button', { name: 'راجع من الأول' }).click();
    await page.locator('.bk-outline-toggle').click();
    assert.equal(await page.locator('.bk-outline > button').count(), 29);
    await page.locator('.bk-outline > button', { hasText: 'مسألة العمود الصلب' }).click();
    assert.equal(
      await page.locator('.bk-attempt').count(),
      0,
      'attempt remains available during this session',
    );
    await page.reload();
    await page.locator('.bk-outline-toggle').click();
    await page.locator('.bk-outline > button', { hasText: 'مسألة العمود الصلب' }).click();
    await page.locator('.bk-attempt').waitFor();
    await page.locator('#book-file').setInputFiles({
      name: 'wrong.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7\nwrong source'),
    });
    await page.getByRole('status').filter({ hasText: 'ده ملف مختلف' }).waitFor();
    assert.equal(await page.locator('canvas').count(), 0);
    if (process.env.BOOK_SOURCE_MAIN && width === 1280) {
      await page.locator('#book-file').setInputFiles(process.env.BOOK_SOURCE_MAIN);
      await page.getByRole('status').filter({ hasText: 'الكتاب مفتوح' }).waitFor();
      await page.waitForFunction(
        () =>
          document.querySelector('canvas')?.width > 0 &&
          document.querySelector('.bk-render-status')?.textContent === '',
      );
      const pages = [];
      // Every printed page, including the two halves of each rotated spread.
      for (let printed = 121; printed <= 133; printed++) {
        await page.locator('.bk-outline-toggle').click();
        await page
          .locator('.bk-outline > button')
          .filter({ has: page.locator('span:first-child', { hasText: String(printed) }) })
          .first()
          .click();
        await page.waitForFunction(
          (printed) =>
            document.querySelector('canvas')?.dataset.page === String(printed) &&
            document.querySelector('.bk-render-status')?.textContent === '',
          printed,
        );
        pages.push(await page.locator('canvas').evaluate((canvas) => canvas.toDataURL()));
      }
      assert.equal(new Set(pages).size, 13, 'printed pages render distinct source crops');
      if (process.env.BOOK_SOURCE_CLOSEUP) {
        await page.locator('#book-file').setInputFiles(process.env.BOOK_SOURCE_CLOSEUP);
        await page.getByRole('status').filter({ hasText: 'الكتاب مفتوح' }).waitFor();
        await page.locator('.bk-outline-toggle').click();
        await page
          .locator('.bk-outline > button')
          .filter({ has: page.locator('span:first-child', { hasText: '124' }) })
          .first()
          .click();
        await page.waitForFunction(
          () =>
            document.querySelector('canvas')?.width > 0 &&
            document.querySelector('.bk-render-status')?.textContent === '',
        );
      }
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(api, [], 'no API, uploads or progress writes');
    await page.close();
  }
  console.log(
    'Book study: complete chapter, 4 gated exercises, math, responsive layout, local-source validation passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
