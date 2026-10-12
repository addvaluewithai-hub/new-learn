import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Thumbnail } from '@remotion/player';
import { useCurrentFrame } from 'remotion';
import type { VisualProps } from '../renderers';

type BoardInput = { Board: ComponentType<VisualProps>; props: Omit<VisualProps, 'frame'> };

function BoardFrame({ Board, props }: BoardInput) {
  return <Board {...props} frame={useCurrentFrame()} />;
}

/**
 * The lesson's own board at a chosen moment. Moving one step forward inside the same
 * clip plays the board's transitions from that step's onset; any other move jumps.
 */
export function ReadingBoard({
  Board,
  props,
  fromMs,
  toMs,
  size,
}: BoardInput & { fromMs: number | null; toMs: number; size: { width: number; height: number } }) {
  const [timeMs, setTimeMs] = useState(toMs);
  const raf = useRef(0);
  useEffect(() => {
    if (props.reducedMotion || fromMs == null || fromMs >= toMs) {
      setTimeMs(toMs);
      return;
    }
    const begin = performance.now();
    const tick = (now: number) => {
      const next = Math.min(toMs, fromMs + (now - begin));
      setTimeMs(next);
      if (next < toMs) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [fromMs, toMs, props.reducedMotion]);
  const frame = Math.round((timeMs * props.fps) / 1000);
  return (
    <div className="reading-board" data-layout={props.layout} dir="ltr">
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
        style={{ width: '100%', height: 'auto', aspectRatio: `${size.width} / ${size.height}` }}
      />
    </div>
  );
}
