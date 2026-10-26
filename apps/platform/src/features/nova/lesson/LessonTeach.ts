import { readMessage, type TeachEvents, type TeachLine } from './teach';
import { LOOKAHEAD_S, REPLY_WAIT_MS } from './voiceTypes';
import type { ReadJob, Session } from './voiceTypes';

/** What the teacher needs from the lesson voice it belongs to. */
export type TeachHost = {
  /** The open session (opening one if needed), and the current one if any. */
  session: () => Session;
  current: () => Session | null;
  /** The learner holds or has an open turn: talking always wins over reading. */
  busy: () => boolean;
  reading: () => void;
  /** Teaching stopped: go idle unless the learner is talking. */
  idle: () => void;
  armIdle: () => void;
  /** Shared with the voice: a reply is running / a cut reply's rest is dropped. */
  flags: { generating: boolean; discard: boolean };
};

/**
 * Nova reading the lesson aloud: one line per reply, the next requested while this one
 * plays (no gaps); each page turns as its line starts. Stops after the last line (a question).
 */
export class LessonTeach {
  job: ReadJob | null = null;
  private timer?: number;
  constructor(private host: TeachHost) {}

  start(lines: TeachLine[], on: TeachEvents) {
    this.end('cut');
    if (this.host.busy() || !lines.length) return;
    const s = this.host.session();
    const job: ReadJob = {
      lines,
      on,
      line: -1,
      heard: false,
      askedAt: 0,
      complete: false,
      timers: [],
    };
    this.job = job;
    this.host.reading();
    s.connected.then(
      () => this.job === job && this.readLine(s, job, 0),
      () => this.job === job && this.end('failed'),
    );
  }

  /** A line's audio was queued, starting `startsIn` seconds from now. */
  heard(startsIn: number) {
    clearTimeout(this.timer);
    const job = this.job;
    // The first sound of a line is when its page turns (the first line is already shown).
    if (!job || job.heard) return;
    job.heard = true;
    const n = job.lines[job.line].n;
    if (job.line > 0)
      job.timers.push(window.setTimeout(() => this.job === job && job.on.show(n), startsIn * 1000));
  }

  /** The model's turn ended. True if it was a teaching turn (handled here). */
  complete(s: Session) {
    const job = this.job;
    if (!job || job.line < 0) return false;
    this.lineDone(s, job);
    return true;
  }

  /** Everything queued has played. True if the teaching just finished. */
  drained() {
    if (!this.job?.complete) return false;
    this.end('done');
    return true;
  }

  private readLine(s: Session, job: ReadJob, line: number) {
    const flags = this.host.flags;
    // A reply still running (e.g. a cut reading) is replaced: drop what is left of it.
    if (flags.generating) flags.discard = true;
    if (line === 0) s.audio.interrupt();
    job.line = line;
    job.heard = false;
    job.askedAt = performance.now();
    s.live.text(readMessage(job.lines[line]));
    flags.generating = true;
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.end('failed'), REPLY_WAIT_MS);
  }

  private lineDone(s: Session, job: ReadJob) {
    // An end right after asking belongs to the reply this line replaced; ignore it. A line
    // that really produced no speech is a failure, never a silent skip ahead.
    if (!job.heard && performance.now() - job.askedAt < 1500) return;
    if (!job.heard) return this.end('failed');
    const next = job.line + 1;
    if (next >= job.lines.length) {
      job.complete = true;
      s.audio.finish();
      if (!s.audio.speaking) this.end('done');
      return;
    }
    const wait = Math.max(0, s.audio.endsIn - LOOKAHEAD_S) * 1000;
    job.timers.push(window.setTimeout(() => this.job === job && this.readLine(s, job, next), wait));
  }

  end(result: 'done' | 'cut' | 'failed') {
    const job = this.job;
    if (!job) return;
    this.job = null;
    clearTimeout(this.timer);
    job.timers.forEach(clearTimeout);
    if (result !== 'done') {
      this.host.current()?.audio.interrupt();
      if (this.host.flags.generating) this.host.flags.discard = true;
    }
    this.host.idle();
    this.host.armIdle();
    if (result === 'done') job.on.done();
    if (result === 'failed') job.on.failed();
  }
}
