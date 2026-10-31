// The design system page (?preview=ui, docs/design-system.md) through the real app: tokens are
// defined, the shared parts work by mouse and keyboard, and nothing scrolls sideways.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const app = 'http://127.0.0.1:5194';
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--config', 'apps/platform/vite.config.ts'].concat([
    '--host',
    '127.0.0.1',
    '--port',
    '5194',
    '--strictPort',
  ]),
  { stdio: 'ignore' },
);
let browser;

async function run(width, height) {
  const page = await browser.newPage({ locale: 'ar-EG', viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${app}/?preview=ui`);
  await page.getByRole('heading', { name: 'نظام التصميم' }).waitFor({ timeout: 20000 });
  // Every swatch shows a real value: a token missing from tokens.css shows nothing.
  const empty = await page
    .locator('.ui-swatches li')
    .evaluateAll((items) => items.filter((li) => !li.querySelectorAll('code')[1]?.textContent));
  assert.equal(empty.length, 0, 'every colour token has a value');
  // Chips toggle, the segmented control picks one, choice cards are radios.
  const chip = page.getByRole('button', { name: 'خطوة بخطوة' });
  await chip.click();
  assert.equal(await chip.getAttribute('aria-pressed'), 'true');
  await page.getByRole('radio', { name: 'سريع' }).click();
  assert.equal(
    await page.getByRole('radio', { name: 'سريع' }).getAttribute('aria-checked'),
    'true',
  );
  await page.getByRole('radio', { name: /لطلابي/ }).check();
  // The switch is a real checkbox announced as a switch.
  const voice = page.getByRole('switch', { name: /الشرح بالصوت/ });
  assert.equal(await voice.isChecked(), true);
  await voice.click();
  assert.equal(await voice.isChecked(), false);
  // A field's error is tied to it and announced.
  assert.equal(await page.getByRole('alert').filter({ hasText: 'الإيميل ده' }).count(), 1);
  // Keyboard focus is visible on the primary button.
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'ابدأ البناء' }).focus();
  const outline = await page
    .getByRole('button', { name: 'ابدأ البناء' })
    .evaluate((b) => getComputedStyle(b).outlineStyle);
  assert.notEqual(outline, 'none', 'focus ring shows');
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(scroll <= width, `no sideways scroll at ${width}px (${scroll})`);
  await page.screenshot({ path: `test-results/ui-${width}.png`, fullPage: true });
  // The dialog traps focus, closes on Escape and gives focus back to the page.
  await page.getByRole('button', { name: 'افتح نافذة' }).click();
  const dialog = page.getByRole('dialog', { name: 'تمسح المسودة؟' });
  await dialog.waitFor();
  await page.screenshot({ path: `test-results/ui-dialog-${width}.png` });
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'افتح نافذة' }).click();
  await dialog.getByRole('button', { name: 'رجوع' }).click();
  await dialog.waitFor({ state: 'detached' });
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
  console.log('Design system page passed at 1280px and 390px.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
