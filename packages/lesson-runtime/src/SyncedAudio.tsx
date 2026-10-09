import { useEffect, useRef, useState } from 'react';
import { Html5Audio } from 'remotion';

export function SyncedAudio({
  src,
  recovery,
  onError,
}: {
  src: string;
  recovery: number;
  onError: (error: Error) => void;
}) {
  const [element, setElement] = useState<HTMLAudioElement | null>(null);
  const previousRecovery = useRef(recovery);
  useEffect(() => {
    if (!element) return;
    if (previousRecovery.current !== recovery) {
      previousRecovery.current = recovery;
      element.load();
    }
    const expected = new URL(src, document.baseURI).href;
    const handleError = () => {
      // Shared native audio tags may have belonged to an earlier recording.
      // Only forward a failure for the source owned by this composition.
      const actual = new URL(element.currentSrc || element.src, document.baseURI).href;
      if (actual !== expected || !element.error) return;
      onError(new Error(`Audio playback failed (media code ${element.error.code})`));
    };
    element.addEventListener('error', handleError);
    handleError();
    return () => element.removeEventListener('error', handleError);
  }, [element, src, recovery, onError]);

  // Native error forwarding covers pooled tags as well as Remotion's callback.
  // Timing and buffering remain owned by Remotion, with no second audio clock.
  return <Html5Audio ref={setElement} src={src} pauseWhenBuffering onError={onError} />;
}
