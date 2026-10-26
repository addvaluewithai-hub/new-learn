import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import './my-drafts.css';

type Course = {
  id: string;
  title: string;
  lessons: Array<{ id: string; title: string; revision: number }>;
};

/** The teacher's draft courses made through Claude or ChatGPT; hidden when there are none. */
export function MyDrafts() {
  const [courses, setCourses] = useState<Course[]>([]);
  useEffect(() => {
    api<Course[]>('/authoring/courses').then(setCourses, () => setCourses([]));
  }, []);
  if (!courses.length) return null;
  return (
    <section className="my-drafts" aria-label="مسوداتي">
      <h2>مسوداتي</h2>
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
