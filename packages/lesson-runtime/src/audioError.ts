/**
 * Remotion may reuse one native audio element across different scene recordings.
 * A late error from a retired source must not stop the active lesson.
 *
 * Check the element's *current* media state, not the stale React error event.
 */
export function errorForCurrentAudio(
  element: Pick<HTMLAudioElement, 'src' | 'currentSrc' | 'error'>,
  requestedSource: string,
  baseUrl: string,
): Error | null {
  const expected = new URL(requestedSource, baseUrl).href;
  // Prefer currentSrc: src may already point to a newly assigned source while
  // the browser has not yet swapped out the old pooled media resource.
  const actualSource = element.currentSrc || element.src;
  if (!actualSource || new URL(actualSource, baseUrl).href !== expected) return null;
  const mediaError = element.error;
  if (!mediaError) return null;
  return new Error(`Audio playback failed (media code ${mediaError.code})`);
}
