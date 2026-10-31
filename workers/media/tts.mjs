// Speech from text with Gemini TTS on Vertex AI (docs/voice-agent.md): one line at a time, in
// the course's voice, with its character and the line's tone as the delivery instruction. The
// technique is the one proven in addvaluewithai-hub/gemini-tts and new-english-channel:
// a style sentence, `<short pause>` tags, and English inside Arabic wrapped in a language tag.
import { rateOf } from './wav.mjs';

/** A line as the model should say it: `[tone]` directions become part of the instruction. */
export function speakable(text) {
  return text
    .replace(/\s*\n\s*/g, ' <short pause> ')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** English runs inside an Arabic line are tagged so the voice switches language cleanly. */
export function tagEnglish(text) {
  if (!/[؀-ۿ]/.test(text)) return text;
  return text.replace(/((?:[A-Za-z][A-Za-z'’.-]*)(?:\s+[A-Za-z][A-Za-z'’.-]*)*)/g, (run) =>
    /[A-Za-z]{2,}/.test(run) ? `<lang xml:lang="en-US">${run}</lang>` : run,
  );
}

const PACE = {
  slowest:
    'Speak very slowly and calmly, as if to someone hearing this for the first time: short sentences, a clear pause after each one, never rushed.',
  slow: 'Speak slowly and calmly, with short pauses between sentences.',
  normal: 'Speak at a natural, calm teaching pace.',
};
const LANGUAGE = {
  ar: 'natural Egyptian Arabic (Cairo dialect), with English words said in English',
  en: 'clear General American English',
};

/** The delivery instruction for one line: the course's character, its pace, and the tone. */
export function styleFor({ persona, pace, tone, language }) {
  const parts = [
    `A teacher narrating one line of a lesson in ${LANGUAGE[language] ?? LANGUAGE.ar}.`,
    persona ? `Character: ${persona}.` : '',
    PACE[pace] ?? PACE.normal,
    tone ? `For this line: ${tone}.` : '',
    'Tags in angle brackets and the language markup are silent instructions, never spoken. Say exactly the words of the line, nothing more.',
  ];
  return parts.filter(Boolean).join(' ');
}

/**
 * Synthesise one line. Returns 16-bit PCM and its rate. `model` falls back through the list
 * when a model is not available in the project.
 */
export async function synthesize(
  { text, voice, style, project, region, models, temperature = 1 },
  { token, fetcher = fetch },
) {
  const errors = [];
  for (const model of models) {
    const host =
      region === 'global' ? 'aiplatform.googleapis.com' : `${region}-aiplatform.googleapis.com`;
    const url = `https://${host}/v1/projects/${project}/locations/${region}/publishers/google/models/${model}:generateContent`;
    const response = await fetcher(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${style}\n\nLine: ${text}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          temperature,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    });
    if (response.status === 404 || response.status === 400) {
      errors.push(`${model}: ${response.status}`);
      continue;
    }
    if (!response.ok)
      throw new Error(`tts ${model}: ${response.status} ${(await response.text()).slice(0, 200)}`);
    const data = await response.json();
    const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!part) throw new Error(`tts ${model}: no audio in the reply`);
    return {
      pcm: Buffer.from(part.inlineData.data, 'base64'),
      rate: rateOf(part.inlineData.mimeType),
      model,
    };
  }
  throw new Error(`no TTS model available: ${errors.join(', ')}`);
}
