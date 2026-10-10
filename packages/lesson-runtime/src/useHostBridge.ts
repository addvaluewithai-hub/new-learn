import { useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { PlayerRef } from '@remotion/player';
import type { LessonPackage } from './types';
import type { Session } from './session';
import { lessonContext, type LessonContext, type LessonController } from './context';

export type HostPlayback = {
  suspended?: boolean;
  onContext?: (context: LessonContext) => void;
  onReady?: (controller: LessonController | null) => void;
};
export function useHostBridge(
  player: RefObject<PlayerRef | null>,
  lesson: LessonPackage,
  state: Session,
  host: HostPlayback,
) {
  const live = useRef({ lesson, state });
  live.current = { lesson, state };
  useLayoutEffect(() => {
    if (host.suspended) player.current?.pause();
  }, [host.suspended, state.epoch, player]);
  useEffect(() => {
    host.onReady?.({
      pause: () => player.current?.pause(),
      getContext: () =>
        lessonContext(live.current.lesson, {
          ...live.current.state,
          frame: player.current?.getCurrentFrame() ?? live.current.state.frame,
        }),
    });
    return () => host.onReady?.(null);
  }, [host.onReady, player]);
  const context = lessonContext(lesson, state);
  const signature = JSON.stringify([
    context.sceneId,
    context.phase,
    context.word?.index,
    context.visibleCueIds,
    context.playing,
    context.questionVisible,
  ]);
  const current = useRef(context);
  current.current = context;
  useEffect(() => {
    host.onContext?.(current.current);
  }, [signature, host.onContext]);
}
