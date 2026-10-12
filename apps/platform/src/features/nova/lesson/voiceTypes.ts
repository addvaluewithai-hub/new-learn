import type { AudioSession } from '../voice/AudioSession';
import type { LiveConnection } from '../voice/LiveConnection';
import type { Position } from '../types';
import type { TeachEvents, TeachLine } from './teach';
import type { VoiceState } from './LessonVoice';

/** Shapes shared by the lesson voice engine. */
export type VoiceEvents = {
  state: (state: VoiceState) => void;
  position: () => Position | null;
  /** Silent context sent when a session opens: earlier talk and where the learner is. */
  primer: () => string[];
  begin: () => void;
  heard: (text: string) => void;
  said: (text: string) => void;
  done: () => void;
  failed: (message: string) => void;
};
export type Session = {
  audio: AudioSession;
  live: LiveConnection;
  ready: boolean;
  connected: Promise<void>;
  mic?: Promise<void>;
  /** The learner's turn is open on the server (activityStart sent). */
  talking: boolean;
  buffer: string[];
};
export type ReadJob = {
  lines: TeachLine[];
  on: TeachEvents;
  /** The line whose speech is being generated now (-1: none yet). */
  line: number;
  heard: boolean;
  askedAt: number;
  complete: boolean;
  timers: number[];
};
/** Ask for the next line while this much speech is still queued, so lines join up. */
export const LOOKAHEAD_S = 6;
