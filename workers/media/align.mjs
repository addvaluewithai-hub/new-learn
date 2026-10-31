// Lays the script's words out in time from the recognised words (the technique from
// new-english-channel/production/lib/tlkit.py): matching words anchor, the rest share the
// gaps between anchors by length. Arabic is normalised before comparing.

export function norm(word) {
  return word
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '') // diacritics, tatweel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}']/gu, '');
}

const similar = (a, b) => {
  if (a === b) return true;
  if (!a || !b || Math.abs(a.length - b.length) > 2) return false;
  // One edit apart, or one contains the other (prefix/suffix clitics): a soft match.
  if (a.includes(b) || b.includes(a)) return Math.min(a.length, b.length) >= 3;
  let d = 0;
  for (let i = 0, j = 0; i < a.length || j < b.length; ) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else {
      d++;
      if (d > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else {
        i++;
        j++;
      }
    }
  }
  return true;
};

/** The longest common subsequence of script tokens and recognised words (soft matches). */
function anchors(script, heard) {
  const n = script.length,
    m = heard.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = similar(script[i], heard[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (similar(script[i], heard[j])) {
      out.push([i, j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return out;
}

/**
 * Times for each word of `text` from the recognised `words` ([{t0, t1, w}]) over a clip of
 * `duration` seconds. Unmatched words share the gap between their neighbours by length.
 */
export function align(text, words, duration) {
  const display = text.split(/\s+/).filter(Boolean);
  const script = display.map(norm);
  const heard = words.map((w) => norm(w.w));
  const times = new Array(script.length).fill(null);
  for (const [i, j] of anchors(script, heard)) times[i] = [words[j].t0, words[j].t1];
  let i = 0;
  while (i < times.length) {
    if (times[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j < times.length && !times[j]) j++;
    const lo = i
      ? times[i - 1][1]
      : Math.max(0, (j < times.length ? times[j][0] : duration) - 0.4 * (j - i));
    const hi = j < times.length ? times[j][0] : Math.min(duration, lo + 0.4 * (j - i));
    const lens = script.slice(i, j).map((s) => Math.max(2, s.length));
    const total = lens.reduce((a, b) => a + b, 0);
    let at = lo;
    lens.forEach((len, k) => {
      const d = ((hi - lo) * len) / total;
      times[i + k] = [at + 0.05 * d, at + 0.95 * d];
      at += d;
    });
    i = j;
  }
  const matched = times.filter(
    (t, k) => t && heard.length && anchors([script[k]], heard).length,
  ).length;
  return {
    words: display.map((w, k) => ({ w, t0: round(times[k][0]), t1: round(times[k][1]) })),
    matched,
  };
}
const round = (x) => Math.round(x * 1000) / 1000;
