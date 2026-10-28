import { useEffect, useRef } from 'react';
import type { LessonContext, LessonController } from '../context';

type Nav = Required<
  Pick<LessonController, 'next' | 'goTo' | 'answer' | 'skip' | 'reveal' | 'back'>
>;

/**
 * What the host sees and may do: the current context on every page change, and a stable
 * controller whose navigation always acts on the latest page (e.g. narration turning it).
 */
export function useHostBridge(
  context: LessonContext,
  nav: Nav,
  page: unknown,
  onReady?: (controller: LessonController | null) => void,
  onContext?: (context: LessonContext) => void,
) {
  const live = useRef({ context, nav });
  live.current = { context, nav };
  useEffect(() => {
    onReady?.({
      pause: () => undefined,
      getContext: () => live.current.context,
      next: () => live.current.nav.next(),
      goTo: (at) => live.current.nav.goTo(at),
      answer: (value) => live.current.nav.answer(value),
      skip: () => live.current.nav.skip(),
      reveal: () => live.current.nav.reveal(),
      back: () => live.current.nav.back(),
    });
    return () => onReady?.(null);
  }, [onReady]);
  useEffect(() => onContext?.(live.current.context), [page, onContext]);
}

/** Report a value to the host whenever one of `changes` does (not on unrelated renders). */
export function useReport<T>(value: T, changes: unknown[], report?: (value: T) => void) {
  const now = useRef(value);
  now.current = value;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => report?.(now.current), [...changes, report]);
}
