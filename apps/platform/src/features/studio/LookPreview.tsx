import { useEffect, useRef, useState } from 'react';
import type { BoardValues, VisualProps } from '@learn/lesson-runtime';
import { HtmlBoard } from '../boards/HtmlBoard';
import { builtSource } from '../boards/sources';
import type { Look } from './looks';

/** A look's demo board, live and open to play with, before the teacher picks it. */
export function LookPreview({
  look,
  onClose,
  onChoose,
}: {
  look: Look;
  onClose: () => void;
  onChoose: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const manifest = builtSource(look.board ?? '')?.manifest;
  const defaults = Object.fromEntries(
    Object.entries(manifest?.variables ?? {}).map(([k, v]) => [k, v.default]),
  ) as BoardValues;
  const [values, setValues] = useState<BoardValues>(defaults);
  const portrait = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 640px)').matches;
  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);
  const view = {
    variables: values,
    highlight: [],
    reveal: [],
    notes: [],
    input: 'open' as const,
    phase: 'teach' as const,
    step: 0,
  };
  const props = {
    spec: { renderer: 'html-board', params: { board: look.board } },
    layout: portrait ? 'portrait' : 'landscape',
    reducedMotion: false,
    board: {
      view,
      onValues: (v: BoardValues) => setValues((now) => ({ ...now, ...v })),
      onObservation: () => {},
    },
  } as unknown as VisualProps;
  return (
    <dialog ref={dialog} className="look-preview" onClose={onClose} aria-label={look.name}>
      <header>
        <div>
          <h2>{look.name}</h2>
          <p>{look.line} جرّب البورد بإيدك.</p>
        </div>
        <button
          type="button"
          className="look-preview-close"
          onClick={() => dialog.current?.close()}
          aria-label="اقفل"
        >
          ×
        </button>
      </header>
      <div className={`look-preview-board ${portrait ? 'portrait' : ''}`}>
        <HtmlBoard {...props} />
      </div>
      <footer>
        <button
          type="button"
          className="button primary"
          onClick={() => {
            onChoose(look.id);
            dialog.current?.close();
          }}
        >
          اختار الشكل ده
        </button>
        {look.demo && (
          <a
            className="button secondary"
            href={`/?preview=demo&id=${look.demo}`}
            target="_blank"
            rel="noreferrer"
          >
            افتح درس الديمو
          </a>
        )}
      </footer>
    </dialog>
  );
}
