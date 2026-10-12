import { useEffect, useRef } from 'react';
import type { Voice } from './TalkControls';

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"]'));

/** Wide screens: hold Space anywhere in the lesson to talk to Nova, like a walkie-talkie. */
export function useSpaceToTalk(voice: Voice, enabled: boolean) {
  const now = useRef(voice);
  now.current = voice;
  useEffect(() => {
    if (!enabled) return;
    let held = false;
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || typing(event.target)) return;
      event.preventDefault();
      if (event.repeat || held) return;
      held = true;
      now.current.press();
    };
    const up = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || !held) return;
      event.preventDefault();
      held = false;
      now.current.release();
    };
    const blur = () => {
      if (held) now.current.release();
      held = false;
    };
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    addEventListener('blur', blur);
    return () => {
      blur();
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
      removeEventListener('blur', blur);
    };
  }, [enabled]);
}
