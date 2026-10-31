import { test } from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error plain JavaScript worker (workers/media), run by Node on Cloud Run
import { wavFromPcm16, pcmSeconds, rateOf, envelope } from '../../../workers/media/wav.mjs';
// @ts-expect-error plain JavaScript worker
import { speakable, tagEnglish, styleFor, synthesize } from '../../../workers/media/tts.mjs';
// @ts-expect-error plain JavaScript worker
import { align, norm } from '../../../workers/media/align.mjs';
// @ts-expect-error plain JavaScript worker
import { agreement, QUALITY_BAR } from '../../../workers/media/quality.mjs';
// @ts-expect-error plain JavaScript worker
import { accessToken, forgetToken } from '../../../workers/media/google.mjs';
// @ts-expect-error plain JavaScript worker
import { recordLine } from '../../../workers/media/record.mjs';
// @ts-expect-error plain JavaScript worker
import { loadMediaConfig } from '../../../workers/media/config.mjs';
// @ts-expect-error plain JavaScript worker
import { runQueue } from '../../../workers/builder/loop.mjs';
// @ts-expect-error plain JavaScript worker
import { builderApi } from '../../../workers/builder/api.mjs';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('WAV: a 44-byte header in front of the PCM, and the rate from the mime type', () => {
  const pcm = Buffer.alloc(24000 * 2); // one second
  const wav = wavFromPcm16(pcm, 24000);
  assert.equal(wav.length, 44 + pcm.length);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(pcmSeconds(pcm), 1);
  assert.equal(rateOf('audio/L16;codec=pcm;rate=24000'), 24000);
  assert.equal(rateOf(undefined), 24000);
  const { values } = envelope(pcm);
  assert.ok(values.length > 40 && values.every((v: number) => v === 0));
});

test('the spoken form: line breaks pause, maths loses its $, English inside Arabic is tagged', () => {
  assert.equal(
    speakable('الشمس نجم.\nالأرض كوكب. $x^2$'),
    'الشمس نجم. <short pause> الأرض كوكب. x^2',
  );
  assert.equal(
    tagEnglish('دي اسمها Big Bang يا بطل'),
    'دي اسمها <lang xml:lang="en-US">Big Bang</lang> يا بطل',
  );
  assert.equal(
    tagEnglish('The sun is a star'),
    'The sun is a star',
    'English lines stay as they are',
  );
  assert.equal(tagEnglish('الحرف a'), 'الحرف a', 'a single letter is not a run');
});

test('the delivery instruction carries the character, the pace, the tone and the silence rule', () => {
  const style = styleFor({
    persona: 'an old astronomer',
    pace: 'slow',
    tone: 'whisper, amazed',
    language: 'ar',
  });
  assert.match(style, /Egyptian Arabic/);
  assert.match(style, /Character: an old astronomer\./);
  assert.match(style, /Speak slowly/);
  assert.match(style, /For this line: whisper, amazed\./);
  assert.match(style, /never spoken/);
  assert.match(styleFor({ language: 'en' }), /American English.*natural, calm teaching pace/);
});

test('TTS on Vertex: the first model the project can use wins; the audio comes back as PCM', async () => {
  const calls: string[] = [];
  const fetcher = async (url: string) => {
    calls.push(url);
    if (url.includes('gemini-2.5-pro-tts')) return json({ error: 'not found' }, 404);
    return json({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/L16;codec=pcm;rate=24000',
                  data: Buffer.from([1, 0, 2, 0]).toString('base64'),
                },
              },
            ],
          },
        },
      ],
    });
  };
  const out = await synthesize(
    {
      text: 'hi',
      voice: 'Algenib',
      style: 's',
      project: 'p',
      region: 'global',
      models: ['gemini-2.5-pro-tts', 'gemini-2.5-flash-tts'],
    },
    { token: 't', fetcher },
  );
  assert.equal(out.model, 'gemini-2.5-flash-tts');
  assert.equal(out.rate, 24000);
  assert.equal(out.pcm.length, 4);
  assert.equal(calls.length, 2);
  assert.ok(
    calls[0].startsWith(
      'https://aiplatform.googleapis.com/v1/projects/p/locations/global/publishers/google/models/',
    ),
  );
  await assert.rejects(
    synthesize(
      { text: 'hi', voice: 'A', style: 's', project: 'p', region: 'global', models: ['x'] },
      { token: 't', fetcher: async () => json({}, 404) },
    ),
    /no TTS model available/,
  );
});

