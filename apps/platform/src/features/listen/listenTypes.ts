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

/** How long the learner has to start talking before the tutor hears SILENCE. */
export const FLOOR_MS = 9000;
/** How long a reply may take before the floor goes back to the learner. */
export const REPLY_MS = 20000;
