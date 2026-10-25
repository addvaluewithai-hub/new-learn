/**
 * Did the tutor say the script line as written? Compares the live transcript of what it said
 * with the line, leniently: transcripts of Arabic speech differ in spelling, diacritics and
 * punctuation, and English terms may come back in Arabic letters. What it catches is real
 * drift: words left out, a rewording, or extra sentences added around the line.
 */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '') // diacritics and tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export type ScriptMatch = { ok: boolean; recall: number; ratio: number };

export function matchScript(said: string, line: string): ScriptMatch {
  // Numbers are skipped: a year may come back as digits or as words.
  const spoken = (text: string) => normalize(text).filter((word) => !/^\d+$/.test(word));
  const heard = spoken(said),
    latin = (word: string) => /^[a-z0-9]+$/.test(word);
  const all = spoken(line);
  let expected = all;
  // Some transcripts write English terms in Arabic letters: then judge the Arabic words only.
  const arabicOnly = expected.filter((word) => !latin(word));
  if (!heard.some(latin) && arabicOnly.length) expected = arabicOnly;
  if (!expected.length) return { ok: true, recall: 1, ratio: 1 };
  const pool = new Map<string, number>();
  for (const word of heard) pool.set(word, (pool.get(word) ?? 0) + 1);
  let found = 0;
  for (const word of expected) {
    const left = pool.get(word) ?? 0;
    if (left > 0) {
      found++;
      pool.set(word, left - 1);
    }
  }
  const recall = found / expected.length,
    ratio = heard.length / all.length;
  // Short lines are judged more loosely: one misheard word is a big share of them.
  const need = expected.length < 5 ? 0.5 : 0.65;
  return { ok: recall >= need && ratio <= 1.6, recall, ratio };
}
