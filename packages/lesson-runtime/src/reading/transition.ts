import { SETTLE_MS } from './model';

export const READING_TRANSITION_MS = 350;

/** Synthetic cue spacing orders units; it must never become a real reading delay. */
export function readingTransitionStart(fromMs: number | null, toMs: number, reduced: boolean) {
  if (reduced || fromMs == null || fromMs >= toMs) return toMs;
  return Math.max(fromMs, toMs - SETTLE_MS);
}

export function readingTransitionTime(startMs: number, toMs: number, elapsedMs: number) {
  const progress = Math.max(0, Math.min(1, elapsedMs / READING_TRANSITION_MS));
  return startMs + (toMs - startMs) * progress;
}
