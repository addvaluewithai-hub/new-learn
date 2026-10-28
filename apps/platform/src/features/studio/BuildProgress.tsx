import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { BuildJob } from './types';
import './progress.css';
import { Alert, ButtonLink, Spinner } from '../../shared/ui';
import { BuildBoards } from './BuildBoards';

const POLL_MS = 3000;

/** The builder's steps as they arrive, then the draft it made or why it stopped. */
export function BuildProgress({ jobId }: { jobId: string }) {
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
    return error ? <Alert tone="error">{error}</Alert> : <Spinner label="بنجيب حالة الكورس…" />;
  const working = job.status === 'queued' || job.status === 'running';
  return (
    <section className="studio build" aria-live="polite">
      <div className="page-heading">
        <ButtonLink variant="link" href="/?studio">
          ← كورس جديد
        </ButtonLink>
        <span className="eyebrow">
          {job.status === 'queued'
            ? 'مستني دوره'
            : job.status === 'running'
              ? 'بيتبني دلوقتي'
              : job.status === 'done'
                ? 'خلص'
                : 'وقف'}
        </span>
        <h1>{job.topic}</h1>
        {working && <p>ده بياخد من 5 لـ 20 دقيقة. ممكن تقفل الصفحة وترجع لها، الشغل مكمّل.</p>}
      </div>
      <ol className="build-steps">
        {job.status === 'queued' && <li className="now">مستني الـbuilder يستلم طلبك…</li>}
        {job.steps.map((step, i) => (
          <li
            key={`${step.at}-${i}`}
            className={working && i === job.steps.length - 1 ? 'now' : ''}
          >
            {step.title}
          </li>
        ))}
      </ol>
      <BuildBoards boards={job.boards ?? []} working={working} />
      {error && working && <p className="muted">{error} بنحاول تاني…</p>}
      {job.status === 'done' && (
        <div className="build-done">
          {job.result.message && <p>{job.result.message}</p>}
          <ButtonLink href={`/?draft=${job.result.lessonId}`}>افتح أول درس</ButtonLink>
          <ButtonLink variant="secondary" href="/">
            مسوداتي
          </ButtonLink>
        </div>
      )}
      {job.status === 'failed' && (
        <Alert tone="error">
          معرفناش نكمّل الكورس ده. {job.error}{' '}
          <ButtonLink variant="link" href="/?studio">
            جرّب تاني
          </ButtonLink>
        </Alert>
      )}
    </section>
  );
}
