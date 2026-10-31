import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import './my-drafts.css';
import { ButtonLink } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';

type Course = {
  id: string;
  title: string;
  lessons: Array<{ id: string; title: string; revision: number }>;
};

/** Lessons shown per course; the rest are one click away in the workspace. */
const SHOWN = 3;

/** The teacher's draft courses, made here or through Claude or ChatGPT, and a way to start one. */
export function MyDrafts() {
  const { t } = useI18n();
  const [courses, setCourses] = useState<Course[]>([]);
  useEffect(() => {
    api<Course[]>('/authoring/courses').then(setCourses, () => setCourses([]));
  }, []);
  if (!courses.length)
    return (
      <p className="my-drafts-start">
        <Rich
          k="authoring.drafts.start"
          parts={{
            link: (
              <ButtonLink variant="link" href="/?studio">
                {t('authoring.drafts.startLink')}
              </ButtonLink>
            ),
          }}
        />
      </p>
    );
  return (
    <section className="my-drafts" aria-label={t('authoring.drafts.title')}>
      <div className="my-drafts-head">
        <h2>{t('authoring.drafts.title')}</h2>
        <span className="my-drafts-links">
          <ButtonLink variant="link" href="/?teach">
            {t('authoring.drafts.dashboard')}
          </ButtonLink>
          <ButtonLink variant="secondary" size="sm" href="/?studio">
            {t('authoring.drafts.newCourse')}
          </ButtonLink>
        </span>
      </div>
      {courses.map((course) => (
        <div key={course.id} className="my-drafts-course">
          <div className="my-drafts-course-head">
            <h3>
              <bdi>{course.title}</bdi>
            </h3>
            <span>{t('authoring.drafts.lessons', { count: course.lessons.length })}</span>
            <ButtonLink variant="link" href={`/?teach&course=${course.id}`}>
              {t('authoring.drafts.open')}
            </ButtonLink>
          </div>
          <ul>
            {course.lessons.slice(0, SHOWN).map((lesson) => (
              <li key={lesson.id}>
                <a href={`/?draft=${lesson.id}`}>
                  <bdi>{lesson.title}</bdi>
                </a>
                <span>{t('authoring.drafts.revision', { revision: lesson.revision })}</span>
              </li>
            ))}
          </ul>
          {course.lessons.length > SHOWN && (
            <ButtonLink variant="link" href={`/?teach&course=${course.id}`}>
              {t('authoring.drafts.more', { count: course.lessons.length - SHOWN })}
            </ButtonLink>
          )}
        </div>
      ))}
    </section>
  );
}
