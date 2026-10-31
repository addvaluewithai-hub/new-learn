import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { useI18n } from '../../i18n';
import { ACTIONS } from '../credits/pricing';
import { buildText } from '../studio/buildText';

type Edit = {
  id: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  topic: string;
  steps: Array<{ at: string; title: string }>;
  result: { message?: string };
  error: string;
};
const working = (e: Edit) => e.status === 'queued' || e.status === 'running';

/**
 * The side chat beside a draft (S2): the teacher says what to change, the builder edits this
 * lesson, and `onEdited` reloads the preview in place each time something is saved.
 */
export function EditChat({
  lessonId,
  open,
  onOpen,
  onEdited,
}: {
  lessonId: string;
  open: boolean;
  onOpen: (open: boolean) => void;
  onEdited: () => Promise<void>;
}) {
  const { t, dir } = useI18n();
  const [edits, setEdits] = useState<Edit[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ edits: Edit[] }>(`/studio/lessons/${lessonId}/edits`).then(
      (r) => setEdits(r.edits),
      (e) => setError(e.message),
    );
  }, [lessonId]);
  const active = edits?.find(working) ?? null;
  // While an edit runs: its steps every few seconds, and the preview as soon as it changes.
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(async () => {
      try {
        const now = await api<Edit>(`/studio/jobs/${active.id}`);
        setEdits((list) => list?.map((e) => (e.id === now.id ? now : e)) ?? null);
        await onEdited();
      } catch {
        // the next tick tries again
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [active?.id, onEdited]); // eslint-disable-line react-hooks/exhaustive-deps
  const send = async () => {
    setBusy(true);
    setError('');
    try {
      const edit = await api<Edit>(`/studio/lessons/${lessonId}/edits`, {
        instruction: text.trim(),
      });
      setEdits((list) => [edit, ...(list ?? [])]);
      setText('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const status = (e: Edit) => {
    if (e.status === 'queued') return t('authoring.edits.queued');
    if (e.status === 'running')
      return e.steps.length
        ? buildText(e.steps[e.steps.length - 1].title)
        : t('authoring.edits.queued');
    if (e.status === 'done') return e.result.message || t('authoring.edits.done');
    return [e.result.message, buildText(e.error || 'step:failed')].filter(Boolean).join(' ');
  };
  return (
    <>
      <button
        type="button"
        className="draft-edits-toggle"
        dir={dir}
        onClick={() => onOpen(!open)}
        aria-expanded={open}
        data-working={active ? '' : undefined}
      >
        {active ? t('authoring.edits.toggleWorking') : t('authoring.edits.toggle')}
      </button>
      {open ? (
        <aside className="draft-edits" dir={dir} aria-label={t('authoring.edits.panel')}>
          <header>
            <strong>{t('authoring.edits.title')}</strong>
          </header>
          <ol>
            {[...(edits ?? [])].reverse().map((e) => (
              <li key={e.id} data-status={e.status}>
                <p className="draft-edit-ask">
                  <bdi>{e.topic}</bdi>
                </p>
                <p className="draft-edit-reply" aria-live={working(e) ? 'polite' : undefined}>
                  {working(e) && <span className="draft-edit-dot" aria-hidden />}
                  <bdi>{status(e)}</bdi>
                </p>
              </li>
            ))}
          </ol>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (text.trim() && !active) void send();
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('authoring.edits.placeholder')}
              aria-label={t('authoring.edits.label')}
              rows={3}
              maxLength={2000}
            />
            <button type="submit" disabled={busy || !!active || text.trim().length < 3}>
              {t('authoring.edits.send')}
            </button>
          </form>
          {active ? <p className="draft-notes-hint">{t('authoring.edits.oneAtATime')}</p> : null}
          {error ? <p role="alert">{error}</p> : null}
          <p className="draft-notes-hint">
            {t('authoring.edits.cost', { credits: ACTIONS['lesson.refine'].credits })}
          </p>
        </aside>
      ) : null}
    </>
  );
}
