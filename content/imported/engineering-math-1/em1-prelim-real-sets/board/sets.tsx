import React from 'react';
import { Ball, T, Tag, ink } from './parts';
import { Axis, Card, Dot, Ticks, ltr, scale, type SceneProps, type Tone } from './axis';

// Sets: a bag of elements, membership, listing vs rule form tied to the real line, then union,
// intersection and the empty set on a two-circle (Venn) diagram.

/** Element chip: a glowing ball with its number. */
export function Elem({ x, y, v, tone = 'c1', o = 1, r = 22 }: { x: number; y: number; v: string; tone?: Tone; o?: number; r?: number }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <Ball x={x} y={y} r={r} tone={tone} />
      <T x={x} y={y + 1} size={r * 0.95} color={ink.bg} math weight={600}>{v}</T>
    </g>
  );
}

/** Two overlapping circles; `union` tints both, `inter` tints only the shared lens. */
export function Venn({ id, a, b, r, union = 0, inter = 0, o = 1, names = ['A', 'B'] }: {
  id: string; a: [number, number]; b: [number, number]; r: number; union?: number; inter?: number; o?: number; names?: [string, string];
}) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <defs>
        <clipPath id={`${id}-a`}><circle cx={a[0]} cy={a[1]} r={r} /></clipPath>
      </defs>
      <circle cx={a[0]} cy={a[1]} r={r} fill={ink.c1} fillOpacity={0.05 + 0.22 * union} />
      <circle cx={b[0]} cy={b[1]} r={r} fill={ink.c4} fillOpacity={0.05 + 0.22 * union} />
      <circle cx={b[0]} cy={b[1]} r={r} clipPath={`url(#${id}-a)`} fill={ink.c2} fillOpacity={0.45 * inter} />
      <circle cx={a[0]} cy={a[1]} r={r} fill="none" stroke={ink.c1} strokeWidth={3} />
      <circle cx={b[0]} cy={b[1]} r={r} fill="none" stroke={ink.c4} strokeWidth={3} />
      <T x={a[0] - r * 0.75} y={a[1] - r * 0.95} size={30} color={ink.c1} math>{names[0]}</T>
      <T x={b[0] + r * 0.75} y={b[1] - r * 0.95} size={30} color={ink.c4} math>{names[1]}</T>
    </g>
  );
}

