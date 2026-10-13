import React from 'react';
import { Arrow, Eq, Rod, T, Tag, Wall, ink } from './parts';

// Bulk drawings: an elastic cube inside a liquid, pressed from every side, shrinking in volume.
export type On = (unit: string, ms?: number) => number;
export type SceneProps = { on: On; P: boolean };

/** Cube centred on (cx, cy) with side a; `ghost` draws the original size dashed around it. */
export function Cube({ cx, cy, a, o = 1, ghost = 0, ghostA = a, tone = ink.c3, sx = 1 }: {
  cx: number; cy: number; a: number; o?: number; ghost?: number; ghostA?: number; tone?: string; sx?: number;
}) {
  if (o <= 0) return null;
  const w = a * sx, d = a * 0.4, ox = d * 0.7, oy = -d * 0.45, x = cx - w / 2 - ox / 2, y = cy - a / 2 - oy / 2;
  const g = ghostA, gx = cx - g / 2 - (g * 0.28) / 2, gy = cy - g / 2 + (g * 0.18) / 2;
  return (
    <g opacity={o}>
      {ghost > 0 ? <rect x={gx} y={gy} width={g} height={g} fill="none" stroke={ink.soft} strokeDasharray="6 6" opacity={ghost} /> : null}
      <path d={`M${x + w} ${y} l${ox} ${oy} v${a} l${-ox} ${-oy} Z`} fill={tone} fillOpacity={0.2} stroke={tone} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M${x} ${y} l${ox} ${oy} h${w} l${-ox} ${-oy} Z`} fill={tone} fillOpacity={0.45} stroke={tone} strokeWidth={2} strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height={a} fill={tone} fillOpacity={0.32} stroke={tone} strokeWidth={2.5} />
    </g>
  );
}

/** Pressure arrows pointing inward at a box of half-size r around (cx, cy). */
export function Squeeze({ cx, cy, r, len = 46, o = 1, color = ink.c2 }: { cx: number; cy: number; r: number; len?: number; o?: number; color?: string }) {
  if (o <= 0) return null;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
  return (
    <g opacity={o}>
      {dirs.map(([dx, dy], i) => {
        const far = r + len + (i > 3 ? 14 : 0), near = r + 6 + (i > 3 ? 14 : 0);
        return <Arrow key={i} x1={cx + dx * far} y1={cy + dy * far} x2={cx + dx * near} y2={cy + dy * near} color={color} w={4} head={12} />;
      })}
    </g>
  );
}

export function Tank({ cx, cy, w, h, o = 1 }: { cx: number; cy: number; w: number; h: number; o?: number }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={18} fill="url(#water)" stroke={ink.c4} strokeOpacity={0.5} />
      {[0.2, 0.5, 0.8].map((k) => <circle key={k} cx={cx - w / 2 + w * k} cy={cy + h / 2 - 22 - k * 30} r={4} fill={ink.c4} opacity={0.5} />)}
    </g>
  );
}

export function Intro({ on, P }: SceneProps) {
  const old = on('U1'), press = on('U2'), shrink = on('U3');
  const t = P ? { cx: 270, cy: 560, w: 400, h: 340 } : { cx: 480, cy: 330, w: 330, h: 270 };
  const a = (P ? 150 : 120) * (1 - 0.18 * shrink);
  return (
    <g>
      <g opacity={old * (1 - 0.55 * press)}>
        <Wall x={P ? 50 : 70} y={(P ? 160 : 100) - 22} h={44} />
        <Rod x={P ? 50 : 70} y={P ? 160 : 100} len={P ? 150 : 170} h={18} />
        <Arrow x1={P ? 210 : 250} y1={P ? 160 : 100} x2={P ? 250 : 300} y2={P ? 160 : 100} color={ink.c2} w={4} head={12} />
        <T x={P ? 130 : 160} y={P ? 200 : 140} size={17} color={ink.soft} weight={500}>الطول بيزيد</T>
        <path d={`M${P ? 330 : 700} ${P ? 185 : 125} h90 l22 -60 h-90 Z`} fill={ink.c4} fillOpacity={0.3} stroke={ink.c4} strokeWidth={2} />
        <T x={P ? 395 : 765} y={P ? 210 : 150} size={17} color={ink.soft} weight={500}>الشكل بيميل</T>
      </g>
      <Tank cx={t.cx} cy={t.cy} w={t.w} h={t.h} o={press} />
      <Cube cx={t.cx} cy={t.cy} a={a} o={press} ghost={shrink} ghostA={P ? 150 : 120} />
      <Squeeze cx={t.cx} cy={t.cy} r={(P ? 150 : 120) * 0.62} o={press} />
      <Tag x={t.cx} y={t.cy + t.h / 2 + 34} text="الضغط حواليه زاد من كل الاتجاهات" color={ink.c2} size={P ? 17 : 18} o={press * (1 - shrink)} />
      <Tag x={t.cx} y={t.cy + t.h / 2 + 34} text="الحجم كله بيقل: Volumetric compression" color={ink.c3} size={P ? 17 : 18} o={shrink} />
    </g>
  );
}

export function Pressure({ on, P }: SceneProps) {
  const def = on('U1'), dp = on('U2'), dv = on('U3'), strain = on('U4');
  const c = P ? { cx: 270, cy: 290 } : { cx: 240, cy: 290 };
  const a = 150 * (1 - 0.16 * dv);
  const rows = [
    { o: def, src: '\\c2{P} = \\f{F}{A}\\q \\t{(Pa)}' },
    { o: dp, src: '\\c2{ΔP} = P − P₀ > 0' },
    { o: dv, src: '\\c3{ΔV} = V − V₀ < 0' },
    { o: strain, src: '\\t{Volumetric strain} = \\f{\\c3{ΔV}}{V₀}' },
  ];
  return (
    <g>
      <Cube cx={c.cx} cy={c.cy} a={a} ghost={dv} ghostA={150} />
      <Squeeze cx={c.cx} cy={c.cy} r={95} o={def} len={32 + 26 * dp} />
      <T x={c.cx} y={c.cy + 175} size={18} color={ink.soft} weight={500} o={def * (1 - dv)}>كل سهم عمودي على السطح</T>
      <T x={c.cx} y={c.cy + 175} size={20} color={ink.c3} o={dv} math>V₀ → V</T>
      {rows.map((r, i) => (
        <Eq key={i} x={P ? 20 : 470} y={(P ? 500 : 80) + i * (P ? 100 : 100)} w={P ? 500 : 460} h={i === 3 ? 100 : 80} src={r.src} size={i === 3 ? 32 : 36} o={r.o} />
      ))}
      <Tag x={P ? 270 : 700} y={P ? 905 : 500} text="ملوش وحدة: حجم على حجم" color={ink.ok} size={17} o={strain} />
    </g>
  );
}

export function Bulk({ on, P }: SceneProps) {
  const law = on('U1'), sign = on('U2'), alt = on('U3'), ex = on('U4');
  const top = 1 - ex;
  return (
    <g>
      <Eq x={P ? 20 : 120} y={P ? 110 : 80} w={P ? 500 : 720} h={120} src="\c1{B} = −\f{\c2{ΔP}}{\c3{ΔV}/V₀}" size={P ? 46 : 52} o={law} />
      <g opacity={sign * top}>
        <Tag x={P ? 120 : 330} y={P ? 280 : 245} text="ΔP > 0" color={ink.c2} size={22} math />
        <Tag x={P ? 270 : 480} y={P ? 280 : 245} text="ΔV < 0" color={ink.c3} size={22} math />
        <Tag x={P ? 420 : 630} y={P ? 280 : 245} text="B > 0" color={ink.ok} size={22} math />
        <T x={P ? 270 : 480} y={P ? 330 : 290} size={18} color={ink.soft} weight={500}>السالب في القانون بيخلّي B موجب</T>
      </g>
      <g opacity={alt * top}>
        <Eq x={P ? 20 : 120} y={P ? 370 : 315} w={P ? 500 : 720} h={110} src="\c1{B} = \f{\c2{ΔP}}{|ΔV|/V₀}" size={P ? 40 : 42} />
        <Tag x={P ? 270 : 480} y={P ? 510 : 455} text="|ΔV| = مقدار النقص (موجب) · نفس الفيزيا" color={ink.c4} size={P ? 16 : 18} />
      </g>
      {ex > 0 ? (
        <g opacity={ex}>
          <Cube cx={P ? 150 : 330} cy={P ? 420 : 330} a={130} />
          <Cube cx={P ? 390 : 630} cy={P ? 420 : 330} a={124} ghost={1} ghostA={130} />
          <T x={P ? 150 : 330} y={P ? 530 : 430} size={22} color={ink.soft} math>100 cm³</T>
          <T x={P ? 390 : 630} y={P ? 530 : 430} size={22} color={ink.soft} math>99 cm³</T>
          <Arrow x1={P ? 235 : 415} y1={P ? 420 : 330} x2={P ? 305 : 545} y2={P ? 420 : 330} color={ink.c2} w={4} head={14} />
          <Tag x={P ? 270 : 330} y={P ? 620 : 490} text="ΔV = −1 cm³" color={ink.c3} size={22} math />
          <Tag x={P ? 270 : 630} y={P ? 690 : 490} text="|ΔV| = 1 cm³" color={ink.c4} size={22} math />
        </g>
      ) : null}
    </g>
  );
}
