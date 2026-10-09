import { Img } from 'remotion';
import type { ReactNode } from 'react';
import { STATE_LABELS, particlesAt, type StateKind } from '../statesLesson';
import { INK, EDGE, C } from './palette';
import { Text, Svg } from './primitives';

export function MassBoxes({ fill, denser }: { fill: boolean; denser: boolean }) {
  return (
    <Svg label="صندوقان بنفس الحجم: تمثيل كتلة أكبر وكتلة أقل">
      {[12, 6].map((count, i) => (
        <g
          key={i}
          transform={`translate(${30 + i * 280} 36)`}
          data-board-part={i === 0 ? 'mass-more' : 'mass-less'}
        >
          <rect
            width="200"
            height="218"
            rx="5"
            fill={denser && i === 0 ? '#f3eddc' : '#f8faf5'}
            stroke={denser && i === 0 ? C.solid : EDGE}
            strokeWidth="3"
          />
          {fill
            ? Array.from({ length: count }, (_, n) => (
                <rect
                  key={n}
                  x={22 + (n % 3) * 52}
                  y={170 - Math.floor(n / 3) * 44}
                  width="38"
                  height="32"
                  rx="3"
                  fill={i === 0 ? C.solid : C.gas}
                />
              ))
            : null}
          {fill ? (
            <Text x={100} y={266} size={38}>
              {i === 0 ? 'كتلة أكبر' : 'كتلة أقل'}
            </Text>
          ) : null}
        </g>
      ))}
    </Svg>
  );
}
