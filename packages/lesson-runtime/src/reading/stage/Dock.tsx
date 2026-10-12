import { useEffect, useRef, useState, type ReactNode } from 'react';

const Arrow = ({ back }: { back?: boolean }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    {/* RTL: «next» points left, «back» points right. */}
    <path
      d={back ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export type DockFlow = {
  /** Page-turn timer for this page; the Next button fills as it runs. */
  ms?: number;
  page: string;
  running: boolean;
  paused: boolean;
  speaking?: boolean;
  onToggle: () => void;
};

const Pause = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
const Play = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M17 12 8 6v12z" fill="currentColor" />
  </svg>
);

/** Fixed controls: back, the host's tool (e.g. the assistant), next. Never moves. */
export function Dock({
  canBack,
  onBack,
  onNext,
  nextLabel,
  center,
  flow,
}: {
  canBack: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  center?: ReactNode;
  flow?: DockFlow;
}) {
  return (
    <nav className="rl-dock" aria-label="التنقل في الدرس">
      <button
        type="button"
        className="rl-round"
        onClick={onBack}
        disabled={!canBack}
        aria-label="الخطوة اللي فاتت"
      >
        <Arrow back />
      </button>
      {flow ? (
        <button
          type="button"
          className="rl-round rl-flow"
          data-speaking={flow.speaking || undefined}
          onClick={flow.onToggle}
          aria-pressed={flow.paused}
          aria-label={flow.paused ? 'كمّل لوحده' : 'وقّف التقليب'}
        >
          {flow.paused ? <Play /> : <Pause />}
        </button>
      ) : null}
      <div className="rl-dock-center">{center}</div>
      <button type="button" className="rl-next" onClick={onNext}>
        {flow?.ms ? (
          <i
            key={flow.page}
            className="rl-next-fill"
            aria-hidden="true"
            style={{
              animationDuration: `${flow.ms}ms`,
              animationPlayState: flow.running ? 'running' : 'paused',
            }}
            onAnimationEnd={onNext}
          />
        ) : null}
        <span>{nextLabel}</span>
        <Arrow />
      </button>
    </nav>
  );
}

/** While answering, the dock becomes the answer field; nothing else competes. */
export function AnswerDock({
  canBack,
  onBack,
  onSubmit,
  written,
}: {
  canBack: boolean;
  onBack: () => void;
  onSubmit: (answer: string) => void;
  written: boolean;
}) {
  const [draft, setDraft] = useState('');
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (written && matchMedia('(pointer: fine)').matches) field.current?.focus();
  }, [written]);
  const send = () => draft.trim() && onSubmit(draft.trim());
  return (
    <nav className="rl-dock" aria-label="جاوب">
      <button
        type="button"
        className="rl-round"
        onClick={onBack}
        disabled={!canBack}
        aria-label="الخطوة اللي فاتت"
      >
        <Arrow back />
      </button>
      {written ? (
        <form
          className="rl-answer"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <textarea
            ref={field}
            rows={1}
            aria-label="إجابتك"
            dir="auto"
            value={draft}
            placeholder="اكتب حلّك هنا…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
          />
          <button type="submit" className="rl-next" disabled={!draft.trim()}>
            <span>ابعت</span>
          </button>
        </form>
      ) : (
        <p className="rl-dock-hint">اختار إجابة من فوق</p>
      )}
    </nav>
  );
}
