import { CourseArt } from '../../shared/CourseArt';
import { PlatformIcon } from '../../shared/PlatformIcon';
import type { Curriculum } from './types';
const number = (n: number) => n.toLocaleString('ar-EG');
export function CurriculumCards({ curricula }: { curricula: Curriculum[] }) {
  return (
    <>
      <div className="section-heading">
        <h2>مناهجي</h2>
        <span>{number(curricula.length)} مناهج</span>
      </div>
      <div className="course-grid">
        {curricula.map((group) => (
          <article className="course-card" key={group.id}>
            <a
              className="course-cover"
              href={`/?curriculum=${encodeURIComponent(group.id)}`}
              aria-label={`فتح ${group.title}`}
            >
              <CourseArt subject={group.subject} />
              <span className="course-category">{group.subject}</span>
            </a>
            <div className="course-body">
              <div className="course-meta">
                <span>{number(group.lessons.length)} دروس</span>
                <span>
                  {number(
                    group.lessons.filter((lesson) => lesson.availability !== 'coming-soon').length,
                  )}{' '}
                  متاحة
                </span>
              </div>
              <h3>
                <a href={`/?curriculum=${encodeURIComponent(group.id)}`}>{group.title}</a>
              </h3>
              <p>{group.description}</p>
              <div className="course-bottom">
                <span>خطوة بخطوة</span>
                <a
                  className="button secondary"
                  href={`/?curriculum=${encodeURIComponent(group.id)}`}
                >
                  افتح المنهج <PlatformIcon name="arrow" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!curricula.length && <p className="empty-state">لسه مفيش مناهج متاحة. ارجع لنا قريب.</p>}
    </>
  );
}
