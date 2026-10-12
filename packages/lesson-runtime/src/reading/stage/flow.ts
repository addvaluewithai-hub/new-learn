import { useEffect, useState } from 'react';
import type { ReadingPace } from '../props';

const WORDS_PER_MINUTE: Record<ReadingPace, number> = { slower: 110, normal: 160, faster: 230 };

/** How long a learner needs for a line at a pace, plus a breath before the page turns. */
export function readingMs(text: string, pace: ReadingPace) {
  const words = text
    .replace(/\$[^$]*\$/g, ' x ')
    .trim()
    .split(/\s+/).length;
  const ms = (words / WORDS_PER_MINUTE[pace]) * 60_000 + 1200;
  return Math.round(Math.min(20_000, Math.max(2500, ms)));
}

export function usePageVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
}
