import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { User } from '../auth/session';
import { LibraryShell } from '../catalog/LibraryShell';
import { Alert, Badge, Button, ButtonLink, ErrorState, PageSkeleton } from '../../shared/ui';
import { courseLessonHref, type MyCourse, type PublicCourse } from './types';
import { go } from '../studio/types';
import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';
import { formatPrice } from '../credits/format';
import '../../shared/platform.css';
import '../catalog/library-shell.css';
import '../catalog/library-account.css';
import './courses.css';

/** `?course=<id>`: a teacher's published course from its link: what it is, and a way in. */
export default function CoursePage({
  user,
  onSignOut,
  courseId,
}: {
  user: User;
  onSignOut: () => Promise<void>;
  courseId: string;
}) {
  const { t, locale } = useI18n();
  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [mine, setMine] = useState<MyCourse | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<PublicCourse>(`/courses/${courseId}`).then(setCourse, (e) => setError(e.message));
    api<{ courses: MyCourse[] }>('/courses').then(
      (r) => setMine(r.courses.find((c) => c.id === courseId) ?? null),
      () => setMine(null),
    );
  }, [courseId]);
  const statusOf = (id: string) => mine?.lessons.find((l) => l.id === id)?.status ?? 'new';
  const next = course?.lessons.find((l) => statusOf(l.id) !== 'completed') ?? course?.lessons[0];
  const start = async () => {
    if (!course || !next) return;
    setBusy(true);
    try {
      await api(`/courses/${courseId}`, {});
      go(courseLessonHref(courseId, next.id).slice(1));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  // A paid course asks the payment gateway for a checkout; until one is connected it says so.
  const buy = async () => {
    setBusy(true);
    try {
      const { url } = await api<{ url: string }>(`/courses/${courseId}/buy`, {});
      location.assign(url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  const price = course?.priceCents ? formatPrice(course.priceCents, course.currency, locale) : '';
  const parts = course
    ? [
        ...course.parts
          .map((p) => ({
            title: p.title,
            lessons: course.lessons.filter((l) => p.lessonIds.includes(l.id)),
          }))
          .filter((p) => p.lessons.length),
        {
          title: '',
          lessons: course.lessons.filter(
            (l) => !course.parts.some((p) => p.lessonIds.includes(l.id)),
          ),
        },
      ].filter((p) => p.lessons.length)
    : [];
  const done = mine ? mine.lessons.filter((l) => l.status === 'completed').length : 0;
  return (
    <LibraryShell user={user} onSignOut={onSignOut}>
      {error ? (
        <ErrorState
          message={error}
          retryLabel={t('common.retry')}
          onRetry={() => location.reload()}
        />
      ) : !course || mine === undefined ? (
        <PageSkeleton label={t('courses.loading')} />
      ) : (
        <>
          <div className="page-heading">
            <ButtonLink variant="link" href="/">
              {t('common.backLink')} {t('courses.back')}
            </ButtonLink>
            <span className="eyebrow">
              {course.subject ? <bdi>{course.subject}</bdi> : t('courses.subjectFallback')}
            </span>
            <h1>{course.title}</h1>
            {course.description && <p>{course.description}</p>}
            <p className="course-meta">
              {course.teacher && (
                <span>
                  <Rich k="courses.by" parts={{ teacher: <bdi>{course.teacher}</bdi> }} />
                </span>
              )}
              <span>{t('courses.lessonCount', { count: course.lessons.length })}</span>
              {price && <Badge tone="accent">{t('courses.paid.badge', { price })}</Badge>}
              {mine && <span>{t('courses.progress', { done, total: course.lessons.length })}</span>}
            </p>
          </div>
          <div className="course-start">
            {course.access === false ? (
              <>
                <Button size="lg" variant="accent" disabled={busy} onClick={buy}>
                  {t('courses.paid.buy', { price })}
                </Button>
                <span className="course-next">{t('courses.paid.buyHelp')}</span>
              </>
            ) : (
              <Button size="lg" variant="accent" disabled={busy || !next} onClick={start}>
                {busy
                  ? t('courses.wait')
                  : mine
                    ? done
                      ? t('courses.continue')
                      : t('courses.start')
                    : t('courses.start')}
              </Button>
            )}
            {course.access !== false && next && mine && (
              <span className="course-next">
                <Rich k="courses.next" parts={{ title: <bdi>{next.title}</bdi> }} />
              </span>
            )}
          </div>
          {parts.map((part, i) => (
            <section
              key={i}
              className="course-part"
              aria-label={part.title || t('courses.lessonsFallback')}
            >
              {part.title && <h2>{part.title}</h2>}
              <ol className="course-lessons">
                {part.lessons.map((l) => {
                  const status = statusOf(l.id);
                  return (
                    <li key={l.id} data-status={status}>
                      <span className="course-lesson-n" aria-hidden="true">
                        {l.position}
                      </span>
                      <a href={courseLessonHref(courseId, l.id)}>
                        <strong>{l.title}</strong>
                        {l.goals.length > 0 && (
                          <span>
                            {l.goals
                              .slice(0, 2)
                              .map((g) => g.text)
                              .join(' · ')}
                          </span>
                        )}
                      </a>
                      {status !== 'new' && (
                        <Badge tone={status === 'completed' ? 'success' : 'accent'}>
                          {status === 'completed' ? t('courses.completed') : t('courses.started')}
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </>
      )}
    </LibraryShell>
  );
}
