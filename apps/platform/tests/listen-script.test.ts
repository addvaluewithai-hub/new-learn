import assert from 'node:assert/strict';
import { test } from 'node:test';
import { matchScript, normalize } from '../src/features/listen/scriptMatch';
import { ScriptReader, scriptItems } from '../src/features/listen/ScriptReader';
import { AnswerGate, realWords } from '../src/features/listen/AnswerGate';

(globalThis as { window?: unknown }).window ??= globalThis;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const line = 'المعرفة الكلاسيكية: اعتقاد صادق مبرَّر، Justified True Belief.';

test('transcript matching tolerates spelling and punctuation, not rewording or additions', () => {
  assert.deepEqual(normalize('أهلًا، يا أحمد!'), ['اهلا', 'يا', 'احمد']);
  assert.ok(matchScript('المعرفه الكلاسيكيه اعتقاد صادق مبرر justified true belief', line).ok);
  assert.ok(matchScript('المعرفة الكلاسيكية اعتقاد صادق مبرر جاستيفايد ترو بيليف', line).ok);
  assert.ok(!matchScript('يعني باختصار المعرفة حاجة إنت مصدقها', line).ok, 'reworded');
  const padded = `تمام يا صاحبي خلينا نشوف مع بعض الجملة الجاية كويس قوي ${line} فاهم كده؟ تمام؟`;
  assert.ok(!matchScript(padded, line).ok, 'added words');
  assert.ok(!matchScript('المعرفة', line).ok, 'cut short');
});

test('scene items are the lines then the question; feedback is its own job', () => {
  const script = { lines: ['أ', 'ب'], ask: 'سؤال؟', feedback: 'الإجابة.' };
  assert.deepEqual(
    scriptItems(script, 'scene').map((i) => i.kind),
    ['line', 'line', 'question'],
  );
  assert.deepEqual(scriptItems(script, 'feedback'), [{ kind: 'feedback', text: 'الإجابة.' }]);
  assert.equal(scriptItems({ lines: ['أ'] }, 'scene').length, 1);
});

function reader() {
  const sent: string[] = [],
    heard: string[] = [],
    cuts: number[] = [];
  let clock = 0,
    failed = 0,
    finished = 0;
  const r = new ScriptReader({
    send: (text) => sent.push(text),
    enqueue: (data) => {
      heard.push(data);
      return 0;
    },
    now: () => clock++,
    cutFrom: (at) => cuts.push(at),
    shown: () => {},
    finished: () => finished++,
    queued: () => 0,
    failed: () => failed++,
  });
  // The tutor speaks `text` word by word, one audio chunk per word (labelled by the word).
  const speak = (text: string) => {
    for (const word of text.split(' ')) {
      r.audio(word, 24000);
      r.said(`${word} `);
    }
  };
  const done = async () => {
    r.complete();
    await wait(230);
  };
  return { r, sent, heard, cuts, speak, done, failed: () => failed, finished: () => finished };
}

const first = 'السطر الأول فيه كلام كتير شوية عن الموضوع';
const second = 'السطر التاني برضه فيه كلام كتير عن الموضوع';

test('a reading streams once its first words match, and the next is asked for at once', async () => {
  const t = reader();
  t.r.start(scriptItems({ lines: [first, second], ask: 'إيه السؤال ده يا ترى؟' }, 'scene'));
  assert.equal(t.sent.at(-1), `READ:\n${first}`);
  t.speak('السطر الأول');
  assert.equal(t.heard.length, 0, 'held until a few words match');
  t.speak('فيه كلام كتير شوية عن الموضوع');
  assert.equal(t.heard.length, first.split(' ').length, 'then it streams, nothing lost');
  await t.done();
  assert.equal(t.sent.at(-1), `READ:\n${second}`, 'next line requested right away');
  t.speak(second);
  await t.done();
  assert.equal(t.sent.at(-1), 'READ QUESTION:\nإيه السؤال ده يا ترى؟');
  t.speak('إيه السؤال ده يا ترى؟');
  await t.done();
  assert.ok(t.r.done);
  assert.equal(t.finished(), 1);
  assert.equal(t.r.drifts, 0);
});

