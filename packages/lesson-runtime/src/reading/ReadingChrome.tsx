import { useEffect, useRef, useState } from 'react';
import type { ReadingGoal, ReadingPackage } from './types';

/** Learning goals as progress: "الأهداف 1 من 3", with the list on demand. */
export function GoalsChip({ goals, met }: { goals: ReadingGoal[]; met: Set<string> }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) =>
      box.current && !box.current.contains(event.target as Node) && setOpen(false);
    addEventListener('mousedown', close);
    return () => removeEventListener('mousedown', close);
  }, [open]);
  if (!goals.length) return null;
  return (
    <div className="reading-goals" ref={box}>
      <button
        type="button"
        className="reading-goals-chip"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="reading-goal-mark" data-met={met.size > 0 || undefined} aria-hidden />
        الأهداف {met.size} من {goals.length}
      </button>
      {open ? (
        <div className="reading-goals-panel" role="dialog" aria-label="أهداف الدرس">
          <strong>أهداف الدرس</strong>
          <ul>
            {goals.map((goal) => (
              <li key={goal.id} data-met={met.has(goal.id) || undefined}>
                <span className="reading-goal-mark" aria-hidden />
                <span>{goal.text}</span>
              </li>
            ))}
          </ul>
          <small>الهدف بيتعلّم عليه لما تجاوب السؤال اللي بيقيسه.</small>
        </div>
      ) : null}
    </div>
  );
}

/** Scene path: titles on wide screens, compact segments on phones. */
export function ScenePath({
  lesson,
  current,
  reached,
  compact,
  onOpen,
}: {
  lesson: ReadingPackage;
  current: number;
  reached: number;
  compact: boolean;
  onOpen: (scene: number) => void;
}) {
  if (compact)
    return (
      <nav className="reading-scenes" aria-label="مشاهد الدرس">
        {lesson.scenes.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`المشهد ${i + 1}: ${s.title}`}
            aria-current={i === current ? 'step' : undefined}
            data-done={i < reached || undefined}
            disabled={i > reached}
            onClick={() => onOpen(i)}
          />
        ))}
      </nav>
    );
  return (
    <nav className="reading-path" aria-label="مشاهد الدرس">
      <ol>
        {lesson.scenes.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              aria-current={i === current ? 'step' : undefined}
              data-done={i < reached || undefined}
              disabled={i > reached}
              onClick={() => onOpen(i)}
            >
              <span className="reading-path-node" aria-hidden>
                {i < reached ? '✓' : i + 1}
              </span>
              <span>{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
