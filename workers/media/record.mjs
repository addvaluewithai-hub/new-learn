// Recording one line (docs/voice-agent.md): speech in the course's voice, then a listen-back
// (transcription) that gives the word timings and checks the words against the script. A clip
// below the quality bar is made once more with a firmer instruction; the better one is kept,
// flagged for the teacher when still below the bar.
import { align } from './align.mjs';
import { agreement, QUALITY_BAR } from './quality.mjs';
import { speakable, styleFor, synthesize, tagEnglish } from './tts.mjs';
import { transcribe } from './transcribe.mjs';
import { pcmSeconds, wavFromPcm16 } from './wav.mjs';

/** Synchronous recognition takes up to a minute of audio; longer lines keep estimated timings. */
const MAX_TRANSCRIBE_SECONDS = 55;

export async function recordLine(
  { line, voice, language, config },
  { token, fetcher = fetch, speak = synthesize, listen = transcribe },
) {
  const said = speakable(line.text);
  const text = language === 'ar' ? tagEnglish(said) : said;
  const base = { persona: voice.persona, pace: voice.pace, tone: line.tone, language };
  const attempts = [
    { style: styleFor(base), temperature: 1 },
    {
      style: `${styleFor(base)} Read the line word for word, every word, in order.`,
      temperature: 0.6,
    },
  ];
  let best = null;
  for (const attempt of attempts) {
    const { pcm, rate, model } = await speak(
      {
        text,
        voice: voice.voice,
        style: attempt.style,
        temperature: attempt.temperature,
        project: config.project,
        region: config.ttsRegion,
        models: config.ttsModels,
      },
      { token, fetcher },
    );
    const wav = wavFromPcm16(pcm, rate);
    const seconds = pcmSeconds(pcm, rate);
    let heard = { text: '', words: [] };
    let score = null;
    if (seconds <= MAX_TRANSCRIBE_SECONDS) {
      heard = await listen(
        {
          wav,
          language,
          project: config.project,
          region: config.speechRegion,
          model: config.speechModel,
        },
        { token, fetcher },
      );
      score = agreement(line.text, heard.text);
    }
    const candidate = {
      wav,
      seconds,
      model,
      heard: heard.text,
      score,
      words: align(line.text, heard.words, seconds).words,
    };
    if (!best || (score ?? 0) > (best.score ?? 0)) best = candidate;
    if (score === null || score >= QUALITY_BAR) break;
  }
  return {
    lineId: line.id,
    hash: line.hash,
    wav: best.wav.toString('base64'),
    seconds: Math.round(best.seconds * 1000) / 1000,
    words: best.words,
    heard: best.heard,
    score: best.score,
    flagged: best.score !== null && best.score < QUALITY_BAR,
    model: best.model,
  };
}
