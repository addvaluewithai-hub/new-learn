import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ReadingGoal, ReadingPackage } from '../types';
import { fill as fillText, useRuntimeText } from '../../text';

/** One segment per scene: done, current (with its own step fill), or ahead. */
export function SceneTrack({
  lesson,
  scene,
  reached,
  fill,
  onOpen,
}: {
  lesson: ReadingPackage;
  scene: number;
  reached: number;
  fill: number;
  onOpen: () => void;
}) {
  const text = useRuntimeText();
  return (
    <button
      type="button"
      className="rl-track"
      onClick={onOpen}
      aria-label={fillText(text.sceneTrack, { scene: scene + 1, scenes: lesson.scenes.length })}
    >
      {lesson.scenes.map((s, i) => (
        <span
          key={s.id}
          className="rl-track-seg"
          data-state={i === scene ? 'now' : i <= reached ? 'done' : 'ahead'}
        >
          <i style={{ inlineSize: i === scene ? `${Math.round(fill * 100)}%` : undefined }} />
        </span>
      ))}
    </button>
  );
}

/** Goals as progress: diamond count; the list opens on demand. */
export function GoalsChip({ goals, met }: { goals: ReadingGoal[]; met: Set<string> }) {
  const text = useRuntimeText();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !box.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    addEventListener('pointerdown', close);
    addEventListener('keydown', close);
    return () => {
      removeEventListener('pointerdown', close);
      removeEventListener('keydown', close);
    };
  }, [open]);
  if (!goals.length) return null;
  return (
    <div className="rl-goals" ref={box}>
      <button
        type="button"
        className="rl-chip"
        aria-expanded={open}
        aria-label={fillText(text.goalsChip, { met: met.size, goals: goals.length })}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="rl-diamond" data-met={met.size > 0 || undefined} aria-hidden />
        <bdi dir="ltr">
          {met.size} / {goals.length}
        </bdi>
      </button>
      {open ? (
        <div className="rl-pop" role="dialog" aria-label={text.lessonGoals}>
          <span className="rl-eyebrow">{text.lessonGoals}</span>
          <ul>
            {goals.map((goal) => (
              <li key={goal.id} data-met={met.has(goal.id) || undefined}>
                <span className="rl-diamond" aria-hidden />
                <span>{goal.text}</span>
              </li>
            ))}
          </ul>
          <small>{text.goalsNote}</small>
        </div>
      ) : null}
    </div>
  );
}

export function TopBar({
  start,
  title,
  sceneTitle,
  track,
  goals,
  end,
}: {
  start?: ReactNode;
  title: string;
  sceneTitle: string;
  track: ReactNode;
  goals: ReactNode;
  end?: ReactNode;
}) {
  return (
    <header className="rl-top">
      <div className="rl-top-start">
        {start}
        <div className="rl-titles">
          <span>{title}</span>
          <strong>{sceneTitle}</strong>
        </div>
      </div>
      <div className="rl-top-track">{track}</div>
      <div className="rl-top-end">
        {end}
        {goals}
      </div>
    </header>
  );
}

/** Leaving the lesson, at the start of the top bar. */
export function ExitLink({ exit }: { exit?: { label: string; href: string } }) {
  return exit ? (
    <a className="rl-round rl-round-sm" href={exit.href} aria-label={exit.label}>
      ×
    </a>
  ) : null;
}
