import { AudioSession } from '../voice/AudioSession';
import { LiveConnection } from '../voice/LiveConnection';
import type { Position } from '../types';
import { reason } from './voiceError';
import { LessonTeach } from './LessonTeach';
import type { TeachEvents, TeachLine } from './teach';
import { IDLE_CLOSE_MS, REPLY_WAIT_MS, talkToken } from './voiceTypes';
import type { Session, VoiceEvents, VoiceState } from './voiceTypes';

export type { VoiceEvents, VoiceState } from './voiceTypes';
export type { TeachEvents, TeachLine } from './teach';

/**
 * One live tutor session per lesson: teaching the lesson aloud and hold-to-talk questions
 * (talking always wins). The microphone opens on the first hold; the session opens on first
 * use, stays warm, closes after two quiet minutes, and a dropped one reopens on next use.
 */
export class LessonVoice {
  private s: Session | null = null;
  private holding = false;
  private stale = false;
  private starting = false;
  private turn = false;
  /** generating: the model is producing a response (until turnComplete or interrupted).
   * discard: audio still arriving from a reply that was cut; dropped until that reply ends. */
  private flags = { generating: false, discard: false };
  private volume = 0.9;
  /** Hands-free mode: the microphone stays open (and the session with it) the whole time. */
  private listening = false;
  private timers: { idle?: number; reply?: number } = {};
  private teacher = new LessonTeach({
    session: () => this.session(),
    current: () => this.s,
    busy: () => this.holding || this.turn,
    reading: () => this.set('reading'),
    idle: () => !this.holding && !this.turn && this.set('idle'),
    armIdle: () => this.armIdle(),
    flags: this.flags,
  });
  constructor(private on: () => VoiceEvents) {}
  private get teaching() {
    return this.teacher.job;
  }

  private set(state: VoiceState) {
    this.on().state(state);
  }
  private session(): Session {
    if (this.s) return this.s;
    const s = { ready: false, talking: false, buffer: [] } as unknown as Session;
    s.audio = new AudioSession(() => this.drained(s));
    s.audio.setVolume(this.volume);
    s.live = new LiveConnection({
      audio: (data, rate) => {
        if (this.holding || this.flags.discard) return;
        // A reply to a hands-free turn waits until the learner's words are known to be real
        // (the reply timer keeps running, so a dropped reply that never ends can't hang).
        const gate = this.on().reply;
        if (!this.teaching && gate?.holding) return gate.hold(data, rate);
        clearTimeout(this.timers.reply);
        this.play(data, rate);
      },
      interrupted: () => {
        this.flags.generating = this.flags.discard = false;
        if (!this.teaching) s.audio.interrupt();
      },
      complete: () => {
        this.flags.generating = false;
        if (this.flags.discard) return void (this.flags.discard = false);
        if (!this.teacher.complete(s)) {
          const gate = this.on().reply;
          if (gate?.holding && !gate.decide()) {
            this.finish(); // noise: say nothing, and wait again
            if (!this.holding) this.set('idle');
            return this.armIdle();
          }
          // The turn ends first: on a slow network the reply may have played out already,
          // and finishing the audio then goes idle at once.
          this.finish();
          s.audio.finish();
        }
        this.armIdle();
      },
      transcript: (role, text) => {
        if (role === 'user') this.on().reply?.learner(text);
        if (this.teaching || this.flags.discard) return;
        if (role === 'user') this.on().heard(text);
        else if (!this.on().reply?.holding) this.on().said(text);
      },
      error: (message) => {
        if (this.s !== s) return;
        const mid = this.turn;
        this.teacher.end('failed');
        this.close();
        if (mid) this.finish(message);
      },
      answer: () => ({ error: 'Not available in lesson talk.' }),
      tool: (name, args) => this.on().tool?.(name, args) ?? { error: 'Unknown tool.' },
    });
    this.s = s;
    if (this.listening) void this.mic(s).catch(() => undefined);
    s.connected = this.connect(s);
    s.connected.catch(() => {
      if (this.s !== s) return;
      this.teacher.end('failed');
      this.close();
    });
    return s;
  }
  private async connect(s: Session) {
    const position = this.on().position();
    if (!position) throw new Error('الدرس لسه بيحمّل.');
    const token = await talkToken(position, this.on().setup?.());
    if (this.s !== s) throw new Error('المكالمة اتقفلت.');
    await s.live.connect(token);
    s.ready = true;
    for (const text of this.on().primer()) if (text) s.live.note(text);
  }
  private mic(s: Session) {
    s.mic ??= s.audio
      .capture((chunk, level, samples) => {
        this.on().capture?.(chunk, level, samples);
        if (!this.holding) return;
        if (s.talking) s.live.audio(chunk);
        else s.buffer.push(chunk);
      })
      .catch((error) => {
        s.mic = undefined;
        throw error;
      });
    return s.mic;
  }
  private drained(s: Session) {
    if (this.s !== s || this.teacher.drained() || this.holding) return;
    if (!this.turn) return this.set('idle');
    // The reply ran out of audio before it ended (a stall, or a lost turnComplete): more
    // audio clears this; otherwise the turn ends, so Nova never stays "speaking" in silence.
    clearTimeout(this.timers.reply);
    this.timers.reply = window.setTimeout(() => {
      this.finish();
      if (!this.holding) this.set('idle');
    }, REPLY_WAIT_MS);
  }
  private armIdle() {
    if (this.stale && this.s && !this.holding && !this.teaching && !this.turn) return this.close();
    clearTimeout(this.timers.idle);
    if (this.listening) return; // waiting for the learner, however long it takes
    this.timers.idle = window.setTimeout(() => {
      if (!this.holding && !this.teaching && !this.turn) this.close();
    }, IDLE_CLOSE_MS);
  }
  private finish(message?: string) {
    clearTimeout(this.timers.reply);
    if (!this.turn) return;
    this.turn = false;
    if (message) this.on().failed(message);
    else this.on().done();
  }

