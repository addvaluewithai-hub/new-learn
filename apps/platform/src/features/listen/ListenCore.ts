import { api } from '../../shared/api';
import { AudioSession } from '../nova/voice/AudioSession';
import { LiveConnection, type LiveCallbacks } from '../nova/voice/LiveConnection';
import { voiceStyle } from '../nova/voice/voicePrefs';
import { TutorWords } from './TutorWords';
import { lessonFor, ScriptReader, scriptItems } from './ScriptReader';
import { LearnerMic } from './LearnerMic';
import { CUT_IN_WAIT_MS, NOISY_NOTICE, notes, REPLY_MS } from './listenTypes';
import type { ListenEvents, ListenPosition, ListenState, ListenToken } from './listenTypes';
import type { ReadJob, SceneScript } from './listenTypes';

/**
 * The flow of a scripted audio-only lesson: one live tutor session per scene. The app reads
 * the script through the tutor line by line (checked against the text), then its question,
 * and waits for the answer as long as it takes. The tutor's own words are only its verdict
 * and replies when the learner cuts in. The mic stays open for the whole run, so it works with
 * the screen off. ListenEngine adds the learner's controls on top.
 */
export class ListenCore {
  protected audio: AudioSession | null = null;
  protected live: LiveConnection | null = null;
  protected position: ListenPosition | null = null;
  protected script: SceneScript = { lines: [] };
  protected job: ReadJob = { kind: 'scene', from: 0 };
  protected current: ListenState = 'idle';
  protected before: ListenState = 'idle';
  protected gen = 0;
  protected flags = { checked: false, resume: false };
  /** A reply is being generated; if the learner cuts in, the rest of it is dropped. */
  protected generating = false;
  protected discard = false;
  protected retried = false;
  protected timers: { floor?: number; reply?: number } = {};
  protected reader = new ScriptReader({
    send: (text) => {
      this.generating = true;
      this.live?.text(text);
    },
    enqueue: (data, rate) => this.audio?.enqueue(data, rate) ?? 0,
    now: () => this.audio?.now ?? 0,
    cutFrom: (at) => this.audio?.cutFrom(at),
    shown: (item) => {
      this.retried = false;
      this.on.said(`${item.text} `);
    },
    finished: () => this.audio?.finish(),
    queued: () => this.audio?.endsIn ?? 0,
    failed: () => this.dropped('تعذّر قراءة الدرس.'),
  });
  protected words = new TutorWords({
    enqueue: (data, rate) => this.audio?.enqueue(data, rate) ?? 0,
    started: () => {
      this.clear('reply');
      if (this.current !== 'paused') this.set('teaching');
    },
    reject: (heard) => this.unclear(heard),
    log: (text) => this.on.said(text),
  });
  protected mic = new LearnerMic({
    state: () => this.current,
    set: (state) => this.set(state),
    live: () => this.live,
    position: () => this.position,
    speaking: () => this.clear('floor'),
    reconnect: () => this.position && void this.open(this.position, { answering: true }),
    called: (chunks) => this.takeFloor(chunks),
    sent: () => {
      this.generating = true;
      this.words.expect();
      this.armReply();
    },
  });
  constructor(protected on: ListenEvents) {}

  protected set(state: ListenState) {
    this.current = state;
    this.mic.strict(state === 'teaching');
    this.on.state(state);
  }
  protected clear(...names: Array<keyof ListenCore['timers']>) {
    for (const name of names) clearTimeout(this.timers[name]);
  }

  /** From a tap: opens the microphone once for the whole run, then starts this scene. */
  async start(position: ListenPosition) {
    if (!this.audio) {
      this.audio = new AudioSession(() => this.drained());
      try {
        void this.mic.load();
        await this.audio.capture((chunk, level, samples) => this.mic.feed(chunk, level, samples));
      } catch (error) {
        this.end('idle');
        throw error;
      }
    }
    await this.open(position);
  }

  /** Opens a scene's session. `job` continues a reading on the same scene; `answering`
   * means the learner is already speaking into a session that dropped while it waited. */
  protected async open(
    position: ListenPosition,
    opts: { job?: ReadJob; answering?: boolean } = {},
  ) {
    const gen = ++this.gen,
      mine = () => gen === this.gen;
    this.live?.close();
    this.live = null;
    this.clear('floor', 'reply');
    this.audio?.interrupt();
    this.reader.stop();
    Object.assign(this, { position, discard: false, generating: false });
    this.flags = { checked: false, resume: false };
    this.words.reset();
    this.mic.reset(opts.answering);
    if (!opts.answering) {
      if (!opts.job) this.on.scene(position);
      this.set('connecting');
    }
    try {
      const token = await api<ListenToken>('/listen/live', { ...position, style: voiceStyle() });
      if (!mine()) return;
      this.script = token.script;
      const live = new LiveConnection(this.callbacks(mine));
      this.live = live;
      await live.connect(token);
      if (!mine()) return live.close();
      if (!opts.answering) return this.startJob(opts.job ?? { kind: 'scene', from: 0 });
      live.note(notes.waiting(this.script.ask ?? ''));
      this.mic.flush(live);
    } catch (error) {
      if (mine()) this.dropped(error instanceof Error ? error.message : 'تعذّر الاتصال.');
    }
  }

