// Launch acceptance for every imported legacy gas-law lesson on the real student host.
// API is controlled here; live database release is verified separately after deployment.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const origin = 'http://127.0.0.1:5196';
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
    '5196',
  ],
  { stdio: 'ignore' },
);
const pins = JSON.parse(await readFile('apps/platform/content-modules.json', 'utf8'));
const registry = JSON.parse(await readFile('content/imported/registry.json', 'utf8'));
const course = registry.curricula.find((c) => c.id === 'chemistry-gas-laws');
assert.equal(course.lessons.filter((l) => l.moduleId).length, 9);
const output = 'test-results/chemistry-legacy-launch';
const report = [];
const next = (page) => page.locator('.rl-dock .rl-next').click();
const plain = (text) => text.replace(/\$/g, '').replace(/\s+/g, ' ').trim();
let browser;
try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    if (i > 150) throw new Error('Preview unavailable');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  await mkdir(output, { recursive: true });
  for (const width of [1280, 390])
    for (const lesson of course.lessons) {
      const pkg = JSON.parse(
        await readFile(`content/imported/${course.id}/${lesson.id}/reading.json`, 'utf8'),
      );
      const questionScene = pkg.scenes.find((s) => s.question);
      const question = questionScene.question;
      const saved = new Map();
      const errors = [];
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: 'no-preference',
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/api/**', async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        const id = decodeURIComponent(path.split('/').pop());
        const progress = /^\/api\/lessons\/([^/]+)\/progress$/.exec(path);
        let body;
        if (path === '/api/me')
          body = { user: { id: 'launch-test', name: 'طالب', email: 'test@example.com' } };
        else if (path === '/api/catalog')
          body = {
            curricula: [
              {
                ...course,
                lessons: course.lessons.map((l) => ({
                  ...l,
                  position: l.order,
                  availability: 'published',
                })),
              },
            ],
            resume: null,
          };
        else if (progress) {
          const key = decodeURIComponent(progress[1]);
          if (request.method() === 'PUT') {
            const input = request.postDataJSON();
            saved.set(key, {
              revision: (saved.get(key)?.revision ?? -1) + 1,
              state: input.state,
              completed: input.complete,
            });
          }
          body = { revision: null, state: null, completed: false, ...saved.get(key) };
        } else if (path.startsWith('/api/lessons/') && pins[`reading:${id}`])
          body = { ...pins[`reading:${id}`], moduleId: `reading:${id}`, stage: 'published' };
        await route.fulfill({ status: body ? 200 : 404, json: body ?? { error: 'unavailable' } });
      });
      await page.goto(`${origin}/?curriculum=${course.id}&lesson=${lesson.id}`);
      await page.locator('.rl').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await next(page);
      if (lesson.order === 1) {
        await page.waitForFunction(
          () => {
            const gas = document.querySelector('.rl-board .phase-gas');
            const liquid = document.querySelector('.rl-board .phase-liquid');
            return (
              gas &&
              liquid &&
              getComputedStyle(gas).visibility === 'hidden' &&
              getComputedStyle(liquid).visibility === 'visible'
            );
          },
          null,
          { timeout: 700 },
        );
      }
      await page.waitForTimeout(450);
      await page.screenshot({
        path: `${output}/${lesson.id}-${width}-teaching.png`,
        fullPage: true,
      });
      for (let guard = 0; guard < 120 && !(await page.locator('.rl-question').count()); guard++)
        await next(page);
      await page.locator('.rl-question').waitFor();
      await page.waitForTimeout(450);
      const board = plain(await page.locator('.rl-board').innerText());
      const overflow = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll('.rl-top, .rl-caption, .rl-dock, .rl-board-frame, .rl-answer'),
        )
          .map((element) => ({ name: element.className, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.left < -1 || rect.right > innerWidth + 1)
          .map(({ name }) => name),
      );
      assert.deepEqual(overflow, [], 'answering UI stays inside the viewport');
      assert.ok(board.includes(plain(question.english)), 'English question on actual board');
      assert.ok(board.includes(plain(question.arabic)), 'Arabic question on actual board');
      assert.ok(!board.includes(plain(question.answer.english)), 'answer hidden before attempt');
      await page.screenshot({
        path: `${output}/${lesson.id}-${width}-question.png`,
        fullPage: true,
      });
      await page.getByRole('button', { name: 'معرفتش، وريني الحل' }).click();
      await page.locator('.rl-tag', { hasText: 'الإجابة النموذجية' }).waitFor();
      await page.waitForTimeout(450);
      const feedback = plain(await page.locator('.rl-board').innerText());
      assert.ok(
        feedback.includes(plain(question.feedback.steps[0].text)),
        'feedback wording on board',
      );
      await page.screenshot({
        path: `${output}/${lesson.id}-${width}-feedback.png`,
        fullPage: true,
      });
      await page.locator('.reading-save', { hasText: 'اتحفظ' }).waitFor();
      await page.reload();
      await page.locator('.rl-tag', { hasText: 'الإجابة النموذجية' }).waitFor();
      assert.ok(saved.get(lesson.id).state.attempts.some((a) => a.questionId === question.id));
      assert.deepEqual(errors, []);
      report.push({
        lesson: lesson.id,
        width,
        teaching: 'passed',
        question: 'passed',
        feedback: 'passed',
        savedAndResumed: 'passed',
      });
      await page.close();
    }
  await writeFile(`${output}/REPORT.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(
    'Legacy gas-law launch: all 9 actual lessons, two widths, question/feedback boards, saved/resumed passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
