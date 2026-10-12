import { useEffect, useRef, useState } from 'react';
import type { LessonContext, LessonController, ReadingPace } from '@learn/lesson-runtime';
import type { ReadResult } from './LessonVoice';

export type FlowSettings = { narration: boolean; volume: number; pace: ReadingPace | null };
const KEY = 'learn.lesson.flow';
const DEFAULTS: FlowSettings = { narration: false, volume: 0.9, pace: null };

function load(): FlowSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return {
      narration: saved?.narration === true,
      volume: typeof saved?.volume === 'number' ? Math.min(1, Math.max(0, saved.volume)) : 0.9,
      pace: ['slower', 'normal', 'faster'].includes(saved?.pace) ? saved.pace : null,
    };
  } catch {
    return DEFAULTS;
  }
}

/**
 * How the lesson moves: by the learner's Next (default), alone at a reading pace, or read
 * aloud by Nova. Settings stay on this device; pausing is per lesson and starts off.
 */
export function useLessonFlow() {
  const [settings, setSettings] = useState(load);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      // Private mode or blocked storage: the choice lasts for this visit only.
    }
  }, [settings]);
  const change = (next: Partial<FlowSettings>) => {
    setSettings((now) => ({ ...now, ...next }));
    setPaused(false);
  };
  return { settings, change, paused, setPaused };
}

/**
 * Nova reads each step aloud and turns the page when the audio ends. It stops at a question
 * (reads it, then waits for the answer). Resuming on a step that was already read moves on;
 * a dropped session is retried once before narration gives up.
 */
export function useNarrator({
  enabled,
  paused,
  context,
  controller,
  read,
  stop,
  onFail,
}: {
  enabled: boolean;
  paused: boolean;
  context: LessonContext | null;
  controller: LessonController | null;
  read: (text: string) => Promise<ReadResult>;
  stop: () => void;
  onFail: () => void;
}) {
  const key =
    context && context.phase !== 'complete'
      ? `${context.sceneId}:${context.phase}:${context.step}`
      : '';
  const last = useRef({ key: '', done: false, retried: false });
  const now = useRef({ context, controller, read, stop, onFail });
  now.current = { context, controller, read, stop, onFail };
  useEffect(() => {
    const { context: c, controller: control } = now.current;
    if (!enabled || paused || !key || !c?.line) return;
    const advance = () => c.phase !== 'attempt' && control?.next?.();
    if (last.current.key === key && last.current.done) {
      advance();
      return;
    }
    if (last.current.key !== key) last.current = { key, done: false, retried: false };
    let alive = true;
    const attempt = (): void => {
      now.current.read(c.line!).then((result) => {
        if (!alive) return;
        if (result === 'done') {
          last.current.done = true;
          advance();
        } else if (result === 'failed' && !last.current.retried) {
          last.current.retried = true;
          attempt();
        } else if (result === 'failed') now.current.onFail();
      });
    };
    attempt();
    return () => {
      alive = false;
      now.current.stop();
    };
  }, [enabled, paused, key]);
}
