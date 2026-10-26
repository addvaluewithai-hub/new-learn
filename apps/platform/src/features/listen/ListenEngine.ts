import { ListenCore } from './ListenCore';

export type { ListenEvents, ListenPosition, ListenState } from './listenTypes';

/** A listen-mode run with the learner's controls: talk, pause, move between scenes, stop,
 * noisy-place mode, and what the mic hears (for the diagnostics panel). */
export class ListenEngine extends ListenCore {
  /** Noisy-place mode: answers need the wake word or an earbud press first. */
  noisy(on: boolean) {
    this.mic.noisy = on;
    this.on.noisy?.(on);
  }
  get heard() {
    return { ...this.mic.heard, drifts: this.reader.drifts };
  }
  /** The learner wants to talk (talk button, headset press). */
  talk() {
    if (this.current === 'floor' && this.mic.noisy) {
      this.mic.arm();
      return this.on.diag?.('الميكروفون مفتوح لردّك');
    }
    if (['teaching', 'thinking', 'floor'].includes(this.current)) this.takeFloor();
  }
  pause() {
    if (['paused', 'idle', 'finished'].includes(this.current)) return;
    this.before = this.current;
    this.clear('floor', 'reply');
    void this.audio?.setPaused(true);
    this.set('paused');
  }
  resume() {
    if (this.current !== 'paused') return;
    void this.audio?.setPaused(false);
    if (this.before === 'floor' || this.before === 'listening') this.openFloor();
    else this.set(this.before);
  }
  previous = () => this.step(-1);
  restart = () => this.position && void this.open(this.position);
  stop = () => this.end('idle');
}
