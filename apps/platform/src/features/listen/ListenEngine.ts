import { api } from '../../shared/api';
import { AudioSession } from '../nova/voice/AudioSession';
import { LiveConnection, type LiveToken } from '../nova/voice/LiveConnection';
import { voiceStyle } from '../nova/voice/voicePrefs';
import { HeardTracker } from './pcmJoin';
import { SpeechDetector } from './speech';
import { WakeWord } from './wakeWord';
import { notes, REPLY_MS } from './listenTypes';
import type { ListenEvents, ListenPosition, ListenState } from './listenTypes';

export type { ListenEvents, ListenPosition, ListenState } from './listenTypes';

/**
 * Runs an audio-only lesson: one live tutor session per scene. When the tutor's turn ends the
 * learner has the floor until they speak; while it talks, the wake word, a headset press or the
 * talk button cut in. The mic stays open for the whole run, so it works with the screen off.
 */
export class ListenEngine {
  private audio: AudioSession | null = null;
  private live: LiveConnection | null = null;
  private position: ListenPosition | null = null;
  private current: ListenState = 'idle';
  private before: ListenState = 'idle';
  private gen = 0;
  private advance = false;
  /** Audio of a reply the learner cut off is dropped until that reply ends. */
  private discard = false;
  private generating = false;
  private retried = false;
  /** Learner speech held while a dropped session reconnects. */
  private pending: string[] | null = null;
  private timers: { floor?: number; reply?: number; done?: number; quiet?: number } = {};
  private heardText = new HeardTracker();
  private wake = new WakeWord(
    () => this.position,
    () => this.current === 'teaching',
    (chunks) => this.takeFloor(chunks),
  );
  private speech = new SpeechDetector({
    start: (preroll) => this.speechStart(preroll),
    chunk: (chunk) =>
      this.current !== 'listening'
        ? this.wake.chunk(chunk)
        : this.pending
          ? this.pending.push(chunk)
          : this.live?.audio(chunk),
    end: (ms) => this.speechEnd(ms),
  });
  constructor(private on: ListenEvents) {}

  private set(state: ListenState) {
    this.current = state;
    // On a loudspeaker the tutor's own voice leaks into the mic: ask for louder speech then.
    this.speech.threshold = state === 'teaching' ? 0.05 : 0.02;
    this.on.state(state);
  }
  private clear(...names: Array<keyof ListenEngine['timers']>) {
    for (const name of names) clearTimeout(this.timers[name]);
  }

  /** From a tap: opens the microphone once for the whole run, then starts this scene. */
  async start(position: ListenPosition) {
    if (!this.audio) {
      const audio = new AudioSession(() => this.drained());
      this.audio = audio;
      try {
        await audio.capture((chunk, level) => this.speech.feed(chunk, level));
      } catch (error) {
        this.stop();
        throw error;
      }
    }
    await this.open(position);
  }

  /** Opens a scene's session. With `answering`, the learner is already speaking into a
   * session that dropped while it waited: no new scene, no START, their speech goes in. */
  private async open(position: ListenPosition, resume = '', answering = false) {
    const gen = ++this.gen;
    this.live?.close();
    this.live = null;
    this.clear('floor', 'reply', 'done', 'quiet');
    this.audio?.interrupt();
    Object.assign(this, { position, advance: false, discard: false, generating: false });
    this.heardText.reset();
    this.wake.reset();
    if (!answering) {
      this.pending = null;
      this.speech.reset();
      this.on.scene(position);
      this.set('connecting');
    }
    const mine = () => gen === this.gen;
    try {
      const token = await api<LiveToken>('/listen/live', { ...position, style: voiceStyle() });
      if (!mine()) return;
      const live = new LiveConnection({
        audio: (data, rate) => mine() && this.tutorAudio(data, rate),
        interrupted: () => {
          if (mine()) this.discard = this.generating = false;
        },
        complete: () => mine() && this.turnOver(),
        transcript: (role, text) => {
          if (!mine()) return;
          if (role === 'user') return this.on.heard(text);
          this.heardText.said(text);
          if (!this.discard) this.on.said(text);
        },
        error: (message) => mine() && this.dropped(message),
        answer: () => ({ error: 'Not available here.' }),
        tool: (name) => (name === 'scene_done' ? this.sceneDone(mine) : { error: 'Unknown tool' }),
      });
      this.live = live;
      await live.connect(token);
      if (!mine()) return live.close();
      if (resume) live.note(resume);
      if (answering) return this.flushAnswer(live);
      live.text('START');
      this.set('thinking');
      this.armReply();
    } catch (error) {
      if (mine()) this.dropped(error instanceof Error ? error.message : 'تعذّر الاتصال.');
    }
  }

  private sceneDone(mine: () => boolean) {
    this.advance = true;
    this.clear('done'); // no closing speech within 8 s: move on anyway
    this.timers.done = window.setTimeout(
      () => mine() && !this.audio?.speaking && this.next(),
      8000,
    );
    return { ok: true };
  }

