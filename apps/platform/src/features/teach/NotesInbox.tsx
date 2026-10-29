import { useState } from 'react';
import { api } from '../../shared/api';
import { Alert, Badge, Button, Chip, EmptyState } from '../../shared/ui';
import type { Workspace } from './types';

type Status = 'open' | 'review' | 'done' | 'dismissed';
const STATUS: Record<Status, { text: string; tone: 'warning' | 'tutor' | 'success' | 'neutral' }> =
  {
    open: { text: 'مفتوحة', tone: 'warning' },
    review: { text: 'اتصلحت، راجعها', tone: 'tutor' },
    done: { text: 'تمام', tone: 'success' },
    dismissed: { text: 'اتشالت', tone: 'neutral' },
  };
const PHASE: Record<string, string> = {
  narration: 'الشرح',
  attempt: 'السؤال',
  feedback: 'الإجابة',
};

/** Every note on the course, by status, with the step it is on and what to do about it. */
export function NotesInbox({
  work,
  onChanged,
}: {
  work: Workspace;
  onChanged: () => Promise<void>;
}) {
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
  const lessonTitle = (id: string) => work.lessons.find((l) => l.id === id)?.title ?? 'درس';
  return (
    <div className="teach-notes">
      <div className="chips" role="group" aria-label="حالة الملاحظات">
        {(Object.keys(STATUS) as Status[]).map((s) => (
          <Chip key={s} pressed={show.includes(s)} onToggle={() => toggle(s)}>
            {STATUS[s].text} ({work.notes.filter((n) => n.status === s).length})
          </Chip>
        ))}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {notes.length ? (
        <ul className="teach-note-list">
          {notes.map((n) => (
            <li key={n.id} className="teach-note-item">
              <div className="teach-note-where">
                <Badge tone={STATUS[n.status].tone}>{STATUS[n.status].text}</Badge>
                <a href={`/?draft=${n.lessonId}`}>{lessonTitle(n.lessonId)}</a>
                <span>
                  {PHASE[n.position.phase] ?? n.position.phase} · خطوة {n.position.step + 1}
                </span>
              </div>
              {n.currentText && <blockquote>{n.currentText}</blockquote>}
              <p>{n.note}</p>
              {n.resolution && <p className="teach-note-fix">الإصلاح: {n.resolution}</p>}
              <div className="teach-note-actions">
                {n.status === 'review' && (
                  <Button size="sm" disabled={busy === n.id} onClick={() => set(n.id, 'done')}>
                    تمام
                  </Button>
                )}
                {n.status !== 'open' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy === n.id}
                    onClick={() => set(n.id, 'open')}
                  >
                    افتحها تاني
                  </Button>
                )}
                {n.status === 'open' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy === n.id}
                    onClick={() => set(n.id, 'dismissed')}
                  >
                    شيلها
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={work.notes.length ? 'مفيش ملاحظات بالحالة دي' : 'مفيش ملاحظات'}>
          افتح المعاينة واكتب ملاحظة على أي خطوة، والـAI اللي متوصّل بحسابك يصلّحها.
        </EmptyState>
      )}
    </div>
  );
}
