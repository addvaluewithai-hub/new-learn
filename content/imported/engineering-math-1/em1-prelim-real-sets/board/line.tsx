import React from 'react';
import { T, Tag, ink } from './parts';
import { Axis, Card, Dot, Hop, Pin, Ticks, ltr, scale, type SceneProps } from './axis';

// The real line built step by step, order on it, and how +, ×(positive), ×(negative) and 1/x act on 2 < 5.

export function Line({ on, P }: SceneProps) {
  const zero = on('U1', 700), ints = on('U2', 900), parts = on('U3'), all = on('U4');
  const g = P ? { x1: 40, x2: 500, y: 470 } : { x1: 90, x2: 870, y: 300 };
  const at = scale(-3.6, 3.6, g.x1, g.x2);
  const steps = [1, 2, 3];
  return (
    <g>
      <Axis x1={g.x1} x2={g.x2} y={g.y} draw={zero} w={all > 0 ? 3 + 2 * all : 3} color={all > 0 ? ink.c1 : ink.soft} />
      <Ticks at={at} y={g.y} values={[0]} o={zero} size={P ? 22 : 22} color={ink.ink} />
      <Ticks at={at} y={g.y} values={[1]} labels={false} o={zero * (1 - ints)} color={ink.c4} />
      <g opacity={zero * (1 - ints)} stroke={ink.c4} strokeWidth={2}>
        <path d={`M${at(0)} ${g.y - 30} v-12 H${at(1)} v12`} fill="none" />
        <g stroke="none"><T x={(at(0) + at(1)) / 2} y={g.y - (P ? 66 : 68)} size={P ? 17 : 18} color={ink.c4}>خطوة واحدة</T></g>
      </g>
      <Ticks at={at} y={g.y} values={[-3, -2, -1, 1, 2, 3]} o={ints} size={P ? 21 : 20} />
      {steps.map((k, i) => (
        <g key={k} opacity={1 - 0.65 * parts}>
          <Hop x1={at(k - 1)} x2={at(k)} y={g.y} up tone="c4" label="+1" o={Math.min(1, Math.max(0, ints * 3 - i))} />
          <Hop x1={at(1 - k)} x2={at(-k)} y={g.y} up={false} tone="c2" label="−1" o={Math.min(1, Math.max(0, ints * 3 - i))} />
        </g>
      ))}
      <Dot x={at(0.5)} y={g.y} tone="c1" o={parts} />
      <Pin x={at(0.5)} y={g.y} dy={P ? -120 : -112} src="\f{1}{2}" tone="c1" o={parts} size={P ? 26 : 24} w={80} />
      <Dot x={at(-0.75)} y={g.y} tone="c2" o={parts} />
      <Pin x={at(-0.75)} y={g.y} dy={P ? -120 : -112} src="-\f{3}{4}" tone="c2" o={parts} size={P ? 26 : 24} w={100} />
      <Dot x={at(Math.SQRT2)} y={g.y} tone="c3" o={parts} />
      <Pin x={at(Math.SQRT2)} y={g.y} dy={P ? -200 : -112} src="\sqrt{2} \approx 1.414" tone="c3" o={parts} size={P ? 24 : 22} w={P ? 190 : 190} />
      {all > 0 ? (
        <g opacity={all}>
          {Array.from({ length: 57 }, (_, i) => -3.5 + i * 0.125).filter((v) => ![0, 0.5, -0.75].includes(v)).map((v) => (
            <circle key={v} cx={at(v)} cy={g.y} r={2.6} fill={ink.c1} opacity={0.75} />
          ))}
          <T x={g.x2 + (P ? -6 : 4)} y={g.y - (P ? 40 : 44)} size={P ? 40 : 46} color={ink.c1} math weight={600}>ℝ</T>
          <Tag x={(g.x1 + g.x2) / 2} y={g.y + (P ? 150 : 150)} text="كل نقطة ↔ عدد واحد" color={ink.c1} size={P ? 19 : 21} />
        </g>
      ) : null}
    </g>
  );
}

