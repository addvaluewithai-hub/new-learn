import type { RefObject } from 'react';
import type { PlayerRef } from '@remotion/player';
import type { Session } from './session';
import { useRuntimeText } from './text';

export function PlaybackControls({
  player,
  state,
  duration,
  onReplay,
}: {
  player: RefObject<PlayerRef | null>;
  state: Session;
  duration: number;
  onReplay: () => void;
}) {
  const text = useRuntimeText();
  const enabled = ['narration', 'feedback'].includes(state.mode) && !state.error;
  return (
    <div className="lesson-controls">
      <button
        className="lesson-primary"
        disabled={!enabled}
        onClickCapture={(event) =>
          state.playing ? player.current?.pause() : player.current?.play(event)
        }
      >
        {state.playing
          ? text.pause
          : state.frame > 0
            ? text.resumeExplaining
            : text.startExplaining}
      </button>
      <input
        aria-label={text.playbackPosition}
        type="range"
        min={0}
        max={duration - 1}
        value={state.frame}
        disabled={!enabled}
        onChange={(event) => player.current?.seekTo(Number(event.target.value))}
      />
      <button className="lesson-secondary" disabled={state.fatalError} onClick={onReplay}>
        {text.replayScene}
      </button>
      {state.buffering && <span role="status">{text.loadingAudio}</span>}
    </div>
  );
}
