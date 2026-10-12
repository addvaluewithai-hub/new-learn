import { api } from '../../../shared/api';
import { AudioSession } from '../voice/AudioSession';
import { LiveConnection, type LiveToken } from '../voice/LiveConnection';
import type { Position } from '../types';
import { reason } from './voiceError';
import { teachMessage, type TeachEvents, type TeachLine } from './teach';

export type { TeachEvents, TeachLine } from './teach';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'reading';
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
type Session = {
  audio: AudioSession;
  live: LiveConnection;
  ready: boolean;
  connected: Promise<void>;
  mic?: Promise<void>;
  /** The learner's turn is open on the server (activityStart sent). */
  talking: boolean;
  buffer: string[];
};
type TeachJob = {
  lines: TeachLine[];
  on: TeachEvents;
  sent: boolean;
  complete: boolean;
  shown: number;
  flips: number[];
};
const IDLE_CLOSE_MS = 120_000;
const REPLY_WAIT_MS = 20_000;

/**
 * One live tutor session per lesson, used two ways: teaching the lesson aloud (a stretch of
 * numbered lines per message, Nova moving the board itself with show_step) and hold-to-talk
 * questions. Talking always wins: a hold cuts the teaching. The
 * microphone opens only on the first hold; the session opens on first use, stays warm, and
 * closes after two quiet minutes. A dropped session is reopened by the next use.
 */
export class LessonVoice {
  private s: Session | null = null;
  private holding = false;
  private starting = false;
  private turn = false;
  private teaching: TeachJob | null = null;
  /** The model is producing a response (until turnComplete or interrupted). */
  private generating = false;
  /** Audio still arriving from teaching that was cut; dropped until that response ends. */
  private discard = false;
  private volume = 0.9;
  private timers: { idle?: number; reply?: number; read?: number } = {};
  constructor(private on: () => VoiceEvents) {}

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
        if (this.holding || this.discard) return;
        clearTimeout(this.timers.reply);
        clearTimeout(this.timers.read);
        this.set(this.teaching ? 'reading' : 'speaking');
        s.audio.enqueue(data, rate);
      },
      interrupted: () => {
        this.generating = false;
        this.discard = false;
        if (!this.teaching) s.audio.interrupt();
      },
      complete: () => {
        this.generating = false;
        if (this.discard) {
          this.discard = false;
          return;
        }
        s.audio.finish();
        if (this.teaching?.sent) {
          this.teaching.complete = true;
          if (!s.audio.speaking) this.endTeach('done');
        } else this.finish();
        this.armIdle();
      },
      tool: (name, args) => this.moved(s, name, args),
      transcript: (role, text) => {
        if (this.teaching || this.discard) return;
        if (role === 'user') this.on().heard(text);
        else this.on().said(text);
      },
      error: (message) => {
        if (this.s !== s) return;
        const mid = this.turn;
        this.endTeach('failed');
        this.close();
        if (mid) this.finish(message);
      },
      answer: () => ({ error: 'Not available in lesson talk.' }),
    });
    this.s = s;
    s.connected = this.connect(s);
    s.connected.catch(() => {
      if (this.s !== s) return;
      this.endTeach('failed');
      this.close();
    });
    return s;
  }
  private async connect(s: Session) {
    const position = this.on().position();
    if (!position) throw new Error('الدرس لسه بيحمّل.');
    const token = await api<LiveToken>('/nova/live', { ...position, purpose: 'talk' });
    if (this.s !== s) throw new Error('المكالمة اتقفلت.');
    await s.live.connect(token);
    s.ready = true;
    for (const text of this.on().primer()) if (text) s.live.note(text);
  }
  private mic(s: Session) {
    s.mic ??= s.audio
      .capture((chunk) => {
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
    if (this.s !== s) return;
    if (this.teaching?.complete) this.endTeach('done');
    else if (!this.holding && !this.turn) this.set('idle');
  }
  private armIdle() {
    clearTimeout(this.timers.idle);
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
    this.endTeach('cut');
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
    s?.audio.setMuted(true);
    if (s?.talking) this.answer(s);
  }
  private answer(s: Session) {
    s.talking = false;
    s.buffer = [];
    s.live.activity(false);
    this.generating = true;
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
    this.endTeach('cut');
    this.s?.audio.interrupt();
    this.finish();
    this.set('idle');
  }

  /**
   * Teach these lines in one go: Nova reads them continuously and moves the board itself
   * (show_step) as it reaches each one, stopping after a question. One message, one reply.
   */
  teach(lines: TeachLine[], on: TeachEvents) {
    this.endTeach('cut');
    if (this.holding || this.turn || !lines.length) return;
    clearTimeout(this.timers.idle);
    const s = this.session();
    const job: TeachJob = { lines, on, sent: false, complete: false, shown: -1, flips: [] };
    this.teaching = job;
    this.set('reading');
    s.connected.then(
      () => {
        if (this.teaching !== job) return;
        // A response still running is cut by this message; drop what is left of it.
        if (this.generating) this.discard = true;
        s.audio.interrupt();
        s.live.text(teachMessage(lines));
        job.sent = true;
        this.generating = true;
        this.timers.read = window.setTimeout(() => this.endTeach('failed'), REPLY_WAIT_MS);
      },
      () => this.teaching === job && this.endTeach('failed'),
    );
  }
  private moved(s: Session, name: string, args: Record<string, unknown>) {
    if (name !== 'show_step') return { error: 'Unknown tool' };
    const job = this.teaching;
    const n = Number(args.step);
    if (job && !this.discard && n > job.shown && job.lines.some((line) => line.n === n)) {
      job.shown = n;
      // The call arrives as the speech is generated, ahead of playback: turn the page when
      // the audio received so far has played, i.e. as Nova starts saying this line.
      const at = s.audio.endsIn * 1000;
      job.flips.push(window.setTimeout(() => this.teaching === job && job.on.show(n), at));
    }
    return { result: 'ok', scheduling: 'SILENT' };
  }
  endTeach(result: 'done' | 'cut' | 'failed') {
    const job = this.teaching;
    if (!job) return;
    this.teaching = null;
    clearTimeout(this.timers.read);
    job.flips.forEach(clearTimeout);
    if (result !== 'done') {
      this.s?.audio.interrupt();
      if (this.generating) this.discard = true;
    }
    if (!this.holding && !this.turn) this.set('idle');
    this.armIdle();
    if (result === 'done') job.on.done(job.shown);
    if (result === 'failed') job.on.failed();
  }
  setVolume(value: number) {
    this.volume = value;
    this.s?.audio.setVolume(value);
  }
  /** Silent context while a session is open (e.g. the learner moved on). */
  tell(text: string) {
    if (this.s?.ready) this.s.live.note(text);
  }
  close() {
    const s = this.s;
    this.s = null;
    this.endTeach('cut');
    this.discard = false;
    this.generating = false;
    s?.live.close();
    s?.audio.close();
    for (const timer of Object.values(this.timers)) clearTimeout(timer);
    this.holding = false;
    this.starting = false;
    this.set('idle');
  }
}