export function Order({ on, P }: SceneProps) {
  const rule = on('U1'), neg = on('U2'), le = on('U3');
  const g = P ? { x1: 40, x2: 500, y: 330 } : { x1: 90, x2: 870, y: 220 };
  const at = scale(-6.4, 2.4, g.x1, g.x2);
  return (
    <g>
      <Axis x1={g.x1} x2={g.x2} y={g.y} />
      <Ticks at={at} y={g.y} values={[-6, -5, -4, -3, -2, -1, 0, 1, 2]} size={P ? 16 : 19} />
      <g opacity={rule}>
        <defs>
          <linearGradient id="bigger" x1="0" x2="1">
            <stop offset="0" stopColor={ink.c4} stopOpacity="0.1" />
            <stop offset="1" stopColor={ink.c4} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect x={g.x1} y={g.y - (P ? 120 : 110)} width={g.x2 - g.x1} height={10} rx={5} fill="url(#bigger)" />
        <polygon points={`${g.x2 + 16},${g.y - (P ? 115 : 105)} ${g.x2},${g.y - (P ? 125 : 115)} ${g.x2},${g.y - (P ? 105 : 95)}`} fill={ink.c4} />
        <T x={g.x2 - 60} y={g.y - (P ? 145 : 135)} size={P ? 18 : 20} color={ink.c4}>أكبر →</T>
        <g opacity={1 - neg}>
          <Dot x={at(-0.6)} y={g.y} tone="c4" />
          <Pin x={at(-0.6)} y={g.y} dy={-52} src="a" tone="c4" size={26} w={60} />
          <Dot x={at(1.3)} y={g.y} tone="c4" />
          <Pin x={at(1.3)} y={g.y} dy={-52} src="b" tone="c4" size={26} w={60} />
          <Card x={P ? 120 : 330} y={P ? 420 : 300} w={P ? 300 : 300} h={P ? 76 : 80} src="a < b" size={P ? 36 : 40} />
          <T x={P ? 270 : 480} y={P ? 530 : 415} size={P ? 20 : 22} color={ink.soft} weight={500}>يعني a واقع على شمال b</T>
        </g>
      </g>
      <g opacity={neg}>
        <Dot x={at(-5)} y={g.y} tone="c2" />
        <Pin x={at(-5)} y={g.y} dy={-56} src="-5" tone="c2" size={26} w={70} />
        <Dot x={at(-2)} y={g.y} tone="c1" />
        <Pin x={at(-2)} y={g.y} dy={-56} src="-2" tone="c1" size={26} w={70} />
        <Hop x1={at(0)} x2={at(-5)} y={g.y + 46} up={false} tone="c2" />
        <T x={at(-2.5)} y={g.y + (P ? 108 : 96)} size={P ? 17 : 18} color={ink.c2} weight={500}>{`${ltr('−5')} أبعد ناحية الشمال`}</T>
        <Card x={P ? 70 : 300} y={P ? 470 : 338} w={P ? 400 : 360} h={P ? 76 : 72} src="\c2{-5} < \c1{-2}" size={P ? 36 : 40} tone="ok" o={neg} />
      </g>
      <g opacity={le}>
        <Card x={P ? 40 : 170} y={P ? 610 : 424} w={P ? 460 : 290} h={P ? 76 : 66} src="3 \le 3\q \ok{\t{✓}}" size={P ? 32 : 32} tone="ok" />
        <Card x={P ? 40 : 500} y={P ? 710 : 424} w={P ? 460 : 290} h={P ? 76 : 66} src="3 < 3\q \no{\t{✗}}" size={P ? 32 : 32} tone="no" />
        <T x={P ? 270 : 480} y={P ? 830 : 512} size={P ? 17 : 16} color={ink.soft} weight={500}>{`${ltr('≤')} يعني «أصغر من أو يساوي»`}</T>
      </g>
    </g>
  );
}

type Row = { u: string; rule: string; min: number; max: number; ticks: number[]; from?: [number, number]; to: [number, number]; to2: [string, string]; result: string; flip: boolean };
const ROWS: Row[] = [
  { u: 'U1', rule: '+3', min: 0, max: 9, ticks: [0, 2, 5, 8], from: [2, 5], to: [5, 8], to2: ['5', '8'], result: '5 < 8', flip: false },
  { u: 'U2', rule: '\\times 3', min: 0, max: 16, ticks: [0, 2, 5, 6, 15], from: [2, 5], to: [6, 15], to2: ['6', '15'], result: '6 < 15', flip: false },
  { u: 'U3', rule: '\\times (-1)', min: -6, max: 6, ticks: [-5, -2, 0, 2, 5], from: [2, 5], to: [-2, -5], to2: ['-2', '-5'], result: '-2 > -5', flip: true },
  { u: 'U4', rule: '\\f{1}{x}', min: 0, max: 1, ticks: [0, 0.2, 0.5, 1], to: [0.5, 0.2], to2: ['\\f{1}{2}', '\\f{1}{5}'], result: '\\f{1}{2} > \\f{1}{5}', flip: true },
];

export function Rules({ on, P }: SceneProps) {
  return (
    <g>
      <Card x={P ? 195 : 405} y={P ? 70 : 44} w={150} h={52} src="2 < 5" size={28} />
      {ROWS.map((r, i) => {
        const o = on(r.u, 600);
        if (o <= 0) return null;
        const y = P ? 230 + i * 190 : 140 + i * 105;
        const x1 = P ? 50 : 270, x2 = P ? 490 : 700;
        const at = scale(r.min, r.max, x1, x2);
        const label = (v: number) => (v === 0.2 ? '1/5' : v === 0.5 ? '1/2' : String(v).replace('-', '−'));
        return (
          <g key={r.u} opacity={Math.min(1, o * 1.6)}>
            <Card x={P ? 40 : 20} y={P ? y - 112 : y - 34} w={P ? 170 : 200} h={P ? 60 : 68} src={r.rule} size={P ? 28 : 32} tone={r.flip ? 'c2' : 'c4'} />
            <Axis x1={x1} x2={x2} y={y} w={2.5} />
            <Ticks at={at} y={y} values={r.ticks} labels={label} size={P ? 15 : 16} len={7} />
            {r.from ? r.from.map((v, k) => <Dot key={k} x={at(v)} y={y} tone={k ? 'c2' : 'c1'} hollow r={7} />) : null}
            {r.from ? r.from.map((v, k) => <Hop key={k} x1={at(v)} x2={lerpTo(at(v), at(r.to[k]), o)} y={y} up={k === 0} tone={k ? 'c2' : 'c1'} o={o} />) : null}
            {r.to.map((v, k) => <Dot key={k} x={at(v)} y={y} tone={k ? 'c2' : 'c1'} o={o} r={8} />)}
            <Card x={P ? 250 : 750} y={P ? y - 112 : y - 34} w={P ? 250 : 190} h={P ? 60 : 68} src={`${r.result}\\q ${r.flip ? '\\no{\\t{⇄}}' : '\\ok{\\t{✓}}'}`} size={P ? 26 : 28} tone={r.flip ? 'no' : 'ok'} o={o} />
          </g>
        );
      })}
      <Tag x={P ? 270 : 480} y={P ? 905 : 520} text="الضرب في سالب أو المقلوب ← اقلب العلامة" color={ink.c2} size={P ? 17 : 17} o={on('U4')} />
    </g>
  );
}

const lerpTo = (a: number, b: number, t: number) => a + (b - a) * t;
