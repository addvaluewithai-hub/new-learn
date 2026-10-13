import React from 'react';
import { Eq, T, Tag, ink } from './parts';
import { Axis, Card, Dot, Pin, Ticks, ltr, scale, type SceneProps, type Tone } from './axis';

// Families of numbers nested inside ℝ, decimals that end or repeat, and the irrational √2 found
// with a unit square and a compass.

type Ring = { u: string; name: string; tone: Tone; box: [number, number, number, number]; items: { src: string; x: number; y: number }[] };

function rings(P: boolean): Ring[] {
  if (P) return [
    { u: 'U1', name: 'ℕ', tone: 'c1', box: [80, 150, 460, 240], items: [{ src: '1', x: 200, y: 200 }, { src: '2', x: 290, y: 200 }, { src: '3', x: 380, y: 200 }] },
    { u: 'U2', name: 'ℤ', tone: 'c4', box: [60, 120, 480, 340], items: [{ src: '0', x: 160, y: 300 }, { src: '-1', x: 270, y: 300 }, { src: '-7', x: 380, y: 300 }] },
    { u: 'U3', name: 'ℚ', tone: 'c2', box: [42, 92, 498, 450], items: [{ src: '\\f{1}{3}', x: 150, y: 405 }, { src: '-\\f{4}{9}', x: 270, y: 405 }, { src: '0.75', x: 390, y: 405 }] },
  ];
  return [
    { u: 'U1', name: 'ℕ', tone: 'c1', box: [100, 170, 250, 420], items: [{ src: '1', x: 175, y: 240 }, { src: '2', x: 175, y: 305 }, { src: '3', x: 175, y: 370 }] },
    { u: 'U2', name: 'ℤ', tone: 'c4', box: [76, 140, 380, 450], items: [{ src: '0', x: 315, y: 240 }, { src: '-1', x: 315, y: 305 }, { src: '-7', x: 315, y: 370 }] },
    { u: 'U3', name: 'ℚ', tone: 'c2', box: [52, 110, 520, 480], items: [{ src: '\\f{1}{3}', x: 450, y: 225 }, { src: '-\\f{4}{9}', x: 450, y: 305 }, { src: '0.75', x: 450, y: 390 }] },
  ];
}

export function Families({ on, P }: SceneProps) {
  const nest = on('U4');
  const R = P ? [24, 64, 516, 480] : [28, 80, 600, 510];
  return (
    <g>
      <g transform={P ? 'translate(0 40)' : undefined}>
      <rect x={R[0]} y={R[1]} width={R[2] - R[0]} height={R[3] - R[1]} rx={28} fill="none" stroke={ink.soft} strokeWidth={2} strokeDasharray="8 6" opacity={on('U1')} />
      <T x={R[2] - 30} y={R[1] + 26} size={28} color={ink.soft} math o={on('U1')}>ℝ</T>
      {rings(P).map((r) => {
        const o = on(r.u, 600);
        if (o <= 0) return null;
        const [x1, y1, x2, y2] = r.box;
        return (
          <g key={r.u} opacity={o}>
            <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} rx={22} fill={ink[r.tone]} fillOpacity={0.08} stroke={ink[r.tone]} strokeWidth={2.5} />
            <T x={x1 + 24} y={y1 + 24} size={26} color={ink[r.tone]} math>{r.name}</T>
            {r.items.map((it) => <Eq key={it.src} x={it.x - 55} y={it.y - 32} w={110} h={64} src={it.src} size={28} />)}
          </g>
        );
      })}
      </g>
      <Card x={P ? 40 : 640} y={P ? 550 : 150} w={P ? 460 : 290} h={110} src="\c2{\f{m}{n}}\q n \ne 0" size={P ? 38 : 38} tone="c2" o={on('U3')} />
      <T x={P ? 270 : 785} y={P ? 685 : 290} size={P ? 18 : 18} color={ink.soft} weight={500} o={on('U3')}>m و n أعداد صحيحة</T>
      <g opacity={nest}>
        <Card x={P ? 40 : 640} y={P ? 720 : 330} w={P ? 460 : 290} h={76} src="-7 = \f{-7}{1}" size={32} tone="c4" />
        <Card x={P ? 40 : 640} y={P ? 815 : 430} w={P ? 460 : 290} h={76} src="\c1{ℕ} \sub \c4{ℤ} \sub \c2{ℚ} \sub ℝ" size={P ? 38 : 34} tone="ok" />
      </g>
    </g>
  );
}

