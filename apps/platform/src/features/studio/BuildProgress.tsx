import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { BuildJob } from './types';
import './progress.css';

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
    return error ? (
      <p className="error-message" role="alert">
        {error}
      </p>
    ) : (
      <p role="status">بنجيب حالة الكورس…</p>
    );
  const working = job.status === 'queued' || job.status === 'running';
  return (
    <section className="studio build" aria-live="polite">
      <div className="page-heading">
        <a className="text-button" href="/?studio">
          ← كورس جديد
        </a>
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
      {error && working && <p className="muted">{error} بنحاول تاني…</p>}
      {job.status === 'done' && (
        <div className="build-done">
          {job.result.message && <p>{job.result.message}</p>}
          <a className="button primary" href={`/?draft=${job.result.lessonId}`}>
            افتح أول درس
          </a>
          <a className="button secondary" href="/">
            مسوداتي
          </a>
        </div>
      )}
      {job.status === 'failed' && (
        <div className="error-message" role="alert">
          معرفناش نكمّل الكورس ده. {job.error}
          <a className="text-button" href="/?studio">
            {' '}
            جرّب تاني
          </a>
        </div>
      )}
    </section>
  );
}
