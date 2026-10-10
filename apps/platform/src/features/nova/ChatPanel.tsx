import { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { NovaIcon } from './NovaIcon';
import type { Position } from './types';
import type { useChat } from './useChat';
export function ChatPanel({
  chat,
  position,
  name,
  enabled,
}: {
  chat: ReturnType<typeof useChat>;
  position: Position;
  name: string;
  enabled: boolean;
}) {
  const [draft, setDraft] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = draft;
    if (!value.trim()) return;
    setDraft('');
    const ok = await chat.send(value, position);
    if (!ok) setDraft((current) => current || value);
  }
  return (
    <>
      <ChatMessages messages={chat.messages} loading={chat.loading} name={name} />
      {chat.error && (
        <p className="nova-error" role="alert">
          {chat.error}
        </p>
      )}
      {!enabled && <p className="nova-error">افتح الدرس بعد تسجيل الدخول لاستخدام Nova.</p>}
      <form className="nova-composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="nova-message">
          رسالتك لنوفا
        </label>
        <textarea
          id="nova-message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          placeholder="اسأل عن الجزء اللي واقفين عنده…"
          disabled={!enabled}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (!chat.loading && enabled) void submit(e);
            }
          }}
        />
        {chat.loading ? (
          <button type="button" onClick={chat.stop} aria-label="إيقاف الرد">
            <NovaIcon name="pause" />
          </button>
        ) : (
          <button type="submit" disabled={!enabled || !draft.trim()} aria-label="إرسال الرسالة">
            <NovaIcon name="send" />
          </button>
        )}
      </form>
      <small className="nova-footnote">
        Enter للإرسال · Shift + Enter لسطر جديد · Nova قد تخطئ، راجع الشرح.
      </small>
    </>
  );
}
