import type { ReplyGate, VoiceState } from '../lesson/voiceTypes';
import { AnswerGate } from './AnswerGate';
import { SpeechDetector } from './speech';
import { VoiceDetector } from './vad';
import { WakeWord } from './wakeWord';

/** What hands-free mode drives: the lesson voice, the lesson itself and the flow. */
export type HandsFreeHost = {
  voice: () => {
    state: VoiceState;
    press: () => void;
    release: () => void;
    stop: () => void;
    play: (data: string, rate: number) => void;
    pushTurn: (chunks: string[]) => void;
  };
  /** The learner is on a question's answer page that is still unanswered. */
  answering: () => boolean;
  answer: (text: string) => void;
  /** Applies a lesson_control call (skip, show the answer, repeat, move, pause). */
  act: (args: Record<string, unknown>) => unknown;
  /** Continue the narration from where the learner is. */
  resume: () => void;
  wakeWord: () => string;
  noisy: () => boolean;
  /** Noise was taken for answers twice in a row: switch noisy-place mode on (and say so). */
  tooNoisy: () => void;
  note?: (text: string) => void;
};

const FOLLOW_UP_MS = 8000; // after the tutor answers a cut-in, silence means "carry on"
const ARMED_MS = 12000; // an earbud press opens the floor this long

/**
 * Hands-free (audio) mode for a normal lesson: the microphone stays open, the Silero voice
 * detector finds utterances, and they become talk turns without holding a button. On an
 * unanswered question the floor is open as long as it takes (in noisy-place mode only after
 * the wake word or an earbud press); while Nova reads, only the wake word or an earbud press
 * cuts in. Replies wait until the learner's transcript shows real words, so noise never gets
 * an answer. A spoken answer is submitted through the lesson's normal answer flow.
 */
export class HandsFree {
  private detector = new VoiceDetector();
  private speech: SpeechDetector;
  private wake: WakeWord;
  private gate: AnswerGate;
  private ours = false;
  private armedUntil = 0;
  private followUpUntil = 0;
  /** A tool call held until the learner's words are known to be real. */
  private pending: (() => void) | null = null;
  private resumeAfterReply = false;
  private answered = false;
  private timers: { quiet?: number; follow?: number } = {};
  constructor(private host: HandsFreeHost) {
    this.speech = new SpeechDetector({
      start: (preroll) => this.started(preroll),
      chunk: (chunk) => !this.ours && this.wake.chunk(chunk),
      end: (ms) => this.ended(ms),
    });
    this.wake = new WakeWord(
      host.wakeWord,
      () => !this.floorOpen(),
      (chunks) => this.cutIn(chunks),
    );
    this.gate = new AnswerGate({
      play: (data, rate) => host.voice().play(data, rate),
      reject: (heard) => this.rejected(heard),
    });
  }

  load() {
    return this.detector.load();
  }
  get detectorName() {
    return this.detector.ready ? 'Silero VAD' : 'loudness';
  }
  get heard() {
    return this.speech.last;
  }

  /** Every microphone chunk (from the lesson voice). */
  capture(chunk: string, level: number, samples: Float32Array) {
    this.detector.push(samples);
    // While Nova talks its voice may leak into the mic: ask for clearer speech then.
    const talking = ['reading', 'speaking'].includes(this.host.voice().state);
    this.speech.voiceAt = talking ? 0.85 : 0.6;
    this.speech.threshold = talking ? 0.05 : 0.02;
    this.speech.feed(chunk, level, this.detector.ready ? this.detector.probability : null);
  }

  /** The reply gate the lesson voice consults for the tutor's own words. */
  get reply(): ReplyGate {
    const gate = this.gate;
    return {
      get holding() {
        return gate.holding;
      },
      hold: (data, rate) => gate.hold(data, rate),
      learner: (text) => gate.heardText(text),
      decide: () => {
        const ok = gate.decide();
        if (ok) this.pending?.();
        this.pending = null;
        return ok;
      },
    };
  }

