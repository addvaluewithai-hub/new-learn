/** Teaching the lesson aloud: the lines Nova reads, and what the reading reports back. */
/** `tone`: the author's direction for reading the line (never spoken). */
export type TeachLine = { n: number; text: string; question: boolean; tone?: string };
export type TeachEvents = {
  /** Line `n` starts playing now: show its page. */
  show: (n: number) => void;
  /** All lines were read and have finished playing. */
  done: () => void;
  failed: () => void;
};

/** One lesson line, said exactly as written (the instruction lives in the session setup). */
export const readMessage = (line: TeachLine) => {
  const tone = line.tone
    ?.replace(/[()\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `READ${line.question ? ' QUESTION' : ''}${tone ? ` (${tone})` : ''}:\n${line.text.replace(/\s*\n\s*/g, '\n')}`;
};
