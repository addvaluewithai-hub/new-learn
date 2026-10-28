import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import './my-drafts.css';
import { ButtonLink } from '../../shared/ui';

type Course = {
  id: string;
  title: string;
  lessons: Array<{ id: string; title: string; revision: number }>;
};

/** The teacher's draft courses, made here or through Claude or ChatGPT, and a way to start one. */
export function MyDrafts() {
  const [courses, setCourses] = useState<Course[]>([]);
  useEffect(() => {
    api<Course[]>('/authoring/courses').then(setCourses, () => setCourses([]));
  }, []);
  if (!courses.length)
    return (
      <p className="my-drafts-start">
        عندك شرح أو ملفات عايز تحوّلها لدرس تفاعلي؟{' '}
        <ButtonLink variant="link" href="/?studio">
          اعمل كورس
        </ButtonLink>
      </p>
    );
  return (
    <section className="my-drafts" aria-label="مسوداتي">
      <div className="my-drafts-head">
        <h2>مسوداتي</h2>
        <ButtonLink variant="secondary" size="sm" href="/?studio">
          + اعمل كورس جديد
        </ButtonLink>
      </div>
      {courses.map((course) => (
        <div key={course.id} className="my-drafts-course">
          <h3>{course.title}</h3>
          <ul>
            {course.lessons.map((lesson) => (
              <li key={lesson.id}>
                <a href={`/?draft=${lesson.id}`}>{lesson.title}</a>
                <span>نسخة {lesson.revision}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
