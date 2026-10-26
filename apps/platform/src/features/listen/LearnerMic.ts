import type { LiveConnection } from '../nova/voice/LiveConnection';
import type { ListenPosition, ListenState } from './listenTypes';
import { SpeechDetector } from './speech';
import { VoiceDetector } from './vad';
import { WakeWord } from './wakeWord';

export type MicHost = {
  state: () => ListenState;
  set: (state: ListenState) => void;
  live: () => LiveConnection | null;
  position: () => ListenPosition | null;
  /** The floor's "carry on" timer must stop: the learner started talking. */
  speaking: () => void;
  /** The session dropped while waiting: reopen it, the learner's words are being held. */
  reconnect: () => void;
  /** The wake word was heard (these chunks include it). */
  called: (chunks: string[]) => void;
  /** The learner's turn was sent; a reply is coming. */
  sent: () => void;
};

/**
 * The learner's side of the always-open microphone. On the floor, a voiced utterance becomes
 * a manual activity turn for the tutor; while the tutor talks it is only a wake-word
 * candidate. In noisy-place mode the floor also needs the wake word or an earbud press first.
 * While a dropped session reconnects, the learner's words are held and sent once it is back.
 */
export class LearnerMic {
  /** Answers need the wake word or an earbud press first (set by the learner, or after noise). */
  noisy = false;
  private armedUntil = 0;
  private pending: string[] | null = null;
  private quiet?: number;
  private wake: WakeWord;
  private speech: SpeechDetector;
  private voice = new VoiceDetector();
  constructor(private host: MicHost) {
    this.wake = new WakeWord(host.position, () => this.wakeListens(), host.called);
    this.speech = new SpeechDetector({
      start: (preroll) => this.start(preroll),
      chunk: (chunk) => {
        if (host.state() !== 'listening') this.wake.chunk(chunk);
        else if (this.pending) this.pending.push(chunk);
        else host.live()?.audio(chunk);
      },
      end: (ms) => this.end(ms),
    });
  }

  /** Loads the voice detector; until it runs, loudness decides. */
  load() {
    return this.voice.load();
  }
  feed(chunk: string, level: number, samples: Float32Array) {
    this.voice.push(samples);
    this.speech.feed(chunk, level, this.voice.ready ? this.voice.probability : null);
  }
  /** What the mic hears right now, for the diagnostics panel. */
  get heard() {
    return { ...this.speech.last, detector: this.voice.ready ? 'silero' : 'loudness' };
  }
  /** While the tutor talks its voice may leak into the mic: ask for clearer speech then. */
  strict(value: boolean) {
    this.speech.threshold = value ? 0.05 : 0.02;
    this.speech.voiceAt = value ? 0.85 : 0.6;
  }
  /** Noisy-place mode: an earbud press opens the floor for the next few seconds. */
  arm(ms = 12000) {
    this.armedUntil = performance.now() + ms;
  }
  private get open() {
    return !this.noisy || performance.now() < this.armedUntil;
  }
  private wakeListens() {
    const state = this.host.state();
    return state === 'teaching' || (state === 'floor' && !this.open);
  }
  /** A new scene: forget held words and any half-heard utterance. */
  reset(keepHeld = false) {
    clearTimeout(this.quiet);
    this.wake.reset();
    if (keepHeld) return;
    this.pending = null;
    this.speech.reset();
    this.voice.reset();
  }

  private start(preroll: string[]) {
    const host = this.host,
      state = host.state();
    if (this.wakeListens()) return this.wake.start(preroll);
    if (state !== 'floor' && state !== 'listening') return;
    clearTimeout(this.quiet);
    this.armedUntil = 0;
    if (state === 'floor' && !host.live() && host.position()) {
      this.pending = [...preroll];
      host.set('listening');
      return host.reconnect();
    }
    host.speaking();
    if (state === 'floor') host.live()?.activity(true);
    preroll.forEach((chunk) => host.live()?.audio(chunk));
    host.set('listening');
  }
  private end(spokenMs: number) {
    if (this.host.state() !== 'listening') return this.wake.end(spokenMs);
    this.host.set('thinking');
    if (this.pending) return; // sent once the session is back
    this.host.live()?.activity(false);
    this.host.sent();
  }

  /** The session is back: held words go in as one turn. */
  flush(live: LiveConnection) {
    live.activity(true);
    for (const chunk of this.pending ?? []) live.audio(chunk);
    this.pending = null;
    if (this.host.state() === 'listening') return;
    live.activity(false);
    this.host.sent();
  }

  /** The wake word cut in: what was said so far goes to the tutor, and they keep talking. */
  speak(spoken: string[]) {
    const live = this.host.live();
    this.armedUntil = 0;
    this.host.set('listening');
    if (!live) {
      this.pending = [...spoken];
      this.host.reconnect();
    } else {
      live.activity(true);
      spoken.forEach((chunk) => live.audio(chunk));
    }
    if (this.speech.active) return;
    // They said only the wake word so far: give them a moment to ask.
    this.quiet = window.setTimeout(() => {
      if (this.host.state() === 'listening' && !this.speech.active) this.end(0);
    }, 3500);
  }
}
