import type { VisualProps } from '@learn/lesson-runtime';

// Frame-derived lesson clock: cue onsets come from the selected recording's timing.json.
export type Clock = { t: number; reduced: boolean; portrait: boolean; ms: (beat: string) => number | undefined };

export const clamp = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};

export function makeClock(props: VisualProps, prefix: string): Clock {
  const { recording, frame, fps, reducedMotion, layout } = props;
  const cues = new Map(recording.cues.map((c) => [c.id, c.atMs]));
  return {
    t: (frame * 1000) / fps,
    reduced: reducedMotion,
    portrait: layout === 'portrait',
    ms: (beat) => cues.get(beat.includes('-') ? beat : `${prefix}-${beat}`),
  };
}

/** 0 → 1 over `dur` ms after the beat's spoken onset; 0 when the cue is absent. */
export function progress(clock: Clock, beat: string | undefined, dur = 380) {
  if (!beat) return 0;
  const at = clock.ms(beat);
  return at == null ? 0 : ease((clock.t - at) / (clock.reduced ? 120 : dur));
}