  /** Learner speech held during a reconnect goes in as one turn. */
  private flushAnswer(live: LiveConnection) {
    live.activity(true);
    for (const chunk of this.pending ?? []) live.audio(chunk);
    this.pending = null;
    if (this.current === 'listening') return;
    live.activity(false);
    this.armReply();
  }

  /** A dropped session reopens once, telling the tutor what was already heard. While the
   * tutor waits for an answer, it stays closed (silent) until the learner starts talking. */
  private dropped(message: string) {
    const position = this.position;
    if (this.current === 'floor') {
      this.live?.close();
      this.live = null;
      return;
    }
    if (position && !this.retried && this.current !== 'finished') {
      this.retried = true;
      return void this.open(position, notes.resume(this.heardText.heard()));
    }
    this.retried = false;
    this.live?.close();
    this.live = null;
    this.set('idle');
    this.on.error(message);
  }

  private tutorAudio(data: string, rate: number) {
    this.generating = true;
    if (this.discard || !this.audio || ['floor', 'listening'].includes(this.current)) return;
    this.clear('reply');
    if (this.current !== 'paused') this.set('teaching');
    this.heardText.queued(this.audio.enqueue(data, rate));
  }

  private turnOver() {
    this.clear('reply');
    this.generating = false;
    if (this.discard) return void (this.discard = false);
    this.retried = false;
    this.audio?.finish();
  }

  /** Everything the tutor said has finished playing. */
  private drained() {
    if (this.advance) return this.next();
    if (this.current === 'teaching' || this.current === 'thinking') this.openFloor();
  }

  /** The learner's turn. With no `wait` it lasts until they speak, however long that takes
   * (the tutor asked something); with one, silence means "carry on" (they cut in, then
   * said nothing). */
  private openFloor(wait?: number) {
    this.heardText.reset();
    this.set('floor');
    this.clear('floor');
    if (wait === undefined) return;
    this.timers.floor = window.setTimeout(() => {
      if (this.current !== 'floor') return;
      this.live?.text('SILENCE');
      this.set('thinking');
      this.armReply();
    }, wait);
  }

  private armReply() {
    this.clear('reply');
    this.timers.reply = window.setTimeout(() => {
      if (this.current === 'thinking') this.openFloor();
    }, REPLY_MS);
  }

  private speechStart(preroll: string[]) {
    if (this.current === 'floor' && !this.live && this.position) {
      // The session dropped while waiting: reconnect now, holding their words meanwhile.
      this.pending = [...preroll];
      this.set('listening');
      return void this.open(this.position, notes.waiting(this.heardText.last), true);
    }
    if (this.current === 'floor' || this.current === 'listening') {
      this.clear('floor', 'quiet');
      if (this.current === 'floor') this.live?.activity(true);
      preroll.forEach((chunk) => this.live?.audio(chunk));
      this.set('listening');
    } else if (this.current === 'teaching') this.wake.start(preroll);
  }
  private speechEnd(spokenMs: number) {
    if (this.current !== 'listening') return this.wake.end(spokenMs);
    this.set('thinking');
    if (this.pending) return; // sent once the session is back
    this.live?.activity(false);
    this.armReply();
  }

  /** The learner wants to talk (talk button, headset press). */
  talk() {
    if (['teaching', 'thinking', 'floor'].includes(this.current)) this.takeFloor();
  }
  private takeFloor(spoken?: string[]) {
    const heard = this.heardText.heard();
    if (this.audio?.speaking || this.current === 'teaching') {
      this.audio?.interrupt();
      this.discard = this.generating;
      this.live?.note(notes.interrupted(heard));
    }
    this.clear('reply');
    if (!spoken) return this.openFloor(this.current === 'floor' ? undefined : 10000);
    this.live?.activity(true);
    spoken.forEach((chunk) => this.live?.audio(chunk));
    this.set('listening');
    if (!this.speech.active)
      // They said only the wake word so far: give them a moment to ask.
      this.timers.quiet = window.setTimeout(() => {
        if (this.current === 'listening' && !this.speech.active) this.speechEnd(0);
      }, 3500);
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

  next() {
    this.step(1);
  }
  previous() {
    this.step(-1);
  }
  restart() {
    if (this.position) void this.open(this.position);
  }
  private step(direction: 1 | -1) {
    if (!this.position) return;
    const target = this.on.move(this.position, direction);
    if (target) return void this.open(target);
    if (direction === -1) return this.restart();
    this.gen++;
    this.live?.close();
    this.live = null;
    this.set('finished');
  }

  stop() {
    this.gen++;
    for (const timer of Object.values(this.timers)) clearTimeout(timer);
    this.live?.close();
    this.audio?.close();
    this.live = null;
    this.audio = null;
    this.set('idle');
  }
}
