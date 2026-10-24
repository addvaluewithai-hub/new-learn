// Listen mode (audio-only lesson with the live tutor), against a mocked API and Live socket:
// scene_done moves to the next scene (a fresh session), the talk button cuts the tutor with a
// silent "heard up to" note, the tutor's question waits indefinitely (no SILENCE, no reconnect
// after a drop), the lock-screen media session is set, and the page
// fits 390px. The microphone is a silent fake file, so spoken turns are covered by unit tests.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:5191';
const args = ['--config', 'apps/platform/vite.config.ts', '--host', '127.0.0.1', '--port', '5191'];
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', ...args], {
  stdio: 'ignore',
});
const base = 'content/listen/manhaj-almarifa';
const course = JSON.parse(await readFile(`${base}/course.json`, 'utf8'));
const lessons = await Promise.all(
  course.lessons.map(async (id) => JSON.parse(await readFile(`${base}/${id}.json`, 'utf8'))),
);
const outline = {
  ...course,
  lessons: lessons.map((l) => ({
    id: l.id,
    title: l.title,
    scenes: l.scenes.map((s) => ({ id: s.id, title: s.title, asks: Boolean(s.check) })),
  })),
};
const pcm = Buffer.alloc(24000 * 2 * 0.3).toString('base64');
const longPcm = Buffer.alloc(24000 * 2 * 4).toString('base64');
const audio = (data) => ({
  serverContent: {
    modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data } }] },
  },
});

