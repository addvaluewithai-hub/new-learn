import { ReadText, textDirection } from '../ReadText';
import { pageSteps } from '../model';
import type { ReadingPage, ReadingQuestion, ReadingScene } from '../types';

/** The one sentence beside the board. Its zone has a fixed height, so nothing moves. */
export function Caption({
  label,
  text,
  answer,
  step,
  steps,
  onThread,
}: {
  label?: string;
  text: string;
  answer?: string;
  step: number;
  steps: number;
  /** Opens the whole lesson conversation. */
  onThread?: () => void;
}) {
  return (
    <div className="rl-caption" data-label={label ? 'yes' : undefined}>
      <div className="rl-caption-meta">
        {label ? <span className="rl-tag">{label}</span> : <span />}
        <span className="rl-caption-step">
          {onThread ? (
            <button type="button" className="rl-link" onClick={onThread}>
              المحادثة
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
  onHint,
}: {
  question: ReadingQuestion;
  onChoose: (option: string) => void;
  onSkip: () => void;
  /** Ask the tutor for a hint (never the answer). */
  onHint?: () => void;
}) {
  const choices = question.attempt !== 'written' ? question.options : [];
  return (
    <div className="rl-caption rl-question">
      <div className="rl-caption-meta">
        <span className="rl-tag rl-tag-ask">جرّب بنفسك</span>
        <span className="rl-caption-step">
          {onHint ? (
            <button type="button" className="rl-hint" onClick={onHint}>
              تلميح
            </button>
          ) : null}
          <button type="button" className="rl-link" onClick={onSkip}>
            معرفتش، وريني الحل
          </button>
        </span>
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

/** The caption for a page: the question while answering, otherwise the current line. */
export function PageCaption({
  scene,
  page,
  answers,
  answering,
  onAnswer,
  onThread,
  onHint,
}: {
  scene: ReadingScene;
  page: ReadingPage;
  answers: Record<string, string>;
  answering: boolean;
  onAnswer: (value: string) => void;
  onThread: () => void;
  onHint?: () => void;
}) {
  const question = scene.question;
  if (answering && question)
    return (
      <QuestionCaption
        question={question}
        onChoose={onAnswer}
        onSkip={() => onAnswer('')}
        onHint={onHint}
      />
    );
  const steps = pageSteps(scene, page);
  const attempt = page.kind === 'attempt';
  return (
    <Caption
      label={page.kind === 'feedback' ? 'الإجابة النموذجية' : attempt ? 'سؤال' : undefined}
      text={attempt ? question!.english : steps[page.step].text}
      answer={
        page.kind === 'feedback' && page.step === 0 && question ? answers[question.id] : undefined
      }
      step={attempt ? 0 : page.step}
      steps={attempt ? 1 : steps.length}
      onThread={onThread}
    />
  );
}
