import { useEffect, useRef } from 'react';
import type { Dispatch, RefObject } from 'react';
import type { CallbackListener, PlayerRef } from '@remotion/player';
import type { Session, SessionAction } from './session';

export function usePlaybackBridge(
  player: RefObject<PlayerRef | null>,
  state: Session,
  duration: number,
  dispatch: Dispatch<SessionAction>,
) {
  const liveEpoch = useRef(state.epoch);
  liveEpoch.current = state.epoch;
  const startOnMount = useRef(state.autoStart);
  startOnMount.current = state.autoStart;
  useEffect(() => {
    const current = player.current;
    if (!current) return;
    const epoch = state.epoch;
    const autoStart = startOnMount.current;
    let active = true;
    let armed = false;
    let ended = false;
    const valid = () => active && liveEpoch.current === epoch;
    const send = (action: Parameters<typeof dispatch>[0]) => {
      if (valid()) dispatch(action);
    };
    const onPlay = () => {
      armed = true;
      send({ type: 'play', epoch });
    };
    const onPause = () => send({ type: 'pause', epoch });
    const onFrame: CallbackListener<'frameupdate'> = (event) =>
      send({ type: 'frame', frame: event.detail.frame, epoch });
    const onEnd = () => {
      if (!valid() || !armed || ended || current.getCurrentFrame() < duration - 1) return;
      ended = true;
      // Let Remotion finish its end/seek operation before changing inputs.
      queueMicrotask(() => send({ type: 'ended', epoch }));
    };
    const onError: CallbackListener<'error'> = (event) => {
      if (!valid()) return;
      current.pause();
      send({
        type: 'error',
        epoch,
        fatal: true,
        message: event.detail.error.message || 'تعذّر تشغيل المشهد.',
      });
    };
    const onWaiting = () => send({ type: 'waiting', epoch });
    const onResume = () => send({ type: 'resume', epoch });
    current.pause();
    current.seekTo(0);
    current.addEventListener('play', onPlay);
    current.addEventListener('pause', onPause);
    current.addEventListener('frameupdate', onFrame);
    current.addEventListener('ended', onEnd);
    current.addEventListener('error', onError);
    current.addEventListener('waiting', onWaiting);
    current.addEventListener('resume', onResume);
    const startTimer = window.setTimeout(() => {
      if (valid() && autoStart) current.play();
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(startTimer);
      current.removeEventListener('play', onPlay);
      current.removeEventListener('pause', onPause);
      current.removeEventListener('frameupdate', onFrame);
      current.removeEventListener('ended', onEnd);
      current.removeEventListener('error', onError);
      current.removeEventListener('waiting', onWaiting);
      current.removeEventListener('resume', onResume);
    };
  }, [state.epoch, duration, player, dispatch]);
}
