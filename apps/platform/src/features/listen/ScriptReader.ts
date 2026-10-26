import { api } from '../../shared/api';
import type { ListenPosition, ReadJob, SceneScript } from './listenTypes';
import { matchScript, strays } from './scriptMatch';

export type ScriptItem = { kind: 'line' | 'question' | 'feedback'; text: string };
export type ReaderHost = {
  /** Sends a message that asks for a reply (one script item per turn). */
  send: (text: string) => void;
  /** Queues audio; returns seconds until it starts playing. */
  enqueue: (data: string, rate: number) => number;
  /** The audio clock, and cutting the audio that starts at or after a time on it. */
  now: () => number;
  cutFrom: (at: number) => void;
  /** An item started being heard (for the transcript on screen). */
  shown: (item: ScriptItem) => void;
  /** The last item is fully queued: nothing more follows. */
  finished: () => void;
  /** Seconds of audio already queued. */
  queued: () => number;
  /** The tutor produced no speech for an item, twice. */
  failed: () => void;
};

/** What a reading job reads: the scene's lines then its question, or the feedback. */
export function scriptItems(script: SceneScript, kind: ReadJob['kind']): ScriptItem[] {
  if (kind === 'feedback') return [{ kind, text: script.feedback ?? '' }];
  const lines = script.lines.map((text) => ({ kind: 'line' as const, text }));
  return script.ask ? [...lines, { kind: 'question', text: script.ask }] : lines;
}

/** The tutor's get_lesson tool: another lesson's script from the server (no answers). */
export function lessonFor(position: ListenPosition, args: Record<string, unknown>) {
  const n = Number(args.lessonNumber);
  if (!Number.isInteger(n) || n < 1) return { error: 'Give a lesson number from 1.' };
  return api(`/listen/${encodeURIComponent(position.courseId)}/lessons/${n}`).catch(() => ({
    error: 'No such lesson.',
  }));
}

const LABEL = { line: 'READ', question: 'READ QUESTION', feedback: 'READ FEEDBACK' } as const;
/** Don't run further ahead than this much queued speech. */
const AHEAD_S = 15;

type Turn = {
  index: number;
  held: Array<[string, number]>;
  said: string;
  retried: boolean;
  /** Its audio goes straight to the speaker (its first words matched the line). */
  streaming: boolean;
  /** Audio-clock time its first sound plays, once it streams. */
  startAt: number | null;
  drifted: boolean;
};

/**
 * Reads script items through the live tutor, one per turn. A reading starts playing as soon
 * as its first words match the line, so sentences follow each other without gaps, and keeps
 * being checked while it streams: words that are not in the line cut it off at once, and a
 * reading that drifted (or ends without matching) is read again, held this time until it is
 * checked in full. The next item is requested the moment the current one is generated.
 */
export class ScriptReader {
  private items: ScriptItem[] = [];
  private next = 0;
  private turn: Turn | null = null;
  private starts: Array<{ index: number; at: number }> = [];
  private timers: { next?: number; grace?: number } = {};
  active = false;
  /** Readings that drifted and were re-read (for diagnostics). */
  drifts = 0;
  constructor(private host: ReaderHost) {}

  /** A reply is being generated for a script item. */
  get waiting() {
    return Boolean(this.turn);
  }
  /** Every item was requested and queued. */
  get done() {
    return this.active && !this.turn && this.next >= this.items.length;
  }

  start(items: ScriptItem[], from = 0) {
    this.stop();
    this.items = items;
    this.next = Math.max(0, Math.min(from, items.length));
    this.active = items.length > 0;
    this.request();
  }

  private request() {
    clearTimeout(this.timers.next);
    if (!this.active || this.turn || this.next >= this.items.length) return;
    if (this.host.queued() > AHEAD_S) {
      this.timers.next = window.setTimeout(() => this.request(), 1000);
      return;
    }
    const index = this.next++;
    this.turn = {
      index,
      held: [],
      said: '',
      retried: false,
      streaming: false,
      startAt: null,
      drifted: false,
    };
    this.host.send(`${LABEL[this.items[index].kind]}:\n${this.items[index].text}`);
  }