test('alignment: matching words anchor, the rest share the gaps; Arabic spelling variants match', () => {
  assert.equal(norm('الأرضُ'), 'الارض');
  assert.equal(norm('مدرسة'), 'مدرسه');
  const heard = [
    { t0: 0.1, t1: 0.4, w: 'الشمس' },
    { t0: 0.5, t1: 0.8, w: 'نجم' },
    { t0: 1.4, t1: 1.8, w: 'كوكب' },
  ];
  const { words, matched } = align('الشمس نجم والأرض كوكب', heard, 2);
  assert.equal(words.length, 4);
  assert.deepEqual(words[0], { w: 'الشمس', t0: 0.1, t1: 0.4 });
  assert.deepEqual(words[3], { w: 'كوكب', t0: 1.4, t1: 1.8 });
  assert.ok(
    words[2].t0 >= 0.8 && words[2].t1 <= 1.4,
    'the unmatched word sits between its neighbours',
  );
  assert.equal(matched, 3);
  const none = align('one two three', [], 3);
  assert.equal(none.words.length, 3);
  assert.ok(none.words[2].t1 <= 3 && none.words[0].t0 >= 0);
});

test('quality: the share of the script heard back, and the bar', () => {
  assert.equal(agreement('الشمس نجم كبير', 'الشمس نجم كبير'), 1);
  assert.ok(agreement('الشمس نجم كبير جدا', 'الشمس كبير') < QUALITY_BAR);
  assert.equal(agreement('', 'x'), 1);
  assert.equal(agreement('a b', ''), 0);
  assert.ok(agreement('The Sun is a star.', 'the sun is a star') >= QUALITY_BAR);
});

test('Google tokens: the metadata server inside Cloud Run, a ready token outside; cached', async () => {
  forgetToken();
  let hits = 0;
  const fetcher = async (url: string, init: RequestInit) => {
    hits++;
    assert.ok(url.startsWith('http://metadata.google.internal/'));
    assert.equal((init.headers as Record<string, string>)['Metadata-Flavor'], 'Google');
    return json({ access_token: 'tok', expires_in: 3600 });
  };
  assert.equal(await accessToken({}, fetcher), 'tok');
  assert.equal(await accessToken({}, fetcher), 'tok');
  assert.equal(hits, 1);
  forgetToken();
  assert.equal(await accessToken({ GOOGLE_ACCESS_TOKEN: 'ready' }, fetcher), 'ready');
  assert.equal(hits, 1);
  forgetToken();
});

