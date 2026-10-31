import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { Badge, ButtonLink, ErrorState, PageSkeleton } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';
import { formatPrice } from '../credits/format';
import { SiteFrame } from '../site/SiteShell';
import type { PublicCourse } from './types';
import './courses.css';

type Card = {
  course: Omit<PublicCourse, 'access'>;
  lesson: { id: string; title: string; scenes: number };
};

export const previewHref = (courseId: string) => `/?course=${courseId}&preview=play`;
export const joinHref = (courseId: string, auth: 'signup' | 'login' = 'signup') =>
  `/?course=${courseId}&auth=${auth}`;

/**
 * `?course=<id>` without an account (M7): what the course is, its first scene to try for free,
 * and an account to go on. After signing in the same address opens the full course page.
 */
export default function CoursePreview({ courseId }: { courseId: string }) {
  const { t, locale } = useI18n();
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setError('');
    api<Card>(`/public/courses/${courseId}`).then(setCard, (e) => setError(e.message));
  }, [courseId, attempt]);
  const course = card?.course;
  return (
    <SiteFrame>
      <div className="site-title course-preview">
        {error ? (
          <ErrorState
            message={error}
            retryLabel={t('common.retry')}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : !course || !card ? (
          <PageSkeleton label={t('courses.loading')} />
        ) : (
          <>
            <span className="eyebrow">
              {course.subject ? <bdi>{course.subject}</bdi> : t('courses.subjectFallback')}
            </span>
            <h1>
              <bdi>{course.title}</bdi>
            </h1>
            {course.description && (
              <p>
                <bdi>{course.description}</bdi>
              </p>
            )}
            <p className="course-meta">
              {course.teacher && (
                <span>
                  <Rich k="courses.by" parts={{ teacher: <bdi>{course.teacher}</bdi> }} />
                </span>
              )}
              <span>{t('courses.lessonCount', { count: course.lessons.length })}</span>
              {course.priceCents > 0 && (
                <Badge tone="accent">
                  {t('courses.paid.badge', {
                    price: formatPrice(course.priceCents, course.currency, locale),
                  })}
                </Badge>
              )}
            </p>
            <div className="site-ctas">
              <ButtonLink size="lg" variant="accent" href={previewHref(courseId)}>
                {t('courses.preview.try')}
              </ButtonLink>
              <ButtonLink size="lg" variant="secondary" href={joinHref(courseId)}>
                {t('courses.preview.join')}
              </ButtonLink>
            </div>
            <p className="course-next">
              <Rich
                k="courses.preview.note"
                parts={{
                  lesson: <bdi>{card.lesson.title}</bdi>,
                  login: <a href={joinHref(courseId, 'login')}>{t('courses.preview.login')}</a>,
                }}
              />
            </p>
            <ol className="course-lessons">
              {course.lessons.map((l) => (
                <li key={l.id} data-status="new">
                  <span className="course-lesson-n" aria-hidden="true">
                    {l.position}
                  </span>
                  <span className="course-lesson-text">
                    <strong>
                      <bdi>{l.title}</bdi>
                    </strong>
                    {l.goals.length > 0 && (
                      <span>
                        <bdi>
                          {l.goals
                            .slice(0, 2)
                            .map((g) => g.text)
                            .join(' · ')}
                        </bdi>
                      </span>
                    )}
                  </span>
                  {l.id === card.lesson.id && (
                    <Badge tone="success">{t('courses.preview.free')}</Badge>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </SiteFrame>
  );
}