test('a reading that drifts is never streamed, or is cut the moment it strays; then re-read held', async () => {
  const t = reader();
  t.r.start(scriptItems({ lines: [first] }, 'scene'));
  t.speak('يعني باختصار خلينا نتكلم عن حاجة تانية خالص');
  assert.equal(t.heard.length, 0, 'off-script from the start: never heard');
  await t.done();
  assert.equal(t.sent.at(-1), `READ AGAIN:\n${first}`);
  t.speak(first);
  assert.equal(t.heard.length, 0, 'a re-read is held until checked in full');
  await t.done();
  assert.equal(t.heard.length, first.split(' ').length);
  assert.equal(t.r.drifts, 1);

  const u = reader();
  u.r.start(scriptItems({ lines: [first, second] }, 'scene'));
  u.speak(first);
  u.speak('وده كلام زيادة مش في السكريبت خالص ولا ليه أي علاقة');
  assert.equal(u.cuts.length, 1, 'cut as soon as it strays');
  await u.done();
  assert.equal(u.sent.at(-1), `READ AGAIN:\n${first}`, 'and read again');
});

test('no speech twice fails; cutting in reports the line being heard', async () => {
  const one = reader();
  one.r.start(scriptItems({ lines: ['سطر'] }, 'scene'));
  await one.done();
  assert.equal(one.sent.at(-1), 'READ AGAIN:\nسطر');
  await one.done();
  assert.equal(one.failed(), 1);
  assert.ok(!one.r.active);

  const two = reader();
  two.r.start(scriptItems({ lines: ['الأول', first, 'التالت'] }, 'scene'), 1);
  assert.equal(two.sent[0], `READ:\n${first}`, 'starts from the given line');
  assert.deepEqual(two.r.playing(), { index: 1, text: first });
  two.speak(first);
  assert.deepEqual(two.r.playing(), { index: 1, text: first });
  two.r.stop();
  assert.ok(!two.r.active && !two.r.waiting);
});

test('real words: noise transcripts and lone fillers are not answers', () => {
  assert.ok(!realWords(''));
  assert.ok(!realWords('¿Qué?'));
  assert.ok(!realWords('...'));
  assert.ok(!realWords('ممم'));
  assert.ok(realWords('كمّل'));
  assert.ok(realWords('لأ'));
  assert.ok(realWords('في البرمجة إحنا بنكتب القواعد'));
  assert.ok(realWords('machine learning learns from data'));
});

test('the gate plays a reply to real words and drops a reply to noise', async () => {
  const played: string[] = [],
    rejected: string[] = [];
  const gate = new AnswerGate({ play: (d) => played.push(d), reject: (h) => rejected.push(h) });
  gate.arm();
  gate.heardText('¿Qué?');
  gate.hold('a', 24000);
  assert.equal(gate.decide(), false);
  assert.deepEqual(played, []);
  assert.deepEqual(rejected, ['¿Qué?']);
  gate.arm();
  gate.heardText('في البرمجة إحنا اللي بنكتب القواعد');
  gate.hold('b', 24000);
  await wait(650);
  assert.deepEqual(played, ['b'], 'decides on its own if the turn is still running');
  assert.equal(gate.rejected, 0);
});

test('a lagging transcript does not hold the audio for more than about 2.5 s', () => {
  const t = reader();
  t.r.start(scriptItems({ lines: [first] }, 'scene'));
  const second = Buffer.alloc(24000 * 2).toString('base64'); // 1 s of audio
  t.r.audio(second, 24000);
  t.r.audio(second, 24000);
  assert.equal(t.heard.length, 0);
  t.r.audio(second, 24000);
  assert.equal(t.heard.length, 3, 'starts once 2.5 s are held with no stray words');
});