/** A decimal written digit by digit; `hl` boxes repeating blocks, `fade` greys the trailing zeros. */
function Digits({ x, y, s, size, o, hl = [], fade = 0, tone = 'c2' }: { x: number; y: number; s: string; size: number; o: number; hl?: [number, number][]; fade?: number; tone?: Tone }) {
  const cw = size * 0.56, shown = Math.ceil(o * s.length);
  return (
    <g>
      {hl.map(([a, b], k) => (k * 2 < shown ? <rect key={k} x={x + a * cw - 3} y={y - size * 0.72} width={(b - a) * cw + 6} height={size * 1.4} rx={8} fill={ink[tone]} fillOpacity={0.16} stroke={ink[tone]} strokeWidth={1.5} opacity={o} /> : null))}
      {[...s].slice(0, shown).map((ch, i) => (
        <T key={i} x={x + i * cw + cw / 2} y={y} size={size} color={i >= s.length - fade - 1 && fade ? ink.muted : ink.ink} math weight={500}>{ch}</T>
      ))}
    </g>
  );
}

export function Decimals({ on, P }: SceneProps) {
  const a = on('U1', 1200), b = on('U2', 1400), both = on('U3');
  const L = P ? 30 : 60, D = P ? 40 : 330, s = P ? 36 : 40;
  const r1 = P ? 200 : 130, r2 = P ? 450 : 270;
  return (
    <g>
      <g opacity={a > 0 ? 1 : 0}>
        <Eq x={L} y={r1 - (P ? 80 : 40)} w={P ? 200 : 250} h={70} src="3 \div 4 =" size={36} o={a} />
        <Digits x={D} y={r1 + (P ? 10 : -5)} s="0.75000000…" size={s} o={a} fade={6} />
        <Tag x={P ? 270 : 830} y={r1 + (P ? 80 : 55)} text="منتهي (terminating)" color={ink.ok} size={P ? 17 : 18} o={a} />
      </g>
      <g opacity={b > 0 ? 1 : 0}>
        <Eq x={L} y={r2 - (P ? 80 : 40)} w={P ? 220 : 250} h={70} src="23 \div 11 =" size={36} o={b} />
        <Digits x={D} y={r2 + (P ? 10 : -5)} s="2.0909090909…" size={s} o={b} hl={[[2, 4], [4, 6], [6, 8], [8, 10], [10, 12]]} />
        <Card x={P ? 150 : 330} y={r2 + (P ? 50 : 35)} w={P ? 240 : 240} h={66} src="= 2.\bar{09}" size={36} tone="c2" o={b} />
        <Tag x={P ? 270 : 780} y={r2 + (P ? 160 : 68)} text="دوري (repeating)" color={ink.c2} size={P ? 17 : 18} o={b} />
      </g>
      <g opacity={both}>
        <Card x={P ? 30 : 150} y={P ? 720 : 420} w={P ? 480 : 660} h={80} src="\c2{ℚ}\q \leftrightarrow\q \t{منتهي أو دوري}" size={P ? 30 : 34} tone="ok" />
        <T x={P ? 270 : 480} y={P ? 840 : 522} size={P ? 18 : 18} color={ink.soft} weight={500}>{`المنتهي دوري برضه: ${ltr('0.75 = 0.75000…')}`}</T>
      </g>
    </g>
  );
}

