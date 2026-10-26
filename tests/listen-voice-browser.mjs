// Listen mode with a real voice in the microphone (a synthetic English speech clip, looped):
// the Silero voice detector opens a learner turn for speech; a transcript that is not real
// words ("¿Qué?") gets the tutor's reply dropped unheard; two in a row switch on noisy-place
// mode with one spoken notice; then speech alone opens nothing until the wake word is heard,
// and real words reach the tutor, whose verdict leads to the scripted feedback.
// API and Live socket are mocked; the voice detector and microphone pipeline are real.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:5193';
const args = ['--config', 'apps/platform/vite.config.ts', '--host', '127.0.0.1', '--port', '5193'];
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
const why = lessons[0].scenes[0];
const pcm = (seconds) => Buffer.alloc(Math.round(24000 * 2 * seconds)).toString('base64');
const NOTICE_START = 'شكل المكان عندك فيه دوشة';
const UNHEARD = 'مش سامعك كويس';

let browser;
try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    if (i > 150) throw new Error('Preview unavailable');
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-audio-capture=${resolve('tests/fixtures/speech-en.wav')}`,
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 860 },
    permissions: ['microphone'],
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**', (r) =>
    r.fulfill({ contentType: 'text/css', body: '' }),
  );
  let wake = false;
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/me')
      return route.fulfill({ json: { user: { id: 'u', name: 'أحمد', email: 's@e.com' } } });
    if (path === `/api/listen/${course.id}`) return route.fulfill({ json: outline });
    if (path === '/api/listen/live')
      return route.fulfill({
        json: {
          token: 't',
          model: 'm',
          config: {},
          script: { lines: why.lines, ask: why.check.ask, feedback: why.check.feedback },
        },
      });
    if (path === '/api/listen/wake') return route.fulfill({ json: { wake } });
    return route.fulfill({ status: 404, json: { error: 'missing' } });
  });
  const log = [];
  let turns = 0;
  await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (ws) => {
    const say = (value) => ws.send(JSON.stringify(value));
    const speak = (text, seconds, extra = []) => {
      say({ serverContent: { outputTranscription: { text } } });
      say({
        serverContent: {
          modelTurn: {
            parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: pcm(seconds) } }],
          },
        },
      });
      for (const value of extra) say(value);
      say({ serverContent: { turnComplete: true } });
    };
    ws.onMessage((raw) => {
      const message = JSON.parse(raw);
      if (message.setup) return say({ setupComplete: {} });
      const text = message.clientContent?.turns?.[0]?.parts?.[0]?.text ?? '';
      if (text) log.push(text);
      const read = /^READ(?: QUESTION| FEEDBACK| AGAIN)?:\n([\s\S]*)$/.exec(text);
      if (read) return speak(read[1], 0.3);
      if (message.realtimeInput?.activityStart) log.push('activityStart');
      if (!message.realtimeInput?.activityEnd) return;
      turns++;
      if (turns <= 2) {
        // Noise transcribed as Spanish; the tutor asks again (this reply must never be heard).
        say({ serverContent: { inputTranscription: { text: '¿Qué?' } } });
        return speak(`${UNHEARD}، ممكن تعيد؟`, 0.5);
      }
      say({
        serverContent: {
          inputTranscription: { text: 'machine learning learns the rules from examples' },
        },
      });
      speak('برافو، بالظبط.', 0.5, [
        { toolCall: { functionCalls: [{ id: 'c1', name: 'check_done', args: {} }] } },
      ]);
    });
  });

  await page.goto(`${url}/?listen=${course.id}`);
  await page.getByLabel('تفاصيل الميكروفون (للتجربة)').check();
  await page.getByRole('button', { name: 'ابدأ الدرس الصوتي' }).click();
  await page.locator('.listen-diag', { hasText: 'Silero VAD' }).waitFor({ timeout: 20000 });
  const until = async (check, label, ms = 60000) => {
    for (const end = Date.now() + ms; Date.now() < end; ) {
      if (check()) return;
      await page.waitForTimeout(200);
    }
    throw new Error(`Timed out: ${label}`);
  };

  // Speech opens a turn; its "¿Qué?" transcript gets the reply dropped, twice; then noisy mode.
  await until(() => turns >= 2, 'two learner turns from speech');
  await until(() => log.some((t) => t.includes(NOTICE_START)), 'noisy-place notice');
  assert.ok(await page.getByLabel(/مكان فيه دوشة/).isChecked(), 'noisy-place mode switched on');
  const screen = await page.locator('.listen-log').innerText();
  assert.ok(!screen.includes(UNHEARD), 'replies to noise were never heard or shown');
  assert.ok(screen.includes(NOTICE_START), 'the notice was heard');

  // In noisy mode, speech alone opens no turn while the wake word is not heard...
  const before = log.filter((t) => t === 'activityStart').length;
  await page.waitForTimeout(15000);
  assert.equal(
    log.filter((t) => t === 'activityStart').length,
    before,
    'no turn without the wake word',
  );
  // ...and once it is, the words reach the tutor and its verdict leads to the feedback.
  wake = true;
  await until(() => turns >= 3, 'turn after the wake word');
  await until(() => log.includes(`READ FEEDBACK:\n${why.check.feedback}`), 'scripted feedback');
  await page.locator('.listen-stage h2', { hasText: lessons[0].scenes[1].title }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'Listen voice: VAD turns, noise replies dropped, noisy mode + wake word, verdict → feedback passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
