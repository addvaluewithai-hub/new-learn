// The real shared classroom; controlled auth/chat/live transport, no fake speech claim.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { readingLesson as lesson } from '../content/book-guided/physics-ch08/reading/package.ts';
import { verifyBookReference } from './book-reference.mjs';
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
const next = (page) => page.locator('.rl-dock .rl-next').click();
const pcm = Buffer.alloc(2400).toString('base64');
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
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      permissions: ['microphone'],
      reducedMotion: 'reduce',
    });
    const errors = [],
      progress = [],
      lives = [],
      chats = [],
      reads = [];
    let authenticated = true;
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/**', async (route) => {
      const request = route.request(),
        path = new URL(request.url()).pathname;
      if (path === '/api/me')
        return route.fulfill({
          status: authenticated ? 200 : 401,
          json: authenticated
            ? { user: { id: 'u', name: 'طالب', email: 'student@example.com' } }
            : { error: 'سجّل دخولك' },
        });
      if (path.endsWith('/progress')) {
        progress.push(path);
        return route.fulfill({ status: 500, json: { error: 'Preview must not call progress' } });
      }
      if (path === '/api/nova/chat') {
        chats.push(request.postDataJSON());
        return route.fulfill({
          json: { text: 'القوى الداخلية تقاوم تغيير المسافات بين الجسيمات.' },
        });
      }
      if (path === '/api/nova/live') {
        lives.push(request.postDataJSON());
        return route.fulfill({ json: { token: 'test-token', model: 'test-model', config: {} } });
      }
      return route.fulfill({ status: 404, json: { error: 'غير موجود' } });
    });
    await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (ws) => {
      ws.onMessage((raw) => {
        const message = JSON.parse(raw);
        if (message.setup) ws.send(JSON.stringify({ setupComplete: {} }));
        const text = message.clientContent?.turns?.[0]?.parts?.[0]?.text ?? '';
        if (text.startsWith('READ')) {
          reads.push(text);
          setTimeout(() => {
            ws.send(
              JSON.stringify({
                serverContent: {
                  modelTurn: {
                    parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: pcm } }],
                  },
                },
              }),
            );
            ws.send(JSON.stringify({ serverContent: { turnComplete: true } }));
          }, 30);
        }
      });
    });
    await page.goto(`${url}/?preview=book-ch08`);
    await page.locator('.rl').waitFor();
    assert.equal(
      await page.locator('input[type=file],.bk-source,iframe').count(),
      0,
      'no full PDF reader',
    );
    await page.getByRole('button', { name: 'إعدادات الدرس وصوت Nova' }).waitFor();
    await page.locator('.ch8-diagram img').waitFor();
    assert.ok(
      await page
        .locator('.ch8-diagram img')
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    );
    assert.equal(lives.length, 0, 'no automatic live session');
    await page.screenshot({ path: `test-results/book-classroom-${width}.png`, fullPage: true });
    await verifyBookReference(page, width);
    const seen = new Set();
    let questions = 0,
      choices = 0,
      written = 0,
      count = 0;
    while (!(await page.locator('.rl-complete').count()) && count++ < 400) {
      const id = await page.locator('.ch8-board').getAttribute('data-book-section');
      seen.add(id);
      assert.equal(
        await page.locator('.book-reference-toggle').getAttribute('data-reference-section'),
        id,
      );
      const board = page.locator('.ch8-board');
      if ((await board.getAttribute('data-source-phase')) === 'reading') {
        const text = await board
          .locator('[data-source-line][data-active="yes"]')
          .getAttribute('data-source-spoken');
        assert.ok(text);
        assert.ok(
          (await page.locator('.rl-caption-text').innerText())
            .replace(/\s+/g, ' ')
            .trim()
            .endsWith(text.replace(/\s+/g, ' ').trim()),
          'the book words being read are visible on the board',
        );
      }
      const sourceFits = await board.locator('.ch8-source-quote').evaluateAll((nodes) =>
        nodes.every((node) => {
          const footer = node.closest('.ch8-board').querySelector('footer').getBoundingClientRect();
          const box = node.getBoundingClientRect();
          return box.bottom <= footer.top + 2;
        }),
      );
      assert.ok(sourceFits, `book excerpt fits above footer at ${width}, ${id}`);

      assert.equal(await page.locator('.katex-error').count(), 0);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `no body overflow at ${width}, ${id}`,
      );
      const dock = await page.locator('.rl-dock').boundingBox();
      assert.ok(dock && dock.y + dock.height <= 901, `controls remain visible at ${width}, ${id}`);
      const clipped = await page
        .locator('.ch8-equation')
        .evaluateAll((nodes) =>
          nodes.some(
            (n) =>
              n.querySelector('.katex-html')?.getBoundingClientRect().width >
              n.getBoundingClientRect().width + 2,
          ),
        );
      assert.equal(clipped, false, `typeset math fits at ${width}, ${id}`);
      assert.ok(
        !/\\(?:frac|mathrm|Delta)|\$\$/.test(await page.locator('.rl-caption-text').innerText()),
        'no raw TeX in spoken caption',
      );
      if (await page.locator('.rl-question').count()) {
        questions++;
        assert.equal(await page.getByText('الحل بعد محاولتك', { exact: true }).count(), 0);
        if (await page.locator('.rl-choices button').count()) {
          choices++;
          assert.equal(await page.locator('.rl-choices button').count(), 4);
          await page.locator('.rl-choices button').first().click();
        } else {
          written++;
          assert.ok(await page.getByRole('button', { name: 'ابعت', exact: true }).isDisabled());
          if (written === 1) {
            await page
              .getByLabel('إجابتك', { exact: true })
              .fill('أختار قانون معامل يونج وأحدد البيانات الناقصة.');
            await page.getByRole('button', { name: 'ابعت', exact: true }).click();
          } else
            await page.getByRole('button', { name: 'معرفتش، وريني الحل', exact: true }).click();
        }
        await page.getByText('الحل بعد محاولتك', { exact: true }).waitFor();
      } else await next(page);
    }
    await page.locator('.rl-complete').waitFor();
    assert.equal(questions, 20);
    assert.equal(choices, 16);
    assert.equal(written, 4);
    assert.equal(seen.size, 29, 'all source sections reached');
    assert.deepEqual(progress, [], 'preview never loads or saves account progress');
    await page.reload();
    await page.locator('.ch8-board[data-book-section="P121-A"]').waitFor();
    if (width === 1280) {
      await page.getByLabel('اسأل Nova', { exact: true }).fill('ليه الجسم بيقاوم التشوه؟');
      await page.getByRole('button', { name: 'ابعت لـ Nova', exact: true }).click();
      await page.locator('.rl-t-note[data-role="tutor"]', { hasText: 'القوى الداخلية' }).waitFor();
      assert.equal(chats[0].lessonId, lesson.lessonId);
      assert.equal(chats[0].contentRevision, lesson.contentRevision);
      assert.equal(chats[0].sceneId, 'P121-A');
      await page.locator('.rl-thread').getByRole('button', { name: 'اقفل', exact: true }).click();
      const settings = page.getByRole('button', { name: 'إعدادات الدرس وصوت Nova' });
      await settings.click();
      await page.getByRole('combobox', { name: 'الصوت', exact: true }).selectOption('Charon');
      await page.getByRole('switch', { name: /Nova تقرا الدرس/ }).check();
      await page.keyboard.press('Escape');
      await page.locator('.rl-question').waitFor({ timeout: 60000 });
      assert.ok(reads[0].endsWith(lesson.scenes[0].steps[0].text));
      assert.ok(reads[1].endsWith(lesson.scenes[0].steps[1].text));
      assert.ok(reads.length >= 3, 'Nova reads the book-ordered explanation');
      assert.equal(
        reads.filter((r) => r.startsWith('READ QUESTION')).length,
        1,
        'question read once',
      );
      assert.ok(!reads.some((r) => r.includes('1.5 × 10⁻⁴')), 'no model answer before attempt');
      assert.ok(
        reads.every((r) => !/\\(?:frac|mathrm|Delta)|\$\$/.test(r)),
        'live narration uses readable math',
      );
      assert.equal(lives[0].lessonId, lesson.lessonId);
      assert.equal(lives[0].purpose, 'talk');
      assert.equal(lives[0].style.voice, 'Charon');
      await settings.click();
      await page.getByRole('switch', { name: /Nova تقرا الدرس/ }).uncheck();
      await page.keyboard.press('Escape');
      await page.screenshot({ path: 'test-results/book-native-question.png', fullPage: true });
    }
    authenticated = false;
    await page.reload();
    await page.locator('.auth-form').waitFor();
    assert.equal(await page.locator('.rl').count(), 0, 'normal sign-in gate');
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    'Book classroom: original UI, small/half/full/hidden scan reference, source figures, 16 MCQs, 4 exercises, math, responsive navigation, auth, Nova chat/live narration and no progress writes passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
