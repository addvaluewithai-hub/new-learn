import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { BuildJob } from './types';
import './progress.css';
import { Alert, ButtonLink, Spinner } from '../../shared/ui';
import { BuildBoards } from './BuildBoards';
import { buildText } from './buildText';
import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';

const POLL_MS = 3000;

/** The builder's steps as they arrive, then the draft it made or why it stopped. */
export function BuildProgress({ jobId }: { jobId: string }) {
  const { t } = useI18n();
  const [job, setJob] = useState<BuildJob | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const load = () =>
      api<BuildJob>(`/studio/jobs/${jobId}`, undefined, controller.signal).then(
        (next) => {
          setJob(next);
          setError('');
          if (next.status === 'queued' || next.status === 'running')
            timer = setTimeout(load, POLL_MS);
        },
        (error) => {
          if (controller.signal.aborted) return;
          setError(error.message);
          if (error.status !== 404) timer = setTimeout(load, POLL_MS * 2);
        },
      );
    load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [jobId]);

  if (!job)
    return error ? (
      <Alert tone="error">{error}</Alert>
    ) : (
      <Spinner label={t('studio.progress.loading')} />
    );
  const working = job.status === 'queued' || job.status === 'running';
  return (
    <section className="studio build" aria-live="polite">
      <div className="page-heading">
        <ButtonLink variant="link" href="/?studio">
          {t('common.backLink')} {t('studio.progress.newCourse')}
        </ButtonLink>
        <span className="eyebrow">
          {job.status === 'queued'
            ? t('studio.progress.status.queued')
            : job.status === 'running'
              ? t('studio.progress.status.running')
              : job.status === 'done'
                ? t('studio.progress.status.done')
                : t('studio.progress.status.failed')}
        </span>
        <h1>{job.topic}</h1>
        {working && <p>{t('studio.progress.duration')}</p>}
      </div>
      <ol className="build-steps">
        {job.status === 'queued' && <li className="now">{t('studio.progress.waiting')}</li>}
        {job.steps.map((step, i) => (
          <li
            key={`${step.at}-${i}`}
            className={working && i === job.steps.length - 1 ? 'now' : ''}
          >
            {buildText(step.title)}
          </li>
        ))}
      </ol>
      <BuildBoards boards={job.boards ?? []} working={working} />
      {error && working && <p className="muted">{t('studio.progress.retrying', { error })}</p>}
      {job.status === 'done' && (
        <div className="build-done">
          {job.result.message && <p>{buildText(job.result.message)}</p>}
          <ButtonLink href={`/?draft=${job.result.lessonId}`}>
            {t('studio.progress.openFirst')}
          </ButtonLink>
          <ButtonLink variant="secondary" href="/">
            {t('studio.progress.myDrafts')}
          </ButtonLink>
        </div>
      )}
      {job.status === 'failed' && (
        <Alert tone="error">
          <Rich
            k="studio.progress.failed"
            parts={{
              error: buildText(job.error),
              retry: (
                <ButtonLink variant="link" href="/?studio">
                  {t('studio.progress.retry')}
                </ButtonLink>
              ),
            }}
          />
        </Alert>
      )}
    </section>
  );
}
