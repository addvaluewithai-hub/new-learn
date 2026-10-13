import { useState } from 'react';

const KEY = 'learn.reading.caption';

/** Whether the line under the board is shown. The learner's choice stays on this device. */
export function useCaptionShown() {
  const [shown, setShown] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== 'hidden';
    } catch {
      return true;
    }
  });
  const toggle = () =>
    setShown((now) => {
      try {
        localStorage.setItem(KEY, now ? 'hidden' : 'shown');
      } catch {
        // Blocked storage: the choice lasts for this visit only.
      }
      return !now;
    });
  return { shown, toggle };
}
