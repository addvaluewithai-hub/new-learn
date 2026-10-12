/** Teaching the lesson aloud: what Nova gets in one TEACH message and what it reports. */
/** One numbered lesson line for Nova to teach; `n` is the board page it belongs to. */
export type TeachLine = { n: number; text: string; question: boolean };
export type TeachEvents = {
  /** Nova reached line `n`: show its page (called when that audio starts playing). */
  show: (n: number) => void;
  /** Nova finished the lines (`shown` is the last line it moved to). */
  done: (shown: number) => void;
  failed: () => void;
};

export function teachMessage(lines: TeachLine[]) {
  const body = lines.map(
    (line) =>
      `[${line.n}] ${line.question ? 'QUESTION: ' : ''}${line.text.replace(/\s*\n\s*/g, ' / ')}`,
  );
  return `TEACH (continue the lesson from here):\n${body.join('\n')}`;
}
