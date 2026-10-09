import type { LessonPackage } from '@learn/lesson-runtime';
import type { GuideTool } from './LessonTools';
import { ClassroomIcon } from './ClassroomIcon';
import './lesson-guide.css';
const titles = {
  guide: 'خلّينا نفهمها واحدة واحدة',
  terms: 'المصطلح ومعناه',
  notes: 'مساحة لأفكارك',
  source: 'مصادر الدرس',
};
export function LessonGuide({
  lesson,
  tool,
  notes,
  onNotes,
  onClose,
  onTerms,
}: {
  lesson: LessonPackage;
  tool: GuideTool;
  notes: string;
  onNotes: (value: string) => void;
  onClose: () => void;
  onTerms: () => void;
}) {
  return (
    <aside className="classroom-guide" aria-label="مساعدة الدرس">
      <header>
        {lesson.guide && <img src={lesson.guide.image} alt="" width={48} height={48} />}
        <div>
          <strong>دليل الدرس</strong>
          <span>شروح جاهزة ومراجعة ذاتية</span>
        </div>
        <button aria-label="أغلق المساعدة" onClick={onClose}>
          <ClassroomIcon name="close" size={18} />
        </button>
      </header>
      <div className="guide-body">
        <span className="guide-eyebrow">{tool === 'guide' ? 'نفكّر سوا' : 'أدوات التعلّم'}</span>
        <h2>{titles[tool]}</h2>
        {tool === 'guide' && (
          <>
            <p className="guide-bubble">{lesson.review.summary}</p>
            <div className="guide-prompt">
              <ClassroomIcon name="guide" />
              <strong>خلي عينك على الفكرة</strong>
              <p>شاهد الفكرة على البورد، جرّب السؤال بنفسك، وبعدها قارن إجابتك بتعقيب المدرّس.</p>
            </div>
            <button className="guide-link" onClick={onTerms}>
              راجع المصطلحات <ClassroomIcon name="book" size={18} />
            </button>
          </>
        )}
        {tool === 'terms' && (
          <dl className="guide-glossary">
            {lesson.glossary.map(({ term, meaning }) => (
              <div key={term}>
                <dt lang="en" dir="ltr">
                  {term}
                </dt>
                <dd>{meaning}</dd>
              </div>
            ))}
          </dl>
        )}
        {tool === 'notes' && (
          <>
            <label htmlFor="lesson-notes">اكتب ملخصًا أو سؤالًا ترجع له.</label>
            <textarea
              id="lesson-notes"
              rows={8}
              maxLength={10000}
              value={notes}
              onChange={(event) => onNotes(event.target.value)}
              placeholder="إيه الفكرة اللي فهمتها؟"
            />
            <p className="guide-small">ملاحظات الجلسة الحالية؛ انسخها قبل ما تقفل الصفحة.</p>
          </>
        )}
        {tool === 'source' && (
          <>
            <p>
              {lesson.curriculumTitle} · {lesson.title}
            </p>
            {lesson.sources.map((source) => (
              <section key={`${source.title}/${source.locator}`}>
                <p className="guide-bubble">
                  <b>{source.title}</b>
                  <br />
                  {source.locator}
                  <br />
                  {source.availability}
                </p>
                {source.url && (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    افتح المرجع
                  </a>
                )}
              </section>
            ))}
            <p className="guide-small">
              نسخة مراجعة بالتسجيلات الأصلية. عرضها هنا لا يعني إعادة اعتماد المحتوى أو التوقيتات.
            </p>
          </>
        )}
      </div>
      <footer>دليل جاهز للدرس، وليس محادثة AI</footer>
    </aside>
  );
}
