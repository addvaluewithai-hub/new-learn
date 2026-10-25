// Scripted listen mode against a mocked API and Live socket: the app reads each script line
// through the tutor and plays only readings whose transcript matches (a drifted line is read
// again and the drift is never heard), then the question, then waits as long as it takes.
// The tutor's tools work (get_lesson fetches another lesson; check_done leads to the scripted
// feedback and the next scene). Cutting in records the line being heard and re-reads it after
// silence; a drop while waiting stays closed. The mic is a silent fake file, so spoken turns
// are covered by unit tests.
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
const pcm = (seconds) => Buffer.alloc(Math.round(24000 * 2 * seconds)).toString('base64');
const scriptOf = ({ lessonId, sceneId }) => {
  const scene = lessons.find((l) => l.id === lessonId).scenes.find((s) => s.id === sceneId);
  return { lines: scene.lines, ask: scene.check?.ask, feedback: scene.check?.feedback };
};
const DRIFT = 'كلام مختلف خالص عن اللي مكتوب في السكريبت ده';
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
  const tools = [];
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/me')
      return route.fulfill({ json: { user: { id: 'u', name: 'أحمد', email: 's@e.com' } } });
    if (path === `/api/listen/${course.id}`) return route.fulfill({ json: outline });
    if (path === `/api/listen/${course.id}/lessons/2`)
      return route.fulfill({ json: { title: lessons[1].title, scenes: [] } });
    if (path === '/api/listen/live') {
      const position = request.postDataJSON();
      sessions.push(position);
      return route.fulfill({
        json: { token: 't', model: 'm', config: {}, script: scriptOf(position) },
      });
    }
    if (path === '/api/listen/wake') return route.fulfill({ json: { wake: false } });
    return route.fulfill({ status: 404, json: { error: 'missing' } });
  });
  const sockets = [];
  const say = (ws, value) => ws.send(JSON.stringify(value));
  const speak = (ws, text, seconds) => {
    say(ws, { serverContent: { outputTranscription: { text } } });
    say(ws, {
      serverContent: {
        modelTurn: {
          parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: pcm(seconds) } }],
        },
      },
    });
  };
  await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (ws) => {
    const n = sessions.length;
    sockets[n] = ws;
    let drifted = false;
    ws.onMessage((raw) => {
      const message = JSON.parse(raw);
      if (message.setup) return say(ws, { setupComplete: {} });
      if (message.toolResponse) tools.push(...message.toolResponse.functionResponses);
      const text = message.clientContent?.turns?.[0]?.parts?.[0]?.text ?? '';
      if (message.clientContent)
        sent.push({ n, text, complete: message.clientContent.turnComplete });
      const read = /^READ(?: QUESTION| FEEDBACK| AGAIN)?:\n([\s\S]*)$/.exec(text);
      if (!read) return;
      // Session 1 drifts once on its second line; session 2 reads slowly (to cut into it).
      const second = n === 1 && read[1] === lessons[0].scenes[0].lines[1] && !drifted;
      if (second) drifted = true;
      speak(ws, second ? DRIFT : read[1], n === 2 ? 2 : 0.3);
      say(ws, { serverContent: { turnComplete: true } });
    });
  });
  const reads = (n) => sent.filter((m) => m.n === n && m.text.startsWith('READ'));
  const why = lessons[0].scenes[0];

  await page.goto(`${url}/?listen=${course.id}`);
  const status = page.locator('.listen-status');
  const title = () => page.locator('.listen-stage h2').innerText();
  await page.getByRole('button', { name: 'ابدأ الدرس الصوتي' }).click();

  // The script is read line by line, then the question; then the learner has the floor.
  await page.locator('.listen-stage.is-floor').waitFor({ timeout: 20000 });
  assert.deepEqual(sessions[0], {
    courseId: course.id,
    lessonId: 'lesson-01',
    sceneId: 'why',
    style: sessions[0].style,
  });
  assert.deepEqual(
    reads(1).map((m) => m.text),
    [
      `READ:\n${why.lines[0]}`,
      `READ:\n${why.lines[1]}`,
      `READ AGAIN:\n${why.lines[1]}`,
      ...why.lines.slice(2).map((line) => `READ:\n${line}`),
      `READ QUESTION:\n${why.check.ask}`,
    ],
  );
  const log = await page.locator('.listen-log').innerText();
  assert.ok(
    log.includes(why.lines[1]) && !log.includes(DRIFT),
    'only the checked reading is heard',
  );
  assert.ok(reads(1).every((m) => m.complete === true));

  // It waits: nothing more is read while the learner hasn't answered.
  await page.waitForTimeout(3000);
  assert.equal(reads(1).length, why.lines.length + 2);
  assert.equal(await status.innerText(), 'دورك: اتكلم');

  // The tutor can pull another lesson's script to answer a question about it.
  say(sockets[1], {
    toolCall: { functionCalls: [{ id: 'g1', name: 'get_lesson', args: { lessonNumber: 2 } }] },
  });
  for (let i = 0; i < 50 && !tools.length; i++) await page.waitForTimeout(100);
  assert.deepEqual(tools[0], {
    id: 'g1',
    name: 'get_lesson',
    response: { title: lessons[1].title, scenes: [] },
  });

  // Verdict in its own words, then check_done: the scripted feedback is read, then the next scene.
  speak(sockets[1], 'برافو، بالظبط.', 0.5);
  say(sockets[1], { toolCall: { functionCalls: [{ id: 'c1', name: 'check_done', args: {} }] } });
  say(sockets[1], { serverContent: { turnComplete: true } });
  await page.waitForFunction(
    () => document.querySelector('.listen-stage h2')?.textContent?.includes('أنواع'),
    null,
    { timeout: 15000 },
  );
  assert.equal(reads(1).at(-1).text, `READ FEEDBACK:\n${why.check.feedback}`);
  assert.equal(sessions[1].sceneId, 'kinds');
  const lock = await page.evaluate(() => navigator.mediaSession.metadata?.title);
  assert.equal(lock, lessons[0].scenes[1].title, 'lock-screen shows the scene');

  // Cutting into the reading notes the line being heard; silence afterwards re-reads it.
  await page.locator('.listen-stage.is-teaching').waitFor({ timeout: 10000 });
  await page.waitForTimeout(2800);
  await page.getByRole('button', { name: 'عايز أتكلم' }).click();
  await page.locator('.listen-stage.is-floor').waitFor();
  const cut = sent.find((m) => m.n === 2 && m.text.startsWith('INTERRUPTED'));
  assert.ok(cut && cut.complete === false, 'interrupt note is silent context');
  const line = lessons[0].scenes[1].lines.find((l) => cut.text.includes(l));
  assert.ok(line, 'the note names the line being heard');
  await page.locator('.listen-stage.is-teaching').waitFor({ timeout: 15000 });
  assert.equal(
    reads(2).filter((m) => m.text === `READ:\n${line}`).length,
    2,
    're-read from that line',
  );

  // After the question it waits; a dropped connection stays closed until the learner speaks.
  await page.locator('.listen-stage.is-floor').waitFor({ timeout: 30000 });
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
    'Listen mode: scripted reading + drift guard, patient wait, get_lesson, verdict + feedback, cut-in re-read, quiet drop, skip, lessons, 390px passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await rm(folder, { recursive: true, force: true });
}
