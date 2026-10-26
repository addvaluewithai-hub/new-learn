import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Thumbnail } from '@remotion/player';
import { useCurrentFrame } from 'remotion';
import type { VisualProps } from '../renderers';
import { HTML_BOARD } from './board';
import { readingTransitionStart, readingTransitionTime } from './transition';

type BoardInput = { Board: ComponentType<VisualProps>; props: Omit<VisualProps, 'frame'> };

function BoardFrame({ Board, props }: BoardInput) {
  return <Board {...props} frame={useCurrentFrame()} />;
}

type Placed = BoardInput & {
  fromMs: number | null;
  toMs: number;
  size: { width: number; height: number };
};

/** A live board draws itself from `props.board`; any other board follows the step clock. */
export function ReadingBoard(input: Placed) {
  if (input.props.spec.renderer !== HTML_BOARD) return <ClockBoard {...input} />;
  const { Board, props } = input;
  return (
    <div className="rl-board rl-board-live" data-layout={props.layout} dir="ltr">
      <Board {...props} frame={0} />
    </div>
  );
}

/**
 * The lesson's own board at a chosen moment. Moving one step forward inside the same
 * clip plays the board's transitions from that step's onset; any other move jumps.
 */
function ClockBoard({ Board, props, fromMs, toMs, size }: Placed) {
  const [clock, setClock] = useState({ target: toMs, value: toMs });
  const raf = useRef(0);
  const startMs = readingTransitionStart(fromMs, toMs, props.reducedMotion);
  // A new caption and its current cue reach the very same render, before effects run.
  const timeMs = props.reducedMotion ? toMs : clock.target === toMs ? clock.value : startMs;
  useEffect(() => {
    setClock({ target: toMs, value: startMs });
    if (startMs === toMs) {
      return;
    }
    const begin = performance.now();
    const tick = (now: number) => {
      const next = readingTransitionTime(startMs, toMs, now - begin);
      setClock({ target: toMs, value: next });
      if (next < toMs) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [startMs, toMs]);
  const frame = Math.round((timeMs * props.fps) / 1000);
  return (
    <div
      className="rl-board"
      data-layout={props.layout}
      data-frame={frame}
      data-target-ms={toMs}
      dir="ltr"
    >
      <Thumbnail
        component={BoardFrame}
        inputProps={{ Board, props }}
        compositionWidth={size.width}
        compositionHeight={size.height}
        durationInFrames={Math.max(
          frame + 1,
          Math.ceil((props.recording.durationMs * props.fps) / 1000) + 1,
        )}
        frameToDisplay={frame}
        fps={props.fps}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
