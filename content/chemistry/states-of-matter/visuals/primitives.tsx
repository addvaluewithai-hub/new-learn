import { Img } from 'remotion';
import type { ReactNode } from 'react';
import { STATE_LABELS, particlesAt, type StateKind } from '../statesLesson';
import { INK, EDGE, C } from './palette';

export function Text({
  x,
  y,
  children,
  size = 38,
  color = INK,
}: {
  x: number;
  y: number;
  children: string;
  size?: number;
  color?: string;
}) {
  return (
    <text x={x} y={y} textAnchor="middle" direction="rtl" fontSize={size} fill={color}>
      {children}
    </text>
  );
}

export function Svg({
  children,
  label,
  viewBox = '0 0 540 340',
}: {
  children: ReactNode;
  label: string;
  viewBox?: string;
}) {
  return (
    <svg viewBox={viewBox} width="100%" height="100%" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

export function Vessel({
  kind,
  x,
  y,
  width,
  height,
  frame,
  reducedMotion = false,
  headspace = 0,
  count = kind === 'liquid' ? 48 : 24,
  particles = true,
}: {
  kind: StateKind;
  x: number;
  y: number;
  width: number;
  height: number;
  frame: number;
  reducedMotion?: boolean;
  headspace?: number;
  count?: number;
  particles?: boolean;
}) {
  const color = C[kind];
  return (
    <g transform={`translate(${x} ${y})`} data-vessel={kind} data-count={particles ? count : 0}>
      <path
        d={`M0 ${-headspace}V${height}H${width}V${-headspace}${kind === 'gas' ? 'Z' : ''}`}
        fill={kind === 'gas' ? color : 'none'}
        fillOpacity=".07"
        stroke={EDGE}
        strokeWidth="3"
      />
      {kind === 'solid' ? (
        <rect
          x="10"
          y={height - 96}
          width="132"
          height="89"
          rx="3"
          fill={color}
          fillOpacity=".2"
          stroke={color}
          strokeWidth="2"
        />
      ) : null}
      {kind === 'solid' && !particles ? (
        <image
          href="/lesson-assets/ice-cube.webp"
          x="12"
          y={height - 103}
          width="129"
          height="99"
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null}
      {kind === 'liquid' ? (
        <rect x="3" y="3" width={width - 6} height={height - 6} fill={color} fillOpacity=".23" />
      ) : null}
      {particles
        ? particlesAt(kind, frame, width, height, count, reducedMotion).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={color} data-particle-size={p.r} />
          ))
        : null}
    </g>
  );
}
