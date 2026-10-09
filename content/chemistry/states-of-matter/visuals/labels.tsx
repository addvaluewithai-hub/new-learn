import { Img } from 'remotion';
import type { ReactNode } from 'react';
import { STATE_LABELS, particlesAt, type StateKind } from '../statesLesson';
import { INK, EDGE, C } from './palette';

export function StateRecap({ phase, portrait }: { phase: string; portrait: boolean }) {
  const count = phase === 'solid' ? 1 : phase === 'liquid' ? 2 : 3;
  const rows = [
    ['Solid', 'شكل محدد', 'حجم محدد'],
    ['Liquid', 'شكل الوعاء', 'حجم محدد تقريبًا'],
    ['Gas', 'شكل الوعاء', 'حجم الوعاء'],
  ];
  return (
    <div
      style={{
        display: 'grid',
        gap: portrait ? 24 : 16,
        width: '100%',
        height: '100%',
        alignContent: 'center',
      }}
    >
      {rows.slice(0, count).map((r, i) => (
        <div
          key={r[0]}
          data-board-part={r[0].toLowerCase()}
          style={{
            display: 'grid',
            gridTemplateColumns: portrait ? '120px 1fr' : '160px 1fr 1fr',
            gap: 12,
            alignItems: 'center',
            padding: '18px 22px',
            background: '#f7f9f3',
            borderRadius: 14,
            opacity: i === count - 1 ? 1 : 0.45,
            fontSize: portrait ? 31 : 34,
          }}
        >
          <b dir="ltr" style={{ color: C[(['solid', 'liquid', 'gas'] as const)[i]] }}>
            {r[0]}
          </b>
          <span dir="rtl">{r[1]}</span>
          <span dir="rtl" style={portrait ? { gridColumn: '2' } : undefined}>
            {r[2]}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Term({ english, arabic }: { english: string; arabic: string }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <strong
        lang="en"
        dir="ltr"
        style={{ fontSize: 44, color: C.liquid, textAlign: 'center', overflowWrap: 'anywhere' }}
      >
        {english}
      </strong>
      <span dir="rtl" style={{ fontSize: 40, textAlign: 'center' }}>
        {arabic}
      </span>
    </div>
  );
}

export function Prompt({
  english,
  arabic,
  portrait,
}: {
  english: string;
  arabic?: string;
  portrait: boolean;
}) {
  return (
    <div
      data-board-part="question"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 24,
        textAlign: 'center',
        padding: portrait ? '0 12px' : '0 65px',
      }}
    >
      <strong
        lang="en"
        dir="ltr"
        style={{ fontSize: portrait ? 42 : 44, lineHeight: 1.5, color: INK }}
      >
        {english}
      </strong>
      {arabic ? (
        <span dir="rtl" style={{ fontSize: portrait ? 32 : 32, lineHeight: 1.6, color: C.liquid }}>
          {arabic}
        </span>
      ) : null}
    </div>
  );
}
