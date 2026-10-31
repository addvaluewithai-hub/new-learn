import { PlatformIcon } from '../../shared/PlatformIcon';
import { goalsOf, lessonHref, nextLesson, open, stats } from './plan';
import type { Curriculum, Resume } from './types';
import { useI18n } from '../../i18n';

/** Goal marks: one diamond per goal, filled when its questions were answered. */
export function GoalMarks({ done, total }: { done: number; total: number }) {
  const { t } = useI18n();
  if (!total) return null;
  return (
    <span className="goal-marks" aria-label={t('catalog.continue.goals', { done, total })}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} data-met={i < done || undefined} aria-hidden="true" />
      ))}
      <bdi dir="ltr">
        {done} / {total}
      </bdi>
    </span>
  );
}

/** The one obvious next step on the home page. */
export function ContinueCard({
  curricula,
  resume,
}: {
  curricula: Curriculum[];
  resume?: Resume | null;
}) {
  const { t } = useI18n();
  const course =
    curricula.find((c) => c.id === resume?.curriculumId) ??
    curricula.find((c) => c.lessons.some(open));
  const lesson = course && nextLesson(course, resume);
  if (!course || !lesson) return null;
  const goals = goalsOf(course.id, lesson.id);
  const total = lesson.progress?.goalsTotal || goals.length;
  const done = lesson.progress?.goalsDone ?? 0;
  const started = lesson.progress?.status === 'started';
  const course_ = stats(course);
  return (
    <section className="pick" aria-labelledby="pick-title">
      <header className="pick-head">
        <span className="eyebrow">
          {started
            ? t('catalog.continue.resume')
            : resume
              ? t('catalog.continue.next')
              : t('catalog.continue.start')}
        </span>
        <a href={`/?curriculum=${encodeURIComponent(course.id)}`} className="pick-course">
          <bdi>{course.title}</bdi> ·{' '}
          {t('catalog.continue.lessonsDone', {
            completed: course_.completed,
            count: course_.lessons,
          })}
        </a>
      </header>
      <div className="pick-card">
        <div className="pick-main">
          <h2 id="pick-title">{lesson.title}</h2>
          <div className="pick-progress">
            <span className="pick-bar" aria-hidden="true">
              <i style={{ inlineSize: `${total ? (100 * done) / total : 0}%` }} />
            </span>
            <GoalMarks done={done} total={total} />
          </div>
        </div>
        <a className="pick-go" href={lessonHref(course.id, lesson.id)}>
          {started ? t('catalog.action.continue') : t('catalog.action.start')}{' '}
          <PlatformIcon name="arrow" />
        </a>
        {goals.length ? (
          <ul className="pick-goals">
            {goals.map((goal) => (
              <li key={goal.id}>{goal.text}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