  /** The tutor's tools, applied only once the learner's words are known to be real. */
  tool(name: string, args: Record<string, unknown>) {
    if (name === 'lesson_control') {
      // The tutor heard words to call it; noise that was taken for words is held, then dropped.
      if (!this.gate.holding || this.gate.realSoFar()) return this.control(args);
      this.pending = () => void this.control(args);
      return { ok: true };
    }
    if (name !== 'submit_answer') return { error: 'Unknown tool.' };
    const text = typeof args.answer === 'string' ? args.answer.trim() : '';
    if (!text || !this.host.answering()) return { error: 'No question is waiting for an answer.' };
    if (this.gate.holding) this.pending = () => this.submit(text);
    else this.submit(text);
    return { ok: true };
  }
  private control(args: Record<string, unknown>) {
    // "Wait" means wait: no carrying on after the reply.
    if (args.action === 'pause') {
      this.resumeAfterReply = false;
      clearTimeout(this.timers.follow);
    }
    return this.host.act(args);
  }
  private submit(text: string) {
    this.host.answer(text);
    this.answered = true;
  }

  /** Is the learner's speech a turn for the tutor right now (rather than a wake candidate)? */
  private floorOpen() {
    const state = this.host.voice().state;
    if (state !== 'idle' && state !== 'listening') return false;
    const now = performance.now();
    if (now < this.armedUntil || now < this.followUpUntil) return true;
    return this.host.answering() && !this.host.noisy();
  }

  private started(preroll: string[]) {
    if (!this.floorOpen()) return this.wake.start(preroll);
    this.open(preroll);
  }
  private open(chunks: string[]) {
    clearTimeout(this.timers.quiet);
    clearTimeout(this.timers.follow);
    this.armedUntil = this.followUpUntil = 0;
    const voice = this.host.voice();
    voice.press();
    voice.pushTurn(chunks);
    this.ours = true;
  }
  private ended(spokenMs: number) {
    if (!this.ours) return this.wake.end(spokenMs);
    this.ours = false;
    this.gate.arm();
    this.host.voice().release();
  }

  /** The wake word was heard while Nova read (or while the floor was closed). */
  private cutIn(chunks: string[]) {
    this.resumeAfterReply = !this.host.answering();
    this.open(chunks);
    if (this.speech.active) return;
    // Only the wake word so far: give them a moment to ask.
    this.timers.quiet = window.setTimeout(
      () => this.ours && !this.speech.active && this.ended(0),
      3500,
    );
  }

  /** An earbud press (or the talk button): stop Nova, or open the floor for a while. */
  press() {
    const state = this.host.voice().state;
    if (state === 'reading' || state === 'speaking') {
      this.host.voice().stop();
      this.resumeAfterReply = !this.host.answering();
      this.host.note?.('الميكروفون مفتوح: اتكلم');
      this.armedUntil = performance.now() + ARMED_MS;
      this.timers.follow = window.setTimeout(() => this.carryOn(), ARMED_MS);
      return;
    }
    this.armedUntil = performance.now() + ARMED_MS;
    this.host.note?.('الميكروفون مفتوح لردّك');
  }

  private rejected(heard: string) {
    this.pending = null;
    this.host.note?.(`تجاهلت صوت مش كلام: «${heard.trim() || '…'}»`);
    if (this.gate.rejected >= 2 && !this.host.noisy()) this.host.tooNoisy();
  }

  /** The lesson voice changed state: after a reply ends, continue or wait for a follow-up. */
  voiceState(state: VoiceState) {
    if (state !== 'idle' || this.ours) return;
    if (this.answered) {
      // The answer went in: the lesson shows the model answer, and Nova reads it now.
      this.answered = false;
      return void window.setTimeout(() => this.carryOn(), 400);
    }
    if (!this.resumeAfterReply) return;
    if (this.host.answering()) return; // still waiting for the answer
    this.followUpUntil = performance.now() + FOLLOW_UP_MS;
    clearTimeout(this.timers.follow);
    this.timers.follow = window.setTimeout(() => this.carryOn(), FOLLOW_UP_MS);
  }
  private carryOn() {
    if (this.ours || this.speech.active || this.host.voice().state !== 'idle') return;
    this.resumeAfterReply = false;
    this.followUpUntil = this.armedUntil = 0;
    this.host.resume();
  }

  stop() {
    for (const timer of Object.values(this.timers)) clearTimeout(timer);
    this.gate.cancel();
    this.speech.reset();
    this.wake.reset();
    this.ours = false;
  }
}
