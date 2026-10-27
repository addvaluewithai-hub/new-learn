import { normalize } from './words';

/** One-word replies that are real answers or requests. */
const SHORT = new Set(
  [
    'كمل',
    'عيد',
    'فوت',
    'تمام',
    'ايوه',
    'اه',
    'لا',
    'لأ',
    'معرفش',
    'التالي',
    'continue',
    'repeat',
    'skip',
    'yes',
    'no',
    'ok',
    'okay',
    'next',
  ].flatMap(normalize),
);

/**
 * Did the learner say real words? Noise sent as speech comes back from the transcriber as
 * nothing, a lone filler, or words of another language (a bathroom fan became "¿Qué?").
 * Real answers here are Arabic or English, usually more than one word.
 */
export function realWords(text: string) {
  if (/[¿¡ñáéíóúüàèìòùç]/i.test(text)) return false;
  const words = normalize(text);
  const known = words.filter((w) => /[ء-ي]/.test(w) || /^[a-z]+$/.test(w));
  if (known.length < words.length / 2) return false;
  if (known.length >= 2) return true;
  return known.length === 1 && SHORT.has(known[0]);
}

export type GateHost = {
  play: (data: string, rate: number) => void;
  /** The learner's words were not real: the tutor's reply was dropped unheard. */
  reject: (heard: string) => void;
};

/**
 * Holds the tutor's reply to a learner turn until the learner's transcript shows real words.
 * Then the held audio plays and the rest streams; otherwise it is dropped and nothing is heard.
 */
export class AnswerGate {
  private judging = false;
  /** Rejected before the reply ended: the rest of it is dropped too, until it ends. */
  private dropping = false;
  private held: Array<[string, number]> = [];
  private heard = '';
  private timer?: number;
  /** Rejections in a row (two switch on the noisy-place mode). */
  rejected = 0;
  constructor(private host: GateHost) {}

  get holding() {
    return this.judging || this.dropping;
  }
  arm() {
    this.cancel();
    this.judging = true;
  }
  heardText(text: string) {
    if (this.judging) this.heard += text;
  }
  hold(data: string, rate: number) {
    if (this.dropping) return;
    this.held.push([data, rate]);
    // The learner's transcript usually arrives first; give it a moment if it hasn't.
    this.timer ??= window.setTimeout(() => (this.dropping = !this.decide()), 600);
  }
  /** Returns whether the reply may be heard (the reply ended, or it is time to judge). */
  decide() {
    if (this.dropping) {
      this.dropping = false;
      return false;
    }
    if (!this.judging) return true;
    const heard = this.heard,
      held = this.held;
    this.cancel();
    if (!realWords(heard)) {
      this.rejected++;
      this.host.reject(heard);
      return false;
    }
    this.rejected = 0;
    held.forEach(([data, rate]) => this.host.play(data, rate));
    return true;
  }
  cancel() {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.judging = this.dropping = false;
    this.held = [];
    this.heard = '';
  }
}
