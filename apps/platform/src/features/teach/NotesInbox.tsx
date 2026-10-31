import { useState } from 'react';
import { api } from '../../shared/api';
import { Alert, Badge, Button, Chip, EmptyState } from '../../shared/ui';
import { Rich } from '../../i18n/Rich';
import { useI18n, type TextKey } from '../../i18n';
import type { Workspace } from './types';

type Status = 'open' | 'review' | 'done' | 'dismissed';
const STATUS: Record<Status, { text: TextKey; tone: 'warning' | 'tutor' | 'success' | 'neutral' }> =
  {
    open: { text: 'teach.notes.status.open', tone: 'warning' },
    review: { text: 'teach.notes.status.review', tone: 'tutor' },
    done: { text: 'teach.notes.status.done', tone: 'success' },
    dismissed: { text: 'teach.notes.status.dismissed', tone: 'neutral' },
  };
const PHASE: Record<string, TextKey> = {
  narration: 'teach.notes.phase.narration',
  attempt: 'teach.notes.phase.attempt',
  feedback: 'teach.notes.phase.feedback',
};

/** Every note on the course, by status, with the step it is on and what to do about it. */
export function NotesInbox({
  work,
  onChanged,
}: {
  work: Workspace;
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [show, setShow] = useState<Status[]>(['open', 'review']);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const toggle = (s: Status) =>
    setShow((now) => (now.includes(s) ? now.filter((x) => x !== s) : [...now, s]));
  const set = async (id: string, status: Status) => {
    setBusy(id);
    setError('');
    try {
      await api(`/teach/notes/${id}`, { status });
      await onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };
  const notes = work.notes.filter((n) => show.includes(n.status));
  const lessonTitle = (id: string) =>
    work.lessons.find((l) => l.id === id)?.title ?? t('teach.notes.lessonFallback');
  return (
    <div className="teach-notes">
      <div className="chips" role="group" aria-label={t('teach.notes.filterLabel')}>
        {(Object.keys(STATUS) as Status[]).map((s) => (
          <Chip key={s} pressed={show.includes(s)} onToggle={() => toggle(s)}>
            {t('teach.notes.filter', {
              status: t(STATUS[s].text),
              count: work.notes.filter((n) => n.status === s).length,
            })}
          </Chip>
        ))}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {notes.length ? (
        <ul className="teach-note-list">
          {notes.map((n) => (
            <li key={n.id} className="teach-note-item">
              <div className="teach-note-where">
                <Badge tone={STATUS[n.status].tone}>{t(STATUS[n.status].text)}</Badge>
                <a href={`/?draft=${n.lessonId}`}>
                  <bdi>{lessonTitle(n.lessonId)}</bdi>
                </a>
                <span>
                  {t('teach.notes.where', {
                    phase: PHASE[n.position.phase] ? t(PHASE[n.position.phase]) : n.position.phase,
                    step: n.position.step + 1,
                  })}
                </span>
              </div>
              {n.currentText && <blockquote>{n.currentText}</blockquote>}
              <p>{n.note}</p>
              {n.resolution && (
                <p className="teach-note-fix">
                  <Rich k="teach.notes.fix" parts={{ fix: <bdi>{n.resolution}</bdi> }} />
                </p>
              )}
              <div className="teach-note-actions">
                {n.status === 'review' && (
                  <Button size="sm" disabled={busy === n.id} onClick={() => set(n.id, 'done')}>
                    {t('teach.notes.markDone')}
                  </Button>
                )}
                {n.status !== 'open' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy === n.id}
                    onClick={() => set(n.id, 'open')}
                  >
                    {t('teach.notes.reopen')}
                  </Button>
                )}
                {n.status === 'open' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy === n.id}
                    onClick={() => set(n.id, 'dismissed')}
                  >
                    {t('teach.notes.dismiss')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={work.notes.length ? t('teach.notes.emptyFiltered') : t('teach.notes.empty')}
        >
          {t('teach.notes.emptyBody')}
        </EmptyState>
      )}
    </div>
  );
}