// A silent 16 kHz WAV as the fake microphone, so nothing is mistaken for speech.
const folder = await mkdtemp(join(tmpdir(), 'listen-'));
const silence = Buffer.alloc(44 + 32000 * 3);
silence.write('RIFF', 0);
silence.writeUInt32LE(36 + 32000 * 3, 4);
silence.write('WAVEfmt ', 8);
silence.writeUInt32LE(16, 16);
silence.writeUInt16LE(1, 20);
silence.writeUInt16LE(1, 22);
silence.writeUInt32LE(16000, 24);
silence.writeUInt32LE(32000, 28);
silence.writeUInt16LE(2, 32);
silence.writeUInt16LE(16, 34);
silence.write('data', 36);
silence.writeUInt32LE(32000 * 3, 40);
await writeFile(join(folder, 'silence.wav'), silence);

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
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-audio-capture=${join(folder, 'silence.wav')}`,
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 860 },
    permissions: ['microphone'],
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const sessions = [];
  const sent = [];
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }),
  );
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/me')
      return route.fulfill({ json: { user: { id: 'u', name: 'أحمد', email: 's@e.com' } } });
    if (path === `/api/listen/${course.id}`) return route.fulfill({ json: outline });
    if (path === '/api/listen/live') {
      sessions.push(request.postDataJSON());
      return route.fulfill({ json: { token: 't', model: 'm', config: {} } });
    }
    if (path === '/api/listen/wake') return route.fulfill({ json: { wake: false } });
    return route.fulfill({ status: 404, json: { error: 'missing' } });
  });
  const sockets = [];
  await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (ws) => {
    const n = sessions.length;
    sockets[n] = ws;
    const send = (value) => ws.send(JSON.stringify(value));
    ws.onMessage((raw) => {
      const message = JSON.parse(raw);
      if (message.setup) return send({ setupComplete: {} });
      const text = message.clientContent?.turns?.[0]?.parts?.[0]?.text ?? '';
      if (message.clientContent)
        sent.push({ n, text, complete: message.clientContent.turnComplete });
      if (message.realtimeInput?.activityStart) sent.push({ n, text: 'activityStart' });
      if (text !== 'START' && text !== 'SILENCE') return;
      if (text === 'START')
        send({ serverContent: { outputTranscription: { text: 'أهلًا يا أحمد.' } } });
      // Session 1 teaches and closes its scene in one turn; session 2 talks for a while.
      if (n === 1)
        send({ toolCall: { functionCalls: [{ id: 'c1', name: 'scene_done', args: {} }] } });
      send(audio(n === 2 && text === 'START' ? longPcm : pcm));
      send({ serverContent: { turnComplete: true } });
    });
  });

  await page.goto(`${url}/?listen=${course.id}`);
  const status = page.locator('.listen-status');
  const title = () => page.locator('.listen-stage h2').innerText();
  await page.getByRole('button', { name: 'ابدأ الدرس الصوتي' }).click();
  await page.locator('.listen-log .is-tutor', { hasText: 'أهلًا يا أحمد' }).waitFor();
  assert.deepEqual(sessions[0], {
    courseId: course.id,
    lessonId: 'lesson-01',
    sceneId: 'why',
    style: sessions[0].style,
  });

  // scene_done: once its words have played, the next scene opens in a fresh session.
  await page.waitForFunction(
    () => document.querySelector('.listen-stage h2')?.textContent?.includes('أنواع'),
    null,
    { timeout: 15000 },
  );
  assert.equal(sessions[1].sceneId, 'kinds');
  const lock = await page.evaluate(() => navigator.mediaSession.metadata?.title);
  assert.equal(lock, lessons[0].scenes[1].title, 'lock-screen shows the scene');

  // Cutting in with the talk button stops the tutor and tells it (silently) what was heard;
  // saying nothing after cutting in means "carry on".
  await page.locator('.listen-stage.is-teaching').waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'عايز أتكلم' }).click();
  await page.locator('.listen-stage.is-floor').waitFor();
  const cut = sent.find((m) => m.n === 2 && m.text.startsWith('INTERRUPTED'));
  assert.ok(cut && cut.complete === false, 'interrupt note is silent context');
  await page.waitForFunction(
    () => document.querySelector('.listen-stage.is-floor') === null,
    null,
    { timeout: 15000 },
  );
  assert.ok(
    sent.some((m) => m.n === 2 && m.text === 'SILENCE'),
    'carry on after a silent cut-in',
  );

  // After the tutor asks, it waits for the answer however long it takes: no SILENCE, and a
  // dropped connection stays closed (no new session) until the learner speaks.
  await page.locator('.listen-stage.is-floor').waitFor({ timeout: 15000 });
  await page.waitForTimeout(12000);
  assert.equal(await status.innerText(), 'دورك: اتكلم');
  assert.equal(sent.filter((m) => m.n === 2 && m.text === 'SILENCE').length, 1, 'waits silently');
  const opened = sessions.length;
  await sockets[2].close();
  await page.waitForTimeout(2000);
  assert.equal(sessions.length, opened, 'no reconnect while waiting');
  assert.equal(await status.innerText(), 'دورك: اتكلم');
  assert.ok((await title()).includes('أنواع'));

  // Skipping and picking a lesson open fresh sessions at the right place.
  await page.getByRole('button', { name: 'المشهد الجاي' }).click();
  await page.waitForFunction(() =>
    document.querySelector('.listen-stage h2')?.textContent?.includes('التعريف'),
  );
  await page.getByRole('button', { name: /بنية التبرير/ }).click();
  await page.locator('.listen-where', { hasText: 'الدرس 3' }).waitFor();
  assert.deepEqual(
    { lessonId: sessions.at(-1).lessonId, sceneId: sessions.at(-1).sceneId },
    { lessonId: 'lesson-03', sceneId: 'regress' },
  );
  const saved = await page.evaluate(() => localStorage.getItem('new-learn:listen:manhaj-almarifa'));
  assert.equal(JSON.parse(saved).lessonId, 'lesson-03');

  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(width <= 390, `no sideways scroll (${width})`);
  await page.getByRole('button', { name: 'إنهاء' }).click();
  await page.getByRole('button', { name: 'ابدأ الدرس الصوتي' }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'Listen mode: scene_done, interrupt + carry on, patient wait, quiet drop, skip, lessons, 390px passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await rm(folder, { recursive: true, force: true });
}
