import type { Position } from './types';
import type { useQuiz } from './useQuiz';
export function QuizPanel({
  practice,
  position,
  enabled,
}: {
  practice: ReturnType<typeof useQuiz>;
  position: Position;
  enabled: boolean;
}) {
  const { quiz, loading, error } = practice;
  if (!quiz)
    return (
      <section className="nova-practice">
        <span className="nova-eyebrow">تدريب على الدرس</span>
        <h3>عشر أسئلة، خطوة بخطوة.</h3>
        <p>الأسئلة بالإنجليزي ومعاها ترجمة، وبعد كل إجابة نفهم السبب سوا.</p>
        <p className="nova-footnote">
          تدريب مولّد بالذكاء الاصطناعي، وليس امتحانًا معتمدًا. النتيجة في الجلسة الحالية فقط.
        </p>
        {error && (
          <p role="alert" className="nova-error">
            {error}
          </p>
        )}
        <button
          className="nova-primary"
          disabled={loading || !enabled}
          onClick={() => void practice.prepare(position)}
        >
          {loading ? 'بنجهّز الأسئلة…' : 'جهّز الاختبار'}
        </button>
        {loading && (
          <button className="nova-secondary" onClick={practice.stop}>
            إلغاء
          </button>
        )}
      </section>
    );
  if (quiz.index >= quiz.questions.length) {
    const score = quiz.answers.reduce((n, a, i) => n + Number(a === quiz.questions[i].correct), 0);
    return (
      <section className="nova-practice" role="status">
        <span className="nova-eyebrow">خلصت التدريب</span>
        <h3>
          {score} / {quiz.questions.length}
        </h3>
        <p>راجع الأفكار اللي محتاجة تثبيت، واسأل Nova عن أي إجابة.</p>
        <button
          className="nova-primary"
          onClick={() => void practice.prepare(position)}
          disabled={loading}
        >
          {loading ? 'بنجهّز تدريبًا جديدًا…' : 'تدريب جديد'}
        </button>
        {error && <p role="alert">{error}</p>}
      </section>
    );
  }
  const question = quiz.questions[quiz.index];
  return (
    <section className="nova-practice">
      <div className="nova-quiz-progress">
        <span>
          السؤال {quiz.index + 1} من {quiz.questions.length}
        </span>
        <progress value={quiz.index} max={quiz.questions.length} />
      </div>
      <h3 lang="en" dir="ltr">
        {question.english}
      </h3>
      <p>{question.arabic}</p>
      <div className="nova-options">
        {question.options.map((option, index) => (
          <button
            lang="en"
            dir="ltr"
            key={index}
            disabled={quiz.revealed}
            data-result={
              quiz.revealed
                ? index === question.correct
                  ? 'correct'
                  : index === quiz.answers[quiz.index]
                    ? 'incorrect'
                    : undefined
                : undefined
            }
            onClick={() => practice.answer(quiz.index, index)}
          >
            <span>{String.fromCharCode(65 + index)}</span>
            {option}
          </button>
        ))}
      </div>
      {quiz.revealed && (
        <div className="nova-quiz-feedback" role="status">
          <strong>
            {quiz.answers[quiz.index] === question.correct ? 'إجابة صحيحة' : 'خلينا نفهم الإجابة'}
          </strong>
          <p dir="ltr" lang="en">
            {question.englishAnswer}
          </p>
          <p>{question.explanation}</p>
          <button className="nova-primary" onClick={practice.next}>
            {quiz.index === 9 ? 'شوف النتيجة' : 'السؤال التالي'}
          </button>
        </div>
      )}
    </section>
  );
}
