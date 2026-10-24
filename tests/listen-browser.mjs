// Listen mode (audio-only lesson with the live tutor), against a mocked API and Live socket:
// the tutor teaches a scene, its turn ending gives the learner the floor, silence is reported
// as SILENCE, scene_done moves to the next scene (a fresh session), the talk button cuts the
// tutor with a silent "heard up to" note, the lock-screen media session is set, and the page
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
  await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (ws) => {
    const n = sessions.length;
    ws.onMessage((raw) => {
      const message = JSON.parse(raw);
      if (message.setup) return ws.send(JSON.stringify({ setupComplete: {} }));
      const text = message.clientContent?.turns?.[0]?.parts?.[0]?.text ?? '';
      if (message.clientContent)
        sent.push({ n, text, complete: message.clientContent.turnComplete });
      if (message.realtimeInput?.activityStart) sent.push({ n, text: 'activityStart' });
      if (text === 'START') {
        ws.send(
          JSON.stringify({ serverContent: { outputTranscription: { text: 'أهلًا يا أحمد.' } } }),
        );
        ws.send(JSON.stringify(audio(n === 2 ? longPcm : pcm)));
        ws.send(JSON.stringify({ serverContent: { turnComplete: true } }));
      }
      if (text === 'SILENCE') {
        ws.send(
          JSON.stringify({
            toolCall: { functionCalls: [{ id: 'c1', name: 'scene_done', args: {} }] },
          }),
        );
        ws.send(JSON.stringify(audio(pcm)));
        ws.send(JSON.stringify({ serverContent: { turnComplete: true } }));
      }
    });
  });

  await page.goto(`${url}/?listen=${course.id}`);
  const status = page.locator('.listen-status');
  await page.getByRole('button', { name: 'ابدأ الدرس الصوتي' }).click();
  await page.locator('.listen-log .is-tutor', { hasText: 'أهلًا يا أحمد' }).waitFor();
  await page.locator('.listen-stage.is-floor').waitFor({ timeout: 10000 });
  assert.equal(await status.innerText(), 'دورك: اتكلم');
  assert.deepEqual(sessions[0], {
    courseId: course.id,
    lessonId: 'lesson-01',
    sceneId: 'why',
    style: sessions[0].style,
  });
  const title = await page.evaluate(() => navigator.mediaSession.metadata?.title);
  assert.equal(title, lessons[0].scenes[0].title, 'lock-screen shows the scene');

  // Nobody speaks: the tutor hears SILENCE, closes the scene, and the next session opens.
  await page.waitForFunction(
    () => document.querySelector('.listen-stage h2')?.textContent?.includes('الفرق'),
    null,
    { timeout: 20000 },
  );
  assert.ok(sent.some((m) => m.n === 1 && m.text === 'SILENCE'));
  assert.equal(sessions[1].sceneId, 'belief-vs-knowledge');

  // Talking over the tutor cuts it and tells it (silently) what was heard.
  await page.locator('.listen-stage.is-teaching').waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'عايز أتكلم' }).click();
  await page.locator('.listen-stage.is-floor').waitFor();
  const cut = sent.find((m) => m.n === 2 && m.text.startsWith('INTERRUPTED'));
  assert.ok(cut && cut.complete === false, 'interrupt note is silent context');

  // Skipping and picking a lesson open fresh sessions at the right place.
  await page.getByRole('button', { name: 'المشهد الجاي' }).click();
  await page.waitForFunction(() =>
    document.querySelector('.listen-stage h2')?.textContent?.includes('المعلومة'),
  );
  await page.getByRole('button', { name: /درجات الإدراك/ }).click();
  await page.locator('.listen-where', { hasText: 'الدرس 3' }).waitFor();
  assert.deepEqual(
    { lessonId: sessions.at(-1).lessonId, sceneId: sessions.at(-1).sceneId },
    { lessonId: 'lesson-03', sceneId: 'scale' },
  );
  const saved = await page.evaluate(() => localStorage.getItem('new-learn:listen:manhaj-almarifa'));
  assert.equal(JSON.parse(saved).lessonId, 'lesson-03');

  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(width <= 390, `no sideways scroll (${width})`);
  await page.getByRole('button', { name: 'إنهاء' }).click();
  await page.getByRole('button', { name: 'ابدأ الدرس الصوتي' }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'Listen mode: teach, floor, SILENCE, scene_done, interrupt, skip, lessons, 390px passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await rm(folder, { recursive: true, force: true });
}