  press() {
    if (this.holding) return;
    this.holding = true;
    clearTimeout(this.timers.idle);
    this.teacher.end('cut');
    const s = this.session();
    s.audio.interrupt();
    this.set(s.ready ? 'listening' : 'connecting');
    // An earlier hold is still starting: it carries on with this one.
    if (this.starting) return;
    this.finish();
    this.turn = true;
    this.starting = true;
    this.on().begin();
    Promise.all([s.connected, this.mic(s)]).then(
      () => {
        this.starting = false;
        if (this.s !== s) return;
        s.audio.setMuted(false);
        s.live.activity(true);
        s.talking = true;
        for (const chunk of s.buffer.splice(0)) s.live.audio(chunk);
        if (this.holding) this.set('listening');
        else this.answer(s);
      },
      (error: unknown) => {
        this.starting = false;
        this.holding = false;
        this.set('idle');
        this.finish(reason(error));
      },
    );
  }
  release() {
    if (!this.holding) return;
    this.holding = false;
    const s = this.s;
    if (!this.listening) s?.audio.setMuted(true); // hands-free keeps hearing (nothing is sent)
    if (s?.talking) this.answer(s);
  }
  private answer(s: Session) {
    s.talking = false;
    s.buffer = [];
    s.live.activity(false);
    this.flags.generating = true;
    this.set('thinking');
    clearTimeout(this.timers.reply);
    this.timers.reply = window.setTimeout(() => {
      this.set('idle');
      this.finish('Nova مردتش المرة دي. جرّب تاني.');
    }, REPLY_WAIT_MS);
    this.armIdle();
  }
  /** Stop Nova talking (a tap while it answers). */
  stop() {
    this.teacher.end('cut');
    this.s?.audio.interrupt();
    this.finish();
    this.set('idle');
  }

  /** Read these lines aloud (see LessonTeach). */
  teach(lines: TeachLine[], on: TeachEvents) {
    this.teacher.start(lines, on);
  }
  endTeach(result: 'done' | 'cut' | 'failed') {
    this.teacher.end(result);
  }
  /** Plays a chunk of the tutor's own words (also used by a reply gate once it opens). */
  play(data: string, rate: number) {
    const s = this.s;
    if (!s) return;
    this.set(this.teaching ? 'reading' : 'speaking');
    this.teacher.heard(s.audio.enqueue(data, rate));
  }
  /** Hands-free mode: open the session and the microphone now, not on the first hold. */
  listen(on: boolean) {
    this.listening = on;
    if (on) return this.mic(this.session());
  }
  /** Hands-free mode: audio from just before a turn started (so its first word is kept). */
  pushTurn(chunks: string[]) {
    const s = this.s;
    if (!s || !this.holding) return;
    if (s.talking) chunks.forEach((chunk) => s.live.audio(chunk));
    else s.buffer.push(...chunks);
  }
  setVolume(value: number) {
    this.volume = value;
    this.s?.audio.setVolume(value);
  }
  /** Silent context while a session is open (e.g. the learner moved on). */
  tell(text: string) {
    if (this.s?.ready) this.s.live.note(text);
  }
  /** New voice settings apply from Nova's next sentence on: a quiet session reopens now. */
  restyle() {
    if (!this.s) return;
    this.stale = true;
    this.armIdle();
  }
  close() {
    const s = this.s;
    this.s = null;
    this.stale = false;
    this.teacher.end('cut');
    this.flags.generating = this.flags.discard = false;
    s?.live.close();
    s?.audio.close();
    for (const timer of Object.values(this.timers)) clearTimeout(timer);
    this.holding = false;
    this.starting = false;
    this.set('idle');
    // Hands-free: a closed or dropped session comes straight back, with its microphone.
    if (this.listening)
      window.setTimeout(
        () => this.listening && !this.s && void this.listen(true)?.catch(() => undefined),
        500,
      );
  }
}
