import type { ReadingPackage } from '@learn/lesson-runtime';
import { dirOf, useI18n } from '../../i18n';

/**
 * Every lesson of the version as text a reviewer can read straight through: scenes, steps,
 * questions with the marked answer, and the feedback. The content keeps its own language.
 */
export function ReviewLessons({
  lessons,
  language,
}: {
  lessons: Array<{ id: string; title: string; package: ReadingPackage }>;
  language: string;
}) {
  const { t } = useI18n();
  return (
    <section className="review-lessons" aria-labelledby="review-lessons">
      <h2 id="review-lessons">{t('review.lessonsTitle')}</h2>
      {lessons.map((lesson) => (
        <details key={lesson.id} className="review-lesson" open={lessons.length === 1}>
          <summary>
            <bdi>{lesson.title}</bdi>
          </summary>
          <div lang={language} dir={dirOf(language)}>
            {lesson.package.scenes.map((scene) => (
              <article key={scene.id}>
                <h3>{scene.title}</h3>
                <ol>
                  {scene.steps.map((step, i) => (
                    <li key={i}>{step.text}</li>
                  ))}
                </ol>
                {scene.question && (
                  <div className="review-question">
                    <strong>{t('review.question')}</strong>
                    <p>{scene.question.arabic || scene.question.english}</p>
                    {scene.question.options.length > 0 && (
                      <ul>
                        {scene.question.options.map((o) => (
                          <li key={o}>{o}</li>
                        ))}
                      </ul>
                    )}
                    <p className="review-answer">
                      {t('review.marked', {
                        answer: scene.question.answer.arabic || scene.question.answer.english,
                      })}
                    </p>
                    {scene.question.feedback.steps.map((step, i) => (
                      <p key={i} className="review-feedback">
                        <small>{t('review.feedback')}: </small>
                        {step.text}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}
