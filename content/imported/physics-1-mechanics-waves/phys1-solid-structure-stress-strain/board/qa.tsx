import React from 'react';
import { Arrow, Ball, Dim, Eq, Rod, T, Tag, Wall, ink } from './parts';
import type { SceneProps } from './matter';

// Question boards show the situation (never the answer); feedback boards add the answer on cue.
const rnd = (i: number) => {
  const s = Math.sin(i * 91.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
};

function Sample({ x, y, regular, label }: { x: number; y: number; regular: boolean; label: string }) {
  const pts = Array.from({ length: 16 }, (_, i) => [
    x + (i % 4) * 48 + (regular ? 0 : (rnd(i) - 0.5) * 30),
    y + Math.floor(i / 4) * 48 + (regular ? 0 : (rnd(i + 20) - 0.5) * 30),
  ]);
  return (
    <g>
      <rect x={x - 36} y={y - 36} width={216} height={216} rx={20} fill={ink.panel} stroke={ink.line} />
      {pts.map(([px, py], i) => <Ball key={i} x={px} y={py} r={12} tone={regular ? 'c1' : 'c4'} />)}
      <T x={x + 72} y={y - 60} size={22} color={ink.soft} math>{label}</T>
    </g>
  );
}

export function Q1({ on, P, feedback }: SceneProps & { feedback: boolean }) {
  const kind = feedback ? on('U1') : 0, el = feedback ? on('U2') : 0, br = feedback ? on('U3') : 0;
  const a = P ? { x: 72, y: 200 } : { x: 100, y: 160 }, b = P ? { x: 322, y: 200 } : { x: 370, y: 160 };
  const ry = P ? 620 : 270, rx = P ? 90 : 650, rl = P ? 330 : 250;
  return (
    <g>
      <Sample x={a.x} y={a.y} regular label="Sample 1" />
      <Sample x={b.x} y={b.y} regular={false} label="Sample 2" />
      <Tag x={a.x + 72} y={a.y + 222} text={kind > 0 ? 'Crystalline ✓' : '؟'} color={kind > 0 ? ink.ok : ink.c2} size={19} math={kind > 0} />
      <Tag x={b.x + 72} y={b.y + 222} text={kind > 0 ? 'Amorphous ✓' : '؟'} color={kind > 0 ? ink.ok : ink.c2} size={19} math={kind > 0} />
      <Wall x={rx} y={ry - 40} h={80} />
      <rect x={rx} y={ry - 13} width={rl} height={26} rx={5} fill="none" stroke={ink.soft} strokeDasharray="6 6" />
      <Rod x={rx} y={ry} len={rl} h={26} />
      <Dim x1={rx} x2={rx + rl} y={ry + 44} label="L₀" size={18} />
      <T x={rx + rl / 2} y={ry - 40} size={17} color={ink.soft} weight={500}>شلنا القوة الصغيرة ← رجع لـ L₀</T>
      <Tag x={rx + rl / 2} y={ry + 96} text={el > 0 ? 'Elastic ✓' : 'Elastic أو Plastic؟'} color={el > 0 ? ink.ok : ink.c2} size={19} />
      <Tag x={P ? 270 : rx + rl / 2} y={P ? ry + 160 : ry + 150} text={br > 0 ? 'قوة الكسر: ما اتختبرتش ✗' : 'قوة الكسر؟'} color={br > 0 ? ink.no : ink.c2} size={19} />
    </g>
  );
}

export function Q2({ on, P, feedback }: SceneProps & { feedback: boolean }) {
  const x0 = P ? 70 : 140, y = P ? 200 : 125, len = P ? 300 : 430;
  const rows = [
    { u: 'U1', src: '\\c1{σ} = \\f{F}{A} = \\f{180}{2\\times 10^{-4}} = \\ok{9\\times 10^{5}\\ \\t{Pa}}' },
    { u: 'U2', src: '\\c2{ΔL} = 0.60\\ \\t{mm} = 6.0\\times 10^{-4}\\ \\t{m}' },
    { u: 'U3', src: '\\c1{ε} = \\f{ΔL}{L₀} = \\f{6.0\\times 10^{-4}}{1.2} = \\ok{5\\times 10^{-4}}' },
  ];
  return (
    <g>
      <Wall x={x0} y={y - 45} h={90} />
      <Rod x={x0} y={y} len={len} h={26} />
      <Arrow x1={x0 + len + 10} y1={y} x2={x0 + len + 90} y2={y} color={ink.c2} w={6} head={18} />
      <T x={x0 + len + 52} y={y - 34} size={22} color={ink.c2} math>F = 180 N</T>
      <T x={x0 + len / 2} y={y - 34} size={19} color={ink.soft} math>A = 2 × 10⁻⁴ m²</T>
      <Dim x1={x0} x2={x0 + len} y={y + 46} label="L₀ = 1.2 m" size={18} />
      <Tag x={P ? 270 : x0 + len + 140} y={P ? y + 110 : y + 46} text="ΔL = 0.60 mm" color={ink.c2} size={18} math />
      {feedback ? rows.map((r, i) => (
        <Eq key={i} x={P ? 10 : 60} y={(P ? 370 : 200) + i * (P ? 120 : 88)} w={P ? 520 : 840} h={P ? 110 : 92} src={r.src} size={P ? 28 : 32} o={on(r.u)} />
      )) : (
        <g>
          <Tag x={P ? 170 : 380} y={P ? 470 : 360} text="σ = ?" color={ink.c1} size={26} math />
          <Tag x={P ? 370 : 580} y={P ? 470 : 360} text="ε = ?" color={ink.c1} size={26} math />
        </g>
      )}
      <g opacity={feedback ? on('U4') : 0}>
        <Tag x={P ? 270 : 330} y={P ? 820 : 510} text="ε ملوش وحدة (مش Pa)" color={ink.c2} size={17} />
        <Tag x={P ? 270 : 630} y={P ? 870 : 510} text="حوّل mm ← m قبل القسمة" color={ink.c2} size={17} />
      </g>
    </g>
  );
}

export function Recap({ on, P }: SceneProps) {
  const cards = [
    { u: 'U1', t: 'الصلب: جسيمات مربوطة', s: 'بلوري أو غير متبلور', src: '' },
    { u: 'U2', t: 'تحت الحمل: تشوّه', s: 'Elastic يرجع · Plastic يفضل', src: '' },
    { u: 'U3', t: 'الحمل والاستجابة', s: '', src: '\\c1{σ} = \\f{F}{A}\\q \\c1{ε} = \\f{ΔL}{L₀}' },
    { u: 'U4', t: 'الدرس الجاي', s: "Young's Modulus يربط σ بـ ε", src: '' },
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
            {c.s ? <T x={x + w / 2} y={y + (c.src ? 150 : 100)} size={P ? 19 : 19} color={ink.soft} weight={500}>{c.s}</T> : null}
            {c.src ? <Eq x={x} y={y + 60} w={w} h={100} src={c.src} size={P ? 34 : 34} /> : null}
          </g>
        );
      })}
    </g>
  );
}
