import { useEffect, useRef, useState } from 'react';
import { Html5Audio } from 'remotion';
import { errorForCurrentAudio } from './audioError';

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
    const handleError = () => {
      const failure = errorForCurrentAudio(element, src, document.baseURI);
      if (failure) onError(failure);
    };
    element.addEventListener('error', handleError);
    handleError();
    return () => element.removeEventListener('error', handleError);
  }, [element, src, recovery, onError]);

  // Do NOT forward Html5Audio's raw React onError here: it can originate from
  // a retired pooled tag after scene navigation, even when the current WAV has
  // already loaded successfully. The guarded native listener above handles
  // genuine failures for the currently owned source.
  // Playback timing and buffering still belong to Remotion.
  return <Html5Audio ref={setElement} src={src} pauseWhenBuffering />;
}
