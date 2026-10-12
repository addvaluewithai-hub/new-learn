import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { ReadText, textDirection } from '../ReadText';
import type { ThreadItem } from '../thread';

const SUGGESTIONS = ['اشرحها بطريقة أبسط', 'إديني مثال تاني', 'ليه كده؟'];

/**
 * The lesson as one conversation: the authored lines (what the lesson says), the learner's
 * answers and questions, and the tutor's replies, marked so they are never mistaken for
 * the curriculum. Opens over the board on phones and beside it on wide screens.
 */
export function Thread({
  items,
  tutor,
  busy,
  onAsk,
  onClose,
  footer,
}: {
  items: ThreadItem[];
  tutor: string;
  busy?: boolean;
  onAsk?: (text: string) => void;
  onClose: () => void;
  /** The composer, when the dock cannot hold it (phones). */
  footer?: ReactNode;
}) {
  const list = useRef<HTMLOListElement>(null);
  const last = items.at(-1);
  const tail = last?.kind === 'note' ? `${last.key}:${last.note.text.length}` : last?.key;
  useLayoutEffect(() => {
    const el = list.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: tail ? 'smooth' : 'auto' });
  }, [tail]);
  useLayoutEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, []);
  return (
    <aside className="rl-thread" aria-label="محادثة الدرس">
      <header className="rl-thread-head">
        <button type="button" className="rl-grip" onClick={onClose} aria-label="صغّر المحادثة" />
        <strong>محادثة الدرس</strong>
        <button type="button" className="rl-round rl-round-sm" onClick={onClose} aria-label="اقفل">
          ×
        </button>
      </header>
      <ol className="rl-thread-list" ref={list} role="log" aria-live="polite">
        {items.map((item) => (
          <li key={item.key} className={`rl-t rl-t-${item.kind}`} {...attrs(item)}>
            <Item item={item} tutor={tutor} />
          </li>
        ))}
        {busy && last?.kind !== 'note' ? (
          <li className="rl-t rl-t-note" data-role="tutor" data-pending>
            <span className="rl-t-who">{tutor}</span>
            <Dots />
          </li>
        ) : null}
      </ol>
      {onAsk ? (
        <div className="rl-suggest" role="group" aria-label="أسئلة سريعة">
          {SUGGESTIONS.map((text) => (
            <button key={text} type="button" disabled={busy} onClick={() => onAsk(text)}>
              {text}
            </button>
          ))}
        </div>
      ) : null}
      {footer ? <div className="rl-thread-foot">{footer}</div> : null}
    </aside>
  );
}

function attrs(item: ThreadItem) {
  if (item.kind === 'note')
    return {
      'data-role': item.note.role,
      'data-pending': item.note.pending || undefined,
      'data-failed': item.note.failed || undefined,
    };
  if (item.kind === 'line' || item.kind === 'question')
    return { 'aria-current': item.current ? ('step' as const) : undefined };
  return {};
}

const Dots = () => (
  <span className="rl-dots" aria-label="بيكتب">
    <i />
    <i />
    <i />
  </span>
);

function Item({ item, tutor }: { item: ThreadItem; tutor: string }) {
  switch (item.kind) {
    case 'scene':
      return (
        <>
          <span>مشهد {item.number}</span> {item.title}
        </>
      );
    case 'line':
      return (
        <>
          {item.label ? <span className="rl-tag">{item.label}</span> : null}
          <p dir={textDirection(item.text)}>
            <ReadText text={item.text} />
          </p>
        </>
      );
    case 'question':
      return (
        <>
          <span className="rl-tag rl-tag-ask">سؤال</span>
          <p dir="ltr" lang="en" className="rl-question-en">
            <ReadText text={item.english} />
          </p>
          <p dir="rtl">
            <ReadText text={item.arabic} />
          </p>
        </>
      );
    case 'answer':
      return <p dir="auto">{item.text || 'معرفتش، وريني الحل'}</p>;
    case 'note': {
      const { note } = item;
      if (note.role === 'learner')
        return (
          <p dir="auto">
            {note.voice ? <span className="rl-t-voice" aria-label="بالصوت" /> : null}
            {note.text || '…'}
          </p>
        );
      return (
        <>
          <span className="rl-t-who">{tutor}</span>
          {note.text ? (
            <p dir={textDirection(note.text)}>
              <ReadText text={note.text} />
            </p>
          ) : (
            <Dots />
          )}
        </>
      );
    }
  }
}
