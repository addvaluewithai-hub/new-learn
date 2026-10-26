import { AnswerGate } from './AnswerGate';
import { HeardTracker } from './pcmJoin';

export type WordsHost = {
  enqueue: (data: string, rate: number) => number;
  /** The tutor's own words started playing. */
  started: () => void;
  /** The learner's turn was not real words; the reply was dropped unheard. */
  reject: (heard: string) => void;
  log: (text: string) => void;
};

/**
 * The tutor's own words (its verdict and its replies when the learner cuts in), as opposed
 * to the script. A reply to a learner turn is held until the learner's transcript shows real
 * words; what was actually heard is tracked so an interruption can say where it stopped.
 */
export class TutorWords {
  heard = new HeardTracker();
  private gate: AnswerGate;
  constructor(private host: WordsHost) {
    this.gate = new AnswerGate({ play: (d, r) => this.play(d, r), reject: host.reject });
  }
  /** Learner turns judged not to be real words, in a row. */
  get rejected() {
    return this.gate.rejected;
  }
  /** A learner turn was sent: hold the reply until we know they said real words. */
  expect() {
    this.gate.arm();
  }
  learner(text: string) {
    this.gate.heardText(text);
  }
  audio(data: string, rate: number) {
    if (this.gate.holding) return this.gate.hold(data, rate);
    this.play(data, rate);
  }
  private play(data: string, rate: number) {
    this.host.started();
    this.heard.queued(this.host.enqueue(data, rate));
  }
  said(text: string) {
    if (this.gate.holding) return;
    this.heard.said(text);
    this.host.log(text);
  }
  /** The reply ended. False: it was dropped (the learner's words were not real). */
  complete() {
    return this.gate.decide();
  }
  reset() {
    this.gate.cancel();
    this.heard.reset();
  }
}
