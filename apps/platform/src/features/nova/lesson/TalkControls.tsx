import { useEffect, useState } from 'react';
import { NovaIcon } from '../NovaIcon';
import type { VoiceState } from './useHoldToTalk';
import { useHold } from './useHold';
import './talk.css';

export type Voice = {
  state: VoiceState;
  press: () => void;
  release: () => void;
  stop: () => void;
};
const HOLD_LABEL: Record<VoiceState, string> = {
  idle: 'اضغط واتكلم',
  connecting: 'بنوصل…',
  listening: 'بسمعك…',
  thinking: 'بتفكّر…',
  speaking: 'وقّف',
};
const PLACEHOLDER: Record<VoiceState, string> = {
  idle: 'اسأل Nova عن الخطوة دي…',
  connecting: 'بنوصّلك بـ Nova…',
  listening: 'Nova بتسمعك… سيب الزرار لما تخلص',
  thinking: 'Nova بتفكّر…',
  speaking: 'Nova بترد… اضغط واتكلم عشان تقاطعها',
};
const TIP = 'دوس على الزرار وسيبه مضغوط وانت بتتكلم';

/** Type a question, or hold the microphone (or Space) and speak. */
export function TalkComposer({
  voice,
  busy,
  onAsk,
}: {
  voice: Voice;
  busy: boolean;
  onAsk: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const [tip, setTip] = useState(false);
  useEffect(() => {
    if (!tip) return;
    const timer = window.setTimeout(() => setTip(false), 2600);
    return () => clearTimeout(timer);
  }, [tip]);
  const hold = useHold({
    onStart: voice.press,
    onEnd: voice.release,
    onTap: () => (voice.state === 'speaking' ? voice.stop() : setTip(true)),
  });
  const typing = text.trim().length > 0;
  return (
    <form
      className="talk"
      data-state={voice.state}
      onSubmit={(event) => {
        event.preventDefault();
        if (!typing || busy) return;
        onAsk(text);
        setText('');
      }}
    >
      <img src="/lesson-assets/nova.webp" alt="" width={30} height={30} />
      <input
        aria-label="اسأل Nova"
        placeholder={tip ? TIP : PLACEHOLDER[voice.state]}
        value={text}
        dir={text ? 'auto' : 'rtl'}
        enterKeyHint="send"
        onChange={(event) => setText(event.target.value)}
      />
      {typing ? (
        <button type="submit" className="talk-send" aria-label="ابعت لـ Nova" disabled={busy}>
          <NovaIcon name="send" size={18} />
        </button>
      ) : (
        <button
          type="button"
          className="talk-hold"
          aria-label="اضغط مطوّل واتكلم مع Nova"
          title="اضغط مطوّل واتكلم — أو اضغط مطوّل على Space"
          {...hold}
        >
          <NovaIcon name={voice.state === 'speaking' ? 'pause' : 'mic'} size={18} />
          <span>{HOLD_LABEL[voice.state]}</span>
        </button>
      )}
    </form>
  );
}

/** Phones: one round Nova in the controls. Tap opens the conversation, hold to speak. */
export function NovaOrb({ voice, onTap }: { voice: Voice; onTap: () => void }) {
  const hold = useHold({ onStart: voice.press, onEnd: voice.release, onTap });
  return (
    <button
      type="button"
      className="talk-orb"
      data-state={voice.state}
      aria-label="محادثة Nova: اضغط تفتحها، أو اضغط مطوّل واتكلم"
      {...hold}
    >
      <img src="/lesson-assets/nova.webp" alt="" width={40} height={40} draggable={false} />
    </button>
  );
}