test('recording a line: a clip below the bar is made again, the better one is kept and flagged', async () => {
  const pcm = Buffer.alloc(2400); // 50 ms
  let attempt = 0;
  const speak = async ({ style, temperature }: { style: string; temperature: number }) => {
    attempt++;
    if (attempt === 2) {
      assert.match(style, /word for word/);
      assert.equal(temperature, 0.6);
    }
    return { pcm, rate: 24000, model: 'm' };
  };
  const heardTexts = ['الشمس', 'الشمس نجم'];
  const listen = async () => ({
    text: heardTexts.shift(),
    words: [{ t0: 0, t1: 0.04, w: 'الشمس' }],
  });
  const config = {
    project: 'p',
    ttsRegion: 'global',
    ttsModels: ['m'],
    speechRegion: 'eu',
    speechModel: 'chirp_3',
  };
  const clip = await recordLine(
    {
      line: { id: 'l1', hash: 'h1', text: 'الشمس نجم كبير جدا', tone: 'calm' },
      voice: { voice: 'Algenib', pace: 'slow', persona: '' },
      language: 'ar',
      config,
    },
    { token: 't', speak, listen },
  );
  assert.equal(attempt, 2);
  assert.equal(clip.lineId, 'l1');
  assert.equal(clip.hash, 'h1');
  assert.equal(clip.heard, 'الشمس نجم');
  assert.equal(clip.flagged, true);
  assert.equal(clip.words.length, 4);
  assert.equal(Buffer.from(clip.wav, 'base64').length, 44 + pcm.length);
  assert.equal(clip.seconds, 0.05);
  // A good first take is kept as it is.
  attempt = 0;
  const good = await recordLine(
    {
      line: { id: 'l2', hash: 'h2', text: 'The Sun is a star.', tone: '' },
      voice: { voice: 'Algenib', pace: 'normal', persona: '' },
      language: 'en',
      config,
    },
    { token: 't', speak, listen: async () => ({ text: 'the sun is a star', words: [] }) },
  );
  assert.equal(attempt, 1);
  assert.equal(good.flagged, false);
  assert.equal(good.score, 1);
});

test('the media worker config needs the platform, the token and the project; exits when the queue is empty', () => {
  const env = {
    NEW_LEARN_ORIGIN: 'https://new-learn.pages.dev/x',
    BUILDER_TOKEN: 't'.repeat(40),
    GCP_PROJECT_ID: 'p',
    BUILDER_MODE: 'once',
  };
  const config = loadMediaConfig(env);
  assert.equal(config.origin, 'https://new-learn.pages.dev');
  assert.equal(config.ttsRegion, 'global');
  assert.deepEqual(config.ttsModels, ['gemini-2.5-flash-tts', 'gemini-2.5-pro-tts']);
  assert.equal(config.speechRegion, 'eu');
  assert.equal(config.lingerMs, 0);
  assert.equal(config.mode, 'once');
  assert.throws(() => loadMediaConfig({ ...env, GCP_PROJECT_ID: '' }), /GCP_PROJECT_ID/);
});

test('the shared loop: a scheduled run works the queue and stops; the builder API asks for kinds', async () => {
  const queue = ['a', 'b'];
  const worked: string[] = [];
  const logs: string[] = [];
  const done = await runQueue({
    claim: async () => queue.shift() ?? null,
    work: async (job: string) => worked.push(job),
    config: { mode: 'once', lingerMs: 0, pollMs: 1, maxRunMs: 60_000 },
    log: (...p: string[]) => logs.push(p.join(' ')),
    wait: async () => {},
    isStopping: () => false,
  });
  assert.equal(done, 2);
  assert.deepEqual(worked, ['a', 'b']);
  assert.equal(logs.at(-1), 'done: 2 job(s)');
  const bodies: string[] = [];
  const api = builderApi(
    { origin: 'https://new-learn.pages.dev', token: 't'.repeat(40) },
    async (url: string, init: RequestInit) => {
      bodies.push(`${init.method ?? 'GET'} ${url} ${init.body ?? ''}`);
      return json({ job: null, ok: true });
    },
  );
  await api.claim(['voice']);
  await api.claim();
  await api.lines('j');
  await api.clip('j', { hash: 'h' });
  assert.equal(bodies[0], 'POST https://new-learn.pages.dev/builder/claim {"kinds":["voice"]}');
  assert.equal(bodies[1], 'POST https://new-learn.pages.dev/builder/claim {}');
  assert.equal(bodies[2], 'GET https://new-learn.pages.dev/builder/jobs/j/lines ');
  assert.equal(bodies[3], 'POST https://new-learn.pages.dev/builder/jobs/j/clips {"hash":"h"}');
});
