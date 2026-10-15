const symbols: Record<string, string> = {
  Delta: 'Δ',
  delta: 'δ',
  sigma: 'σ',
  varepsilon: 'ε',
  tau: 'τ',
  gamma: 'γ',
  mu: 'μ',
  pi: 'π',
  times: ' × ',
  approx: ' ≈ ',
  simeq: ' ≃ ',
  Longrightarrow: ' ⇒ ',
  quad: ' ',
  qquad: ' ',
  left: '',
  right: '',
  max: 'max',
};
const upper = '⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺';
const lower = '₀₁₂₃₄₅₆₇₈₉₋₊';

/** Keep the native caption and live READ turn legible; the board typesets the original TeX. */
export function plainMath(source: string): string {
  let index = 0;
  const group = (): string => {
    if (source[index] !== '{') return source[index++] ?? '';
    const start = ++index;
    let depth = 1;
    while (index < source.length && depth) {
      if (source[index] === '{') depth++;
      if (source[index] === '}') depth--;
      index++;
    }
    return plainMath(source.slice(start, index - 1));
  };
  let result = '';
  while (index < source.length) {
    const char = source[index++];
    if (char === '\\') {
      const word = /^[A-Za-z]+/.exec(source.slice(index))?.[0];
      if (!word) {
        index++;
        result += ' ';
        continue;
      }
      index += word.length;
      while (source[index] === ' ') index++;
      if (word === 'frac') result += `(${group()})/(${group()})`;
      else if (word === 'mathrm' || word === 'text') result += group();
      else if (word in symbols) result += symbols[word];
      else throw new Error(`Unknown book math command: ${word}`);
    } else if (char === '^' || char === '_') {
      const value = group();
      const digits = char === '^' ? upper : lower;
      result += /^[\d+−-]+$/.test(value)
        ? [...value].map((d) => digits['0123456789-+'.indexOf(d === '−' ? '-' : d)]).join('')
        : `(${value})`;
    } else if (char !== '{' && char !== '}') result += char;
  }
  return result.replace(/\s+/g, ' ').trim();
}

export function lessonText(text: string) {
  return text
    .replace(/^English (?:restatement|model answer):\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/\s*\[E1\]/g, '')
    .replace(
      /\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g,
      (_, display, inline) => `$${plainMath(display ?? inline)}$`,
    );
}

export function passages(blocks: string[]) {
  const groups: string[][] = [];
  for (const block of blocks) {
    const previous = groups.at(-1);
    // Keep a lead-in or a solution subheading with the passage it introduces.
    if (
      previous &&
      (/[:：]$/.test(previous.at(-1)!) || (previous[0].length < 35 && previous.length === 1))
    )
      previous.push(block);
    else groups.push([block]);
  }
  return groups.map((group) => group.join('\n\n'));
}
