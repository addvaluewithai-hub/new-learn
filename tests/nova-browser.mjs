import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const origin = 'http://127.0.0.1:5184';
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
    '5184',
  ],
  { stdio: 'pipe' },
);
let logs = '';
server.stdout.on('data', (d) => (logs += d));
server.stderr.on('data', (d) => (logs += d));
const module = JSON.parse(await readFile('apps/platform/content-modules.json', 'utf8'))[
  'states-of-matter-review'
];
const manifest = JSON.parse(
  await readFile('content/chemistry/states-of-matter/data/manifest.json', 'utf8'),
);
const questions = Array.from({ length: 10 }, (_, i) => ({
  english: `Practice question ${i + 1}?`,
  arabic: 'اختار الخاصية الصحيحة.',
  options: ['First option', 'Second option', 'Third option', 'Fourth option'],
  correct: 1,
  explanation: 'ده تفسير الإجابة.',
  englishAnswer: 'Second option',
  sceneId: 'S01',
}));
async function seek(page, frame) {
  await page.getByLabel('موضع التشغيل').evaluate((node, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
      node,
      String(value),
    );
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
  }, frame);
}
let browser;
try {
  const deadline = Date.now() + 15000;
  while (true) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    if (Date.now() > deadline) throw new Error(logs);
    await new Promise((r) => setTimeout(r, 100));
  }
  await mkdir('test-results', { recursive: true });
  browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    permissions: ['microphone'],
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let delayChat = false,
    failChat = false,
    lastPosition,
    liveSetup,
    toolResult,
    voiceSocket;
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data,
      status = 200;
    if (path === '/api/me')
      data = { user: { id: 'test', name: 'مريم', email: 'review@example.com' } };
    else if (path.startsWith('/api/lessons/'))
      data = { ...module, moduleId: 'states-of-matter-review', stage: 'review' };
    else if (path === '/api/nova/chat') {
      lastPosition = route.request().postDataJSON();
      if (delayChat) await new Promise((r) => setTimeout(r, 800));
      if (failChat) {
        status = 502;
        data = { error: 'تعذّر الاتصال بمساعدة Nova.' };
      } else data = { text: 'الكثافة هي الكتلة لكل وحدة حجم. مثال صغير يوضحها.' };
    } else if (path === '/api/nova/quiz') data = { questions };
    else if (path === '/api/nova/live')
      data = {
        token: 'test-only-token',
        model: 'gemini-3.8-live',
        config: { generationConfig: { responseModalities: ['AUDIO'] } },
      };
    else {
      status = 404;
      data = { error: 'Unknown mock route' };
    }
    try {
      await route.fulfill({ status, json: data });
    } catch {}
  });
  // Controlled protocol fixtures exercise browser lifecycle, not the real provider.
  await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (socket) => {
    voiceSocket = socket;
    socket.onMessage((raw) => {
      const input = JSON.parse(String(raw));
      if (input.setup) {
        liveSetup = input.setup;
        socket.send(JSON.stringify({ setupComplete: {} }));
      }
      if (input.clientContent) {
        socket.send(
          JSON.stringify({
            serverContent: {
              outputTranscription: { text: 'أهلًا، نفهم الفكرة سوا.' },
              turnComplete: true,
            },
          }),
        );
      }
      if (input.toolResponse) toolResult = input.toolResponse;
    });
  });
  await page.goto(`${origin}/?lesson=chem-gas-states-matter`);
  await page.getByRole('button', { name: 'افتح شات نوفا' }).waitFor();
  await page.getByRole('button', { name: 'ابدأ الشرح', exact: true }).click();
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'افتح شات نوفا' }).click();
  const modal = page.getByRole('dialog');
  await modal.waitFor();
  const frame = Number(await page.getByLabel('موضع التشغيل').inputValue());
  await page.waitForTimeout(300);
  assert.equal(
    Number(await page.getByLabel('موضع التشغيل').inputValue()),
    frame,
    'opening Nova pauses exact board clock',
  );
  await modal.getByLabel('رسالتك لنوفا').fill('ما معنى الكثافة؟');
  await modal.getByRole('button', { name: 'إرسال الرسالة' }).click();
  await modal.getByText('الكثافة هي الكتلة لكل وحدة حجم.', { exact: false }).waitFor();
  assert.equal(lastPosition.sceneId, 'S01');
  assert.equal(lastPosition.frame, frame);
  assert.equal(lastPosition.contentRevision, module.contentRevision);
  assert.equal('studentName' in lastPosition, false, 'server derives student identity');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'افتح شات نوفا' }).click();
  await modal.getByText('الكثافة هي الكتلة لكل وحدة حجم.', { exact: false }).waitFor();
  delayChat = true;
  await modal.getByLabel('رسالتك لنوفا').fill('مثال؟');
  await modal.getByRole('button', { name: 'إرسال الرسالة' }).click();
  await modal.getByRole('button', { name: 'إيقاف الرد' }).click();
  await modal.getByRole('button', { name: 'إرسال الرسالة' }).waitFor();
  delayChat = false;
  failChat = true;
  await modal.getByLabel('رسالتك لنوفا').fill('سؤال آخر');
  await modal.getByRole('button', { name: 'إرسال الرسالة' }).click();
  await modal.getByRole('alert').waitFor();
  failChat = false;
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({ path: `test-results/nova-chat-${width}.png` });
  }
  await modal.getByRole('button', { name: 'صوت', exact: true }).click();
  await modal.getByRole('button', { name: 'ابدأ المكالمة' }).click();
  await modal.getByText('Nova بتسمعك', { exact: true }).waitFor();
  assert.equal(liveSetup.model, 'models/gemini-3.8-live');
  await modal.getByRole('button', { name: 'كتم الميكروفون' }).click();
  await modal.getByRole('button', { name: 'افتح الميكروفون' }).waitFor();
  await modal.getByRole('button', { name: 'توقف مؤقتًا' }).click();
  await modal.getByRole('button', { name: 'كمّل المكالمة' }).waitFor();
  await modal.getByRole('button', { name: 'كمّل المكالمة' }).click();
  await modal.getByRole('button', { name: 'إنهاء الاتصال' }).click();
  await modal.getByRole('button', { name: 'ابدأ المكالمة' }).waitFor();
  await modal.getByRole('button', { name: 'ارجع للدرس' }).click();
  // Reach real end through the public engine controls; no test-only completion hook.
  await page.getByRole('button', { name: 'المشاهد', exact: true }).click();
  await page.locator('.lesson-scenes button').last().click();
  const sceneId = await page.locator('.lesson-preview').getAttribute('data-scene');
  const last = manifest.beats.find((r) => r.id.includes(sceneId));
  const duration = Math.ceil((last.durationMs / 1000) * 30);
  await seek(page, duration - 5);
  await page.getByRole('button', { name: 'كمّل الشرح', exact: true }).click();
  await page.locator('.lesson-preview[data-mode="attempt"]').waitFor();
  await page.locator('.lesson-question input[type="radio"]').first().check();
  await page
    .locator('.lesson-question textarea')
    .fill('It is a gas because the particles have large gaps.');
  await page.getByRole('button', { name: 'اسمع التعقيب ونكمل', exact: true }).click();
  await page.locator('.lesson-preview[data-mode="feedback"]').waitFor();
  const feedback = manifest.feedback.find((r) => r.id === 'F04');
  await seek(page, Math.ceil((feedback.durationMs / 1000) * 30) - 5);
  await page.getByRole('button', { name: 'اختبار بالشات', exact: false }).waitFor();
  await page.getByRole('button', { name: 'اختبار بالشات', exact: false }).click();
  await modal.getByRole('button', { name: 'جهّز الاختبار' }).click();
  await modal.getByText('Practice question 1?', { exact: true }).waitFor();
  assert.equal(
    await modal.getByText('Second option', { exact: true }).count(),
    1,
    'answer explanation not disclosed',
  );
  for (let i = 0; i < 10; i++) {
    await modal.getByRole('button', { name: 'B Second option', exact: true }).click();
    await modal.getByText('ده تفسير الإجابة.', { exact: true }).waitFor();
    await modal
      .getByRole('button', { name: i === 9 ? 'شوف النتيجة' : 'السؤال التالي', exact: true })
      .click();
  }
  await modal.getByRole('heading', { name: '10 / 10' }).waitFor();
  await page.screenshot({ path: 'test-results/nova-practice-result.png' });
  await modal.getByRole('button', { name: 'تدريب جديد', exact: true }).click();
  await modal.getByText('Practice question 1?', { exact: true }).waitFor();
  await modal.getByRole('button', { name: 'صوت', exact: true }).click();
  await modal.getByRole('button', { name: 'ابدأ المكالمة', exact: true }).click();
  await modal.getByText('Nova بتسمعك', { exact: true }).waitFor();
  voiceSocket.send(
    JSON.stringify({
      toolCall: {
        functionCalls: [
          { id: 'answer-1', name: 'answer_question', args: { questionIndex: 0, choice: 1 } },
        ],
      },
    }),
  );
  await modal.getByText('ده تفسير الإجابة.', { exact: true }).waitFor();
  assert.equal(toolResult.functionResponses[0].response.correct, true);
  voiceSocket.send(
    JSON.stringify({
      toolCall: {
        functionCalls: [
          { id: 'duplicate', name: 'answer_question', args: { questionIndex: 0, choice: 0 } },
        ],
      },
    }),
  );
  await page.waitForTimeout(100);
  assert.ok(toolResult.functionResponses[0].response.error);
  await modal.getByRole('button', { name: 'إغلاق نوفا', exact: true }).click();

  assert.deepEqual(errors, []);
  console.log(
    'Nova: controlled browser chat/context/pause/cancel/error/reopen/responsive, microphone lifecycle and ten-question practice passed.',
  );
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  await browser?.close();
  server.kill();
}
