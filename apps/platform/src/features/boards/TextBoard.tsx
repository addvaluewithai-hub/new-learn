import type { VisualProps } from '@learn/lesson-runtime';
import './text-board.css';

const plain = (text: string) => text.replace(/\$([^$]+)\$/g, '$1');

/**
 * The board of a draft scene without an interactive board: the scene title and the steps
 * read so far, the current one in front. Reading lessons hold the board at each step's time.
 */
export function TextBoard({ spec, reading, frame, fps, layout }: VisualProps) {
  const ms = (frame * 1000) / fps;
  const steps = (reading?.steps ?? []).filter((step) => step.atMs <= ms);
  const shown = steps.slice(-4);
  const title = typeof spec.params.title === 'string' ? spec.params.title : '';
  return (
    <div className="text-board" data-layout={layout} dir="auto">
      <h2 dir="auto">{title}</h2>
      <ol start={steps.length - shown.length + 1}>
        {shown.map((step, i) => (
          <li key={step.atMs} data-current={i === shown.length - 1 || undefined} dir="auto">
            {plain(step.text)}
          </li>
        ))}
      </ol>
    </div>
  );
}
