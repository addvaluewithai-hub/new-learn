import { Img } from 'remotion';
import type { ReactNode } from 'react';
import { STATE_LABELS, particlesAt, type StateKind } from '../statesLesson';
import { INK, EDGE, C } from './palette';

export function Photo({ kind, label }: { kind: StateKind; label?: string }) {
  const file = kind === 'solid' ? 'ice-cube' : kind === 'liquid' ? 'water-beaker' : 'air-jar';
  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0 }}>
      <div style={{ position: 'absolute', inset: 0, bottom: label ? 76 : 0 }}>
        <Img
          src={`/lesson-assets/${file}.webp`}
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      {label ? (
        <div
          data-board-part="state-name"
          dir="ltr"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            fontSize: 36,
            lineHeight: 1.3,
            fontWeight: 650,
            color: C[kind],
            textAlign: 'center',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}

export function Photos({
  kinds,
  portrait,
  active,
  labels = true,
}: {
  kinds: StateKind[];
  portrait: boolean;
  active?: StateKind;
  labels?: boolean;
}) {
  const visibleKinds = portrait && active ? [active] : kinds;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: `repeat(${visibleKinds.length}, minmax(0, 1fr))`,
        gap: portrait ? 16 : 34,
      }}
    >
      {visibleKinds.map((kind) => (
        <div
          key={kind}
          data-board-part={kind}
          style={{ minWidth: 0, height: '100%', opacity: !active || kind === active ? 1 : 0.35 }}
        >
          <Photo
            kind={kind}
            label={labels ? `${STATE_LABELS[kind].name} · ${STATE_LABELS[kind].arabic}` : undefined}
          />
        </div>
      ))}
    </div>
  );
}
