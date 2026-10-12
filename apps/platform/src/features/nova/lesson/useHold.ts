import { useRef, type KeyboardEvent, type PointerEvent } from 'react';

const HOLD_MS = 220;

/**
 * Press-and-hold on a button: a hold starts after a short delay and ends on release; a quick
 * tap is a tap. On the keyboard, Space holds and Enter taps. No click event is used, so a
 * hold never also counts as a tap.
 */
export function useHold({
  onStart,
  onEnd,
  onTap,
}: {
  onStart: () => void;
  onEnd: () => void;
  onTap: () => void;
}) {
  const timer = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const end = (tap: boolean) => {
    // Nothing started here (e.g. a right click): neither a hold nor a tap.
    if (timer.current === undefined && !held.current) return;
    clearTimeout(timer.current);
    timer.current = undefined;
    if (held.current) {
      held.current = false;
      onEnd();
    } else if (tap) onTap();
  };
  const holdKey = (event: KeyboardEvent) => event.key === ' ';
  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        held.current = true;
        onStart();
      }, HOLD_MS);
    },
    onPointerUp: () => end(true),
    onPointerCancel: () => end(false),
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (!event.repeat) onTap();
        return;
      }
      if (!holdKey(event)) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.repeat || held.current) return;
      held.current = true;
      onStart();
    },
    onKeyUp: (event: KeyboardEvent) => {
      if (!holdKey(event)) return;
      event.preventDefault();
      event.stopPropagation();
      end(false);
    },
  };
}
