import { useEffect, useRef } from 'react';

type Keys = {
  threadOpen: boolean;
  closeThread: () => void;
  /** Next page, or null while it is not allowed (an unanswered question, the end). */
  forward: (() => void) | null;
  back: () => void;
};

/** Arrow keys turn pages (right-to-left: left is forward); Escape closes the conversation. */
export function useReadingKeys(active: boolean, keys: Keys) {
  const now = useRef(keys);
  now.current = keys;
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      const k = now.current;
      if (event.key === 'Escape' && k.threadOpen) k.closeThread();
      if ((event.target as HTMLElement | null)?.closest('textarea, input, select')) return;
      if (event.key === 'ArrowLeft') k.forward?.();
      if (event.key === 'ArrowRight') k.back();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [active]);
}
