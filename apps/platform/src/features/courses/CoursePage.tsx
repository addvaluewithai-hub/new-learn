import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { User } from '../auth/session';
import { LibraryShell } from '../catalog/LibraryShell';
import { Alert, Badge, Button, ButtonLink, Spinner } from '../../shared/ui';
import { courseLessonHref, type MyCourse, type PublicCourse } from './types';
import { go } from '../studio/types';
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
        <Alert tone="error">{error}</Alert>
      ) : !course || mine === undefined ? (
        <Spinner label="بنجهّز الكورس…" />
      ) : (
        <>
          <div className="page-heading">
            <ButtonLink variant="link" href="/">
              ← مكتبتك
            </ButtonLink>
            <span className="eyebrow">{course.subject || 'كورس'}</span>
            <h1>{course.title}</h1>
            {course.description && <p>{course.description}</p>}
            <p className="course-meta">
              {course.teacher && <span>بإعداد {course.teacher}</span>}
              <span>{course.lessons.length} دروس</span>
              {mine && (
                <span>
                  خلّصت {done} من {course.lessons.length}
                </span>
              )}
            </p>
          </div>
          <div className="course-start">
            <Button size="lg" variant="accent" disabled={busy || !next} onClick={start}>
              {busy ? 'لحظة…' : mine ? (done ? 'كمّل الكورس' : 'ابدأ الكورس') : 'ابدأ الكورس'}
            </Button>
            {next && mine && <span className="course-next">الجاي: {next.title}</span>}
          </div>
          {parts.map((part, i) => (
            <section key={i} className="course-part" aria-label={part.title || 'الدروس'}>
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
                          {status === 'completed' ? 'خلّصته' : 'بدأته'}
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
