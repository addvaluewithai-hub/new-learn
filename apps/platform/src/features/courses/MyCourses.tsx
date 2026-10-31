import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { courseHref, courseLessonHref, type MyCourse } from './types';
import './courses.css';
import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';

/** The published courses the learner is in, on the library page, with the next lesson. */
export function MyCourses() {
  const { t } = useI18n();
  const [courses, setCourses] = useState<MyCourse[]>([]);
  useEffect(() => {
    api<{ courses: MyCourse[] }>('/courses').then(
      (r) => setCourses(r.courses),
      () => setCourses([]),
    );
  }, []);
  if (!courses.length) return null;
  return (
    <section className="my-courses" aria-labelledby="my-courses-title">
      <div className="section-heading">
        <h2 id="my-courses-title">{t('courses.mine.title')}</h2>
        <span>{courses.length}</span>
      </div>
      <ul>
        {courses.map((course) => {
          const done = course.lessons.filter((l) => l.status === 'completed').length;
          const next = course.lessons.find((l) => l.status !== 'completed');
          return (
            <li key={course.id} className="my-course">
              <div>
                <span className="eyebrow">
                  {course.subject || course.teacher ? (
                    <bdi>{course.subject || course.teacher}</bdi>
                  ) : (
                    t('courses.mine.fallback')
                  )}
                </span>
                <h3>
                  <a href={courseHref(course.id)}>{course.title}</a>
                </h3>
                <span className="my-course-progress">
                  <span className="pick-bar" aria-hidden="true">
                    <i
                      style={{
                        inlineSize: `${course.lessons.length ? (100 * done) / course.lessons.length : 0}%`,
                      }}
                    />
                  </span>
                  {t('courses.progress', { done, total: course.lessons.length })}
                </span>
              </div>
              {next && (
                <a
                  className="nl-button nl-button--secondary nl-button--sm"
                  href={courseLessonHref(course.id, next.id)}
                >
                  <Rich
                    k={done ? 'courses.mine.continue' : 'courses.mine.start'}
                    parts={{ title: <bdi>{next.title}</bdi> }}
                  />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
