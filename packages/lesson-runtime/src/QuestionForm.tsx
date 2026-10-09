import { canSubmitAttempt } from './flow';
import type { Attempt } from './session';
import type { LessonQuestion } from './types';

export function QuestionForm({
  question,
  draft,
  onChange,
  onSubmit,
}: {
  question: LessonQuestion;
  draft: Attempt;
  onChange: (attempt: Attempt) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="lesson-question"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <p className="lesson-label">دورك دلوقتي</p>
      <h2 dir="ltr" lang="en">
        {question.english}
      </h2>
      <p>{question.title}</p>
      {question.attempt !== 'written' && (
        <fieldset>
          <legend>اختار إجابتك</legend>
          {question.options.map((option, index) => (
            <label key={index}>
              <input
                type="radio"
                name={question.id}
                checked={draft.choice === index}
                onChange={() => onChange({ ...draft, choice: index })}
              />
              <span>
                <span dir="ltr" lang="en">
                  {question.englishOptions[index]}
                </span>
                <small>{option}</small>
              </span>
            </label>
          ))}
        </fieldset>
      )}
      {question.attempt !== 'choice' && (
        <label className="lesson-written">
          {question.writtenLabel}
          <textarea
            value={draft.written}
            maxLength={5000}
            placeholder={question.writtenPlaceholder}
            onChange={(event) => onChange({ ...draft, written: event.target.value })}
          />
        </label>
      )}
      <button
        type="submit"
        className="lesson-primary"
        disabled={!canSubmitAttempt(question, draft.choice, draft.written)}
      >
        اسمع التعقيب ونكمل
      </button>
    </form>
  );
}
