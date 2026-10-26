import { useState } from 'react';
import type { LessonContext } from '@learn/lesson-runtime';
import { api } from '../../shared/api';
import './feedback.css';

export type Note = {
  id: string;
  position: { sceneId: string; phase: string; step: number };
  kind: string;
  note: string;
  status: 'open' | 'review' | 'done' | 'dismissed';
  resolution: string;
};
const KINDS: Array<[string, string]> = [
  ['text', 'الشرح'],
  ['board', 'البورد'],
  ['question', 'السؤال'],
  ['translation', 'الترجمة'],
];
const STATUS: Record<Note['status'], string> = {
  open: 'مفتوحة',
  review: 'اتصلحت، راجعها',
  done: 'تمام',
  dismissed: 'اتشالت',
};

/** The teacher's notes on the step on screen; the connected AI reads and fixes them. */
export function FeedbackPanel({
  lessonId,
  revision,
  notes,
  context,
  onChanged,
}: {
  lessonId: string;
  revision: number;
  notes: Note[];
  context: LessonContext | null;
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [kind, setKind] = useState('text');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const here =
    context && context.phase !== 'complete'
      ? { sceneId: context.sceneId, phase: context.phase, step: context.step ?? 0 }
      : null;
  const atHere = notes.filter(
    (n) =>
      here &&
      n.position.sceneId === here.sceneId &&
      n.position.phase === here.phase &&
      n.position.step === here.step,
  );
  const waiting = notes.filter((n) => n.status === 'open' || n.status === 'review').length;
  const act = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await work();
      await onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button
        type="button"
        className="draft-notes-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        ملاحظات المسودة{waiting ? ` (${waiting})` : ''}
      </button>
      {open ? (
        <aside className="draft-notes" aria-label="ملاحظات على الخطوة دي">
          <header>
            <strong>{here ? `${context?.sceneTitle} · خطوة ${here.step + 1}` : 'آخر الدرس'}</strong>
            <span>نسخة {revision}</span>
          </header>
          <ul>
            {atHere.map((n) => (
              <li key={n.id} data-status={n.status}>
                <p>{n.note}</p>
                {n.resolution ? <p className="draft-notes-fix">الإصلاح: {n.resolution}</p> : null}
                <span className="draft-notes-status">{STATUS[n.status]}</span>
                {n.status === 'review' ? (
                  <span className="draft-notes-actions">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        act(() => api(`/authoring/feedback/${n.id}`, { status: 'done' }))
                      }
                    >
                      تمام
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        act(() => api(`/authoring/feedback/${n.id}`, { status: 'open' }))
                      }
                    >
                      لسه
                    </button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {here ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!text.trim()) return;
                void act(async () => {
                  await api(`/authoring/lessons/${lessonId}/feedback`, {
                    ...here,
                    kind,
                    note: text.trim(),
                  });
                  setText('');
                });
              }}
            >
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                aria-label="نوع الملاحظة"
              >
                {KINDS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="إيه اللي محتاج يتظبط في الخطوة دي؟"
                aria-label="الملاحظة"
                rows={3}
                maxLength={2000}
              />
              <button type="submit" disabled={busy || !text.trim()}>
                ابعت الملاحظة
              </button>
            </form>
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
          <p className="draft-notes-hint">
            اطلب من Claude: «شوف ملاحظاتي على الدرس وصلّحها». هيعلّم كل ملاحظة «اتصلحت، راجعها».
          </p>
        </aside>
      ) : null}
    </>
  );
}
