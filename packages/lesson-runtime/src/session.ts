import { canSubmitAttempt } from './flow';
import { framesForRecording, recordingFor } from './recording';
import type { LessonPackage } from './types';

export type Attempt = { choice?: number; written: string };
export type Session = {
  epoch: number;
  recovery: number;
  index: number;
  mode: 'narration' | 'attempt' | 'feedback' | 'complete';
  frame: number;
  playing: boolean;
  buffering: boolean;
  autoStart: boolean;
  error: string | null;
  draft: Attempt;
  answers: Record<string, Attempt>;
};
type PlaybackAction =
  | { type: 'frame'; frame: number }
  | { type: 'play' | 'pause' | 'waiting' | 'resume' | 'ended' }
  | { type: 'error'; message: string };
export type SessionAction =
  | (PlaybackAction & { epoch: number })
  | { type: 'draft'; draft: Attempt }
  | { type: 'submit' | 'retry' | 'restart' }
  | { type: 'navigate'; index: number };

export function initialSession(): Session {
  return {
    epoch: 0,
    recovery: 0,
    index: 0,
    mode: 'narration',
    frame: 0,
    playing: false,
    buffering: false,
    autoStart: false,
    error: null,
    draft: { written: '' },
    answers: {},
  };
}

export function activeRecording(lesson: LessonPackage, state: Session) {
  const scene = lesson.scenes[state.index];
  return recordingFor(
    lesson,
    state.mode === 'feedback' ? scene.question!.feedbackId : scene.recordingId,
  );
}

function move(state: Session, index: number, autoStart: boolean): Session {
  return {
    ...state,
    epoch: state.epoch + 1,
    index,
    mode: 'narration',
    frame: 0,
    playing: false,
    buffering: false,
    error: null,
    autoStart,
    draft: { written: '' },
  };
}

export function reduceSession(
  lesson: LessonPackage,
  state: Session,
  action: SessionAction,
): Session {
  // Epochs retire late events from old audio, effects, retries and scene changes.
  if ('epoch' in action && action.epoch !== state.epoch) return state;
  const scene = lesson.scenes[state.index];
  const question = scene.question;
  const lastFrame = framesForRecording(activeRecording(lesson, state), lesson.fps) - 1;

  switch (action.type) {
    case 'frame':
      if (!Number.isInteger(action.frame)) return state;
      return { ...state, frame: Math.max(0, Math.min(action.frame, lastFrame)) };
    case 'play':
      return state.error || !['narration', 'feedback'].includes(state.mode)
        ? state
        : { ...state, playing: true };
    case 'pause':
      return { ...state, playing: false };
    case 'waiting':
      return { ...state, buffering: true };
    case 'resume':
      return { ...state, buffering: false };
    case 'error':
      return {
        ...state,
        playing: false,
        buffering: false,
        autoStart: false,
        error: action.message,
      };
    case 'draft':
      return state.mode === 'attempt' ? { ...state, draft: action.draft } : state;
    case 'submit': {
      if (
        state.mode !== 'attempt' ||
        state.error ||
        !question ||
        !canSubmitAttempt(question, state.draft.choice, state.draft.written)
      )
        return state;
      return {
        ...state,
        epoch: state.epoch + 1,
        mode: 'feedback',
        frame: 0,
        playing: false,
        buffering: false,
        autoStart: true,
        answers: { ...state.answers, [scene.id]: { ...state.draft } },
      };
    }
    case 'ended': {
      if (state.error || !['narration', 'feedback'].includes(state.mode)) return state;
      if (state.mode === 'narration' && question) {
        return { ...state, mode: 'attempt', frame: lastFrame, playing: false, autoStart: false };
      }
      if (state.index + 1 < lesson.scenes.length) return move(state, state.index + 1, true);
      return {
        ...state,
        epoch: state.epoch + 1,
        mode: 'complete',
        frame: lastFrame,
        playing: false,
        autoStart: false,
      };
    }
    case 'navigate':
      return Number.isInteger(action.index) &&
        action.index >= 0 &&
        action.index < lesson.scenes.length
        ? move(state, action.index, false)
        : state;
    case 'retry':
      return state.error
        ? {
            ...state,
            epoch: state.epoch + 1,
            recovery: state.recovery + 1,
            frame: 0,
            playing: false,
            buffering: false,
            autoStart: true,
            error: null,
          }
        : state;
    case 'restart':
      return { ...initialSession(), epoch: state.epoch + 1 };
  }
}
