import { useEffect, useMemo, useRef, useState } from 'react';
import {
  readingContext,
  readingPageIndex,
  readingPages,
  readingPositionOf,
  type LessonContext,
  type LessonController,
  type ReadingPackage,
  type ReadingPace,
  type ReadingPosition,
  type QuestionMode,
} from '@learn/lesson-runtime';
import type { TeachEvents, TeachLine } from './LessonVoice';

export type FlowSettings = {
  narration: boolean;
  volume: number;
  pace: ReadingPace | null;
  /** Audio mode: Nova reads, and the learner answers by voice without touching the screen. */
  handsFree: boolean;
  /** Answers only after the wake word or an earbud press (a noisy place). */
  noisy: boolean;
  /** The learner's word for calling Nova while it reads. */
  wakeWord: string;
  /** Questions are asked (default), or shown with their model answers. */
  questions: QuestionMode;
};
const KEY = 'learn.lesson.flow';
export const WAKE_WORD = 'يا نوفا';
const DEFAULTS: FlowSettings = {
  narration: false,
  volume: 0.9,
  pace: null,
  handsFree: false,
  noisy: false,
  wakeWord: WAKE_WORD,
  questions: 'ask',
};

/** The learner's lesson settings on this device (also edited on the settings page). */
export function loadFlow(): FlowSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return {
      narration: saved?.narration === true,
      volume: typeof saved?.volume === 'number' ? Math.min(1, Math.max(0, saved.volume)) : 0.9,
      pace: ['slower', 'normal', 'faster'].includes(saved?.pace) ? saved.pace : null,
      handsFree: saved?.handsFree === true,
      noisy: saved?.noisy === true,
      wakeWord:
        typeof saved?.wakeWord === 'string' && saved.wakeWord.trim()
          ? saved.wakeWord.slice(0, 30)
          : WAKE_WORD,
      questions: saved?.questions === 'show' ? 'show' : 'ask',
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveFlow(settings: FlowSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Private mode or blocked storage: the choice lasts for this visit only.
  }
}

/**
 * How the lesson moves: by the learner's Next (default), alone at a reading pace, or read
 * aloud by Nova. Settings stay on this device. A lesson that moves on its own never starts by
 * itself when opened: it waits, paused, until the learner presses play.
 */
export function useLessonFlow() {
  const [settings, setSettings] = useState(loadFlow);
  const [paused, setPaused] = useState(() => settings.narration || settings.pace !== null);
  useEffect(() => saveFlow(settings), [settings]);
  const change = (next: Partial<FlowSettings>) => {
    setSettings((now) => ({ ...now, ...next }));
    setPaused(false);
  };
  /** Changes a setting without restarting a paused lesson (e.g. switched on by the app). */
  const adjust = (next: Partial<FlowSettings>) => setSettings((now) => ({ ...now, ...next }));
  return { settings, change, adjust, paused, setPaused };
}

/**
 * Nova teaches the lesson aloud in one live session: from where the learner is, it reads the
 * lines up to the next question one after another without gaps; each page turns as its line
 * starts playing, and Nova waits at the question. Moving by hand, asking
 * something or pausing cuts it; it continues from wherever the learner then is. A dropped
 * session is retried once before narration gives up.
 */
export function useNarrator({
  enabled,
  paused,
  asking,
  lesson,
  context,
  controller,
  teach,
  stop,
  onFail,
}: {
  enabled: boolean;
  paused: boolean;
  /** Questions are asked: Nova reads one and waits for the answer. Otherwise it reads the
   * question and its model answer and goes on. */
  asking: boolean;
  lesson: ReadingPackage | null;
  context: LessonContext | null;
  controller: LessonController | null;
  teach: (lines: TeachLine[], on: TeachEvents) => void;
  stop: () => void;
  onFail: () => void;
}) {
  const pages = useMemo(() => (lesson ? readingPages(lesson) : []), [lesson]);
  const position: ReadingPosition | null =
    context && context.phase !== 'complete'
      ? { sceneId: context.sceneId, phase: context.phase, step: context.step ?? 0 }
      : null;
  const index = lesson && position ? readingPageIndex(lesson, pages, position) : -1;
  /** The page Nova itself moved to (its own page turn must not restart the teaching). */
  const steered = useRef(-1);
  const retried = useRef(false);
  const now = useRef({ controller, teach, stop, onFail });
  now.current = { controller, teach, stop, onFail };
  // Pausing, turning narration off or leaving the lesson cuts Nova off.
  useEffect(() => {
    if (!enabled || paused) return;
    return () => {
      steered.current = -1;
      now.current.stop();
    };
  }, [enabled, paused, lesson]);
  useEffect(() => {
    if (!enabled || paused || !lesson || index < 0) return;
    // Nova's own page turn: it is already reading this line.
    if (steered.current === index) return;
    steered.current = -1;
    const lines: TeachLine[] = [];
    for (let n = index; n < pages.length; n++) {
      const page = pages[n];
      // A question is read once, whole, on its answer page: its lead-in pages are skipped.
      if (page.kind === 'ask') continue;
      const question = asking && page.kind === 'attempt';
      const at = readingContext(lesson, page, false);
      lines.push({ n, text: at.line ?? '', question, ...(at.tone ? { tone: at.tone } : {}) });
      if (question) break;
    }
    const at = (n: number) => readingPositionOf(lesson, pages[n], false);
    const last = lines[lines.length - 1];
    let reached = index;
    const events: TeachEvents = {
      show: (n) => {
        reached = n;
        steered.current = n;
        now.current.controller?.goTo?.(at(n));
      },
      done: () => {
        retried.current = false;
        if (last.question) return; // the question was read: wait for the answer
        steered.current = -1;
        now.current.controller?.next?.(); // end of the lesson: on to completion
      },
      failed: () => {
        if (retried.current) return now.current.onFail();
        retried.current = true;
        // Once more from the line the learner is on; then narration gives up.
        now.current.teach(
          lines.filter((line) => line.n >= reached),
          events,
        );
      },
    };
    if (!lines.length) return;
    // Started on a question's lead-in: go straight to its answer page, where it is read.
    if (lines[0].n !== index) events.show(lines[0].n);
    now.current.teach(lines, events);
    // A new stretch starts only when the learner (not Nova) changes the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, paused, asking, lesson, index]);
}
