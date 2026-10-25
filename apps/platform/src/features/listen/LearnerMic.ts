import type { LiveConnection } from '../nova/voice/LiveConnection';
import type { ListenPosition, ListenState } from './listenTypes';
import { SpeechDetector } from './speech';
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
  /** The wake word was heard while the tutor talked (these chunks include it). */
  called: (chunks: string[]) => void;
  /** The learner's turn was sent; a reply is coming. */
  sent: () => void;
};

/**
 * The learner's side of the always-open microphone. On the floor, speech becomes a manual
 * activity turn for the tutor; while the tutor talks, speech is only a wake-word candidate.
 * While a dropped session reconnects, the learner's words are held and sent once it is back.
 */
export class LearnerMic {
  private pending: string[] | null = null;
  private quiet?: number;
  private wake: WakeWord;
  private speech: SpeechDetector;
  constructor(private host: MicHost) {
    this.wake = new WakeWord(host.position, () => host.state() === 'teaching', host.called);
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

  feed(chunk: string, level: number) {
    this.speech.feed(chunk, level);
  }
  /** On a loudspeaker the tutor's voice leaks into the mic: ask for louder speech then. */
  strict(value: boolean) {
    this.speech.threshold = value ? 0.05 : 0.02;
  }
  /** A new scene: forget held words and any half-heard utterance. */
  reset(keepHeld = false) {
    clearTimeout(this.quiet);
    this.wake.reset();
    if (keepHeld) return;
    this.pending = null;
    this.speech.reset();
  }

  private start(preroll: string[]) {
    const host = this.host,
      state = host.state();
    if (state === 'floor' && !host.live() && host.position()) {
      this.pending = [...preroll];
      host.set('listening');
      return host.reconnect();
    }
    if (state === 'floor' || state === 'listening') {
      clearTimeout(this.quiet);
      host.speaking();
      if (state === 'floor') host.live()?.activity(true);
      preroll.forEach((chunk) => host.live()?.audio(chunk));
      host.set('listening');
    } else if (state === 'teaching') this.wake.start(preroll);
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
    live?.activity(true);
    spoken.forEach((chunk) => live?.audio(chunk));
    this.host.set('listening');
    if (this.speech.active) return;
    // They said only the wake word so far: give them a moment to ask.
    this.quiet = window.setTimeout(() => {
      if (this.host.state() === 'listening' && !this.speech.active) this.end(0);
    }, 3500);
  }
}
