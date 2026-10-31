// Every language file, every kind of page (docs/i18n.md): the site for visitors, the app
// signed in, and a lesson. For each language: <html lang/dir>, the first heading in that
// language, no interface text left in another language (lesson content aside), and no
// sideways scroll on a phone. Screenshots for English and Chinese. Against a mocked API.
import assert from 'node:assert/strict';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const app = 'http://127.0.0.1:5198';
const dir = new URL('../apps/platform/src/i18n/locales/', import.meta.url);
const codes = (await readdir(dir)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
const files = Object.fromEntries(
  await Promise.all(
    codes.map(async (c) => [c, JSON.parse(await readFile(new URL(`${c}.json`, dir), 'utf8'))]),
  ),
);
const at = (messages, key) => key.split('.').reduce((node, part) => node?.[part], messages);
const rtl = (code) => ['ar', 'fa', 'he', 'ur'].includes(code.split('-')[0]);
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--config', 'apps/platform/vite.config.ts'].concat([
    '--host',
    '127.0.0.1',
    '--port',
    '5198',
    '--strictPort',
  ]),
  { stdio: 'ignore' },
);

const user = { id: 'u1', name: 'Mona', email: 'mona@example.com' };
function api(signedIn) {
  return (route) => {
    const path = new URL(route.request().url()).pathname;
    const send = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/me') return signedIn ? send({ user }) : send({ user: null }, 401);
    if (path === '/api/catalog') return send({ curricula: [], resume: null });
    if (path === '/api/authoring/courses') return send([]);
    if (path === '/api/courses') return send({ courses: [] });
    if (path === '/api/teach/courses') return send({ courses: [] });
    if (path === '/api/studio/jobs') return send({ jobs: [] });
    return send({ error: 'not here' }, 404);
  };
}

/** Visible interface text (and labels) with Arabic letters, outside content marked lang=ar. */
const leftovers = () => {
  const skip = 'script, style, select, [lang="ar"], .html-board, .rl-stage, code';
  const found = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || el.closest(skip) || !el.getClientRects().length) continue;
    if (/[؀-ۿ]/.test(node.textContent)) found.push(node.textContent.trim().slice(0, 60));
  }
  for (const el of document.body.querySelectorAll('[aria-label], [title], [placeholder], [alt]')) {
    if (el.closest(skip)) continue;
    for (const name of ['aria-label', 'title', 'placeholder', 'alt']) {
      const value = el.getAttribute(name);
      if (value && /[؀-ۿ]/.test(value)) found.push(`${name}: ${value.slice(0, 60)}`);
    }
  }
  return [...new Set(found)];
};

const PAGES = [
  { path: '/', signedIn: false, heading: 'landing.hero.title', name: 'landing' },
  { path: '/teachers', signedIn: false, heading: 'site.teachers.title', name: 'teachers' },
  { path: '/support', signedIn: false, heading: 'site.support.title', name: 'support' },
  { path: '/privacy', signedIn: false, heading: 'site.legal.privacy.title', name: 'privacy' },
  { path: '/terms', signedIn: false, heading: 'site.legal.terms.title', name: 'terms' },
  { path: '/?auth=signup', signedIn: false, name: 'signup' },
  { path: '/', signedIn: true, name: 'library' },
  { path: '/?settings', signedIn: true, name: 'settings' },
  { path: '/?studio', signedIn: true, name: 'studio' },
  { path: '/?teach', signedIn: true, name: 'teach' },
  { path: '/?preview=ui', signedIn: false, name: 'ui' },
  { path: '/?preview=demo&id=interest', signedIn: false, name: 'lesson', content: true },
];

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
  for (const code of codes) {
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ locale: 'en-US', viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      for (const item of PAGES) {
        await page.unroute('**/api/**').catch(() => {});
        await page.route('**/api/**', api(item.signedIn));
        const join = item.path.includes('?') ? '&' : '?';
        await page.goto(`${app}${item.path}${join}lang=${code}`);
        await page.locator('h1').first().waitFor({ timeout: 20000 });
        const where = `${code} ${item.name} ${width}`;
        assert.equal(await page.evaluate(() => document.documentElement.lang), code, where);
        assert.equal(
          await page.evaluate(() => document.documentElement.dir),
          rtl(code) ? 'rtl' : 'ltr',
          where,
        );
        if (item.heading)
          assert.equal(
            (await page.locator('h1').first().innerText()).trim(),
            at(files[code], item.heading),
            where,
          );
        if (!rtl(code) && !item.content)
          assert.deepEqual(await page.evaluate(leftovers), [], `${where}: text left in Arabic`);
        if (width === 390)
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            false,
            `${where}: sideways scroll`,
          );
        if (
          ['en', 'zh'].includes(code) &&
          ['landing', 'studio', 'lesson', 'settings'].includes(item.name)
        )
          await page.screenshot({ path: `test-results/i18n-${code}-${item.name}-${width}.png` });
      }
      assert.deepEqual(errors, [], `${code} ${width}`);
      await page.close();
    }
  }
  // The picker switches the page in place and the choice is remembered.
  const page = await browser.newPage({ locale: 'ar-EG', viewport: { width: 1280, height: 900 } });
  await page.route('**/api/**', api(false));
  await page.goto(`${app}/teachers`);
  await page.getByRole('heading', { name: files.ar.site.teachers.title, level: 1 }).waitFor();
  const other = codes.find((c) => c !== 'ar');
  if (other) {
    await page.locator('.site-nav select').selectOption(other);
    await page.getByRole('heading', { name: files[other].site.teachers.title, level: 1 }).waitFor();
    await page.goto(`${app}/support`);
    await page.getByRole('heading', { name: files[other].site.support.title, level: 1 }).waitFor();
  }
  await page.close();
  console.log(`Languages: ${codes.join(', ')}; ${PAGES.length} pages each at 1280 and 390 passed.`);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
