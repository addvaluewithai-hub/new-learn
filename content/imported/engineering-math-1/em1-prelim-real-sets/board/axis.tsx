import React from 'react';
import { Eq, T, ink } from './parts';
import { Tex } from './mathkit';

// Number-line pieces shared by every view of this lesson. A view builds a scale once and
// places ticks, points and labels with it, so landscape and portrait only change numbers.
export type On = (unit: string, ms?: number) => number;
export type SceneProps = { on: On; P: boolean; feedback: boolean };
export type Tone = 'c1' | 'c2' | 'c3' | 'c4' | 'ok' | 'no';

/** Keeps a math run (−5, ≤, x > 0) left-to-right inside an Arabic sentence. */
export const ltr = (s: string) => `\u2066${s}\u2069`;

export const scale = (min: number, max: number, x1: number, x2: number) => (v: number) => x1 + ((v - min) / (max - min)) * (x2 - x1);

/** Horizontal real line; `draw` grows it outward from its centre, arrows mark that it goes on. */
export function Axis({ x1, x2, y, draw = 1, o = 1, w = 3, color = ink.soft }: {
  x1: number; x2: number; y: number; draw?: number; o?: number; w?: number; color?: string;
}) {
  if (o <= 0 || draw <= 0) return null;
  const mid = (x1 + x2) / 2, half = ((x2 - x1) / 2) * draw;
  const a = mid - half, b = mid + half;
  return (
    <g opacity={o} stroke={color} strokeWidth={w} strokeLinecap="round" fill={color}>
      <line x1={a} y1={y} x2={b} y2={y} />
      {draw > 0.95 ? (
        <>
          <polygon points={`${b + 14},${y} ${b},${y - 7} ${b},${y + 7}`} stroke="none" />
          <polygon points={`${a - 14},${y} ${a},${y - 7} ${a},${y + 7}`} stroke="none" />
        </>
      ) : null}
    </g>
  );
}

/** Tick marks with optional labels under the line. */
export function Ticks({ at, y, values, labels = true, o = 1, size = 18, color = ink.soft, len = 10 }: {
  at: (v: number) => number; y: number; values: number[]; labels?: boolean | ((v: number) => string);
  o?: number; size?: number; color?: string; len?: number;
}) {
  if (o <= 0) return null;
  const text = (v: number) => (typeof labels === 'function' ? labels(v) : String(v).replace('-', '−'));
  return (
    <g opacity={o}>
      {values.map((v) => (
        <g key={v}>
          <line x1={at(v)} y1={y - len} x2={at(v)} y2={y + len} stroke={color} strokeWidth={2} />
          {labels ? <T x={at(v)} y={y + len + size * 0.9} size={size} color={color} math weight={500}>{text(v)}</T> : null}
        </g>
      ))}
    </g>
  );
}

/** A point on the line: solid glowing dot, or hollow when the number is missing (a hole / open end). */
export function Dot({ x, y, tone = 'c1', o = 1, r = 9, hollow = false }: { x: number; y: number; tone?: Tone; o?: number; r?: number; hollow?: boolean }) {
  if (o <= 0) return null;
  return hollow ? (
    <circle cx={x} cy={y} r={r} fill={ink.bg} stroke={ink[tone]} strokeWidth={3} opacity={o} />
  ) : (
    <g opacity={o}>
      <circle cx={x} cy={y} r={r + 6} fill={ink[tone]} opacity={0.18} />
      <circle cx={x} cy={y} r={r} fill={`url(#ball-${tone})`} />
    </g>
  );
}

/** Label above (dy < 0) or below a point, joined by a thin leader; `src` is mathkit markup. */
export function Pin({ x, y, dy = -48, src, tone = 'c1', o = 1, size = 24, w = 140 }: {
  x: number; y: number; dy?: number; src: string; tone?: Tone; o?: number; size?: number; w?: number;
}) {
  if (o <= 0) return null;
  const h = size * 2.4, cy = y + dy;
  return (
    <g opacity={o}>
      <line x1={x} y1={y + Math.sign(dy) * 12} x2={x} y2={cy - Math.sign(dy) * h * 0.32} stroke={ink[tone]} strokeWidth={1.5} strokeDasharray="3 4" />
      <foreignObject x={x - w / 2} y={cy - h / 2} width={w} height={h}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ink[tone] }}>
          <Tex src={src} size={size} color={ink[tone]} />
        </div>
      </foreignObject>
    </g>
  );
}

/** Hop arc between two points on the line, above (up) or below it. */
export function Hop({ x1, x2, y, up = true, tone = 'c4', o = 1, label }: { x1: number; x2: number; y: number; up?: boolean; tone?: Tone; o?: number; label?: string }) {
  if (o <= 0) return null;
  const h = Math.min(46, Math.abs(x2 - x1) * 0.45) * (up ? -1 : 1);
  const mx = (x1 + x2) / 2;
  const tip = x2 > x1 ? -1 : 1;
  return (
    <g opacity={o} fill="none" stroke={ink[tone]} strokeWidth={2.5} strokeLinecap="round">
      <path d={`M${x1} ${y + (up ? -6 : 6)} Q${mx} ${y + h * 1.6} ${x2} ${y + (up ? -6 : 6)}`} />
      <path d={`M${x2 + tip * 9} ${y + (up ? -14 : 14)} L${x2} ${y + (up ? -6 : 6)} L${x2 + tip * 11} ${y + (up ? -2 : 2)}`} />
      {label ? <g stroke="none"><T x={mx} y={y + h * 1.25 + (up ? -12 : 12)} size={16} color={ink[tone]} math weight={600}>{label}</T></g> : null}
    </g>
  );
}

/** Rounded panel holding one typeset line; used for rules and results beside a drawing. */
export function Card({ x, y, w, h = 70, src, size = 30, o = 1, tone }: { x: number; y: number; w: number; h?: number; src: string; size?: number; o?: number; tone?: Tone }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={ink.panel} stroke={tone ? ink[tone] : ink.line} strokeWidth={tone ? 1.8 : 1} />
      <Eq x={x} y={y} w={w} h={h} src={src} size={size} o={1} />
    </g>
  );
}
