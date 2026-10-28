// Reading lessons through the real platform UI with a controlled, stateful API: home with
// Continue → study plan → lesson → goals → locked question → feedback → saved progress →
// reload resumes → skip and "I don't know" (neither reaches a goal) → completion, at 1280
// and 390px; then the "show the answers" setting walks past a question without asking.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const url = 'http://127.0.0.1:5185';
const args = ['--config', 'apps/platform/vite.config.ts', '--host', '127.0.0.1', '--port', '5185'];
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', ...args], {
  stdio: 'ignore',
});
const pins = JSON.parse(await readFile('apps/platform/content-modules.json', 'utf8'));
const { curricula } = JSON.parse(await readFile('content/imported/registry.json', 'utf8'));
const course = curricula[0];
const first = course.lessons[0];

function api(store) {
  const summary = (lesson) => {
    const saved = store.get(lesson.id);
    if (!saved) return undefined;
    const real = saved.state.attempts.filter((a) => a.written.trim());
    const answered = new Set(real.map((a) => a.questionId));
    const goals = lesson.goals ?? [];
    return {
      status: saved.completed ? 'completed' : 'started',
      goalsDone: goals.filter((g) => g.questionIds.every((q) => answered.has(q))).length,
      goalsTotal: goals.length,
      updatedAt: saved.at,
    };
  };
  return async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const progress = /^\/api\/lessons\/([^/]+)\/progress$/.exec(path);
    const id = decodeURIComponent(path.split('/').pop());
    let body = null;
    if (path === '/api/me') body = { user: { id: 'u', name: 'طالب', email: 's@example.com' } };
    else if (path === '/api/catalog') {
      const lessons = course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        subtitle: l.subtitle,
        position: l.order,
        availability: l.moduleId ? 'published' : 'coming-soon',
        progress: summary(l),
      }));
      const touched = lessons.filter((l) => l.progress);
      body = {
        curricula: [{ ...course, lessons }],
        resume: touched.length
          ? { curriculumId: course.id, lessonId: touched[0].id, kind: 'continue' }
          : null,
      };
    } else if (progress && request.method() === 'GET') {
      const saved = store.get(decodeURIComponent(progress[1]));
      body = {
        contentRevision: pins[`reading:${progress[1]}`].contentRevision,
        revision: saved?.revision ?? null,
        state: saved?.state ?? null,
        completed: saved?.completed ?? false,
      };
    } else if (progress && request.method() === 'PUT') {
      const input = request.postDataJSON();
      const key = decodeURIComponent(progress[1]);
      const saved = store.get(key);
      if ((saved?.revision ?? null) !== input.revision) body = { error: 'conflict' };
      else {
        const next = {
          revision: (saved?.revision ?? -1) + 1,
          state: input.state,
          completed: Boolean(saved?.completed || input.complete),
          at: new Date().toISOString(),
        };
        store.set(key, next);
        body = next;
      }
    } else if (pins[`reading:${id}`] && path.startsWith('/api/lessons/'))
      body = { ...pins[`reading:${id}`], moduleId: `reading:${id}`, stage: 'published' };
    await route.fulfill({
      status: body ? (body.error ? 409 : 200) : 404,
      json: body ?? { error: 'غير موجود' },
    });
  };
}
const next = (page) => page.locator('.rl-dock .rl-next').click();
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
    const store = new Map();
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'no-preference',
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/api/**', api(store));
    await page.goto(url);
    await page.locator('.pick', { hasText: first.title }).waitFor();
    await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
    await page.goto(`${url}/?curriculum=${course.id}`);
    await page.locator('.plan-part').first().waitFor();
    await page.screenshot({ path: `test-results/plan-${width}.png`, fullPage: true });
    await page.locator('.plan-lessons a', { hasText: 'ابدأ' }).first().click();
    await page.locator('.rl').waitFor();
    // A normal-motion Next must reach the current cue with its caption, not wait 8.4s.
    const firstTarget = Number(await page.locator('.rl-board').getAttribute('data-target-ms'));
    await next(page);
    await page.waitForFunction(
      (target) =>
        Number(document.querySelector('.rl-board')?.getAttribute('data-target-ms')) > target,
      firstTarget,
    );
    await page.waitForFunction(
      () => {
        const board = document.querySelector('.rl-board');
        return (
          (Number(board?.getAttribute('data-frame')) * 1000) / 30 >=
          Number(board?.getAttribute('data-target-ms')) - 1600
        );
      },
      null,
      { timeout: 500 },
    );
    await page.waitForFunction(
      () => {
        const board = document.querySelector('.rl-board');
        return (
          Math.abs(
            (Number(board?.getAttribute('data-frame')) * 1000) / 30 -
              Number(board?.getAttribute('data-target-ms')),
          ) < 34
        );
      },
      null,
      { timeout: 700 },
    );
    // Interrupt an unfinished transition with another Next, then Back; abandoned frames
    // may never restore an older cue or leave a future answer visible.
    await next(page);
    await page.getByRole('button', { name: 'الخطوة اللي فاتت' }).click();
    const heldTarget = Number(await page.locator('.rl-board').getAttribute('data-target-ms'));
    await page.waitForTimeout(450);
    assert.equal(
      Number(await page.locator('.rl-board').getAttribute('data-target-ms')),
      heldTarget,
    );
    assert.ok(
      Math.abs(
        (Number(await page.locator('.rl-board').getAttribute('data-frame')) * 1000) / 30 -
          heldTarget,
      ) < 34,
    );
    await page.getByRole('button', { name: /أهداف الدرس: 0 من/ }).click();
    await page.locator('.rl-pop').waitFor();
    await page.keyboard.press('Escape');
    // The learner can hide the line under the board and bring it back.
    await page.getByRole('button', { name: 'إخفاء النص' }).click();
    await page.locator('.rl-caption-zone').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'إظهار النص' }).click();
    await page.locator('.rl-caption-text').waitFor();
    await page.screenshot({ path: `test-results/reading-${width}.png`, fullPage: true });
    while (!(await page.locator('.rl-question').count())) await next(page);
    assert.equal(
      await page.locator('.rl-tag', { hasText: 'الإجابة النموذجية' }).count(),
      0,
      'no answer before attempt',
    );
    await page.getByLabel('إجابتك').fill('7/12');
    await page.getByRole('button', { name: 'ابعت' }).click();
    await page.locator('.rl-tag', { hasText: 'الإجابة النموذجية' }).waitFor();
    await page.getByRole('button', { name: /أهداف الدرس: 1 من/ }).waitFor();
    await page.locator('.reading-save', { hasText: 'اتحفظ' }).waitFor();
    const where = await page.locator('.rl-titles strong').innerText();
    await page.reload();
    await page.locator('.rl').waitFor();
    assert.equal(await page.locator('.rl-titles strong').innerText(), where, 'resumed in place');
    await page.getByRole('button', { name: /أهداف الدرس: 1 من/ }).waitFor();
    await page.screenshot({ path: `test-results/reading-feedback-${width}.png`, fullPage: true });
    let skipped = false;
    for (let guard = 0; guard < 300 && !(await page.locator('.rl-complete').count()); guard++) {
      if (!(await page.locator('.rl-question').count())) await next(page);
      else if (skipped) await page.getByRole('button', { name: 'معرفتش، وريني الحل' }).click();
      else {
        // Skip: on to the next scene, no model answer, no goal.
        const scene = await page.locator('.rl-titles strong').innerText();
        await page.getByRole('button', { name: 'فوّت', exact: true }).click();
        await page.waitForFunction(
          (title) => document.querySelector('.rl-titles strong')?.textContent !== title,
          scene,
        );
        assert.equal(await page.locator('.rl-tag', { hasText: 'الإجابة النموذجية' }).count(), 0);
        await page.getByRole('button', { name: /أهداف الدرس: 1 من/ }).waitFor();
        skipped = true;
      }
    }
    await page.locator('.rl-complete', { hasText: 'خلّصت الدرس' }).waitFor();
    // Only the one real answer counts: not the skip, not "I don't know".
    assert.match(await page.locator('.rl-complete-sub').innerText(), /جاوبت 1 من/);
    await page.locator('.reading-save', { hasText: 'اتحفظ' }).waitFor();
    assert.equal(store.get(first.id).completed, true);
    await page.goto(`${url}/?curriculum=${course.id}`);
    await page.locator('.plan-lessons li[data-done]').first().waitFor();
    assert.deepEqual(errors, []);
    await page.close();
  }
  // "Show the answers": the question is shown, Next goes on to its model answer, nothing saved.
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const shown = new Map();
  await page.route(`${url}/api/**`, api(shown));
  await page.addInitScript(() =>
    localStorage.setItem('learn.lesson.flow', JSON.stringify({ questions: 'show' })),
  );
  await page.goto(`${url}/?lesson=${first.id}&curriculum=${course.id}`);
  await page.locator('.rl').waitFor();
  for (let guard = 0; guard < 80; guard++) {
    if (await page.locator('.rl-tag', { hasText: 'الإجابة النموذجية' }).count()) break;
    assert.equal(await page.locator('.rl-question').count(), 0, 'never asked');
    await next(page);
  }
  await page.locator('.rl-tag', { hasText: 'الإجابة النموذجية' }).waitFor();
  assert.equal(await page.locator('.rl-yours').count(), 0, 'no "your answer" line');
  await page.close();
  console.log(
    'Reading: continue, plan, goals, locked question, saved + resumed, skip and "I don\'t know" (no goal), completion, show-the-answers passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
