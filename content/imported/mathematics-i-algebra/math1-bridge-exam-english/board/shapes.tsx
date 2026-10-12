import React from 'react';
import { Tex, mathFont, palette } from './mathkit';
import { progress, type Clock } from './clock';

// Concrete pictures for the bridge lessons (identical copy per lesson):
// fraction pies (equal pieces) and the area model for multiplying two brackets.
type Tone = 'c1' | 'c2' | 'c3' | 'c4';
const tone: Record<Tone, string> = { c1: palette.c1, c2: palette.c2, c3: palette.c3, c4: palette.c4 };

export type PieSpec = {
  at: string;
  labels?: Array<[string, string]>;
  states: Array<{ at: string; parts: number; fills: Array<[number, Tone]> }>;
};
export type AreaSpec = { a: number; b: number; cellsAt: string };

function latest<T extends { at: string }>(clock: Clock, items: T[]) {
  return items.filter((item, i) => i === 0 || progress(clock, item.at, 1) > 0).pop()!;
}

function Pie({ pie, clock }: { pie: PieSpec; clock: Clock }) {
  const r = clock.portrait ? 78 : 66;
  const state = latest(clock, pie.states);
  const label = (pie.labels ?? []).filter(([beat]) => progress(clock, beat, 1) > 0).pop()?.[1];
  const colors: Array<string | null> = Array.from({ length: state.parts }, () => null);
  let k = 0;
  for (const [count, t] of state.fills) for (let j = 0; j < count && k < colors.length; j++) colors[k++] = tone[t];
  const step = (2 * Math.PI) / state.parts;
  const point = (angle: number) => `${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`;
  return (
    <div style={{ opacity: progress(clock, pie.at), display: 'grid', justifyItems: 'center', gap: 6 }}>
      <svg width={2 * r + 8} height={2 * r + 8} viewBox={`${-r - 4} ${-r - 4} ${2 * r + 8} ${2 * r + 8}`}>
        {colors.map((color, j) =>
          state.parts === 1 ? (
            <circle key={j} r={r} fill={color ?? palette.panel} />
          ) : (
            <path key={j} d={`M0,0 L${point(-Math.PI / 2 + j * step)} A${r},${r} 0 0 1 ${point(-Math.PI / 2 + (j + 1) * step)} Z`}
              fill={color ?? palette.panel} stroke={palette.bg} strokeWidth={3} />
          ),
        )}
        <circle r={r} fill="none" stroke={palette.line} strokeWidth={2} />
      </svg>
      {label ? <Tex src={label} size={clock.portrait ? 34 : 30} /> : null}
    </div>
  );
}

export function Pies({ pies, clock }: { pies: PieSpec[]; clock: Clock }) {
  return (
    <div dir="ltr" style={{ display: 'flex', flexWrap: 'wrap', gap: clock.portrait ? 18 : 28, justifyContent: 'center', alignItems: 'flex-start' }}>
      {pies.map((pie, i) => <Pie key={i} pie={pie} clock={clock} />)}
    </div>
  );
}

/** (x + a)(x + b) as a rectangle: sides x | b across, x | a down; four cells. */
export function Area({ spec, clock }: { spec: AreaSpec; clock: Clock }) {
  const X = clock.portrait ? 170 : 150, u = 40, pad = 34;
  const W = X + spec.b * u, H = X + spec.a * u;
  const c = progress(clock, spec.cellsAt, 500);
  const cell = (x: number, y: number, w: number, h: number, text: string, fill: string) => (
    <g key={text}>
      <rect x={pad + x} y={pad + y} width={w} height={h} fill={fill} fillOpacity={0.25 * c} stroke={palette.line} strokeWidth={2} />
      <text x={pad + x + w / 2} y={pad + y + h / 2 + 8} textAnchor="middle" fill={palette.ink} fontSize={24} fontFamily={mathFont} fontStyle="italic" opacity={c}>{text}</text>
    </g>
  );
  const side = (x: number, y: number, text: string) => (
    <text x={x} y={y} textAnchor="middle" fill={palette.soft} fontSize={22} fontFamily={mathFont} fontStyle="italic">{text}</text>
  );
  return (
    <svg width={W + pad + 8} height={H + pad + 8} viewBox={`0 0 ${W + pad + 8} ${H + pad + 8}`}>
      {side(pad + X / 2, 24, 'x')}
      {side(pad + X + (spec.b * u) / 2, 24, String(spec.b))}
      {side(16, pad + X / 2 + 8, 'x')}
      {side(16, pad + X + (spec.a * u) / 2 + 8, String(spec.a))}
      {cell(0, 0, X, X, 'x²', palette.c4)}
      {cell(X, 0, spec.b * u, X, `${spec.b}x`, palette.c1)}
      {cell(0, X, X, spec.a * u, `${spec.a}x`, palette.c2)}
      {cell(X, X, spec.b * u, spec.a * u, String(spec.a * spec.b), palette.c3)}
    </svg>
  );
}
