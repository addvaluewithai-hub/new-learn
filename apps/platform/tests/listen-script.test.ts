import assert from 'node:assert/strict';
import { test } from 'node:test';
import { matchScript, normalize } from '../src/features/listen/scriptMatch';
import { ScriptReader, scriptItems } from '../src/features/listen/ScriptReader';

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
    played: string[] = [];
  let failed = 0;
  const r = new ScriptReader({
    send: (text) => sent.push(text),
    play: (_chunks, item, last) => {
      played.push(item.text + (last ? ' (last)' : ''));
      return 0;
    },
    queued: () => 0,
    failed: () => failed++,
  });
  const reply = async (said: string, audio = true) => {
    if (audio) r.audio('AAAA', 24000);
    r.said(said);
    r.complete();
    await wait(320);
  };
  return { r, sent, played, reply, failed: () => failed };
}

test('the reader plays only checked readings, re-reads a drifted one once, in order', async () => {
  const { r, sent, played, reply } = reader();
  r.start(
    scriptItems({ lines: ['السطر الأول هنا', 'السطر التاني هنا'], ask: 'إيه السؤال ده؟' }, 'scene'),
  );
  assert.equal(sent.at(-1), 'READ:\nالسطر الأول هنا');
  await reply('السطر الأول هنا');
  assert.deepEqual(played, ['السطر الأول هنا']);
  await wait(5);
  assert.equal(sent.at(-1), 'READ:\nالسطر التاني هنا');
  await reply('كلام تاني خالص مالوش علاقة باللي مكتوب');
  assert.equal(sent.at(-1), 'READ AGAIN:\nالسطر التاني هنا', 'drift is re-read');
  assert.equal(played.length, 1, 'drifted audio never plays');
  await reply('السطر التاني هنا');
  await wait(5);
  assert.equal(sent.at(-1), 'READ QUESTION:\nإيه السؤال ده؟');
  await reply('إيه السؤال ده');
  assert.deepEqual(played.slice(1), ['السطر التاني هنا', 'إيه السؤال ده؟ (last)']);
  assert.ok(r.done);
  assert.equal(r.drifts, 1);
});

test('a reading with no speech twice fails; cutting in reports the line being heard', async () => {
  const one = reader();
  one.r.start(scriptItems({ lines: ['سطر'] }, 'scene'));
  await one.reply('', false);
  assert.equal(one.sent.at(-1), 'READ AGAIN:\nسطر');
  await one.reply('', false);
  assert.equal(one.failed(), 1);
  assert.ok(!one.r.active);

  const two = reader();
  two.r.start(scriptItems({ lines: ['الأول', 'التاني', 'التالت'] }, 'scene'), 1);
  assert.equal(two.sent[0], 'READ:\nالتاني', 'starts from the given line');
  assert.deepEqual(two.r.playing(), { index: 1, text: 'التاني' });
  await two.reply('التاني');
  assert.deepEqual(two.r.playing(), { index: 1, text: 'التاني' });
  two.r.stop();
  assert.ok(!two.r.active && !two.r.waiting);
});
