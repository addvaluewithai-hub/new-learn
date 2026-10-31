import { useEffect, useState } from 'react';
import { NovaIcon } from '../NovaIcon';
import type { VoiceState } from './LessonVoice';
import { useHold } from './useHold';
import { useI18n, type TextKey } from '../../../i18n';
import './talk.css';

export type Voice = {
  state: VoiceState;
  press: () => void;
  release: () => void;
  stop: () => void;
};
const HOLD_LABEL: Record<VoiceState, TextKey> = {
  idle: 'nova.talk.hold.idle',
  connecting: 'nova.talk.hold.connecting',
  listening: 'nova.talk.hold.listening',
  thinking: 'nova.talk.hold.thinking',
  speaking: 'nova.talk.hold.speaking',
  reading: 'nova.talk.hold.reading',
};
const PLACEHOLDER: Record<VoiceState, TextKey> = {
  idle: 'nova.talk.placeholder.idle',
  connecting: 'nova.talk.placeholder.connecting',
  listening: 'nova.talk.placeholder.listening',
  thinking: 'nova.talk.placeholder.thinking',
  speaking: 'nova.talk.placeholder.speaking',
  reading: 'nova.talk.placeholder.reading',
};
const TIP: TextKey = 'nova.talk.tip';

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
  const { t, dir } = useI18n();
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
        aria-label={t('nova.talk.ask')}
        placeholder={t(tip ? TIP : PLACEHOLDER[voice.state])}
        value={text}
        dir={text ? 'auto' : dir}
        enterKeyHint="send"
        onChange={(event) => setText(event.target.value)}
      />
      {typing ? (
        <button
          type="submit"
          className="talk-send"
          aria-label={t('nova.talk.send')}
          disabled={busy}
        >
          <NovaIcon name="send" size={18} />
        </button>
      ) : (
        <button
          type="button"
          className="talk-hold"
          aria-label={t('nova.talk.holdLabel')}
          title={t('nova.talk.holdTitle')}
          {...hold}
        >
          <NovaIcon name={voice.state === 'speaking' ? 'pause' : 'mic'} size={18} />
          <span>{t(HOLD_LABEL[voice.state])}</span>
        </button>
      )}
    </form>
  );
}

/** Phones: one round Nova in the controls. Tap opens the conversation, hold to speak. */
export function NovaOrb({ voice, onTap }: { voice: Voice; onTap: () => void }) {
  const { t } = useI18n();
  const hold = useHold({ onStart: voice.press, onEnd: voice.release, onTap });
  return (
    <button
      type="button"
      className="talk-orb"
      data-state={voice.state}
      aria-label={t('nova.talk.orb')}
      {...hold}
    >
      <img src="/lesson-assets/nova.webp" alt="" width={40} height={40} draggable={false} />
    </button>
  );
}