  audio(data: string, rate: number) {
    const turn = this.turn;
    if (!turn || turn.drifted) return;
    if (turn.streaming) return this.play(turn, data, rate);
    turn.held.push([data, rate]);
    this.check(turn);
  }
  said(text: string) {
    const turn = this.turn;
    if (!turn || turn.drifted) return;
    turn.said += text;
    this.check(turn);
  }

  /** Start streaming once the first words match; cut off as soon as words stray. */
  private check(turn: Turn) {
    const line = this.items[turn.index].text,
      seen = strays(turn.said, line);
    const allowed = Math.max(3, Math.round(seen.size * 0.3));
    if (turn.streaming) {
      if (seen.extra <= allowed) return;
      turn.drifted = true;
      if (turn.startAt !== null) this.host.cutFrom(turn.startAt);
      this.starts = this.starts.filter((s) => s.index !== turn.index);
      return;
    }
    if (turn.retried || !turn.held.length) return; // a re-read is held until checked in full
    // Seconds of held audio (base64 16-bit PCM): a lagging transcript must not hold it forever.
    const held = turn.held.reduce((sum, [data, rate]) => sum + (data.length * 0.375) / rate, 0);
    const matched = seen.heard >= Math.min(4, seen.size);
    if (seen.extra > 1 || (!matched && held < 2.5)) return;
    turn.streaming = true;
    for (const [data, rate] of turn.held.splice(0)) this.play(turn, data, rate);
  }

  private play(turn: Turn, data: string, rate: number) {
    const startsIn = this.host.enqueue(data, rate);
    if (turn.startAt !== null) return;
    turn.startAt = this.host.now() + startsIn;
    this.starts.push({ index: turn.index, at: performance.now() + startsIn * 1000 });
    this.host.shown(this.items[turn.index]);
  }

  /** The tutor's turn ended; transcripts can trail the audio a little, so check shortly. */
  complete() {
    clearTimeout(this.timers.grace);
    this.timers.grace = window.setTimeout(() => this.verify(), 200);
  }

  private verify() {
    const turn = this.turn;
    if (!turn) return;
    const item = this.items[turn.index];
    const spoke = turn.streaming || turn.held.length > 0;
    const ok = spoke && !turn.drifted && matchScript(turn.said, item.text).ok;
    if (!ok && !turn.retried) {
      if (spoke) this.drifts++;
      if (turn.startAt !== null && !turn.drifted) this.host.cutFrom(turn.startAt);
      this.starts = this.starts.filter((s) => s.index !== turn.index);
      Object.assign(turn, {
        held: [],
        said: '',
        retried: true,
        streaming: false,
        startAt: null,
        drifted: false,
      });
      return this.host.send(`READ AGAIN:\n${item.text}`);
    }
    this.turn = null;
    if (!spoke) {
      this.active = false;
      return this.host.failed();
    }
    // A second reading is played even if it still drifted: better than stopping the lesson.
    if (!turn.streaming) for (const [data, rate] of turn.held) this.play(turn, data, rate);
    if (this.next >= this.items.length) return this.host.finished();
    this.request();
  }

  /** The item the learner is hearing now (or the next to be heard). */
  playing(now = performance.now()) {
    const started = this.starts.filter((s) => s.at <= now);
    const index = started.length
      ? started[started.length - 1].index
      : (this.starts[0]?.index ?? this.turn?.index ?? this.next);
    return { index, text: this.items[index]?.text ?? '' };
  }

  /** Stops reading (the learner cut in, or the scene changed). */
  stop() {
    clearTimeout(this.timers.next);
    clearTimeout(this.timers.grace);
    this.turn = null;
    this.starts = [];
    this.active = false;
  }
}
