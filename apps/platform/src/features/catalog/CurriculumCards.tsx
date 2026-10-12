import { CourseArt } from '../../shared/CourseArt';
import { PlatformIcon } from '../../shared/PlatformIcon';
import { stats } from './plan';
import type { Curriculum } from './types';
export function CurriculumCards({ curricula }: { curricula: Curriculum[] }) {
  return (
    <>
      <div className="section-heading">
        <h2>مناهجي</h2>
        <span>{curricula.length} مناهج</span>
      </div>
      <div className="course-grid">
        {curricula.map((group) => (
          <article className="course-card" key={group.id}>
            <a
              className="course-cover"
              href={`/?curriculum=${encodeURIComponent(group.id)}`}
              aria-label={`فتح ${group.title}`}
            >
              <CourseArt subject={group.subject} math={/math|رياض/i.test(group.subject)} />
              <span className="course-category">{group.subject}</span>
            </a>
            <div className="course-body">
              <div className="course-meta">
                <span>{group.lessons.length} دروس</span>
                <span>{stats(group).available} متاحة</span>
                {stats(group).completed ? <span>خلّصت {stats(group).completed}</span> : null}
              </div>
              <h3>
                <a href={`/?curriculum=${encodeURIComponent(group.id)}`}>{group.title}</a>
              </h3>
              <p>{group.description}</p>
              <div className="course-bottom">
                <span>
                  {stats(group).goalsTotal
                    ? `الأهداف ${stats(group).goalsDone} من ${stats(group).goalsTotal}`
                    : ''}
                </span>
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
