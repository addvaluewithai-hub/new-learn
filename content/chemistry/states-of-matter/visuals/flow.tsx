import { Img } from 'remotion';
import type { ReactNode } from 'react';
import { STATE_LABELS, particlesAt, type StateKind } from '../statesLesson';
import { INK, EDGE, C } from './palette';
import { Text, Svg } from './primitives';

export function Flow({
  frame,
  liquid,
  gas,
  reducedMotion,
}: {
  frame: number;
  liquid: boolean;
  gas: boolean;
  reducedMotion: boolean;
}) {
  const time = reducedMotion ? 0 : frame / 30;
  return (
    <Svg label="المية والهوا يتحركان خلال أنبوبتين">
      {(['liquid', 'gas'] as const).map((kind, row) =>
        (row === 0 ? liquid : gas) ? (
          <g
            key={kind}
            data-board-part={kind}
            transform={`translate(20 ${liquid && gas ? 60 + row * 155 : 122})`}
          >
            <path d="M0 0h496M0 76h496" stroke={EDGE} strokeWidth="3" />
            {kind === 'liquid' ? (
              <rect width="496" height="76" fill={C.liquid} fillOpacity=".19" />
            ) : null}
            {Array.from({ length: 24 }, (_, i) => (
              <circle
                key={i}
                cx={8 + ((i * 31 + time * 66) % 480)}
                cy={12 + (i % 4) * 17}
                r="5"
                fill={C[kind]}
              />
            ))}
            <path d="M220 105h65m-12 -9 12 9 -12 9" fill="none" stroke={C[kind]} strokeWidth="4" />
            <Text x={248} y={-18} color={C[kind]} size={38}>
              {kind === 'liquid' ? 'Liquid' : 'Gas'}
            </Text>
          </g>
        ) : null,
      )}
    </Svg>
  );
}

export function Diffusion({
  frame,
  progress,
  reducedMotion,
}: {
  frame: number;
  progress: number;
  reducedMotion: boolean;
}) {
  return (
    <Svg label="مجموعتان من جسيمات الغاز تختلطان تدريجيًا بالحركة العشوائية">
      <rect
        x="28"
        y="38"
        width="484"
        height="240"
        rx="8"
        fill="#f7f6fb"
        stroke={EDGE}
        strokeWidth="3"
      />
      {particlesAt('gas', frame, 464, 220, 48, reducedMotion).map((p, i) => {
        const initialX = (i < 24 ? 9 : 279) + ((p.x - 9) / 446) * 166;
        return (
          <circle
            key={i}
            cx={38 + initialX * (1 - progress) + p.x * progress}
            cy={48 + p.y}
            r="5"
            fill={i < 24 ? C.liquid : C.solid}
          />
        );
      })}
    </Svg>
  );
}
