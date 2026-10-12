import { useState } from 'react';
import { NovaIcon } from '../nova/NovaIcon';

/**
 * Ask Nova from the lesson controls. Wide screens get the full field; phones get one
 * round button that opens the chat, so the controls stay on one line.
 */
export function NovaBar({ onAsk }: { onAsk: (text: string, mode: 'chat' | 'voice') => void }) {
  const [text, setText] = useState('');
  return (
    <>
      <form
        className="nova-bar"
        onSubmit={(event) => {
          event.preventDefault();
          onAsk(text, 'chat');
          setText('');
        }}
      >
        <img src="/lesson-assets/nova.webp" alt="" width={30} height={30} />
        <input
          aria-label="اسأل Nova عن الخطوة دي"
          placeholder="اسأل Nova عن الخطوة دي…"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="button" aria-label="كلّم Nova بالصوت" onClick={() => onAsk('', 'voice')}>
          <NovaIcon name="voice" size={18} />
        </button>
        <button type="submit" aria-label="ابعت لـ Nova" disabled={!text.trim()}>
          <NovaIcon name="send" size={18} />
        </button>
      </form>
      <button
        type="button"
        className="nova-round"
        aria-label="اسأل Nova"
        onClick={() => onAsk('', 'chat')}
      >
        <img src="/lesson-assets/nova.webp" alt="" width={34} height={34} />
      </button>
    </>
  );
}
