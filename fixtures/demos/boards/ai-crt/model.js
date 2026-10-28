// A toy language model: for each step, the five likeliest next words and their chances.
// Temperature reshapes the chances (p^(1/T)); a fixed lottery number per step picks the word,
// so the same words count and temperature always write the same sentence.
const MODEL = {
  ar: {
    prompt: 'الجو النهارده',
    steps: [
      [
        ['حر', 0.46],
        ['جميل', 0.21],
        ['برد', 0.13],
        ['مشمس', 0.12],
        ['غريب', 0.08],
      ],
      [
        ['جدًا', 0.52],
        ['شوية', 0.2],
        ['زي', 0.12],
        ['ومفيش', 0.1],
        ['!', 0.06],
      ],
      [
        ['فخليك', 0.34],
        ['ولازم', 0.22],
        ['والناس', 0.16],
        ['زي', 0.16],
        ['.', 0.12],
      ],
      [
        ['في', 0.44],
        ['جوه', 0.21],
        ['معاك', 0.15],
        ['بعيد', 0.12],
        ['مبسوط', 0.08],
      ],
      [
        ['البيت', 0.55],
        ['الضل', 0.25],
        ['التكييف', 0.1],
        ['المية', 0.06],
        ['الشغل', 0.04],
      ],
    ],
  },
  en: {
    prompt: 'The weather today is',
    steps: [
      [
        ['hot', 0.46],
        ['nice', 0.21],
        ['cold', 0.13],
        ['sunny', 0.12],
        ['strange', 0.08],
      ],
      [
        ['and', 0.52],
        ['so', 0.2],
        ['like', 0.12],
        ['but', 0.1],
        ['!', 0.06],
      ],
      [
        ['you', 0.34],
        ['we', 0.22],
        ['people', 0.16],
        ['everyone', 0.16],
        ['.', 0.12],
      ],
      [
        ['should', 0.44],
        ['can', 0.21],
        ['might', 0.15],
        ['must', 0.12],
        ['will', 0.08],
      ],
      [
        ['stay', 0.55],
        ['rest', 0.25],
        ['swim', 0.1],
        ['relax', 0.06],
        ['work', 0.04],
      ],
    ],
  },
};
const LOTTERY = [0.4, 0.45, 0.3, 0.4, 0.5];

/** The chances at this temperature, highest first as listed. */
function shape(step, temperature) {
  const raw = step.map(([, p]) => Math.pow(p, 1 / temperature));
  const sum = raw.reduce((a, b) => a + b, 0);
  return step.map(([word], i) => ({ word, p: raw[i] / sum }));
}
/** Which candidate the lottery number lands on. */
function draw(chances, r) {
  let at = 0;
  for (let i = 0; i < chances.length; i++) {
    at += chances[i].p;
    if (r < at) return i;
  }
  return chances.length - 1;
}
/** The sentence after `words` steps, and the candidates for the next one. */
function generate(lang, words, temperature) {
  const model = MODEL[lang] ?? MODEL.ar;
  const written = [];
  for (let s = 0; s < Math.min(words, model.steps.length); s++) {
    const chances = shape(model.steps[s], temperature);
    written.push(chances[draw(chances, LOTTERY[s])].word);
  }
  const s = Math.min(words, model.steps.length - 1);
  const next = words < model.steps.length ? shape(model.steps[s], temperature) : null;
  const pick = next ? draw(next, LOTTERY[s]) : -1;
  return { prompt: model.prompt, written, next, pick };
}
