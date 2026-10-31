// Published catalog → chapter 8 → saved attempt/reload → completion → chapter 9.
// The API fixture is stateful; tools/book-live-check.mjs verifies the real API + database.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { bookCourse } from '../content/book-guided/published.ts';
import { bookReadingPackages } from '../content/book-guided/packages.ts';
import { verifyBookReference } from './book-reference.mjs';
const url = 'http://127.0.0.1:5194';
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
    '5194',
  ],
  { stdio: 'ignore' },
);
const course = bookCourse;
const packages = new Map(
  await Promise.all(
    course.lessons.map(async (l) => [l.id, (await bookReadingPackages[l.moduleId]()).default]),
  ),
);
const next = (page) => page.locator('.rl-dock .rl-next').click();
let browser;
try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    if (i > 150) throw new Error('Preview unavailable');
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({ headless: true });
  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390]) {
    const store = new Map(),
      errors = [];
    const page = await browser.newPage({
      locale: 'ar-EG',
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/api/**', async (route) => {
      const request = route.request(),
        path = new URL(request.url()).pathname;
      if (path === '/api/me')
        return route.fulfill({
          json: { user: { id: 'book-test', name: 'طالب', email: 'student@example.com' } },
        });
      if (path === '/api/catalog') {
        const lessons = course.lessons.map((l) => ({
          ...l,
          position: l.order,
          availability: 'published',
          progress: store.has(l.id)
            ? {
                status: store.get(l.id).completed ? 'completed' : 'started',
                goalsDone: 0,
                goalsTotal: l.goals.length,
                updatedAt: new Date().toISOString(),
              }
            : undefined,
        }));
        return route.fulfill({ json: { curricula: [{ ...course, lessons }], resume: null } });
      }
      const match = /^\/api\/lessons\/([^/]+)(\/progress)?$/.exec(path);
      const lesson = course.lessons.find((l) => l.id === match?.[1]);
      if (!lesson) return route.fulfill({ status: 404, json: { error: 'الدرس لسه مش متاح.' } });
      if (!match[2])
        return route.fulfill({ json: { ...lesson, lessonId: lesson.id, stage: 'published' } });
      if (request.method() === 'PUT') {
        const input = request.postDataJSON(),
          saved = store.get(lesson.id);
        assert.equal(input.contentRevision, lesson.contentRevision);
        assert.equal(input.revision, saved?.revision ?? null);
        store.set(lesson.id, {
          contentRevision: lesson.contentRevision,
          revision: (saved?.revision ?? -1) + 1,
          state: input.state,
          completed: Boolean(saved?.completed || input.complete),
        });
      }
      return route.fulfill({
        json: store.get(lesson.id) ?? {
          contentRevision: lesson.contentRevision,
          revision: null,
          state: null,
          completed: false,
        },
      });
    });
    await page.goto(url);
    const planHref = `/?curriculum=${course.id}`;
    await page.locator(`a[href="${planHref}"]`).first().click();
    await page.locator('.plan-lessons > li').first().waitFor();
    assert.equal(await page.locator('.plan-lessons > li').count(), 2);
    const [first, second] = course.lessons;
    await page.getByRole('link', { name: `ابدأ: ${first.title}`, exact: true }).click();
    await page.locator('.ch8-board[data-book-section="P121-A"]').waitFor();
    assert.equal(await page.getByLabel('معاينة، التقدم في الجلسة فقط').count(), 0);
    await verifyBookReference(page, width);
    for (let guard = 0; !(await page.locator('.rl-question').count()); guard++) {
      assert.ok(guard < 50);
      await next(page);
    }
    assert.equal(await page.getByText('الحل بعد محاولتك', { exact: true }).count(), 0);
    await page.locator('.rl-choices button').first().click();
    await page.getByText('الحل بعد محاولتك', { exact: true }).waitFor();
    await page.locator('.reading-save[data-state="saved"]').waitFor();
    assert.equal(store.get(first.id).state.attempts.length, 1);
    const savedCaption = await page.locator('.rl-caption-text').innerText();
    await page.reload();
    await page.getByText('الحل بعد محاولتك', { exact: true }).waitFor();
    assert.equal(await page.locator('.rl-caption-text').innerText(), savedCaption);
    await page.screenshot({
      path: `test-results/book-published-feedback-${width}.png`,
      fullPage: true,
    });
    // Resume immediately before completion to check the real next-chapter link.
    const last = packages.get(first.id).scenes.at(-1);
    store.get(first.id).state = {
      ...store.get(first.id).state,
      sceneId: last.id,
      phase: 'narration',
      step: last.steps.length - 1,
    };
    await page.reload();
    await page.locator('.rl').waitFor();
    await next(page);
    await page.locator('.rl-complete').waitFor();
    await page.locator('.reading-save[data-state="saved"]').waitFor();
    assert.equal(store.get(first.id).completed, true);
    await page.getByRole('link', { name: `الدرس الجاي: ${second.title}` }).click();
    await page.locator('.ch8-board[data-book-section="P134-A"]').waitFor();
    await next(page);
    await page.locator('.reading-save[data-state="saved"]').waitFor();
    assert.equal(store.get(second.id).state.step, 1);
    await page.reload();
    await page.locator('.rl').waitFor();
    assert.ok(
      (await page.locator('.rl-caption-text').innerText()).includes(
        packages.get(second.id).scenes[0].steps[1].text,
      ),
    );
    await page.goto(`${url}${planHref}`);
    await page.locator('.plan-lessons li[data-done="true"]').waitFor();
    assert.equal(await page.locator('.plan-lessons li[data-done="true"]').count(), 1);
    await page.getByRole('link', { name: `كمّل: ${second.title}`, exact: true }).waitFor();
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    'Published book physics: one course, chapter order, original board/reference, attempts/save/reload, completion and next chapter passed at 1280/390px.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
