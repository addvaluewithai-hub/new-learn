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
      <span>
        {done} من {total}
      </span>
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
  const done = lesson.progress?.goalsDone ?? 0;
  const total = stats(course);
  const started = lesson.progress?.status === 'started';
  return (
    <section className="continue-card" aria-labelledby="continue-title">
      <div className="continue-head">
        <span className="eyebrow">
          {started ? 'كمّل من مكانك' : resume ? 'الدرس الجاي' : 'ابدأ من هنا'}
        </span>
        <span className="continue-course">
          {course.title} · خلّصت {total.completed} من {total.lessons} دروس
        </span>
      </div>
      <div className="continue-lesson">
        <div>
          <h2 id="continue-title">{lesson.title}</h2>
          <GoalMarks done={done} total={lesson.progress?.goalsTotal || goals.length} />
        </div>
        <a className="button primary" href={lessonHref(course.id, lesson.id)}>
          {started ? 'كمّل' : 'ابدأ'} <PlatformIcon name="arrow" />
        </a>
      </div>
      {goals.length ? (
        <ul className="continue-goals">
          {goals.map((goal) => (
            <li key={goal.id}>{goal.text}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
