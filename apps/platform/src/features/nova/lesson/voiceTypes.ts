import type { AudioSession } from '../voice/AudioSession';
import type { LiveConnection, LiveToken } from '../voice/LiveConnection';
import { api } from '../../../shared/api';
import { voiceStyle } from '../voice/voicePrefs';
import type { Position } from '../types';
import type { TeachEvents, TeachLine } from './teach';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'reading';
export const IDLE_CLOSE_MS = 120_000;
export const REPLY_WAIT_MS = 20_000;

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

/** The live session for lesson talk, opened with the learner's voice settings. */
export const talkToken = (position: Position) =>
  api<LiveToken>('/nova/live', { ...position, purpose: 'talk', style: voiceStyle() });
