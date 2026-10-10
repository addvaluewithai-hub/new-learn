import { useEffect, useRef, useState } from 'react';
import type { Message } from './types';
export function ChatMessages({
  messages,
  loading,
  name,
}: {
  messages: Message[];
  loading: boolean;
  name: string;
}) {
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
        aria-label="المحادثة"
        aria-live="polite"
        onScroll={() => {
          const node = scroll.current!;
          follow.current = node.scrollHeight - node.scrollTop - node.clientHeight < 65;
          if (follow.current) setUnseen(false);
        }}
      >
        {!messages.length && (
          <div className="nova-welcome">
            <span>أهلًا {name} 👋</span>
            <h3>نقف عند أي فكرة ونفهمها سوا.</h3>
            <p>اسأل عن الشرح أو المصطلحات أو مثال محتاج توضيح.</p>
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
            <span className="nova-dots" /> Nova بتجهّز الرد…
          </p>
        )}
      </div>
      {unseen && (
        <button className="nova-latest" onClick={latest}>
          ↓ آخر الرسائل
        </button>
      )}
    </div>
  );
}
