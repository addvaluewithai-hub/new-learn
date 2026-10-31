// Word timings for a clip, from Google Speech-to-Text v2 (Chirp) on the rendered audio: what
// the voice actually said, and when each word starts and ends. The timings drive the word
// highlight, the cues and the lip sync; the text is compared with the script (quality.mjs).

const seconds = (value) => (value ? Number(String(value).replace(/s$/, '')) : 0);

export async function transcribe(
  { wav, language, project, region, model = 'chirp_3' },
  { token, fetcher = fetch },
) {
  const host = region === 'global' ? 'speech.googleapis.com' : `${region}-speech.googleapis.com`;
  const url = `https://${host}/v2/projects/${project}/locations/${region}/recognizers/_:recognize`;
  const response = await fetcher(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      config: {
        autoDecodingConfig: {},
        languageCodes: [language === 'en' ? 'en-US' : 'ar-EG'],
        model,
        features: { enableWordTimeOffsets: true, enableAutomaticPunctuation: false },
      },
      content: Buffer.from(wav).toString('base64'),
    }),
  });
  if (!response.ok)
    throw new Error(`transcribe: ${response.status} ${(await response.text()).slice(0, 200)}`);
  const data = await response.json();
  const words = [];
  let text = '';
  for (const result of data.results ?? []) {
    const alt = result.alternatives?.[0];
    if (!alt) continue;
    text += (text ? ' ' : '') + (alt.transcript ?? '');
    for (const w of alt.words ?? [])
      words.push({ t0: seconds(w.startOffset), t1: seconds(w.endOffset), w: w.word });
  }
  return { text: text.trim(), words };
}
