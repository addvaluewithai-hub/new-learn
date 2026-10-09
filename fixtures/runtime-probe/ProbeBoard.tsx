import { AbsoluteFill } from 'remotion';
import { cueIsVisible } from '@learn/lesson-runtime/core';
import type { VisualProps } from '@learn/lesson-runtime';

export function ProbeBoard({ spec, recording, frame, layout, fps }: VisualProps) {
  const portrait = layout === 'portrait';
  const mode = spec.params.mode;
  const showSecond = mode === 'combine' && cueIsVisible(recording, 'second-group', frame, fps);
  return (
    <AbsoluteFill
      data-board-phase="teaching"
      style={{
        background: '#fafbf4',
        color: '#193a35',
        fontFamily: 'Tahoma, Arial, sans-serif',
        padding: portrait ? '90px 36px' : '46px 64px',
        gap: portrait ? 64 : 36,
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <h2
        data-safe-element="heading"
        dir="rtl"
        style={{ margin: 0, fontSize: 38, lineHeight: 1.6 }}
      >
        {mode === 'combine'
          ? 'نجمع مجموعتين'
          : mode === 'question'
            ? 'دلوقتي سؤال صغير'
            : 'الفكرة وصلت — نكمل'}
      </h2>
      {mode === 'combine' && (
        <div
          style={{
            display: 'flex',
            flexDirection: portrait ? 'column' : 'row',
            gap: 48,
            alignItems: 'center',
          }}
        >
          <Group count={2} label="المجموعة الأولى" />
          {showSecond && <Group count={3} label="المجموعة الثانية" />}
        </div>
      )}
      {mode !== 'combine' && (
        <p
          data-safe-element="subtitle"
          dir="rtl"
          style={{ margin: 0, fontSize: 30, lineHeight: 1.7 }}
        >
          {mode === 'question'
            ? 'السؤال هيظهر مع بداية قراءته.'
            : 'انتهت تجربة الصوت والبورد والسؤال.'}
        </p>
      )}
    </AbsoluteFill>
  );
}

function Group({ count, label }: { count: number; label: string }) {
  return (
    <div
      data-safe-element="group"
      data-count={count}
      style={{ display: 'grid', gap: 22, justifyItems: 'center' }}
    >
      <svg width="190" height="65" viewBox="0 0 190 65" role="img" aria-label={`${count} نقاط`}>
        {Array.from({ length: count }, (_, index) => (
          <circle key={index} cx={32 + index * 60} cy={32} r={22} fill="#146e57" />
        ))}
      </svg>
      <span dir="rtl" style={{ fontSize: 28 }}>
        {label}
      </span>
    </div>
  );
}
