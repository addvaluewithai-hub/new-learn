import { api } from '../../shared/api';
import type { ListenPosition, ReadJob, SceneScript } from './listenTypes';
import { matchScript } from './scriptMatch';

export type ScriptItem = { kind: 'line' | 'question' | 'feedback'; text: string };
export type ReaderHost = {
  /** Sends a message that asks for a reply (one script item per turn). */
  send: (text: string) => void;
  /** Queues verified audio; returns seconds until it starts. `last` = nothing follows. */
  play: (chunks: Array<[string, number]>, item: ScriptItem, last: boolean) => number;
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
/** Ask for the next item while this much speech is still queued, so items join up. */
const LOOKAHEAD_S = 5;

/**
 * Reads script items through the live tutor, one per turn. Each item's audio is held until
 * its turn completes and its transcript matches the script; a drifted reading is discarded
 * and asked for once more, so the learner only hears the checked version. The next item is
 * requested while the current one plays, so the reading has no gaps.
 */
export class ScriptReader {
  private items: ScriptItem[] = [];
  private next = 0;
  private turn: {
    index: number;
    chunks: Array<[string, number]>;
    said: string;
    retried: boolean;
  } | null = null;
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
  /** Every item was requested and played out to the audio queue. */
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
    const index = this.next++,
      item = this.items[index];
    this.turn = { index, chunks: [], said: '', retried: false };
    this.host.send(`${LABEL[item.kind]}:\n${item.text}`);
  }

  audio(data: string, rate: number) {
    this.turn?.chunks.push([data, rate]);
  }
  said(text: string) {
    if (this.turn) this.turn.said += text;
  }
  /** The tutor's turn ended; transcripts can trail the audio a little, so check shortly. */
  complete() {
    clearTimeout(this.timers.grace);
    this.timers.grace = window.setTimeout(() => this.verify(), 300);
  }

  private verify() {
    const turn = this.turn;
    if (!turn) return;
    const item = this.items[turn.index];
    const drifted = turn.chunks.length > 0 && !matchScript(turn.said, item.text).ok;
    if ((drifted || !turn.chunks.length) && !turn.retried) {
      if (drifted) this.drifts++;
      Object.assign(turn, { chunks: [], said: '', retried: true });
      return this.host.send(`READ AGAIN:\n${item.text}`);
    }
    this.turn = null;
    if (!turn.chunks.length) {
      this.active = false;
      return this.host.failed();
    }
    const last = this.next >= this.items.length;
    const startsIn = this.host.play(turn.chunks, item, last);
    this.starts.push({ index: turn.index, at: performance.now() + startsIn * 1000 });
    if (last) return;
    const wait = Math.max(0, this.host.queued() - LOOKAHEAD_S) * 1000;
    this.timers.next = window.setTimeout(() => this.request(), wait);
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
