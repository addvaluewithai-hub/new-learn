import type { ReadingGoal } from '../types';
import { fill, useRuntimeText } from '../../text';

/** The end of a lesson: what was reached, and the one obvious next step. */
export function Complete({
  title,
  goals,
  met,
  answered,
  questions,
  next,
  exit,
  onReview,
  onPractice,
}: {
  title: string;
  goals: ReadingGoal[];
  met: Set<string>;
  answered: number;
  questions: number;
  next?: { title: string; href: string } | null;
  exit?: { label: string; href: string };
  onReview: () => void;
  /** Opens the conversation and asks Nova for a short check (when the host has Nova). */
  onPractice?: () => void;
}) {
  const text = useRuntimeText();
  const tally = { answered, questions };
  return (
    <section className="rl-complete" aria-labelledby="rl-complete-title">
      <div className="rl-complete-mark" aria-hidden>
        <svg viewBox="0 0 64 64" width="64" height="64">
          <circle cx="32" cy="32" r="30" />
          <path d="M20 33l8 8 16-17" />
        </svg>
      </div>
      <span className="rl-eyebrow">{text.lessonDone}</span>
      <h2 id="rl-complete-title">{title}</h2>
      <p className="rl-complete-sub">
        {fill(questions === 1 ? text.answeredOne : text.answeredMany, tally)}
        {goals.length ? ` · ${fill(text.goalsMet, { met: met.size, goals: goals.length })}` : ''}
      </p>
      {goals.length ? (
        <ul className="rl-complete-goals">
          {goals.map((goal) => (
            <li key={goal.id} data-met={met.has(goal.id) || undefined}>
              <span className="rl-diamond" aria-hidden />
              <span>{goal.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="rl-complete-actions">
        {next ? (
          <a className="rl-next" href={next.href}>
            <span>{fill(text.nextLesson, { title: next.title })}</span>
          </a>
        ) : exit ? (
          <a className="rl-next" href={exit.href}>
            <span>{exit.label}</span>
          </a>
        ) : null}
        {onPractice && (
          <button type="button" className="rl-practice" onClick={onPractice}>
            {text.practiceWithNova}
          </button>
        )}
        <button type="button" className="rl-quiet" onClick={onReview}>
          {text.reviewLesson}
        </button>
      </div>
    </section>
  );
}
