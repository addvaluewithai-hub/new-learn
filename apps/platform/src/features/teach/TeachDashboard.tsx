import { Badge, ButtonLink, EmptyState } from '../../shared/ui';
import { previewHref, statusOf, type TeachCourse } from './types';

/** Every course of the teacher: where it stands, who studies it, what waits for them. */
export function TeachDashboard({ courses }: { courses: TeachCourse[] }) {
  const students = courses.reduce((n, c) => n + (c.published?.students ?? 0), 0);
  const notes = courses.reduce((n, c) => n + c.openNotes, 0);
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">لوحة المدرس</span>
        <h1>كورساتك</h1>
      </div>
      <div className="teach-stats" role="list">
        <div role="listitem">
          <strong>{courses.length}</strong>
          <span>كورسات</span>
        </div>
        <div role="listitem">
          <strong>{courses.filter((c) => c.published && !c.published.withdrawn).length}</strong>
          <span>منشورة</span>
        </div>
        <div role="listitem">
          <strong>{students}</strong>
          <span>طلاب</span>
        </div>
        <div role="listitem">
          <strong>{notes}</strong>
          <span>ملاحظات مفتوحة</span>
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
                    <a href={`/?teach&course=${course.id}`}>{course.title}</a>
                  </h2>
                  <p>
                    {course.lessons.length} دروس
                    {course.published ? ` · ${course.published.students} طالب` : ''}
                    {course.openNotes ? ` · ${course.openNotes} ملاحظة مفتوحة` : ''}
                  </p>
                </div>
                <div className="teach-course-actions">
                  <ButtonLink size="sm" href={`/?teach&course=${course.id}`}>
                    افتح
                  </ButtonLink>
                  {preview && (
                    <ButtonLink variant="secondary" size="sm" href={preview}>
                      معاينة
                    </ButtonLink>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title="لسه معندكش كورسات"
          action={<ButtonLink href="/?studio">اعمل أول كورس</ButtonLink>}
        >
          اكتب فكرة أو ارفع ملزمة، وهنبني لك مسودة تراجعها وتنشرها لطلابك.
        </EmptyState>
      )}
    </>
  );
}
