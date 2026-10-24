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
  /** The scene before/after this one, or null at either end of the course. */
  move: (from: ListenPosition, step: 1 | -1) => ListenPosition | null;
};

/** How long a reply may take before the floor goes back to the learner. */
export const REPLY_MS = 20000;

/** Silent notes to the tutor (context, never a request for a reply on their own). */
export const notes = {
  resume: (heard: string) =>
    heard
      ? `RESUME: the connection dropped. The learner already heard you up to: «${heard}». Do not greet again or start over; continue from there.`
      : '',
  waiting: (said: string) =>
    `RESUME: the connection dropped while you were waiting for the learner. Your last words were: «${said}». Do not repeat them or greet again; the learner is answering now, so listen and respond to what they say.`,
  interrupted: (heard: string) =>
    `INTERRUPTED: the learner stopped you to talk. They heard you only up to: «${heard}». Answer them, then continue from exactly that point.`,
};
