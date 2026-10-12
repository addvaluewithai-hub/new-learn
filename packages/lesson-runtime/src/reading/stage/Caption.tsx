import { useLayoutEffect, useRef, useState } from 'react';
import { ReadText, textDirection } from '../ReadText';
import { pageSteps } from '../model';
import type { ReadingPage, ReadingQuestion, ReadingScene } from '../types';

/** The one sentence beside the board. Its zone has a fixed height, so nothing moves. */
export function Caption({
  label,
  text,
  lead,
  answer,
  step,
  steps,
  onThread,
  fit = [],
}: {
  label?: string;
  text: string;
  /** Every line of this clip: the text box keeps the height of the longest, so it never
   * changes size (or cuts a line short) while the learner steps through the scene. */
  fit?: string[];
  /** The start of a sentence that began on earlier steps, shown faded before this one. */
  lead?: string;
  answer?: string;
  step: number;
  steps: number;
  /** Opens the whole lesson conversation. */
  onThread?: () => void;
}) {
  const ruler = useRef<HTMLDivElement>(null);
  const [tallest, setTallest] = useState(0);
  const key = fit.join('\u0000');
  useLayoutEffect(() => {
    const box = ruler.current;
    if (!box) return;
    const measure = () =>
      setTallest(
        Math.max(0, ...[...box.children].map((line) => (line as HTMLElement).offsetHeight)),
      );
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(box);
    return () => watch.disconnect();
  }, [key]);
  return (
    <div className="rl-caption" data-label={label ? 'yes' : undefined}>
      {fit.length ? (
        <div className="rl-ruler" ref={ruler} aria-hidden="true">
          {fit.map((line, i) => (
            <p key={i} dir={textDirection(line)}>
              <ReadText text={line} />
            </p>
          ))}
        </div>
      ) : null}
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
      <p
        key={text}
        className="rl-caption-text"
        dir={textDirection(text)}
        aria-live="polite"
        style={tallest ? { minHeight: tallest } : undefined}
      >
        {lead ? (
          <span className="rl-lead" aria-hidden="true">
            <ReadText text={lead} />{' '}
          </span>
        ) : null}
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
      lead={attempt ? undefined : sentenceLead(steps, page.step)}
      fit={
        attempt
          ? []
          : steps.map((s, i) => [sentenceLead(steps, i), s.text].filter(Boolean).join(' '))
      }
      answer={
        page.kind === 'feedback' && page.step === 0 && question ? answers[question.id] : undefined
      }
      step={attempt ? 0 : page.step}
      steps={attempt ? 1 : steps.length}
      onThread={onThread}
    />
  );
}

/** Earlier steps of the same sentence: back from this step until one ends a sentence. */
export function sentenceLead(steps: Array<{ text: string }>, step: number) {
  let first = step;
  while (first > 0 && !/[.!?؟…]["»)]?\s*$/.test(steps[first - 1].text.trim())) first--;
  const lead = steps
    .slice(first, step)
    .map((s) => s.text.trim())
    .join(' ');
  return lead.length > 160 ? `…${lead.slice(-160)}` : lead;
}