export function Sets({ on, P }: SceneProps) {
  const bag = on('U1'), list = on('U2', 900), mem = on('U3'), rule = on('U4'), ray = on('U5');
  const B = P ? { x: 40, y: 80, w: 390, h: 230 } : { x: 50, y: 74, w: 380, h: 250 };
  const spots = P
    ? [[100, 200], [170, 150], [240, 220], [310, 150], [370, 215]]
    : [[130, 170], [240, 140], [340, 190], [150, 260], [270, 260]];
  const g = P ? { x1: 40, x2: 500, y: 690 } : { x1: 80, x2: 880, y: 430 };
  const at = scale(-1.4, 8.4, g.x1, g.x2);
  const settle = (k: number) => Math.min(1, Math.max(0, list * 5 - k));
  return (
    <g>
      <g opacity={bag * (1 - 0.5 * ray)}>
        <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={60} fill={ink.panel} stroke={ink.c1} strokeWidth={2.5} />
        <T x={B.x + 34} y={B.y + 32} size={30} color={ink.c1} math o={list}>A</T>
        <Elem x={B.x + B.w / 2} y={B.y + B.h / 2} v="•" tone="c4" o={1 - list} />
        <Tag x={B.x + B.w / 2} y={B.y + B.h + (P ? 0 : 0) - 26} text="عنصر (element)" color={ink.c4} size={16} o={1 - list} />
        {spots.map(([x, y], k) => (
          <Elem key={k} x={x} y={lerp(B.y - 40, y, settle(k))} v={String(k + 1)} tone={mem > 0 && k === 2 ? 'ok' : 'c1'} o={settle(k)} r={26} />
        ))}
      </g>
      <Card x={P ? 40 : 460} y={P ? 330 : 70} w={P ? 460 : 470} h={70} src="A = \{1, 2, 3, 4, 5\}" size={P ? 32 : 34} o={list} />
      <g opacity={mem * (1 - 0.5 * ray)}>
        <Elem x={P ? 482 : 400} y={P ? 200 : 362} v="7" tone="no" r={26} />
        <Card x={P ? 40 : 520} y={P ? 420 : 160} w={P ? 220 : 190} h={64} src="3 \in A" size={32} tone="ok" />
        <Card x={P ? 280 : 730} y={P ? 420 : 160} w={P ? 220 : 190} h={64} src="7 \notin A" size={32} tone="no" />
      </g>
      <Card x={P ? 20 : 460} y={P ? 500 : 245} w={P ? 500 : 480} h={70} src="A = \{x \mid x \in \Z,\ 0 < x < 6\}" size={P ? 27 : 29} tone="c1" o={rule * (1 - ray)} />
      <T x={P ? 270 : 700} y={P ? 592 : 335} size={P ? 17 : 17} color={ink.soft} weight={500} o={rule * (1 - ray)}>{`${ltr('|')} تتقري «بحيث»`}</T>
      <g opacity={list}>
        <Axis x1={g.x1} x2={g.x2} y={g.y} />
        <Ticks at={at} y={g.y} values={[-1, 0, 1, 2, 3, 4, 5, 6, 7, 8]} size={P ? 15 : 18} />
        {[1, 2, 3, 4, 5].map((v, k) => <Dot key={v} x={at(v)} y={g.y} tone={mem > 0 && v === 3 ? 'ok' : 'c1'} o={settle(k) * (1 - 0.7 * ray)} r={8} />)}
        <Dot x={at(0)} y={g.y} tone="c2" hollow o={rule * (1 - ray)} r={8} />
        <Dot x={at(6)} y={g.y} tone="c2" hollow o={rule * (1 - ray)} r={8} />
      </g>
      <g opacity={ray}>
        <line x1={at(0) + 9} y1={g.y} x2={g.x2} y2={g.y} stroke={ink.c2} strokeWidth={8} strokeLinecap="round" />
        <polygon points={`${g.x2 + 18},${g.y} ${g.x2},${g.y - 11} ${g.x2},${g.y + 11}`} fill={ink.c2} />
        <Dot x={at(0)} y={g.y} tone="c2" hollow r={9} />
        <Card x={P ? 40 : 240} y={P ? 770 : 470} w={P ? 460 : 480} h={64} src="\{x \mid x \in ℝ,\ x > 0\}" size={P ? 30 : 30} tone="c2" />
        <Tag x={P ? 270 : 700} y={P ? 610 : 340} text="مالهاش آخر ← قاعدة مش قائمة" color={ink.c2} size={P ? 17 : 18} />
      </g>
    </g>
  );
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function Ops({ on, P }: SceneProps) {
  const place = on('U1', 700), uni = on('U2'), int = on('U3'), empty = on('U4');
  const a: [number, number] = P ? [195, 300] : [235, 230], b: [number, number] = P ? [345, 300] : [395, 230], r = P ? 112 : 125;
  const els = [
    { v: '1', x: a[0] - r * 0.5, y: a[1], both: false },
    { v: '3', x: (a[0] + b[0]) / 2, y: a[1] - 38, both: true },
    { v: '5', x: (a[0] + b[0]) / 2, y: a[1] + 38, both: true },
    { v: '4', x: b[0] + r * 0.5, y: b[1], both: false },
  ];
  const fade = 1 - 0.75 * empty;
  return (
    <g>
      <g opacity={fade}>
        <Venn id="ops" a={a} b={b} r={r} union={uni * (1 - int)} inter={int} />
        {els.map((e, k) => <Elem key={e.v} x={e.x} y={e.y} v={e.v} tone={e.both ? 'c2' : k === 0 ? 'c1' : 'c4'} o={Math.min(1, Math.max(0, place * 4 - k))} r={20} />)}
        <Card x={P ? 20 : 30} y={P ? 100 : 380} w={P ? 500 : 410} h={60} src="A = \{1, 3, 5\}\q B = \{3, 4, 5\}" size={P ? 26 : 26} o={place} />
      </g>
      <Card x={P ? 30 : 540} y={P ? 440 : 90} w={P ? 480 : 390} h={70} src="A \cup B = \{1, 3, 4, 5\}" size={P ? 32 : 32} tone="c1" o={uni} />
      <Card x={P ? 30 : 540} y={P ? 530 : 180} w={P ? 480 : 390} h={70} src="A \cap B = \{\c2{3}, \c2{5}\}" size={P ? 32 : 32} tone="c2" o={int} />
      <g opacity={int}>
        <Tag x={P ? 150 : 640} y={P ? 640 : 290} text="∪ ← «أو»" color={ink.c1} size={20} />
        <Tag x={P ? 390 : 830} y={P ? 640 : 290} text="∩ ← «و»" color={ink.c2} size={20} />
      </g>
      <g opacity={empty}>
        <circle cx={P ? 140 : 610} cy={P ? 770 : 420} r={P ? 62 : 56} fill={ink.c2} fillOpacity={0.12} stroke={ink.c2} strokeWidth={2.5} />
        <circle cx={P ? 400 : 860} cy={P ? 770 : 420} r={P ? 62 : 56} fill={ink.c3} fillOpacity={0.12} stroke={ink.c3} strokeWidth={2.5} />
        <T x={P ? 140 : 610} y={P ? 770 : 420} size={30} color={ink.c2} math>ℚ</T>
        <T x={P ? 400 : 860} y={P ? 770 : 420} size={P ? 18 : 17} color={ink.c3}>غير نسبي</T>
        <Card x={P ? 205 : 672} y={P ? 742 : 392} w={P ? 130 : 126} h={56} src="\cap = \empty" size={P ? 26 : 24} tone="no" />
        <Card x={P ? 70 : 30} y={P ? 870 : 470} w={P ? 400 : 410} h={60} src="\empty \ne \{0\}" size={30} tone="no" />
      </g>
    </g>
  );
}
