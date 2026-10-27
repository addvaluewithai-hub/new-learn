import { CourseArt, subjectOf } from '../../shared/CourseArt';
import { stats } from './plan';
import type { Curriculum } from './types';

/** Courses as cards: a subject cover, what it is, how far you are. The whole card opens it. */
export function CurriculumCards({ curricula }: { curricula: Curriculum[] }) {
  return (
    <section className="courses" aria-labelledby="courses-title">
      <div className="section-heading">
        <h2 id="courses-title">مناهجي</h2>
        <span>{curricula.length} مناهج</span>
      </div>
      <ul className="course-list">
        {curricula.map((group) => {
          const s = stats(group);
          const percent = s.lessons ? Math.round((100 * s.completed) / s.lessons) : 0;
          const href = `/?curriculum=${encodeURIComponent(group.id)}`;
          return (
            <li className="course-card" key={group.id}>
              <CourseArt subject={group.subject} />
              <div className="course-copy">
                <span className="course-subject" data-subject={subjectOf(group.subject)}>
                  {group.subject}
                </span>
                <h3>
                  <a href={href}>{group.title}</a>
                </h3>
                <p>{group.description}</p>
                <div className="course-progress">
                  <span className="pick-bar" aria-hidden="true">
                    <i style={{ inlineSize: `${percent}%` }} />
                  </span>
                  <span>
                    خلّصت {s.completed} من {s.lessons}
                    <span className="course-available"> · {s.available} متاحة</span>
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!curricula.length && <p className="empty-state">لسه مفيش مناهج متاحة. ارجع لنا قريب.</p>}
    </section>
  );
}
