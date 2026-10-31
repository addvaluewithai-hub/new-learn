// The media worker's settings (docs/worker-cloud-run.md): the platform, the Google Cloud
// project, and the queue mode it shares with the builder.
export function loadMediaConfig(env = process.env) {
  const need = (name) => {
    const value = env[name];
    if (!value) throw new Error(`Missing ${name} in the environment.`);
    return value;
  };
  const origin = new URL(need('NEW_LEARN_ORIGIN')).origin;
  const token = need('BUILDER_TOKEN');
  if (token.length < 32) throw new Error('BUILDER_TOKEN must be at least 32 characters.');
  return {
    origin,
    token,
    project: need('GCP_PROJECT_ID'),
    /** Where Gemini TTS runs (`global` serves every model). */
    ttsRegion: env.TTS_REGION || 'global',
    /** Models to try in order: the first the project can use wins. */
    ttsModels: (env.TTS_MODELS || 'gemini-2.5-flash-tts,gemini-2.5-pro-tts')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean),
    /** Speech-to-Text v2 (word timings); Chirp 3 lives in multi-region locations. */
    speechRegion: env.SPEECH_REGION || 'eu',
    speechModel: env.SPEECH_MODEL || 'chirp_3',
    pollMs: Number(env.POLL_MS) || 5000,
    mode: env.BUILDER_MODE === 'once' ? 'once' : 'forever',
    maxRunMs: Number(env.MAX_RUN_MS) || 50 * 60 * 1000,
    /** A scheduled run starts every minute, so by default it exits as soon as the queue is empty. */
    lingerMs: Number(env.LINGER_MS) || 0,
  };
}
