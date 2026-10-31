import { useEffect, type ReactNode } from 'react';
import type { ReadingPackage } from '../types';
import { useRuntimeText } from '../../text';

/** Side panel on wide screens, bottom sheet on phones. Esc or the backdrop closes it. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const text = useRuntimeText();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="rl-sheet-layer">
      <button type="button" className="rl-backdrop" aria-label={text.close} onClick={onClose} />
      <aside className="rl-sheet" role="dialog" aria-label={title}>
        <header>
          <strong>{title}</strong>
          <button
            type="button"
            className="rl-round rl-round-sm"
            onClick={onClose}
            aria-label={text.close}
          >
            ×
          </button>
        </header>
        <div className="rl-sheet-body">{children}</div>
      </aside>
    </div>
  );
}

export function ScenesList({
  lesson,
  current,
  reached,
  onOpen,
}: {
  lesson: ReadingPackage;
  current: number;
  reached: number;
  onOpen: (scene: number) => void;
}) {
  return (
    <ol className="rl-scenes">
      {lesson.scenes.map((s, i) => (
        <li key={s.id}>
          <button
            type="button"
            aria-current={i === current ? 'step' : undefined}
            data-done={(i !== current && i <= reached) || undefined}
            disabled={i > reached}
            onClick={() => onOpen(i)}
          >
            <span className="rl-node" aria-hidden>
              {i !== current && i <= reached ? '✓' : i + 1}
            </span>
            <span>{s.title}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
