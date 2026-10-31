import { useEffect, useRef, useState } from 'react';
import type { Message } from './types';
import { useI18n } from '../../i18n';
export function ChatMessages({
  messages,
  loading,
  name,
}: {
  messages: Message[];
  loading: boolean;
  name: string;
}) {
  const { t } = useI18n();
  const scroll = useRef<HTMLDivElement>(null),
    follow = useRef(true);
  const [unseen, setUnseen] = useState(false);
  function latest() {
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: 'auto' });
    follow.current = true;
    setUnseen(false);
  }
  useEffect(() => {
    if (follow.current) latest();
    else setUnseen(true);
  }, [messages, loading]);
  return (
    <div className="nova-conversation">
      <div
        className="nova-messages"
        ref={scroll}
        role="log"
        aria-label={t('nova.chat.log')}
        aria-live="polite"
        onScroll={() => {
          const node = scroll.current!;
          follow.current = node.scrollHeight - node.scrollTop - node.clientHeight < 65;
          if (follow.current) setUnseen(false);
        }}
      >
        {!messages.length && (
          <div className="nova-welcome">
            <span>{t('nova.chat.welcome', { name })}</span>
            <h3>{t('nova.chat.welcomeTitle')}</h3>
            <p>{t('nova.chat.welcomeLead')}</p>
          </div>
        )}
        {messages.map((message) => (
          <article key={message.id} className={`nova-message ${message.role}`}>
            <small>{message.role === 'user' ? name : 'Nova'}</small>
            <p dir="auto">{message.text}</p>
          </article>
        ))}
        {loading && (
          <p className="nova-thinking" role="status">
            <span className="nova-dots" /> {t('nova.chat.thinking')}
          </p>
        )}
      </div>
      {unseen && (
        <button className="nova-latest" onClick={latest}>
          {t('nova.chat.latest')}
        </button>
      )}
    </div>
  );
}
