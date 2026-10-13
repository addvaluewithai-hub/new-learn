import React from 'react';
import { Arrow, Eq, Rod, T, Tag, Wall, ink } from './parts';
import { Cube, Squeeze, Tank, type SceneProps } from './cube';

// Question boards show the situation and its data; feedback boards solve it on cue.

export function Q1({ on, P, feedback }: SceneProps & { feedback: boolean }) {
  const c = P ? { cx: 270, cy: 250 } : { cx: 200, cy: 270 };
  const rows = [
    { u: 'U1', src: '\\f{ΔP}{B} = \\f{1.5\\times 10^{6}}{3\\times 10^{9}} = 5\\times 10^{-4}' },
    { u: 'U2', src: '\\c3{ΔV} = −\\f{ΔP}{B}\\ V₀ = −(5\\times 10^{-4})(0.006) = \\ok{−3\\times 10^{-6}\\ \\t{m}^3}' },
    { u: 'U3', src: '|ΔV| = 3\\times 10^{-6}\\ \\t{m}^3 = \\ok{3\\ \\t{cm}^3}' },
  ];
  return (
    <g>
      <Tank cx={c.cx} cy={c.cy} w={260} h={230} />
      <Cube cx={c.cx} cy={c.cy} a={100} />
      <Squeeze cx={c.cx} cy={c.cy} r={66} len={30} />
      <T x={c.cx} y={c.cy + 145} size={18} color={ink.c3} math>V₀ = 0.006 m³</T>
      <T x={c.cx} y={c.cy + 175} size={18} color={ink.c2} math>ΔP = 1.5 × 10⁶ Pa</T>
      <T x={c.cx} y={c.cy + 205} size={18} color={ink.c1} math>B = 3 × 10⁹ Pa</T>
      {feedback ? rows.map((r, i) => (
        <Eq key={r.u} x={P ? 10 : 390} y={(P ? 490 : 95) + i * (P ? 115 : 110)} w={P ? 520 : 560} h={100} src={r.src} size={P ? 24 : 27} o={on(r.u)} />
      )) : (
        <g>
          <Tag x={P ? 150 : 660} y={P ? 560 : 200} text="ΔV = ?" color={ink.c3} size={26} math />
          <Tag x={P ? 390 : 660} y={P ? 560 : 300} text="|ΔV| (cm³) = ?" color={ink.c4} size={24} math />
        </g>
      )}
      <Tag x={P ? 270 : 670} y={P ? 860 : 450} text="+3 cm³ هو مقدار النقص، مش ΔV الموقّع" color={ink.c2} size={P ? 16 : 18} o={feedback ? on('U4') : 0} />
    </g>
  );
}

function Shear({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x - 10} y1={y} x2={x + 130} y2={y} stroke={ink.soft} strokeWidth={3} />
      <path d={`M${x} ${y} h90 l26 -80 h-90 Z`} fill={ink.c4} fillOpacity={0.3} stroke={ink.c4} strokeWidth={2} />
      <Arrow x1={x - 30} y1={y - 90} x2={x + 20} y2={y - 90} color={ink.c2} w={4} head={12} />
    </g>
  );
}

export function Q2({ on, P, feedback }: SceneProps & { feedback: boolean }) {
  const cards = [
    { u: 'U1', ans: "Young · ΔL/L₀", name: 'شد محوري' },
    { u: 'U2', ans: 'Shear (S) · Δx/h', name: 'قص جانبي' },
    { u: 'U3', ans: 'Bulk (B) · ΔV/V₀', name: 'ضغط من كل ناحية' },
  ];
  return (
    <g>
      {cards.map((k, i) => {
        const cx = P ? 270 : 170 + i * 310, cy = P ? 200 + i * 250 : 270;
        const o = feedback ? on(k.u) : 0;
        return (
          <g key={k.u}>
            <rect x={cx - 140} y={cy - 120} width={280} height={P ? 220 : 300} rx={20} fill={ink.panel} stroke={o > 0 ? ink.ok : ink.line} />
            <T x={cx} y={cy - 92} size={20} color={ink.soft}>{k.name}</T>
            {i === 0 ? (
              <g>
                <Wall x={cx - 110} y={cy - 22} h={44} />
                <Rod x={cx - 110} y={cy} len={170} h={20} />
                <Arrow x1={cx + 66} y1={cy} x2={cx + 120} y2={cy} color={ink.c2} w={4} head={12} />
              </g>
            ) : i === 1 ? <Shear x={cx - 60} y={cy + 40} /> : (
              <g>
                <Cube cx={cx} cy={cy} a={70} />
                <Squeeze cx={cx} cy={cy} r={48} len={24} />
              </g>
            )}
            <Tag x={cx} y={cy + (P ? 82 : 140)} text={o > 0 ? `${k.ans} ✓` : '? · ?'} color={o > 0 ? ink.ok : ink.c2} size={P ? 18 : 18} math={o > 0} />
          </g>
        );
      })}
    </g>
  );
}

export function Recap({ on, P }: SceneProps) {
  const cards = [
    { u: 'U1', t: 'الانضغاط الحجمي', s: '', src: '\\c1{B} = −\\f{ΔP}{ΔV/V₀}' },
    { u: 'U2', t: 'الإشارة', s: 'ΔV سالبة · B موجب · مقدار النقص موجب', src: '' },
    { u: 'U3', t: 'تلات معاملات', s: '', src: '\\t{Y}: \\f{ΔL}{L₀}\\q \\t{S}: \\f{Δx}{h}\\q \\t{B}: \\f{ΔV}{V₀}' },
    { u: 'U4', t: 'قبل أي مسألة اسأل', s: 'القوة نوعها إيه؟ التشوّه إيه؟ والفرض إيه؟', src: '' },
  ];
  return (
    <g>
      {cards.map((c, i) => {
        const o = on(c.u);
        const x = P ? 50 : 70 + (i % 2) * 420, y = P ? 140 + i * 190 : 80 + Math.floor(i / 2) * 215;
        const w = P ? 440 : 400, h = P ? 165 : 190;
        if (o <= 0) return null;
        return (
          <g key={i} opacity={o} transform={`translate(0 ${(1 - o) * 12})`}>
            <rect x={x} y={y} width={w} height={h} rx={22} fill={ink.panel} stroke={i === 3 ? ink.c2 : ink.line} strokeWidth={i === 3 ? 2 : 1} />
            <T x={x + w / 2} y={y + 38} size={P ? 23 : 24} color={i === 3 ? ink.c2 : ink.c1}>{c.t}</T>
            {c.src ? <Eq x={x} y={y + 58} w={w} h={110} src={c.src} size={P ? 28 : 30} /> : null}
            {c.s ? <T x={x + w / 2} y={y + 105} size={P ? 17 : 18} color={ink.soft} weight={500}>{c.s}</T> : null}
          </g>
        );
      })}
    </g>
  );
}
