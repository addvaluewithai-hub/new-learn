import { ReadText, textDirection } from '../ReadText';
import type { ReadingQuestion } from '../types';

/** The one sentence beside the board. Its zone has a fixed height, so nothing moves. */
export function Caption({
  label,
  text,
  answer,
  step,
  steps,
  onHistory,
}: {
  label?: string;
  text: string;
  answer?: string;
  step: number;
  steps: number;
  onHistory?: () => void;
}) {
  return (
    <div className="rl-caption" data-label={label ? 'yes' : undefined}>
      <div className="rl-caption-meta">
        {label ? <span className="rl-tag">{label}</span> : <span />}
        <span className="rl-caption-step">
          {onHistory ? (
            <button type="button" className="rl-link" onClick={onHistory}>
              اللي فات
            </button>
          ) : null}
          <bdi dir="ltr">
            {step + 1} / {steps}
          </bdi>
        </span>
      </div>
      <p key={text} className="rl-caption-text" dir={textDirection(text)} aria-live="polite">
        <ReadText text={text} />
      </p>
      {answer !== undefined ? (
        <p className="rl-yours">
          إجابتك: <bdi dir="auto">{answer || 'معرفتش'}</bdi>
        </p>
      ) : null}
    </div>
  );
}

/** The question while the learner answers: wording, choices, and a way out. */
export function QuestionCaption({
  question,
  onChoose,
  onSkip,
}: {
  question: ReadingQuestion;
  onChoose: (option: string) => void;
  onSkip: () => void;
}) {
  const choices = question.attempt !== 'written' ? question.options : [];
  return (
    <div className="rl-caption rl-question">
      <div className="rl-caption-meta">
        <span className="rl-tag rl-tag-ask">جرّب بنفسك</span>
        <button type="button" className="rl-link" onClick={onSkip}>
          معرفتش، وريني الحل
        </button>
      </div>
      <div key={question.id} className="rl-caption-text">
        <p dir="ltr" lang="en" className="rl-question-en">
          <ReadText text={question.english} />
        </p>
        <p dir="rtl">
          <ReadText text={question.arabic} />
        </p>
      </div>
      {choices.length ? (
        <div className="rl-choices" role="group" aria-label="الاختيارات">
          {choices.map((option, i) => (
            <button key={i} type="button" onClick={() => onChoose(option)}>
              <ReadText text={option} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
