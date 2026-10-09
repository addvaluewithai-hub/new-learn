import type { Curriculum } from './types';
export function CurriculumDetail({ curriculum }: { curriculum: Curriculum }) {
  const next = curriculum.lessons.find((lesson) => lesson.availability !== 'coming-soon');
  return (
    <>
      <section className="curriculum-hero">
        <div>
          <span className="eyebrow">{curriculum.subject}</span>
          <h2>{next?.title ?? 'دروسك بتتجهّز.'}</h2>
          <p>{next?.subtitle ?? 'هنضيف الدروس هنا أول ما تكون جاهزة.'}</p>
          {next && (
            <a
              className="button primary"
              href={`/?lesson=${encodeURIComponent(next.id)}&curriculum=${encodeURIComponent(curriculum.id)}`}
            >
              {next.availability === 'review' ? 'شوف نسخة المراجعة' : 'ابدأ الدرس التالي'}
            </a>
          )}
        </div>
      </section>
      <ol className="lesson-path">
        {curriculum.lessons.map((lesson) => (
          <li key={lesson.id}>
            <span className="lesson-node">{lesson.position.toLocaleString('ar-EG')}</span>
            <div className="lesson-path-copy">
              <span className="eyebrow">
                {lesson.availability === 'review'
                  ? 'نسخة للمراجعة'
                  : lesson.availability === 'published'
                    ? 'متاح للتعلّم'
                    : 'قريبًا'}
              </span>
              <h3>{lesson.title}</h3>
              <p>{lesson.subtitle}</p>
            </div>
            {lesson.availability === 'coming-soon' ? (
              <button className="button secondary" disabled>
                قريبًا
              </button>
            ) : (
              <a
                className="button secondary"
                href={`/?lesson=${encodeURIComponent(lesson.id)}&curriculum=${encodeURIComponent(curriculum.id)}`}
              >
                افتح الدرس
              </a>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
