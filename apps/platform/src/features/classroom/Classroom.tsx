import { LessonPreview } from '@learn/lesson-runtime';
import type { LessonPackage, RendererRegistry } from '@learn/lesson-runtime';
import './classroom.css';

export function Classroom({
  lesson,
  registry,
}: {
  lesson: LessonPackage;
  registry: RendererRegistry;
}) {
  return (
    <main className="classroom">
      <div className="classroom-intro">
        <p className="eyebrow">أول تجربة للمحرك المشترك</p>
        <h1>نشرح فكرة، نجربها، ونكمل.</h1>
        <p>
          اختبار تقني قصير بصوت نغمات تجريبية. المحتوى والتوقيتات هنا للاختبار، وليست درسًا أو
          تسجيلًا معتمدًا.
        </p>
      </div>
      <LessonPreview lesson={lesson} registry={registry} />
      <p className="classroom-note">
        المعاينة لا تسجل دخولًا أو تحفظ تقدمًا. إعدادات الحسابات والمناهج ستضاف في المرحلة التالية.
      </p>
    </main>
  );
}
