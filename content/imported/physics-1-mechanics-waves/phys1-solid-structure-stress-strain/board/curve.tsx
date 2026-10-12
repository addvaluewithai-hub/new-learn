import React from 'react';
import { Arrow, T, Tag, ink } from './parts';
import type { SceneProps } from './matter';

// The schematic stress–strain curve, drawn segment by segment as the text reaches each region.

type Pt = [number, number];

function Drawn({ d, p, color, w = 5 }: { d: string; p: number; color: string; w?: number }) {
  if (p <= 0) return null;
  return <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
}

export function Curve({ on, P }: SceneProps) {
  const axes = on('U1'), lin = on('U2', 700), plas = on('U3', 900), brk = on('U4', 700), cmp = on('U5');
  const ox = P ? 80 : 150, oy = P ? 800 : 455, w = P ? 410 : 600, h = P ? 500 : 320;
  const X = (u: number) => ox + u * w, Y = (v: number) => oy - v * h;
  const pt = ([u, v]: Pt) => `${X(u)} ${Y(v)}`;
  const lim: Pt = [0.29, 0.6], top: Pt = [0.75, 0.9], end: Pt = [0.95, 0.78];
  const segLinear = `M${pt([0, 0])} L${pt([0.25, 0.55])}`;
  const segPlastic = `M${pt([0.25, 0.55])} L${pt(lim)} Q${pt([0.33, 0.64])} ${pt([0.4, 0.64])} C${pt([0.55, 0.65])} ${pt([0.64, 0.9])} ${pt(top)}`;
  const segBreak = `M${pt(top)} Q${pt([0.86, 0.9])} ${pt(end)}`;
  return (
    <g>
      {plas > 0 ? (
        <g opacity={plas * 0.9}>
          <rect x={ox} y={Y(1)} width={X(lim[0]) - ox} height={h} fill={ink.ok} opacity={0.08} />
          <rect x={X(lim[0])} y={Y(1)} width={X(end[0]) - X(lim[0])} height={h} fill={ink.c2} opacity={0.07} />
          <T x={(ox + X(lim[0])) / 2} y={Y(1) + 24} size={P ? 17 : 18} color={ink.ok}>Elastic</T>
          <T x={(X(lim[0]) + X(end[0])) / 2} y={Y(1) + 24} size={P ? 17 : 18} color={ink.c2}>Plastic — دائم</T>
        </g>
      ) : null}
      <g opacity={axes}>
        <Arrow x1={ox} y1={oy} x2={X(1.05)} y2={oy} color={ink.soft} w={3} head={14} />
        <Arrow x1={ox} y1={oy} x2={ox} y2={Y(1.08)} color={ink.soft} w={3} head={14} />
        <T x={X(1.0)} y={oy + 34} size={P ? 20 : 21} color={ink.soft} anchor="end" math>ε (Strain)</T>
        <T x={ox + 12} y={Y(1.08) + 4} size={P ? 20 : 21} color={ink.soft} anchor="start" math>σ (Stress)</T>
        <T x={ox - 18} y={oy + 20} size={18} color={ink.muted} math>0</T>
      </g>
      <Tag x={P ? 290 : 520} y={P ? 500 : 280} text="نزوّد الحمل شوية بشوية ونسجّل σ وε كل مرة" color={ink.soft} size={P ? 16 : 18} o={axes * (1 - lin)} />
      <Drawn d={segLinear} p={lin} color={ink.c1} w={6} />
      {lin > 0.6 ? (
        <g opacity={(lin - 0.6) / 0.4}>
          <path d={`M${pt([0.12, 0.264])} H${X(0.22)} V${Y(0.484)}`} fill="none" stroke={ink.c1} strokeWidth={2} strokeDasharray="5 4" />
          <T x={X(0.12) - 8} y={Y(0.36)} size={P ? 18 : 19} color={ink.c1} anchor="end" math>Linear</T>
        </g>
      ) : null}
      <Drawn d={segPlastic} p={plas} color={ink.c2} w={5} />
      {plas > 0 ? (
        <g opacity={plas}>
          <circle cx={X(lim[0])} cy={Y(lim[1])} r={8} fill={ink.ok} stroke={ink.bg} strokeWidth={3} />
          <Tag x={X(lim[0]) + (P ? 110 : 130)} y={Y(lim[1]) + 46} text="Elastic limit — حد المرونة" color={ink.ok} size={P ? 15 : 17} />
        </g>
      ) : null}
      <Drawn d={segBreak} p={brk} color={ink.no} w={5} />
      {brk > 0.7 ? (
        <g opacity={(brk - 0.7) / 0.3}>
          <path d={`M${X(end[0]) - 11} ${Y(end[1]) - 11} l22 22 M${X(end[0]) + 11} ${Y(end[1]) - 11} l-22 22`} stroke={ink.no} strokeWidth={5} strokeLinecap="round" />
          <Tag x={X(end[0]) - (P ? 60 : 30)} y={Y(end[1]) + 46} text="Breaking point — كسر" color={ink.no} size={P ? 15 : 17} />
        </g>
      ) : null}
      {cmp > 0 ? (
        <g opacity={cmp}>
          <Drawn d={`M${pt([0, 0])} L${pt([0.14, 0.62])}`} p={cmp} color={ink.c3} w={4} />
          {P ? <Tag x={270} y={880} text="أجسأ (Stiffer): σ كبير لـε صغير" color={ink.c3} size={17} />
            : <T x={X(0.14) + 10} y={Y(0.62) - 18} size={18} color={ink.c3} anchor="start">أجسأ (Stiffer): σ كبير لـε صغير</T>}
          <Tag x={P ? 270 : 640} y={P ? 170 : 98} text="Elastic ≠ Linear · أجسأ ≠ أقوى في الكسر" color={ink.c3} size={P ? 16 : 18} />
        </g>
      ) : null}
    </g>
  );
}
