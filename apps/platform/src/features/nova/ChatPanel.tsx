import { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { NovaIcon } from './NovaIcon';
import type { Position } from './types';
import type { useChat } from './useChat';
import { useI18n } from '../../i18n';
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
  const { t } = useI18n();
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
        <p className="nl-alert nl-alert--error" role="alert">
          {chat.error}
        </p>
      )}
      <form className="nova-composer" onSubmit={submit}>
        <label className="nl-sr-only" htmlFor="nova-message">
          {t('nova.chat.label')}
        </label>
        <textarea
          id="nova-message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          placeholder={t('nova.chat.placeholder')}
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
          <button type="button" onClick={chat.stop} aria-label={t('nova.chat.stop')}>
            <NovaIcon name="pause" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!enabled || !draft.trim()}
            aria-label={t('nova.chat.send')}
          >
            <NovaIcon name="send" />
          </button>
        )}
      </form>
      <small className="nova-footnote">{t('nova.chat.footnote')}</small>
    </>
  );
}
