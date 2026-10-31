// Hands-free (audio) mode in a normal reading lesson, with a real voice in the microphone (a
// synthetic English speech clip, looped) and the API and Live socket mocked. Turning it on in
// the lesson settings starts Nova reading; the session is opened in hands-free mode with the
// learner's own wake word. While Nova reads, speech is only checked against that wake word.
// On the question, speech opens a turn without any button: a transcript that is not real
// words ("¿Qué?") gets the reply dropped unheard, even the part that arrives after it was
// judged; a question back whose turnComplete arrives after its audio has played still ends
// Nova's turn, so the next answer is heard; a real spoken answer is submitted through
// the lesson's own answer flow (submit_answer → the model answer page), and Nova goes on to
// read the feedback. On the next question, "skip this one" calls lesson_control: the question
// stays unanswered (nothing saved for it) and Nova reads on from the next scene. The Silero
// voice detector and the microphone pipeline are real.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:5194';
const args = ['--config', 'apps/platform/vite.config.ts', '--host', '127.0.0.1', '--port', '5194'];
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', ...args], {
  stdio: 'ignore',
});
const pins = JSON.parse(await readFile('apps/platform/content-modules.json', 'utf8'));
const id = 'manhaj-01';
const pkg = JSON.parse(
  await readFile(`content/imported/manhaj-almarifa/${id}/reading.json`, 'utf8'),
);
const asked = pkg.scenes.find((s) => s.question);
const second = pkg.scenes.filter((s) => s.question)[1];
const afterSecond = pkg.scenes[pkg.scenes.indexOf(second) + 1].steps[0].text;
const feedbackLine = asked.question.feedback.steps[0].text;
const pcm = (seconds) => Buffer.alloc(Math.round(24000 * 2 * seconds)).toString('base64');
const UNHEARD = 'مش سامعك كويس';
const WORD = 'يا أستاذ';

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
    locale: 'ar-EG',
    viewport: { width: 390, height: 860 },
    permissions: ['microphone'],
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**', (r) =>
    r.fulfill({ contentType: 'text/css', body: '' }),
  );
  const lives = [],
    wakes = [],
    saves = [];
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/me')
      return route.fulfill({ json: { user: { id: 'u', name: 'أحمد', email: 's@e.com' } } });
    if (path.endsWith('/progress') && request.method() !== 'GET')
      saves.push(request.postDataJSON());
    if (path.endsWith('/progress'))
      return route.fulfill({
        json:
          request.method() === 'GET'
            ? { revision: null, state: null, completed: false }
            : { revision: 0 },
      });
    if (path === '/api/nova/live') {
      lives.push(request.postDataJSON());
      return route.fulfill({ json: { token: 't', model: 'm', config: {} } });
    }
    if (path === '/api/nova/wake') {
      wakes.push(request.postDataJSON().word);
      return route.fulfill({ json: { wake: false } });
    }
    return route.fulfill({
      json: { ...pins[`reading:${id}`], moduleId: `reading:${id}`, stage: 'published' },
    });
  });
  const sent = [],
    tools = [];
  let turns = 0;
  await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (ws) => {
    const say = (value) => ws.send(JSON.stringify(value));
    const audio = (seconds) =>
      say({
        serverContent: {
          modelTurn: {
            parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: pcm(seconds) } }],
          },
        },
      });
    const late = [];
    const speak = (text, seconds, extra = []) => {
      if (text) say({ serverContent: { outputTranscription: { text } } });
      if (seconds) audio(seconds);
      for (const value of extra) say(value);
      if (extra === late) setTimeout(() => say({ serverContent: { turnComplete: true } }), 2500);
      else say({ serverContent: { turnComplete: true } });
    };
    ws.onMessage((raw) => {
      const message = JSON.parse(raw);
      if (message.setup) return say({ setupComplete: {} });
      if (message.toolResponse) tools.push(...message.toolResponse.functionResponses);
      const text = message.clientContent?.turns?.[0]?.parts?.[0]?.text ?? '';
      if (text) sent.push(text);
      const read = /^READ(?: QUESTION)?:\n([\s\S]*)$/.exec(text);
      if (read && message.clientContent.turnComplete)
        return speak(read[1], text.startsWith('READ QUESTION') ? 0.3 : 1.5);
      if (!message.realtimeInput?.activityEnd) return;
      turns++;
      if (turns === 1) {
        // Noise transcribed as Spanish; the tutor asks again (this reply must never be heard).
        // Its first audio is judged (and dropped) before the rest of the reply arrives.
        say({ serverContent: { inputTranscription: { text: '¿Qué?' } } });
        audio(0.3);
        return setTimeout(() => speak(`${UNHEARD}، ممكن تعيد؟`, 0.5), 1200);
      }
      if (turns === 2) {
        // A question back to Nova on a slow network: the reply has played out before its
        // turnComplete arrives. Nova must still end its turn and hear the next answer.
        say({ serverContent: { inputTranscription: { text: 'I forgot, can you remind me' } } });
        speak('', 0.4, late);
        return;
      }
      if (turns === 4) {
        say({ serverContent: { inputTranscription: { text: 'skip this one please' } } });
        const skip = { id: 's1', name: 'lesson_control', args: { action: 'skip_question' } };
        return speak('تمام', 0.2, [{ toolCall: { functionCalls: [skip] } }]);
      }
      if (turns > 4) return speak('', 0);
      say({ serverContent: { inputTranscription: { text: 'it asks how we know things' } } });
      const call = { id: 'a1', name: 'submit_answer', args: { answer: 'بتسأل إزاي بنعرف' } };
      speak('', 0, [{ toolCall: { functionCalls: [call] } }]);
    });
  });
  const until = async (check, label, ms = 60000) => {
    for (const end = Date.now() + ms; Date.now() < end; ) {
      if (check()) return;
      await page.waitForTimeout(200);
    }
    throw new Error(`Timed out: ${label}`);
  };

  await page.goto(`${url}/?lesson=${id}&curriculum=manhaj-almarifa`);
  await page.locator('.rl').waitFor();
  await page.getByRole('button', { name: 'إعدادات الدرس وصوت Nova' }).first().click();
  await page.getByRole('switch', { name: /وضع الاستماع/ }).check();
  await page.getByRole('textbox', { name: /كلمة النداء/ }).fill(WORD);
  await page.keyboard.press('Escape');

  // Nova reads; the session is in hands-free mode; speech meanwhile is only a wake candidate.
  await until(() => sent.some((t) => t.startsWith('READ QUESTION')), 'Nova reads to the question');
  assert.ok(
    lives.some((l) => l.purpose === 'talk' && l.handsFree === true),
    'hands-free session',
  );
  await until(() => wakes.includes(WORD), 'wake check with the learner word');
  assert.equal(turns, 0, 'no turn while Nova reads');
  const lock = await page.evaluate(() => navigator.mediaSession.metadata?.title);
  assert.equal(lock, pkg.title, 'lock-screen shows the lesson');

  // On the question: speech is a turn. Noise gets no reply; a question back gets a reply
  // whose end arrives late; then a real answer is submitted.
  await until(() => turns >= 3, 'three spoken turns on the question');
  await until(() => tools.some((t) => t.name === 'submit_answer'), 'submit_answer result');
  assert.deepEqual(tools.find((t) => t.name === 'submit_answer').response, { ok: true });
  await until(() => sent.some((t) => t.includes(feedbackLine)), 'Nova reads the model answer');

  // The next question: "skip this one" → lesson_control → on to the next scene, unanswered.
  await until(
    () => sent.some((t) => t.startsWith('READ QUESTION') && t.includes(second.question.arabic)),
    'the second question',
  );
  await until(() => tools.some((t) => t.name === 'lesson_control'), 'lesson_control result');
  assert.deepEqual(tools.find((t) => t.name === 'lesson_control').response, { ok: true });
  await until(() => sent.some((t) => t.includes(afterSecond)), 'Nova reads on after the skip');
  const last = saves.at(-1).state;
  assert.ok(!last.attempts.some((a) => a.questionId === second.question.id), 'nothing saved');
  const thread = await page.locator('.rl').innerText();
  assert.ok(!thread.includes(UNHEARD), 'the reply to noise was never shown');
  assert.deepEqual(errors, []);
  console.log(
    'Hands-free: settings, wake word, reading, noise dropped, spoken answer → feedback, spoken skip passed.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
