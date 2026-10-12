import { GoalMarks } from './ContinueCard';
import { goalsOf, lessonHref, nextLesson, open, partsOf, stats } from './plan';
import type { CatalogLesson, Curriculum, Resume } from './types';

function action(lesson: CatalogLesson) {
  if (!open(lesson)) return 'قريبًا';
  if (lesson.progress?.status === 'completed') return 'راجع';
  return lesson.progress ? 'كمّل' : 'ابدأ';
}

/** The curriculum as a path: parts, lessons, goals, and where the learner is now. */
export function StudyPlan({
  curriculum,
  resume,
}: {
  curriculum: Curriculum;
  resume?: Resume | null;
}) {
  const total = stats(curriculum);
  const current = nextLesson(curriculum, resume);
  const percent = total.goalsTotal ? Math.round((100 * total.goalsDone) / total.goalsTotal) : 0;
  return (
    <>
      <section className="plan-summary" aria-label="تقدمك في المنهج">
        <div>
          <strong>
            {total.goalsDone} <span>/ {total.goalsTotal}</span>
          </strong>
          <span>
            أهداف اتعلّمت · خلّصت {total.completed} من {total.lessons} دروس
          </span>
        </div>
        <span className="plan-percent">{percent}%</span>
        <div className="plan-bar" aria-hidden="true">
          <i style={{ width: `${percent}%` }} />
        </div>
      </section>
      <ol className="plan">
        {partsOf(curriculum).map((part, p) => (
          <li className="plan-part" key={part.title}>
            <header className="plan-part-head">
              <span className="plan-part-node">{p + 1}</span>
              <div>
                <h2>{part.title}</h2>
                {part.summary ? <p>{part.summary}</p> : null}
              </div>
            </header>
            <ol className="plan-lessons">
              {part.lessons.map((lesson) => {
                const goals = goalsOf(curriculum.id, lesson.id);
                const isCurrent = lesson.id === current?.id;
                const done = lesson.progress?.status === 'completed';
                return (
                  <li
                    key={lesson.id}
                    data-current={isCurrent || undefined}
                    data-done={done || undefined}
                    data-soon={!open(lesson) || undefined}
                  >
                    <span className="plan-node" aria-hidden="true">
                      {done ? '✓' : lesson.position}
                    </span>
                    <div className="plan-lesson-copy">
                      <h3>{lesson.title}</h3>
                      {lesson.subtitle ? <p dir="auto">{lesson.subtitle}</p> : null}
                      {open(lesson) ? (
                        <GoalMarks
                          done={lesson.progress?.goalsDone ?? 0}
                          total={lesson.progress?.goalsTotal || goals.length}
                        />
                      ) : (
                        <span className="plan-soon">قريبًا</span>
                      )}
                    </div>
                    {open(lesson) ? (
                      <a
                        className={isCurrent ? 'button primary plan-go' : 'plan-go plan-go-quiet'}
                        href={lessonHref(curriculum.id, lesson.id)}
                        aria-label={`${action(lesson)}: ${lesson.title}`}
                      >
                        <span>{action(lesson)}</span>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M15 5l-7 7 7 7" />
                        </svg>
                      </a>
                    ) : null}
                    {isCurrent && goals.length ? (
                      <ul className="plan-goals">
                        {goals.map((goal) => (
                          <li key={goal.id}>{goal.text}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </>
  );
}
