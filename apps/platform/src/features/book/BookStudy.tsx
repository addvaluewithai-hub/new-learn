import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CaretLeft, CaretRight, Check, List, X } from '@phosphor-icons/react';
import { bookMetadata, bookSections } from '../../../../../content/book-guided/physics-ch08';
import { Brand } from '../../shared/Brand';
import { BookText } from './BookText';
import { BookPage } from './BookPage';
import { useBookSources } from './useBookSources';
import { allowedStep, bookSteps } from './model';
import './book.css';
import './book-brand.css';
import './book-reader.css';
import './book-lesson.css';

export default function BookStudy() {
  const steps = useMemo(() => bookSteps(bookSections), []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const [outline, setOutline] = useState(false);
  const [complete, setComplete] = useState(false);
  const article = useRef<HTMLElement>(null);
  const { sources, busy, status, open } = useBookSources();
  const current = steps[index];
  const section = current.section;
  const pending = current.phase === 'attempt' && !answers[section.id];
  const go = (next: number) => {
    setComplete(false);
    setIndex(allowedStep(steps, next, answers));
    setOutline(false);
    setDraft('');
  };
  const next = () => (index === steps.length - 1 ? setComplete(true) : go(index + 1));
  const attempt = (value: string) => {
    if (!value.trim()) return;
    setAnswers({ ...answers, [section.id]: value.trim() });
    setIndex(index + 1);
    setDraft('');
  };
  useEffect(() => {
    article.current?.scrollTo({ top: 0 });
    if (index > 0 && matchMedia('(max-width: 850px)').matches)
      article.current?.scrollIntoView({ block: 'start' });
  }, [index]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOutline(false);
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('input,textarea,select,button,summary')
      )
        return;
      if (e.key === 'ArrowLeft' && !pending) {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(index - 1);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  return (
    <main className="bk" dir="rtl">
      <header className="bk-header">
        <Brand />
        <div className="bk-title">
          <span>
            شرح مع الكتاب <span aria-hidden>·</span> الفصل ٨
          </span>
          <h1>{bookMetadata.title}</h1>
        </div>
        <button
          className="bk-outline-toggle"
          aria-expanded={outline}
          onClick={() => setOutline(!outline)}
        >
          <List size={20} /> فهرس الفصل
        </button>
      </header>
      <div className="bk-file-bar">
        <BookOpen size={19} weight="duotone" aria-hidden />
        <label htmlFor="book-file">
          {sources.main ? 'تغيير ملف الكتاب' : 'افتح كتابك من جهازك'}
        </label>
        <input
          id="book-file"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          disabled={busy}
          onChange={(e) => {
            void open(e.target.files);
            e.target.value = '';
          }}
        />
        <span role="status">{status || 'الملف يفضل على جهازك، من غير رفع.'}</span>
      </div>
      <div className="bk-workspace">
        {outline ? (
          <nav className="bk-outline" aria-label="فهرس أجزاء الفصل">
            <div>
              <h2>نمشي مع الكتاب</h2>
              <button aria-label="اقفل الفهرس" onClick={() => setOutline(false)}>
                <X size={20} />
              </button>
            </div>
            {bookSections.map((s) => (
              <button
                key={s.id}
                aria-current={s.id === section.id ? 'step' : undefined}
                onClick={() => go(steps.findIndex((step) => step.section.id === s.id))}
              >
                <span>{s.page}</span>
                <span>{s.title.replace(/^وP123-A /, '')}</span>
                {answers[s.id] ? <Check size={16} /> : null}
              </button>
            ))}
          </nav>
        ) : null}
        <BookPage page={section.page} id={section.id} sources={sources} />
        <article className="bk-lesson" ref={article} aria-label="شرح المعلّم">
          {complete ? (
            <div className="bk-complete">
              <Check size={38} weight="bold" />
              <h2>وصلنا لنهاية الفصل</h2>
              <p>تقدر ترجع لأي جزء من الفهرس وتراجعه مع الكتاب.</p>
              <p>
                دي تجربة قراءة. مكانك ومحاولاتك في الجلسة الحالية فقط، ومش بتتسجّل كإنجاز في حسابك.
              </p>
              <button className="bk-primary" onClick={() => go(0)}>
                راجع من الأول
              </button>
            </div>
          ) : (
            <>
              <div className="bk-location">
                <span>صفحة {section.page}</span>
                <span>
                  {current.phase === 'solution'
                    ? 'الحل خطوة خطوة'
                    : section.question
                      ? 'جرّب بنفسك'
                      : 'نشرح ونفهم'}
                </span>
              </div>
              <h2 tabIndex={-1}>{section.title.replace(/^وP123-A /, '')}</h2>
              {section.page === 130 ? (
                <p className="bk-warning">
                  بيانات المسألة دي محتاجة تأكيد من صورة أوضح. الحساب العددي مشروط، وجزء أقصى حمل
                  لسه محتاج إجهاد الفشل.
                </p>
              ) : null}
              {section.page === 131 ? (
                <p className="bk-warning">
                  معامل يونج المستخدم في الحل قيمة تقريبية مضافة من مرجع خارجي، ومذكور عند التعويض.
                </p>
              ) : null}
              <div className="bk-explanation" aria-live="polite">
                {current.blocks.map((text, i) => (
                  <BookText
                    key={`${index}:${i}`}
                    text={text
                      .replace(/^English restatement: /, '')
                      .replace(/^English model answer: /, '')}
                  />
                ))}
              </div>
              {pending ? (
                <form
                  className="bk-attempt"
                  onSubmit={(e) => {
                    e.preventDefault();
                    attempt(draft);
                  }}
                >
                  <label htmlFor="book-answer">اكتب محاولتك أو أول خطوة وصلت لها</label>
                  <textarea
                    id="book-answer"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={4000}
                    rows={3}
                  />
                  <div>
                    <button className="bk-primary" disabled={!draft.trim()}>
                      شوف الحل بعد محاولتي
                    </button>
                    <button type="button" onClick={() => attempt('محتاج أشوف طريقة الحل')}>
                      معرفتش، ورّيني الحل
                    </button>
                  </div>
                </form>
              ) : null}
              {current.phase === 'solution' && answers[section.id] ? (
                <details className="bk-note">
                  <summary>محاولتك</summary>
                  <p>{answers[section.id]}</p>
                </details>
              ) : null}
              {section.notes.some((n) => !n.startsWith('**إشارة العرض:')) ? (
                <details className="bk-note">
                  <summary>توضيحات على المصدر</summary>
                  {section.notes
                    .filter((n) => !n.startsWith('**إشارة العرض:'))
                    .map((n, i) => (
                      <BookText key={i} text={n.replace(/^\*\*[^*]+:\*\*\s*/, '')} />
                    ))}
                </details>
              ) : null}
              <p className="bk-session-note">
                تجربة قراءة للمراجعة. محاولتك تساعدك تقارن بالحل، ومش بتتقيّم تلقائيًا.
              </p>
            </>
          )}
        </article>
      </div>
      <footer className="bk-dock">
        <button disabled={index === 0 && !complete} onClick={() => go(index - 1)}>
          <CaretRight size={20} /> السابق
        </button>
        <div className="bk-progress">
          <span>
            {index + 1} من {steps.length}
          </span>
          <progress
            value={complete ? steps.length : index + 1}
            max={steps.length}
            aria-label="مكانك في الشرح"
          />
        </div>
        <button className="bk-primary" disabled={pending || complete} onClick={next}>
          {index === steps.length - 1 ? 'خلّص الفصل' : 'التالي'}
          <CaretLeft size={20} />
        </button>
      </footer>
    </main>
  );
}
