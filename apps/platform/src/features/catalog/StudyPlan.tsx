import { GoalMarks } from './ContinueCard';
import { goalsOf, lessonHref, nextLesson, open, partsOf, stats } from './plan';
import type { CatalogLesson, Curriculum, Resume } from './types';
import { useI18n, type TextKey } from '../../i18n';

function action(lesson: CatalogLesson): TextKey {
  if (!open(lesson)) return 'catalog.action.soon';
  if (lesson.progress?.status === 'completed') return 'catalog.action.review';
  return lesson.progress ? 'catalog.action.continue' : 'catalog.action.start';
}

/** The curriculum as a path: parts, lessons, goals, and where the learner is now. */
export function StudyPlan({
  curriculum,
  resume,
}: {
  curriculum: Curriculum;
  resume?: Resume | null;
}) {
  const { t } = useI18n();
  const total = stats(curriculum);
  const current = nextLesson(curriculum, resume);
  const percent = total.goalsTotal ? Math.round((100 * total.goalsDone) / total.goalsTotal) : 0;
  return (
    <>
      <section className="plan-summary" aria-label={t('catalog.plan.label')}>
        <div>
          <strong>
            {total.goalsDone} <span>/ {total.goalsTotal}</span>
          </strong>
          <span>
            {t('catalog.plan.summary', { completed: total.completed, count: total.lessons })}
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
                <h2>{part.title || t('catalog.plan.restPart')}</h2>
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
                        <span className="plan-soon">{t('catalog.action.soon')}</span>
                      )}
                    </div>
                    {open(lesson) ? (
                      <a
                        className={
                          isCurrent
                            ? 'nl-button nl-button--primary nl-button--md plan-go'
                            : 'plan-go plan-go-quiet'
                        }
                        href={lessonHref(curriculum.id, lesson.id)}
                        aria-label={t('catalog.plan.goLabel', {
                          action: t(action(lesson)),
                          title: lesson.title,
                        })}
                      >
                        <span>{t(action(lesson))}</span>
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
