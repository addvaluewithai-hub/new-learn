import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { Alert, Badge, Button } from '../../shared/ui';
import { useI18n } from '../../i18n';
import type { Workspace } from './types';

const POLL_MS = 5000;

type LessonNarration = {
  lessonId: string;
  title: string;
  lines: number;
  recorded: number;
  toRecord: number;
  flagged: number;
  seconds: number;
  minutes: number;
  credits: number;
  job: { id: string; status: 'queued' | 'running' | 'done' | 'failed' } | null;
};
type Plan = { lessons: LessonNarration[]; pricePerMinute: number };

const busy = (l: LessonNarration) => l.job?.status === 'queued' || l.job?.status === 'running';

/**
 * Recorded narration per lesson (docs/voice-agent.md): how many lines have a clip, what the
 * rest would cost, and a button that records them. Polls while a recording runs.
 */
export function NarrationCard({ work }: { work: Workspace }) {
  const { t } = useI18n();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState('');
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const load = () =>
      api<Plan>(`/teach/courses/${work.id}/narration`, undefined, controller.signal).then(
        (next) => {
          setPlan(next);
          setError('');
          if (next.lessons.some(busy)) timer = setTimeout(load, POLL_MS);
        },
        (e) => {
          if (!controller.signal.aborted) setError((e as Error).message);
        },
      );
    load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [work.id, note]);
  const record = async (lessonId: string) => {
    setSending(lessonId);
    setError('');
    try {
      await api(`/teach/lessons/${lessonId}/narration`, {});
      setNote(`${lessonId}:${Date.now()}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending('');
    }
  };
  return (
    <section className="teach-narration" aria-labelledby="narration-title">
      <h2 id="narration-title">{t('teach.narration.title')}</h2>
      <p className="teach-note">
        {t('teach.narration.lead', { price: plan?.pricePerMinute ?? 2 })}
      </p>
      {error && <Alert tone="error">{error}</Alert>}
      {note && !error && <Alert tone="success">{t('teach.narration.started')}</Alert>}
      {!plan ? (
        <p className="teach-note">{t('teach.narration.loading')}</p>
      ) : (
        <ul className="teach-narration-list">
          {plan.lessons.map((l) => (
            <li key={l.lessonId}>
              <span className="teach-narration-title">
                <bdi>{l.title}</bdi>
              </span>
              <span className="teach-narration-state">
                {busy(l) ? (
                  <Badge tone="warning">
                    {t(
                      l.job?.status === 'queued'
                        ? 'teach.narration.queued'
                        : 'teach.narration.running',
                    )}
                  </Badge>
                ) : l.lines && !l.toRecord ? (
                  <Badge tone="success">{t('teach.narration.done')}</Badge>
                ) : l.recorded ? (
                  <Badge>
                    {t('teach.narration.recorded', { recorded: l.recorded, lines: l.lines })}
                  </Badge>
                ) : (
                  <Badge>{t('teach.narration.none')}</Badge>
                )}
                {l.flagged > 0 && (
                  <Badge tone="warning">{t('teach.narration.flagged', { count: l.flagged })}</Badge>
                )}
                {l.job?.status === 'failed' && !busy(l) && (
                  <span className="teach-narration-failed">{t('teach.narration.failed')}</span>
                )}
              </span>
              {l.toRecord > 0 && !busy(l) && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={sending === l.lessonId}
                  onClick={() => record(l.lessonId)}
                >
                  {t('teach.narration.record', { count: l.toRecord, credits: l.credits })}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
