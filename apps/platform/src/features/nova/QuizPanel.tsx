import type { Position } from './types';
import type { useQuiz } from './useQuiz';
import { useI18n } from '../../i18n';
export function QuizPanel({
  practice,
  position,
  enabled,
}: {
  practice: ReturnType<typeof useQuiz>;
  position: Position;
  enabled: boolean;
}) {
  const { t } = useI18n();
  const { quiz, loading, error } = practice;
  if (!quiz)
    return (
      <section className="nova-practice">
        <span className="nova-eyebrow">{t('nova.quiz.eyebrow')}</span>
        <h3>{t('nova.quiz.title')}</h3>
        <p>{t('nova.quiz.lead')}</p>
        <p className="nova-footnote">{t('nova.quiz.disclaimer')}</p>
        {error && (
          <p role="alert" className="nl-alert nl-alert--error">
            {error}
          </p>
        )}
        <button
          className="nl-button nl-button--primary nl-button--sm"
          disabled={loading || !enabled}
          onClick={() => void practice.prepare(position)}
        >
          {loading ? t('nova.quiz.preparing') : t('nova.quiz.prepare')}
        </button>
        {loading && (
          <button className="nl-button nl-button--secondary nl-button--sm" onClick={practice.stop}>
            {t('nova.quiz.cancel')}
          </button>
        )}
      </section>
    );
  if (quiz.index >= quiz.questions.length) {
    const score = quiz.answers.reduce((n, a, i) => n + Number(a === quiz.questions[i].correct), 0);
    return (
      <section className="nova-practice" role="status">
        <span className="nova-eyebrow">{t('nova.quiz.doneEyebrow')}</span>
        <h3>{t('nova.quiz.score', { score, total: quiz.questions.length })}</h3>
        <p>{t('nova.quiz.doneLead')}</p>
        <button
          className="nl-button nl-button--primary nl-button--sm"
          onClick={() => void practice.prepare(position)}
          disabled={loading}
        >
          {loading ? t('nova.quiz.preparingNew') : t('nova.quiz.again')}
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
          {t('nova.quiz.progress', { number: quiz.index + 1, total: quiz.questions.length })}
        </span>
        <progress value={quiz.index} max={quiz.questions.length} />
      </div>
      <h3 lang="en" dir="ltr">
        {question.english}
      </h3>
      <p>
        <bdi>{question.arabic}</bdi>
      </p>
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
            {quiz.answers[quiz.index] === question.correct
              ? t('nova.quiz.correct')
              : t('nova.quiz.review')}
          </strong>
          <p dir="ltr" lang="en">
            {question.englishAnswer}
          </p>
          <p>
            <bdi>{question.explanation}</bdi>
          </p>
          <button className="nl-button nl-button--primary nl-button--sm" onClick={practice.next}>
            {quiz.index === 9 ? t('nova.quiz.result') : t('nova.quiz.next')}
          </button>
        </div>
      )}
    </section>
  );
}
