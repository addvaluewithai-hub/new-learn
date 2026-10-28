import { decodeBoardAnswer, gradeBoard } from '../../board/state';
import { ReadText, textDirection } from '../ReadText';
import { pageSteps } from '../model';
import { gradeChoice } from '../grade';
import { useEffect } from 'react';
import type { ReadingPage, ReadingQuestion, ReadingScene } from '../types';

/** The one sentence beside the board; its card fits the text (no empty space, no scroll). */
export function Caption({
  label,
  text,
  lead,
  answer,
  verdict,
  step,
  steps,
  onThread,
}: {
  label?: string;
  text: string;
  /** The start of a sentence that began on earlier steps, shown faded before this one. */
  lead?: string;
  answer?: string;
  /** An answer our code graded (a board, or a choice that names the model answer). */
  verdict?: boolean;
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
        {lead ? (
          <span className="rl-lead" aria-hidden="true">
            <ReadText text={lead} />{' '}
          </span>
        ) : null}
        <ReadText text={text} />
      </p>
      {answer !== undefined ? (
        <p className="rl-yours">
          <span>
            إجابتك: <bdi dir="auto">{answer || 'معرفتش'}</bdi>
          </span>
          {verdict === undefined ? null : (
            <span className="rl-verdict" data-correct={verdict}>
              {verdict ? '✓ مظبوطة' : '✗ لسه مش مظبوطة'}
            </span>
          )}
        </p>
      ) : null}
    </div>
  );
}

const KEYS = ['أ', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح'];

/** The question while the learner answers: wording, choices, and ways out. */
export function QuestionCaption({
  question,
  onChoose,
  onSkip,
  onReveal,
  onHint,
}: {
  question: ReadingQuestion;
  onChoose: (option: string) => void;
  /** Leave it unanswered and go on. */
  onSkip: () => void;
  /** "I don't know": show the model answer. */
  onReveal: () => void;
  /** Ask the tutor for a hint (never the answer). */
  onHint?: () => void;
}) {
  const chooses = question.attempt === 'choice' || question.attempt === 'choice-and-written';
  const choices = chooses ? question.options : [];
  // Number keys pick a choice (1 is the first), unless the learner is typing.
  useEffect(() => {
    if (!choices.length) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest('textarea, input, select')) return;
      const n = Number(event.key);
      if (Number.isInteger(n) && n >= 1 && n <= choices.length) onChoose(choices[n - 1]);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [choices, onChoose]);
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
          <button type="button" className="rl-link" onClick={onReveal}>
            معرفتش، وريني الحل
          </button>
          <button type="button" className="rl-link" onClick={onSkip}>
            فوّت
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
            <button
              key={i}
              type="button"
              aria-keyshortcuts={String(i + 1)}
              onClick={() => onChoose(option)}
            >
              <span className="rl-choice-key" aria-hidden="true">
                {KEYS[i] ?? i + 1}
              </span>
              <ReadText text={option} />
            </button>
          ))}
        </div>
      ) : null}
      {question.attempt === 'board' ? (
        <p className="rl-board-ask">غيّر البورد لحد ما توصل لإجابتك، وبعدين اضغط «ابعت».</p>
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
  onSkip,
  onReveal,
  onThread,
  onHint,
}: {
  scene: ReadingScene;
  page: ReadingPage;
  answers: Record<string, string>;
  answering: boolean;
  onAnswer: (value: string) => void;
  onSkip: () => void;
  onReveal: () => void;
  onThread: () => void;
  onHint?: () => void;
}) {
  const question = scene.question;
  if (answering && question)
    return (
      <QuestionCaption
        question={question}
        onChoose={onAnswer}
        onSkip={onSkip}
        onReveal={onReveal}
        onHint={onHint}
      />
    );
  const steps = pageSteps(scene, page);
  const attempt = page.kind === 'attempt';
  const raw =
    page.kind === 'feedback' && page.step === 0 && question ? answers[question.id] : undefined;
  const onBoard = question?.board ? decodeBoardAnswer(raw) : null;
  return (
    <Caption
      label={page.kind === 'feedback' ? 'الإجابة النموذجية' : attempt ? 'سؤال' : undefined}
      text={attempt ? question!.english : steps[page.step].text}
      lead={attempt ? undefined : sentenceLead(steps, page.step)}
      answer={onBoard ? onBoard.text : raw}
      verdict={
        onBoard && question?.board
          ? gradeBoard(question.board.check, onBoard.values)
          : question && raw !== undefined
            ? gradeChoice(question, raw)
            : undefined
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
