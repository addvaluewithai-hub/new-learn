import { LessonPreview } from '@learn/lesson-runtime';
import type { LessonPackage, RendererRegistry } from '@learn/lesson-runtime';
import './classroom.css';

export function Classroom({
  lesson,
  registry,
  realContent = false,
}: {
  lesson: LessonPackage;
  registry: RendererRegistry;
  realContent?: boolean;
}) {
  return (
    <main className="classroom">
      <div className="classroom-intro">
        <p className="eyebrow">
          {realContent
            ? `${lesson.curriculumTitle} · الدرس ${lesson.lessonOrder}`
            : 'أول تجربة للمحرك المشترك'}
        </p>
        <h1>{realContent ? lesson.title : 'نشرح فكرة، نجربها، ونكمل.'}</h1>
        <p>
          {realContent
            ? 'شاهد الشرح، جرّب الأسئلة، وكمل مع المدرّس. نسخة للمراجعة بصوت الدرس الأصلي.'
            : 'اختبار تقني قصير بصوت نغمات تجريبية. المحتوى والتوقيتات هنا للاختبار، وليست درسًا أو تسجيلًا معتمدًا.'}
        </p>
      </div>
      {realContent && (
        <p className="lesson-edition" lang="en" dir="ltr">
          {lesson.englishTitle} <span>11 scenes · 4 questions</span>
        </p>
      )}
      <LessonPreview lesson={lesson} registry={registry} />
      <p className="classroom-note">
        المعاينة لا تسجل دخولًا أو تحفظ تقدمًا. الحسابات والفهرس وحفظ التقدم ما زالوا قيد التطوير.
      </p>
      {realContent && (
        <details className="review-details">
          <summary>عن نسخة المراجعة</summary>
          <p>
            أعدنا استخدام درس حالات المادة والتسجيلات والتوقيتات الأصلية لمراجعة الواجهة والمحرك.
            هذه المعاينة لا تعني اعتماد جودة المحتوى أو التوقيتات من جديد.
          </p>
          <a href="?preview=probe">افتح اختبار المحرك القصير</a>
        </details>
      )}
    </main>
  );
}
