import type { LiveToken } from '../nova/voice/LiveConnection';

export type ListenPosition = { courseId: string; lessonId: string; sceneId: string };
export type ListenState =
  | 'idle'
  | 'connecting'
  | 'teaching'
  | 'floor'
  | 'listening'
  | 'thinking'
  | 'paused'
  | 'finished';
export type ListenEvents = {
  state: (state: ListenState) => void;
  scene: (position: ListenPosition) => void;
  said: (text: string) => void;
  heard: (text: string) => void;
  error: (message: string) => void;
  /** A short note for the diagnostics panel. */
  diag?: (note: string) => void;
  /** Noisy-place mode changed (by the learner or after noise). */
  noisy?: (on: boolean) => void;
  /** The scene before/after this one, or null at either end of the course. */
  move: (from: ListenPosition, step: 1 | -1) => ListenPosition | null;
};

/** One scene's script as the server sends it (never the expected answer). */
export type SceneScript = { lines: string[]; ask?: string; feedback?: string };
export type ListenToken = LiveToken & { script: SceneScript };

/** What is being read: the scene (lines, then its question) or the feedback after a verdict. */
export type ReadJob = { kind: 'scene' | 'feedback'; from: number };

/** How long a reply may take before the floor goes back to the learner. */
export const REPLY_MS = 20000;
/** After cutting in, this much silence means "carry on reading". */
export const CUT_IN_WAIT_MS = 10000;

/** Said once when noise keeps being taken for answers. It must not contain the wake word. */
export const NOISY_NOTICE =
  'شكل المكان عندك فيه دوشة. فهستنى لحد ما تدوس زرار السماعة مرة، أو تنادي عليّا باسمي، وبعدين رد براحتك.';

/** Silent notes to the tutor (context, never a request for a reply on their own). */
export const notes = {
  waiting: (asked: string) =>
    `RESUME: the connection dropped while you were waiting for the learner's answer to: «${asked}». Do not repeat it or greet again; the learner is answering now, so listen and respond to what they say.`,
  interruptedReading: (line: string) =>
    `INTERRUPTED: the learner stopped your reading to talk, during this script line: «${line}». Reply to what they say; when they are ready call resume_lesson and the app re-reads from that line.`,
  interrupted: (heard: string) =>
    `INTERRUPTED: the learner stopped you to talk. They heard you only up to: «${heard}». Reply to what they say.`,
};
