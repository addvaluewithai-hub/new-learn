import { api } from '../../../shared/api';
import { AudioSession } from '../voice/AudioSession';
import { LiveConnection, type LiveToken } from '../voice/LiveConnection';
import type { Position } from '../types';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'reading';
export type ReadResult = 'done' | 'cut' | 'failed';
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
type ReadJob = { resolve: (result: ReadResult) => void; sent: boolean; complete: boolean };
const IDLE_CLOSE_MS = 120_000;
const REPLY_WAIT_MS = 20_000;

const reason = (error: unknown) =>
  error instanceof Error && error.name === 'NotAllowedError'
    ? 'اسمح بالميكروفون من المتصفح، أو اكتب سؤالك.'
    : error instanceof Error
      ? error.message
      : 'تعذّر الكلام مع Nova.';

/**
 * One live tutor session per lesson, used two ways: reading the lesson aloud (one READ turn
 * per step) and hold-to-talk questions. Talking always wins: a hold cuts the reading. The
 * microphone opens only on the first hold; the session opens on first use, stays warm, and
 * closes after two quiet minutes. A dropped session is reopened by the next use.
 */
export class LessonVoice {
  private s: Session | null = null;
  private holding = false;
  private starting = false;
  private turn = false;
  private reading: ReadJob | null = null;
  /** Audio still arriving from a reading that was cut; dropped until that turn ends. */
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
        this.set(this.reading ? 'reading' : 'speaking');
        s.audio.enqueue(data, rate);
      },
      interrupted: () => {
        this.discard = false;
        if (!this.reading) s.audio.interrupt();
      },
      complete: () => {
        if (this.discard) {
          this.discard = false;
          return;
        }
        s.audio.finish();
        if (this.reading?.sent) {
          this.reading.complete = true;
          if (!s.audio.speaking) this.endRead('done');
        } else this.finish();
        this.armIdle();
      },
      transcript: (role, text) => {
        if (this.reading || this.discard) return;
        if (role === 'user') this.on().heard(text);
        else this.on().said(text);
      },
      error: (message) => {
        if (this.s !== s) return;
        const mid = this.turn;
        this.endRead('failed');
        this.close();
        if (mid) this.finish(message);
      },
      answer: () => ({ error: 'Not available in lesson talk.' }),
    });
    this.s = s;
    s.connected = this.connect(s);
    s.connected.catch(() => {
      if (this.s !== s) return;
      this.endRead('failed');
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
    if (this.reading?.complete) this.endRead('done');
    else if (!this.holding && !this.turn) this.set('idle');
  }
  private armIdle() {
    clearTimeout(this.timers.idle);
    this.timers.idle = window.setTimeout(() => {
      if (!this.holding && !this.reading && !this.turn) this.close();
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
    this.endRead('cut');
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
    this.endRead('cut');
    this.s?.audio.interrupt();
    this.finish();
    this.set('idle');
  }

  /** Read a lesson line aloud, word for word. Resolves when the audio has finished. */
  read(text: string): Promise<ReadResult> {
    this.endRead('cut');
    if (this.holding || this.turn) return Promise.resolve('cut');
    clearTimeout(this.timers.idle);
    const s = this.session();
    return new Promise((resolve) => {
      const job: ReadJob = { resolve, sent: false, complete: false };
      this.reading = job;
      this.set('reading');
      s.connected.then(
        () => {
          if (this.reading !== job) return;
          s.audio.interrupt();
          s.live.text(`READ:\n${text}`);
          job.sent = true;
          this.timers.read = window.setTimeout(() => this.endRead('failed'), REPLY_WAIT_MS);
        },
        () => this.reading === job && this.endRead('failed'),
      );
    });
  }
  endRead(result: ReadResult) {
    const job = this.reading;
    if (!job) return;
    this.reading = null;
    clearTimeout(this.timers.read);
    if (result !== 'done') {
      this.s?.audio.interrupt();
      if (job.sent && !job.complete) this.discard = true;
    }
    if (!this.holding && !this.turn) this.set('idle');
    this.armIdle();
    job.resolve(result);
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
    this.endRead('cut');
    this.discard = false;
    s?.live.close();
    s?.audio.close();
    for (const timer of Object.values(this.timers)) clearTimeout(timer);
    this.holding = false;
    this.starting = false;
    this.set('idle');
  }
}
