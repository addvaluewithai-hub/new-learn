import { useState } from 'react';
import type { LessonContext } from '@learn/lesson-runtime';
import { api } from '../../shared/api';
import { useI18n, type TextKey } from '../../i18n';
import { Rich } from '../../i18n/Rich';
import './feedback.css';

export type Note = {
  id: string;
  position: { sceneId: string; phase: string; step: number };
  kind: string;
  note: string;
  status: 'open' | 'review' | 'done' | 'dismissed';
  resolution: string;
};
const KINDS: Array<[string, TextKey]> = [
  ['text', 'authoring.feedback.kinds.text'],
  ['board', 'authoring.feedback.kinds.board'],
  ['question', 'authoring.feedback.kinds.question'],
  ['translation', 'authoring.feedback.kinds.translation'],
];
const STATUS: Record<Note['status'], TextKey> = {
  open: 'authoring.feedback.status.open',
  review: 'authoring.feedback.status.review',
  done: 'authoring.feedback.status.done',
  dismissed: 'authoring.feedback.status.dismissed',
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
  const { t, dir } = useI18n();
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
        dir={dir}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {waiting
          ? t('authoring.feedback.toggleCount', { count: waiting })
          : t('authoring.feedback.toggle')}
      </button>
      {open ? (
        <aside className="draft-notes" dir={dir} aria-label={t('authoring.feedback.panel')}>
          <header>
            <strong>
              {here ? (
                <Rich
                  k="authoring.feedback.where"
                  parts={{ scene: <bdi>{context?.sceneTitle}</bdi>, step: here.step + 1 }}
                />
              ) : (
                t('authoring.feedback.end')
              )}
            </strong>
            <span>{t('authoring.feedback.revision', { revision })}</span>
          </header>
          <ul>
            {atHere.map((n) => (
              <li key={n.id} data-status={n.status}>
                <p>{n.note}</p>
                {n.resolution ? (
                  <p className="draft-notes-fix">
                    <Rich k="authoring.feedback.fix" parts={{ fix: <bdi>{n.resolution}</bdi> }} />
                  </p>
                ) : null}
                <span className="draft-notes-status">{t(STATUS[n.status])}</span>
                {n.status === 'review' ? (
                  <span className="draft-notes-actions">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        act(() => api(`/authoring/feedback/${n.id}`, { status: 'done' }))
                      }
                    >
                      {t('authoring.feedback.done')}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        act(() => api(`/authoring/feedback/${n.id}`, { status: 'open' }))
                      }
                    >
                      {t('authoring.feedback.notYet')}
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
                aria-label={t('authoring.feedback.kindLabel')}
              >
                {KINDS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {t(label)}
                  </option>
                ))}
              </select>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('authoring.feedback.placeholder')}
                aria-label={t('authoring.feedback.noteLabel')}
                rows={3}
                maxLength={2000}
              />
              <button type="submit" disabled={busy || !text.trim()}>
                {t('authoring.feedback.send')}
              </button>
            </form>
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
          <p className="draft-notes-hint">{t('authoring.feedback.hint')}</p>
        </aside>
      ) : null}
    </>
  );
}