export function Irrational({ on, P }: SceneProps) {
  const sq = on('U1', 1400), digits = on('U2', 1400), more = on('U3'), full = on('U4');
  const g = P ? { x1: 50, x2: 490, y: 560 } : { x1: 100, x2: 880, y: 410 };
  const at = scale(0, 4, g.x1, g.x2);
  const u = at(1) - at(0), d = u * Math.SQRT2;
  const swing = Math.min(1, Math.max(0, sq * 1.6 - 0.6)); // the compass turns after the square is drawn
  const ang = (-Math.PI / 4) * (1 - swing);
  const tip = { x: g.x1 + d * Math.cos(ang), y: g.y + d * Math.sin(ang) };
  return (
    <g>
      <Axis x1={g.x1} x2={g.x2} y={g.y} w={3 + 2 * full} color={full > 0 ? ink.c1 : ink.soft} />
      <Ticks at={at} y={g.y} values={[0, 1, 2, 3, 4]} size={P ? 18 : 20} />
      <g opacity={sq}>
        <rect x={g.x1} y={g.y - u} width={u} height={u} fill={ink.c4} fillOpacity={0.1} stroke={ink.c4} strokeWidth={2} />
        <T x={g.x1 + u / 2} y={g.y - u - 16} size={18} color={ink.c4} math>1</T>
        <line x1={g.x1} y1={g.y} x2={g.x1 + u} y2={g.y - u} stroke={ink.c3} strokeWidth={3} strokeDasharray={swing > 0 ? '6 6' : undefined} opacity={1 - 0.5 * swing} />
        <path d={`M${g.x1 + d * Math.cos(-Math.PI / 4)} ${g.y + d * Math.sin(-Math.PI / 4)} A${d} ${d} 0 0 1 ${tip.x} ${tip.y}`} fill="none" stroke={ink.c3} strokeWidth={2} strokeDasharray="4 5" />
        <line x1={g.x1} y1={g.y} x2={tip.x} y2={tip.y} stroke={ink.c3} strokeWidth={3} opacity={swing} />
        <T x={g.x1 + u * 0.38} y={g.y - u * 0.62} size={20} color={ink.c3} math o={1 - swing}>√2</T>
      </g>
      <Dot x={at(Math.SQRT2)} y={g.y} tone="c3" o={swing * (1 - digits) + full} />
      <Dot x={at(Math.SQRT2)} y={g.y} tone="c3" hollow o={digits * (1 - full)} />
      <Pin x={at(Math.SQRT2)} y={g.y} dy={P ? 70 : 72} src="\sqrt{2} \approx 1.414" tone="c3" o={swing} size={P ? 20 : 22} w={170} />
      <Card x={P ? 40 : 520} y={P ? 90 : 70} w={P ? 460 : 400} h={64} src="1^2 = 1 < 2 < 4 = 2^2" size={P ? 28 : 30} o={sq} />
      <g opacity={digits}>
        <Digits x={P ? 70 : 520} y={P ? 215 : 175} s="1.41421356237…" size={P ? 30 : 32} o={digits} tone="c3" />
        <Tag x={P ? 270 : 720} y={P ? 280 : 235} text="لا بيخلص ولا بيتكرر" color={ink.c3} size={P ? 17 : 18} />
        <Tag x={at(Math.SQRT2)} y={g.y - (P ? 70 : 70)} text="خُرم في خط النسبي" color={ink.no} size={P ? 15 : 16} o={1 - full} />
      </g>
      <g opacity={more}>
        <Dot x={at(Math.PI)} y={g.y} tone="c3" />
        <Pin x={at(Math.PI)} y={g.y} dy={P ? -60 : -64} src="\pi \approx 3.14159…" tone="c3" size={P ? 18 : 22} w={P ? 150 : 190} />
        <Dot x={at(Math.cbrt(5))} y={g.y} tone="c3" />
        <Pin x={at(Math.cbrt(5))} y={g.y} dy={P ? -150 : -132} src="∛5 \approx 1.70998…" tone="c3" size={P ? 18 : 20} w={180} />
      </g>
      <Tag x={P ? 270 : 690} y={P ? 760 : 500} text="النسبي + غير النسبي = خط كامل من غير خُرم" color={ink.c1} size={P ? 16 : 18} o={full} />
    </g>
  );
}

export function Classify({ on, P }: SceneProps) {
  const ask = on('U1'), two = on('U2'), three = on('U3');
  const xs = P ? [0, 0, 0] : [170, 480, 790];
  const ys = P ? [200, 420, 640] : [140, 140, 140];
  const cx = (i: number) => (P ? 120 : xs[i]);
  const nums = ['2.5', '\\sqrt{9}', '\\sqrt{3}'];
  const res = [
    { o: two, src: '= \\f{5}{2}', ok: true },
    { o: two, src: '= 3 = \\f{3}{1}', ok: true },
    { o: three, src: '1 < \\sqrt{3} < 2', ok: false },
  ];
  return (
    <g>
      {nums.map((n, i) => (
        <Card key={n} x={cx(i) - 100} y={ys[i] - 50} w={200} h={100} src={n} size={46} o={ask} />
      ))}
      <Tag x={P ? 270 : 480} y={P ? 90 : 60} text="أقدر أكتبه m/n ؟" color={ink.c4} size={P ? 20 : 20} o={ask} />
      {res.map((r, i) => {
        const rx = P ? 250 : cx(i) - 140, ry = P ? ys[i] - 70 : 230;
        return (
          <g key={i} opacity={r.o}>
            <Eq x={rx} y={ry} w={P ? 270 : 280} h={80} src={r.src} size={P ? 30 : 34} />
            <Tag x={rx + (P ? 135 : 140)} y={ry + (P ? 120 : 125)} text={r.ok ? 'نسبي ✓' : 'غير نسبي ✗'} color={r.ok ? ink.ok : ink.no} size={20} />
          </g>
        );
      })}
      <g opacity={three}>
        <Card x={P ? 30 : 110} y={P ? 800 : 430} w={P ? 480 : 740} h={70} src="\sqrt{4} = 2\q \sqrt{9} = 3\q \sqrt{16} = 4" size={P ? 26 : 30} tone="ok" />
        <T x={P ? 270 : 480} y={P ? 900 : 525} size={P ? 17 : 17} color={ink.soft} weight={500}>الجذر نسبي بس لو اللي جوّاه مربع كامل</T>
      </g>
    </g>
  );
}