  private callbacks(mine: () => boolean): LiveCallbacks {
    return {
      audio: (data, rate) => {
        if (!mine() || this.discard) return;
        if (this.reader.waiting) return this.reader.audio(data, rate);
        this.words.audio(data, rate);
      },
      interrupted: () => {
        if (mine()) this.discard = this.generating = false;
      },
      complete: () => {
        if (!mine()) return;
        this.generating = false;
        if (this.discard) return void (this.discard = false);
        if (this.reader.waiting) return this.reader.complete();
        this.clear('reply');
        if (!this.words.complete()) return;
        this.retried = false;
        this.audio?.finish();
      },
      transcript: (role, text) => {
        if (!mine()) return;
        if (role === 'user') {
          this.words.learner(text);
          return this.on.heard(text);
        }
        if (this.discard) return;
        if (this.reader.waiting) return this.reader.said(text);
        this.words.said(text);
      },
      error: (message) => mine() && this.dropped(message),
      answer: () => ({ error: 'Not available here.' }),
      tool: (name, args) => this.tool(name, args),
    };
  }

  private tool(name: string, args: Record<string, unknown>) {
    if (name === 'check_done' || name === 'resume_lesson') {
      this.flags[name === 'check_done' ? 'checked' : 'resume'] = true;
      return { ok: true };
    }
    if (name === 'get_lesson' && this.position) return lessonFor(this.position, args);
    return { error: 'Unknown tool.' };
  }
  private startJob(job: ReadJob) {
    this.job = job;
    if (!this.live && this.position) return void this.open(this.position, { job });
    this.set('teaching');
    this.reader.start(scriptItems(this.script, job.kind), job.from);
  }
  /** The learner's "answer" was noise: say nothing and keep waiting. Twice in a row turns on
   * noisy-place mode, announced once. */
  protected unclear(heard: string) {
    this.discard = this.generating;
    this.flags = { checked: false, resume: false };
    this.on.diag?.(`تجاهلت صوت مش كلام: «${heard.trim() || '…'}»`);
    if (this.words.rejected >= 2 && !this.mic.noisy) {
      this.mic.noisy = true;
      this.on.noisy?.(true);
      this.set('teaching');
      return this.live?.text(`READ:\n${NOISY_NOTICE}`);
    }
    this.openFloor();
  }

  /** Everything queued has finished playing. */
  private drained() {
    if (this.reader.active) {
      if (!this.reader.done) return;
      this.reader.stop();
      // Feedback or a scene with no question: move on. Otherwise wait for the answer.
      if (this.job.kind === 'feedback' || !this.script.ask) return this.next();
      this.job = { kind: 'scene', from: this.script.lines.length };
      return this.openFloor();
    }
    if (this.flags.checked || this.flags.resume) return this.carryOn();
    if (this.current === 'teaching' || this.current === 'thinking') this.openFloor();
  }
  /** After the tutor's own words: the scripted feedback, or back to the script. */
  private carryOn() {
    const checked = this.flags.checked;
    this.flags = { checked: false, resume: false };
    if (!checked) return this.startJob(this.job);
    if (this.script.feedback) return this.startJob({ kind: 'feedback', from: 0 });
    this.next();
  }

  /** The learner's turn: with no `wait` it lasts until they speak, however long that takes;
   * with one (they cut in, then said nothing) silence means "carry on". */
  protected openFloor(wait?: number) {
    this.words.heard.reset();
    this.set('floor');
    this.clear('floor');
    if (wait !== undefined)
      this.timers.floor = window.setTimeout(() => this.current === 'floor' && this.carryOn(), wait);
  }
  private armReply() {
    this.clear('reply');
    this.timers.reply = window.setTimeout(() => {
      if (this.current === 'thinking') this.openFloor();
    }, REPLY_MS);
  }

  protected takeFloor(spoken?: string[]) {
    if (this.reader.active) {
      // Cut into the reading: remember the line being heard, to re-read it afterwards.
      const at = this.reader.playing();
      this.job = { ...this.job, from: at.index };
      this.reader.stop();
      this.audio?.interrupt();
      this.discard = this.generating;
      this.live?.note(notes.interruptedReading(at.text));
    } else if (this.audio?.speaking || this.current === 'teaching') {
      this.audio?.interrupt();
      this.discard = this.generating;
      this.live?.note(notes.interrupted(this.words.heard.heard()));
    }
    this.clear('reply');
    if (spoken) return this.mic.speak(spoken);
    this.openFloor(this.current === 'floor' ? undefined : CUT_IN_WAIT_MS);
  }

  /** A dropped session reopens once, continuing the reading where it was. While the tutor
   * waits for the learner, it stays closed (silent) until the learner starts talking. */
  private dropped(message: string) {
    const position = this.position;
    if (this.current === 'floor') {
      this.live?.close();
      this.live = null;
      return;
    }
    if (position && !this.retried && this.current !== 'finished') {
      this.retried = true;
      if (this.reader.active) this.job = { ...this.job, from: this.reader.playing().index };
      return void this.open(position, { job: this.job });
    }
    this.retried = false;
    this.live?.close();
    this.live = null;
    this.set('idle');
    this.on.error(message);
  }

  next = () => this.step(1);
  protected step(direction: 1 | -1) {
    const target = this.position && this.on.move(this.position, direction);
    if (target) return void this.open(target);
    // Before the first scene: start it again.
    if (direction === -1) return void (this.position && this.open(this.position));
    this.end('finished');
  }
  protected end(state: 'idle' | 'finished') {
    this.gen++;
    for (const timer of Object.values(this.timers)) clearTimeout(timer);
    this.reader.stop();
    this.live?.close();
    this.live = null;
    if (state === 'idle') this.audio?.close();
    if (state === 'idle') this.audio = null;
    this.set(state);
  }
}
