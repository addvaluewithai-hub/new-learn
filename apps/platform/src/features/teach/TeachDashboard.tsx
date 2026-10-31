import { Badge, ButtonLink, EmptyState } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { previewHref, statusOf, type TeachCourse } from './types';

/** Every course of the teacher: where it stands, who studies it, what waits for them. */
export function TeachDashboard({ courses }: { courses: TeachCourse[] }) {
  const { t } = useI18n();
  const students = courses.reduce((n, c) => n + (c.published?.students ?? 0), 0);
  const notes = courses.reduce((n, c) => n + c.openNotes, 0);
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">{t('teach.dashboard.eyebrow')}</span>
        <h1>{t('teach.dashboard.title')}</h1>
      </div>
      <div className="teach-stats" role="list">
        <div role="listitem">
          <strong>{courses.length}</strong>
          <span>{t('teach.dashboard.stats.courses')}</span>
        </div>
        <div role="listitem">
          <strong>{courses.filter((c) => c.published && !c.published.withdrawn).length}</strong>
          <span>{t('teach.dashboard.stats.published')}</span>
        </div>
        <div role="listitem">
          <strong>{students}</strong>
          <span>{t('teach.dashboard.stats.students')}</span>
        </div>
        <div role="listitem">
          <strong>{notes}</strong>
          <span>{t('teach.dashboard.stats.openNotes')}</span>
        </div>
      </div>
      {courses.length ? (
        <ul className="teach-courses">
          {courses.map((course) => {
            const status = statusOf(course);
            const preview = previewHref(course);
            return (
              <li key={course.id} className="teach-course">
                <div className="teach-course-copy">
                  <Badge tone={status.tone}>{status.text}</Badge>
                  <h2>
                    <a href={`/?teach&course=${course.id}`}>
                      <bdi>{course.title}</bdi>
                    </a>
                  </h2>
                  <p>
                    {[
                      t('teach.lessonCount', { count: course.lessons.length }),
                      course.published &&
                        t('teach.studentCount', { count: course.published.students }),
                      course.openNotes && t('teach.openNoteCount', { count: course.openNotes }),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="teach-course-actions">
                  <ButtonLink size="sm" href={`/?teach&course=${course.id}`}>
                    {t('teach.dashboard.open')}
                  </ButtonLink>
                  {preview && (
                    <ButtonLink variant="secondary" size="sm" href={preview}>
                      {t('teach.dashboard.preview')}
                    </ButtonLink>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title={t('teach.dashboard.emptyTitle')}
          action={<ButtonLink href="/?studio">{t('teach.dashboard.emptyAction')}</ButtonLink>}
        >
          {t('teach.dashboard.emptyBody')}
        </EmptyState>
      )}
    </>
  );
}
