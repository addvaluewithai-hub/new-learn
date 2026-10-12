import React from 'react';
import { Dim, Eq, T, Tag, ink } from './parts';
import { Base, Block, Push, type SceneProps } from './block';

// Question boards show the situation and its data; feedback boards solve it on cue.

export function Q1({ on, P, feedback }: SceneProps & { feedback: boolean }) {
  const b = P ? { x: 140, y: 330, w: 200, h: 160 } : { x: 150, y: 420, w: 160, h: 180 };
  const rows = [
    { u: 'U1', src: '\\c1{τ} = \\f{F}{A} = \\f{90}{0.030} = \\ok{3000\\ \\t{Pa}}' },
    { u: 'U2', src: '\\c2{Δx} = 0.30\\ \\t{mm} = 3.0\\times 10^{-4}\\ \\t{m}' },
    { u: 'U3', src: '\\c1{γ} = \\f{Δx}{h} = \\f{3.0\\times 10^{-4}}{0.15} = \\ok{0.002}' },
    { u: 'U4', src: '\\c3{S} = \\f{τ}{γ} = \\f{3000}{0.002} = \\ok{1.5\\times 10^{6}\\ \\t{Pa}}' },
  ];
  return (
    <g>
      <Base x={b.x - 30} y={b.y} w={b.w + 110} />
      <Block x={b.x} y={b.y} w={b.w} h={b.h} dx={22} d={50} />
      <Push x={b.x + 26} y={b.y - b.h - 8} label="F = 90 N" len={120} />
      <line x1={b.x - 22} y1={b.y} x2={b.x - 22} y2={b.y - b.h} stroke={ink.soft} strokeWidth={2} />
      <T x={b.x - 30} y={b.y - b.h / 2} size={18} color={ink.soft} anchor="end" math>h = 0.15 m</T>
      <T x={b.x + b.w / 2 + 40} y={b.y + 30} size={18} color={ink.c1} math>A = 0.030 m²</T>
      <Tag x={b.x + b.w / 2 + 30} y={b.y + 70} text="Δx = 0.30 mm" color={ink.c2} size={18} math />
      {feedback ? rows.map((r, i) => (
        <Eq key={r.u} x={P ? 10 : 390} y={(P ? 440 : 95) + i * (P ? 115 : 105)} w={P ? 520 : 560} h={P ? 105 : 100} src={r.src} size={P ? 28 : 31} o={on(r.u)} />
      )) : (
        <g>
          {['τ = ?', 'γ = ?', 'S = ?'].map((t, i) => (
            <Tag key={t} x={P ? 110 + i * 160 : 650} y={P ? 560 : 170 + i * 100} text={t} color={ink.c1} size={26} math />
          ))}
        </g>
      )}
    </g>
  );
}

export function Q2({ on, P, feedback }: SceneProps & { feedback: boolean }) {
  const half = feedback ? on('U3') : 0;
  const y = P ? 420 : 380;
  const blocks = [
    { name: 'A', x: P ? 50 : 70, d: 40, dx: 44 },
    { name: 'B: 2A', x: P ? 290 : 320, d: 90, dx: 44 - 22 * half },
  ];
  const rows = [
    { u: 'U1', src: '\\c1{τʙ} = \\f{F}{2A} = \\f{1}{2}\\ τᴀ' },
    { u: 'U2', src: '\\c1{γʙ} = \\f{τʙ}{S} = \\f{1}{2}\\ γᴀ' },
    { u: 'U3', src: '\\c2{Δxʙ} = γʙ\\ h = \\f{1}{2}\\ Δxᴀ' },
  ];
  return (
    <g>
      {blocks.map((k) => (
        <g key={k.name}>
          <Base x={k.x - 20} y={y} w={P ? 200 : 240} />
          <Block x={k.x} y={y} w={P ? 120 : 140} h={150} dx={k.dx} d={k.d} ghost={1} />
          <Push x={k.x + k.dx + 4} y={y - 158} len={70} label="F" />
          <T x={k.x + (P ? 60 : 70)} y={y + 30} size={20} color={ink.c1} math>{k.name}</T>
          {half > 0 ? <Dim x1={k.x} x2={k.x + k.dx} y={y - 175 - k.d * 0.45} label={k.name === 'A' ? 'Δx' : 'Δx/2'} color={ink.c2} size={18} o={half} /> : null}
        </g>
      ))}
      <T x={P ? 270 : 300} y={P ? 130 : 105} size={18} color={ink.soft}>نفس المادة · نفس h · نفس F</T>
      {feedback ? rows.map((r, i) => (
        <Eq key={r.u} x={P ? 20 : 640} y={(P ? 520 : 120) + i * (P ? 110 : 110)} w={P ? 500 : 310} h={100} src={r.src} size={P ? 30 : 28} o={on(r.u)} />
      )) : (
        <g>
          <Tag x={P ? 150 : 760} y={P ? 560 : 200} text="τʙ : τᴀ = ?" color={ink.c1} size={22} math />
          <Tag x={P ? 390 : 760} y={P ? 560 : 300} text="Δxʙ : Δxᴀ = ?" color={ink.c2} size={22} math />
        </g>
      )}
    </g>
  );
}

export function Recap({ on, P }: SceneProps) {
  const cards = [
    { u: 'U1', t: 'القص: قوة موازية للوجه', s: 'الشكل بيميل، مش بيطول', src: '' },
    { u: 'U2', t: 'إجهاد وانفعال القص', s: '', src: '\\c1{τ} = \\f{F}{A}\\q \\c1{γ} = \\f{Δx}{h} ≈ θ' },
    { u: 'U3', t: 'معامل القص', s: 'h بين الوجهين · Δx حركة جانبية', src: '\\c3{S} = \\f{τ}{γ} = \\f{Fh}{AΔx}' },
    { u: 'U4', t: 'الدرس الجاي', s: 'ضغط من كل الاتجاهات ← Bulk modulus', src: '' },
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
            {c.src ? <Eq x={x} y={y + 58} w={w} h={c.s ? 80 : 110} src={c.src} size={P ? 30 : 32} /> : null}
            {c.s ? <T x={x + w / 2} y={y + (c.src ? 160 : 100)} size={19} color={ink.soft} weight={500}>{c.s}</T> : null}
          </g>
        );
      })}
    </g>
  );
}
