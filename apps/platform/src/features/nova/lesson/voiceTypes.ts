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
  /** Hands-free mode: every microphone chunk (16 kHz PCM, loudness, samples). */
  capture?: (chunk: string, level: number, samples: Float32Array) => void;
  /** Hands-free mode: holds a reply until the learner's words are known to be real. */
  reply?: ReplyGate;
  /** Extra setup for the next session (hands-free mode). */
  setup?: () => TalkSetup;
  /** A connected session closed after this many seconds, and why (docs/voice-agent.md, Y3). */
  ended?: (seconds: number, reason: string) => void;
  /** Client tools the tutor may call (e.g. submit_answer); the result goes back as-is. */
  tool?: (name: string, args: Record<string, unknown>) => unknown;
};
export type ReplyGate = {
  holding: boolean;
  hold: (data: string, rate: number) => void;
  learner: (text: string) => void;
  /** Reply over: false means it was dropped (noise, not words). */
  decide: () => boolean;
};
export type Session = {
  audio: AudioSession;
  live: LiveConnection;
  ready: boolean;
  /** When the session was ready (performance.now()). */
  since: number;
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
export const talkToken = (position: Position, setup: TalkSetup = {}) =>
  api<LiveToken>('/nova/live', { ...position, purpose: 'talk', style: voiceStyle(), ...setup });
/** Extra session setup, e.g. hands-free mode and its wake word. */
export type TalkSetup = { handsFree?: boolean; wakeWord?: string };
