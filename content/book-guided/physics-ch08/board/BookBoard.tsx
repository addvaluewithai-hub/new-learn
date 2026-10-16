import { AbsoluteFill } from 'remotion';
import type { VisualProps } from '@learn/lesson-runtime';
import { Formula } from './Formula';
import { topics } from './topics';
import { bookSource, type SourceExcerpt } from './source';
import { plainMath } from '../reading/text';
import './book-board.css';

/** Original source excerpts and cropped figures, inside the existing classroom. */
type BookBoardProps = VisualProps & {
  chapter?: number;
  sources?: Record<string, SourceExcerpt>;
  headings?: Record<string, { title: string; words: string[] }>;
};
export default function BookBoard(props: BookBoardProps) {
  const chapter = props.chapter ?? 8;
  const id = String(props.spec.params.sectionId);
  const page = Number(props.spec.params.page);
  const topic = props.headings?.[id] ?? topics[id] ?? topics['P133-Z'];
  const source = (props.sources ?? bookSource)[id];
  const time = (props.frame * 1000) / props.fps;
  const index = Math.max(0, (props.reading?.steps.filter((s) => s.atMs <= time).length ?? 1) - 1);
  const sourceIndex = (props.spec.params.sourceIndices as number[] | undefined)?.[index] ?? index;
  const quoteIndex = Math.min(sourceIndex, (source?.quotes.length ?? 1) - 1);
  const image =
    props.phase === 'feedback' && chapter === 9
      ? undefined
      : Array.isArray(source?.image)
        ? source.image[Math.min(quoteIndex, source.image.length - 1)]
        : source?.image;
  const checkpoint = Boolean(props.spec.params.checkpoint);
  const feedback = props.phase === 'feedback';
  const raw = (props.spec.params.rawSteps as string[])[index] ?? '';
  const maths = feedback
    ? [...raw.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g)]
        .flatMap((m) => (m[1] ?? m[2]).split(/\\qquad|\\quad/))
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const quotes = source?.quotes;
  const sourceStepCount = Number(props.spec.params.sourceStepCount ?? 0);
  const readingSource = !checkpoint && !feedback && index < sourceStepCount;
  const quoteLength = quotes?.join(' ').length ?? 0;
  const warning =
    chapter === 8 && id === 'P130-Q1'
      ? 'الحساب العددي مشروط بتأكيد الحمل؛ حد إجهاد الفشل غير معطى.'
      : chapter === 8 && id === 'P131-Q2'
        ? 'قيمة Young’s modulus في الحل تقريبية ومضافة من مرجع خارجي.'
        : source?.note;
  return (
    <AbsoluteFill>
      <div
        className="ch8-board"
        data-layout={props.layout}
        data-book-chapter={chapter}
        data-book-section={id}
        data-source-image={!checkpoint && image ? 'yes' : 'no'}
        data-source-phase={readingSource ? 'reading' : 'explanation'}
        dir="rtl"
      >
        <header>
          <span>
            شابتر {chapter} · ص {id === 'P122-C' ? '122–123' : page}
          </span>
          <span>
            {feedback
              ? 'الحل بعد محاولتك'
              : checkpoint
                ? 'اختبر فهمك'
                : readingSource
                  ? 'قراءة نص الكتاب'
                  : 'شرح النص'}
          </span>
        </header>
        <h2 lang="en" dir="ltr">
          {checkpoint ? 'Check your understanding' : topic.title}
        </h2>
        {!checkpoint && image ? (
          <figure className="ch8-diagram">
            <img
              src={`/book-ch${String(chapter).padStart(2, '0')}/${image}.webp`}
              alt={`رسم الكتاب · ${topic.title} · ص ${page}`}
            />
            <figcaption>رسم مستخرج من الكتاب · ص {page}</figcaption>
          </figure>
        ) : null}
        <section
          className="ch8-points"
          aria-label={checkpoint ? 'سؤال من المعلّم' : 'مقتطف الكتاب'}
        >
          <small>
            {checkpoint
              ? feedback
                ? 'الإجابة النموذجية'
                : 'جرّب بنفسك'
              : feedback && maths.length
                ? 'توضيح المعلّم'
                : source
                  ? 'من الكتاب'
                  : 'مراجعة المعلّم'}
          </small>
          {checkpoint ? (
            <p lang="en" dir="ltr">
              {feedback ? props.answer?.english : props.question?.english}
            </p>
          ) : maths.length ? (
            maths.map((math, i) => (
              <Formula key={i} source={math} fontSize={chapter === 9 ? 26 : undefined} />
            ))
          ) : (
            <>
              <p
                className="ch8-source-quote"
                lang="en"
                dir="ltr"
                data-long={quoteLength > 170}
                data-dense={quoteLength > 280}
              >
                {quotes
                  ? quotes.map((quote, i) => (
                      <span
                        key={i}
                        data-source-line={i}
                        data-source-spoken={quote}
                        data-active={readingSource && i === index ? 'yes' : undefined}
                      >
                        {quote}
                      </span>
                    ))
                  : topic.words.join(' · ')}
              </p>
              {source?.formula ? (
                <div
                  data-source-line={quotes?.length}
                  data-source-spoken={plainMath(source.formula)}
                  data-active={readingSource && index === quotes?.length ? 'yes' : undefined}
                >
                  {source.formula.split(/\\quad/).map((line, i) => (
                    <Formula key={i} source={line} fontSize={chapter === 9 ? 26 : undefined} />
                  ))}
                </div>
              ) : null}
              {source?.teacherFormula ? (
                <>
                  <small>توضيح المعلّم</small>
                  <Formula source={source.teacherFormula} />
                </>
              ) : null}
            </>
          )}
        </section>
        <footer>
          {!checkpoint ? (
            <p>{feedback ? 'نراجع خطوات الحل مع بعض' : 'نقرأ المقتطف، وبعده نشرحه خطوة خطوة'}</p>
          ) : (
            <p>
              {feedback
                ? 'راجع السبب في الشرح تحت السبورة'
                : 'اختار إجابتك عشان نراجع السبب مع بعض'}
            </p>
          )}
          {!checkpoint && warning ? <small>{warning}</small> : null}
        </footer>
      </div>
    </AbsoluteFill>
  );
}
