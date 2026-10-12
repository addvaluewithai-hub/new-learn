// Nova inside a reading lesson: the lesson conversation opens from the caption, a typed
// question and a held-down spoken question both land in it pinned to the current step, the
// tutor reply is marked as Nova (not curriculum), and the live socket only gets manual
// activity turns. Desktop holds Space; phones long-press the Nova button.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const url = 'http://127.0.0.1:5186';
const args = ['--config', 'apps/platform/vite.config.ts', '--host', '127.0.0.1', '--port', '5186'];
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', ...args], {
  stdio: 'ignore',
});
const pins = JSON.parse(await readFile('apps/platform/content-modules.json', 'utf8'));
const { curricula } = JSON.parse(await readFile('content/imported/registry.json', 'utf8'));
const course = curricula[0];
const lesson = course.lessons.find((l) => l.moduleId);
const pcm = Buffer.alloc(24000 * 2 * 0.2).toString('base64');
const say = (socket, content) => socket.send(JSON.stringify({ serverContent: content }));

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
  for (const width of [1280, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 860 },
      permissions: ['microphone'],
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const chats = [];
    const socket = [];
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const id = decodeURIComponent(path.split('/').pop());
      if (path === '/api/me')
        return route.fulfill({ json: { user: { id: 'u', name: 'طالب', email: 's@e.com' } } });
      if (path.endsWith('/progress'))
        return route.fulfill({
          json:
            request.method() === 'GET'
              ? { revision: null, state: null, completed: false }
              : { revision: 0 },
        });
      if (path === '/api/nova/chat') {
        chats.push(request.postDataJSON());
        return route.fulfill({ json: { text: 'لأن كل حتة لازم تبقى نفس الحجم.' } });
      }
      if (path === '/api/nova/live') {
        assert.equal(request.postDataJSON().purpose, 'talk');
        return route.fulfill({ json: { token: 't', model: 'm', config: {} } });
      }
      return route.fulfill({
        json: { ...pins[`reading:${id}`], moduleId: `reading:${id}`, stage: 'published' },
      });
    });
    await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (ws) => {
      ws.onMessage((raw) => {
        const message = JSON.parse(raw);
        const input = message.realtimeInput ?? {};
        if (message.setup) ws.send(JSON.stringify({ setupComplete: {} }));
        if (message.clientContent) socket.push(`note:${message.clientContent.turnComplete}`);
        if (input.activityStart) socket.push('start');
        if (input.activityEnd) {
          socket.push('end');
          say(ws, { inputTranscription: { text: 'يعني إيه بسط؟' } });
          say(ws, { outputTranscription: { text: 'البسط هو الرقم اللي فوق.' } });
          say(ws, {
            modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: pcm } }] },
          });
          say(ws, { turnComplete: true });
        }
      });
    });
    await page.goto(`${url}/?lesson=${lesson.id}&curriculum=${course.id}`);
    await page.locator('.rl').waitFor();
    await page.locator('.rl-dock .rl-next').click();
    const before = await page.locator('.rl-dock .rl-next').boundingBox();

    await page.getByRole('button', { name: 'المحادثة' }).click();
    const thread = page.getByRole('complementary', { name: 'محادثة الدرس' });
    await thread.waitFor();
    assert.equal(await thread.locator('.rl-t-line[aria-current]').count(), 1, 'current line');
    await page.getByRole('textbox', { name: 'اسأل Nova' }).fill('ليه نفس الحجم؟');
    await page.getByRole('textbox', { name: 'اسأل Nova' }).press('Enter');
    const reply = thread.locator('.rl-t-note[data-role="tutor"]', { hasText: 'نفس الحجم' });
    await reply.waitFor();
    assert.equal(await reply.locator('.rl-t-who').innerText(), 'Nova');
    assert.deepEqual(chats[0].messages, [{ role: 'user', text: 'ليه نفس الحجم؟' }]);
    assert.equal(chats[0].step, 1);

    if (width > 650) {
      await page.locator('.rl-thread-list').click();
      await page.keyboard.down('Space');
      await page.locator('.talk[data-state="listening"]').waitFor();
      await page.keyboard.up('Space');
    } else {
      await thread.getByRole('button', { name: 'اقفل' }).click();
      const orb = page.locator('.talk-orb');
      const box = await orb.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.locator('.talk-orb[data-state="listening"]').waitFor();
      await page.mouse.up();
    }
    await thread.locator('.rl-t-note[data-role="learner"]', { hasText: 'يعني إيه بسط' }).waitFor();
    await thread.locator('.rl-t-note[data-role="tutor"]', { hasText: 'البسط' }).waitFor();
    assert.deepEqual(socket.slice(-2), ['start', 'end'], 'manual activity only');
    assert.ok(socket.includes('note:false'), 'context is silent');
    assert.ok(!socket.includes('note:true'), 'no forced replies');
    // Opening the conversation never moves the controls.
    assert.deepEqual(await page.locator('.rl-dock .rl-next').boundingBox(), before);
    await page.keyboard.press('Escape');
    await thread.waitFor({ state: 'detached' });
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Lesson talk: thread, typed question, hold-to-talk voice, 1280/390 passed.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
