import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AnswerGate, realWords } from '../src/features/nova/handsfree/AnswerGate';
import { HandsFree, type HandsFreeHost } from '../src/features/nova/handsfree/HandsFree';
import { SpeechDetector } from '../src/features/nova/handsfree/speech';
import type { VoiceState } from '../src/features/nova/lesson/voiceTypes';
import { liveConfig } from '../server/nova/live';
import { wakeVerdict, wakeWav, wakeWordOf } from '../server/nova/wake';

(globalThis as { window?: unknown }).window ??= globalThis;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('real words: noise transcripts and lone fillers are not answers', () => {
  for (const noise of ['', '¿Qué?', '...', 'ممم']) assert.ok(!realWords(noise), noise);
  for (const words of ['كمّل', 'لأ', 'في البرمجة إحنا بنكتب القواعد', 'it learns from data'])
    assert.ok(realWords(words), words);
});

test('the gate plays a reply to real words and drops a reply to noise', async () => {
  const played: string[] = [],
    rejected: string[] = [];
  const gate = new AnswerGate({ play: (d) => played.push(d), reject: (h) => rejected.push(h) });
  gate.arm();
  gate.heardText('¿Qué?');
  gate.hold('a', 24000);
  assert.equal(gate.decide(), false);
  assert.deepEqual([played, rejected], [[], ['¿Qué?']]);
  gate.arm();
  gate.heardText('المعرفة اعتقاد صادق مبرر');
  gate.hold('b', 24000);
  await wait(650);
  assert.deepEqual(played, ['b'], 'decides on its own if the turn is still running');
});

test('speech needs half a second of voice; noise the detector rejects never starts', () => {
  const events: string[] = [];
  const speech = new SpeechDetector({
    start: (preroll) => events.push(`start:${preroll.length}`),
    chunk: () => {},
    end: () => events.push('end'),
  });
  const feed = (level: number, voice: number | null, n: number) => {
    for (let i = 0; i < n; i++) speech.feed('AAAA', level, voice);
  };
  feed(0.3, 0.05, 40); // loud running water: loud, but no voice
  feed(0.2, 0.95, 6); // a short "hm"
  feed(0.001, 0.02, 20);
  assert.deepEqual(events, []);
  feed(0.2, 0.95, 12);
  feed(0.001, 0.02, 40);
  assert.deepEqual(events, ['start:25', 'end']);
});

function harness(state: VoiceState = 'idle', answering = true) {
  const log: string[] = [];
  const voice = {
    state,
    press: () => log.push('press'),
    release: () => log.push('release'),
    stop: () => log.push('stop'),
    play: (d: string) => log.push(`play:${d}`),
    pushTurn: (c: string[]) => log.push(`push:${c.length}`),
  };
  const flags = { answering, noisy: false };
  const host: HandsFreeHost = {
    voice: () => voice,
    answering: () => flags.answering,
    answer: (text) => log.push(`answer:${text}`),
    resume: () => log.push('resume'),
    wakeWord: () => 'يا نوفا',
    noisy: () => flags.noisy,
    tooNoisy: () => log.push('noisy'),
  };
  const free = new HandsFree(host);
  const speak = (voiced: number) => {
    const samples = new Float32Array(640);
    for (let i = 0; i < voiced; i++) free.capture('AAAA', 0.3, samples); // loudness fallback
    for (let i = 0; i < 40; i++) free.capture('AAAA', 0.0001, samples);
  };
  return { free, log, voice, flags, speak };
}

test('on an unanswered question, speech is a turn and a spoken answer goes in once it is real', () => {
  const { free, log, speak } = harness();
  speak(20);
  assert.deepEqual(log.slice(0, 3), ['press', 'push:12', 'release']);
  const reply = free.reply;
  assert.ok(reply.holding, 'the reply waits for the transcript');
  reply.learner('المعرفة اعتقاد صادق مبرر');
  assert.deepEqual(free.tool('submit_answer', { answer: 'اعتقاد صادق مبرر' }), { ok: true });
  assert.ok(!log.some((l) => l.startsWith('answer:')), 'not before the words are known real');
  reply.hold('x', 24000);
  assert.equal(reply.decide(), true);
  assert.ok(log.includes('play:x') && log.includes('answer:اعتقاد صادق مبرر'));
});

test('noise on the floor gets no reply and no answer; twice switches on noisy mode', () => {
  const { free, log, speak } = harness();
  for (let i = 0; i < 2; i++) {
    speak(20);
    free.reply.learner('¿Qué?');
    free.tool('submit_answer', { answer: 'qué' });
    free.reply.hold('y', 24000);
    assert.equal(free.reply.decide(), false);
  }
  assert.ok(!log.some((l) => l.startsWith('answer:') || l === 'play:y'));
  assert.ok(log.includes('noisy'));
});

test('while Nova reads, speech is not a turn; an earbud press stops it and opens the floor', () => {
  const { free, log, voice, flags, speak } = harness('reading', false);
  speak(20);
  assert.ok(!log.includes('press'), 'only a wake-word candidate');
  free.press();
  assert.ok(log.includes('stop'));
  voice.state = 'idle';
  flags.answering = false;
  speak(20);
  assert.ok(log.includes('press') && log.includes('release'), 'the floor is open after a press');
});

test('server: wake words are plain and short; hands-free talk gets submit_answer', () => {
  assert.equal(wakeWordOf('  يا   نوفا! '), 'يا نوفا');
  assert.throws(() => wakeWordOf(''));
  assert.throws(() => wakeWordOf('x'.repeat(31)));
  assert.equal(
    Buffer.from(wakeWav(Buffer.alloc(32000).toString('base64')), 'base64').readUInt32LE(24),
    16000,
  );
  assert.equal(wakeVerdict('{"wake":true}'), true);
  assert.equal(wakeVerdict('nope'), false);
  const plain = liveConfig('x', 'talk') as { tools?: unknown };
  assert.equal(plain.tools, undefined, 'normal talk is unchanged');
  const free = liveConfig('x', 'talk', undefined, { handsFree: true, wakeWord: 'يا أستاذ' }) as {
    tools: Array<{ functionDeclarations: Array<{ name: string }> }>;
    systemInstruction: { parts: Array<{ text: string }> };
  };
  assert.equal(free.tools[0].functionDeclarations[0].name, 'submit_answer');
  const text = free.systemInstruction.parts[0].text;
  assert.ok(text.includes('HANDS-FREE') && text.includes('يا أستاذ'));
});
