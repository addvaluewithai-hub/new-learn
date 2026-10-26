import { useEffect, useRef, useState } from 'react';
import type { LessonContext, LessonController } from '@learn/lesson-runtime';
import type { VoiceEvents, VoiceState } from '../lesson/voiceTypes';
import type { FlowSettings } from '../lesson/useLessonFlow';
import { HandsFree } from './HandsFree';
import { MediaKeys } from './mediaKeys';

type Hooks = Partial<Pick<VoiceEvents, 'capture' | 'reply' | 'tool' | 'setup'>>;
type Voice = {
  state: VoiceState;
  press: () => void;
  release: () => void;
  stop: () => void;
  play: (data: string, rate: number) => void;
  pushTurn: (chunks: string[]) => void;
  listen: (on: boolean) => Promise<void> | undefined;
  restyle: () => void;
};

/** Said once when noise keeps being taken for answers. It must not contain the wake word. */
const NOISY_NOTICE =
  'شكل المكان عندك فيه دوشة. فهستنى لحد ما تدوس زرار السماعة مرة، أو تنادي عليّا، وبعدين رد براحتك.';

/** The hooks object the lesson voice reads (pass it to useLessonTalk before calling this). */
export const useVoiceHooks = () => useRef<Hooks>({});

/**
 * Turns hands-free (audio) mode on for the open lesson: microphone always open, voice
 * detection, wake word and earbud button, lock-screen controls, spoken answers submitted
 * through the lesson's own answer flow. Off, it leaves the lesson exactly as it was.
 */
export function useHandsFree({
  hooks,
  settings,
  change,
  voice,
  controller,
  context,
  resume,
  title,
  onNotice,
}: {
  hooks: { current: Hooks };
  settings: FlowSettings;
  change: (next: Partial<FlowSettings>) => void;
  voice: Voice;
  controller: LessonController | null;
  context: LessonContext | null;
  resume: () => void;
  title: { lesson: string; course: string };
  onNotice: (text: string) => void;
}) {
  const now = useRef({ settings, change, voice, controller, context, resume, onNotice });
  now.current = { settings, change, voice, controller, context, resume, onNotice };
  const [free] = useState(
    () =>
      new HandsFree({
        voice: () => now.current.voice,
        answering: () => now.current.context?.phase === 'attempt',
        answer: (text) => now.current.controller?.answer?.(text),
        resume: () => now.current.resume(),
        wakeWord: () => now.current.settings.wakeWord,
        noisy: () => now.current.settings.noisy,
        tooNoisy: () => {
          now.current.change({ noisy: true });
          now.current.onNotice(NOISY_NOTICE);
        },
      }),
  );
  const [keys] = useState(() => new MediaKeys());
  const on = settings.handsFree;
  // Set during render, before any effect (e.g. narration) can open a session without them.
  hooks.current = on
    ? {
        capture: (chunk, level, samples) => free.capture(chunk, level, samples),
        reply: free.reply,
        tool: (name, args) => free.tool(name, args),
        setup: () => ({ handsFree: true, wakeWord: now.current.settings.wakeWord }),
      }
    : {};

  useEffect(() => {
    if (!on) return;
    void free.load();
    void now.current.voice.listen(true)?.catch(() => change({ handsFree: false }));
    void keys.start(title.lesson, title.course, {
      talk: () => free.press(),
      next: () => now.current.controller?.next?.(),
      previous: () => undefined,
    });
    now.current.voice.restyle(); // the next session opens in hands-free mode
    return () => {
      now.current.voice.listen(false);
      free.stop();
      keys.stop();
      now.current.voice.restyle();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, free, keys]);
  useEffect(() => keys.update(title.lesson, title.course), [keys, title.lesson, title.course]);
  // A new wake word applies from the next session.
  useEffect(() => void (on && now.current.voice.restyle()), [on, settings.wakeWord]);
  useEffect(() => void (on && free.voiceState(voice.state)), [on, free, voice.state]);

  return { press: () => free.press(), detector: () => free.detectorName };
}
