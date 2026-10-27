import { PlatformIcon } from '../../shared/PlatformIcon';
import { goalsOf, lessonHref, nextLesson, open, stats } from './plan';
import type { Curriculum, Resume } from './types';

/** Goal marks: one diamond per goal, filled when its questions were answered. */
export function GoalMarks({ done, total }: { done: number; total: number }) {
  if (!total) return null;
  return (
    <span className="goal-marks" aria-label={`الأهداف ${done} من ${total}`}>
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
      <svg
        className="pick-waves"
        viewBox="0 0 420 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M-10 70 Q 25 20 60 70 T 130 70 T 200 70 T 270 70 T 340 70 T 410 70 T 480 70" />
        <path d="M-10 170 Q 40 130 90 170 T 190 170 T 290 170 T 390 170 T 490 170" />
      </svg>
      <header className="pick-head">
        <span className="eyebrow">
          {started ? 'كمّل من مكانك' : resume ? 'الدرس الجاي' : 'ابدأ من هنا'}
        </span>
        <a href={`/?curriculum=${encodeURIComponent(course.id)}`} className="pick-course">
          {course.title} · {course_.completed} من {course_.lessons} دروس
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
          {started ? 'كمّل' : 'ابدأ'} <PlatformIcon name="arrow" />
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
