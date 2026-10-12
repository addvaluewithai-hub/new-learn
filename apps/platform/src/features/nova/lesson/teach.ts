/** Teaching the lesson aloud: the lines Nova reads, and what the reading reports back. */
export type TeachLine = { n: number; text: string; question: boolean };
export type TeachEvents = {
  /** Line `n` starts playing now: show its page. */
  show: (n: number) => void;
  /** All lines were read and have finished playing. */
  done: () => void;
  failed: () => void;
};

/** One lesson line, said exactly as written (the instruction lives in the session setup). */
export const readMessage = (line: TeachLine) =>
  `READ${line.question ? ' QUESTION' : ''}:\n${line.text.replace(/\s*\n\s*/g, '\n')}`;
