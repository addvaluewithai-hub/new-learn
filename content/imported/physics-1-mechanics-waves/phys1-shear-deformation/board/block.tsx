import React from 'react';
import { Arrow, Dim, Eq, Rod, T, Tag, Wall, ink } from './parts';

// Shear drawings: a rubber block on a fixed base whose top face slides sideways.
export type On = (unit: string, ms?: number) => number;
export type SceneProps = { on: On; P: boolean };

type BlockSpec = { x: number; y: number; w: number; h: number; dx?: number; d?: number; o?: number; face?: number; ghost?: number; tone?: string };

/** Block standing on y (its bottom edge); the top face is shifted by dx, `d` is its depth. */
export function Block({ x, y, w, h, dx = 0, d = 50, o = 1, face = 0, ghost = 0, tone = ink.c4 }: BlockSpec) {
  if (o <= 0) return null;
  const ox = d * 0.7, oy = -d * 0.45, t = y - h;
  const front = `M${x} ${y} L${x + w} ${y} L${x + w + dx} ${t} L${x + dx} ${t} Z`;
  const top = `M${x + dx} ${t} L${x + w + dx} ${t} L${x + w + dx + ox} ${t + oy} L${x + dx + ox} ${t + oy} Z`;
  const side = `M${x + w} ${y} L${x + w + ox} ${y + oy} L${x + w + dx + ox} ${t + oy} L${x + w + dx} ${t} Z`;
  return (
    <g opacity={o}>
      <path d={`M${x} ${y} L${x + w} ${y} L${x + w} ${t} L${x} ${t} Z`} fill="none" stroke={ink.soft} strokeDasharray="6 6" opacity={ghost} />
      <path d={side} fill={tone} fillOpacity={0.18} stroke={tone} strokeWidth={2} strokeLinejoin="round" />
      <path d={front} fill={tone} fillOpacity={0.3} stroke={tone} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={top} fill={face > 0 ? ink.c1 : tone} fillOpacity={face > 0 ? 0.25 + 0.4 * face : 0.42} stroke={face > 0 ? ink.c1 : tone} strokeWidth={face > 0 ? 3 : 2} strokeLinejoin="round" />
    </g>
  );
}

/** Fixed base under a block, with hatching. */
export function Base({ x, y, w, o = 1 }: { x: number; y: number; w: number; o?: number }) {
  return (
    <g opacity={o}>
      <line x1={x} y1={y} x2={x + w} y2={y} stroke={ink.soft} strokeWidth={3} />
      {Array.from({ length: Math.floor(w / 16) }, (_, i) => (
        <line key={i} x1={x + 16 * i + 4} y1={y + 2} x2={x + 16 * i - 8} y2={y + 14} stroke={ink.muted} strokeWidth={1.5} />
      ))}
    </g>
  );
}

/** Push on the top face: an arrow along the face, pointing right. */
export function Push({ x, y, len = 110, o = 1, label = 'F' }: { x: number; y: number; len?: number; o?: number; label?: string }) {
  return (
    <g opacity={o}>
      <Arrow x1={x - len} y1={y} x2={x - 6} y2={y} color={ink.c2} w={6} head={18} />
      <T x={x - len / 2} y={y - 26} size={24} color={ink.c2} math>{label}</T>
    </g>
  );
}

export function Compare({ on, P }: SceneProps) {
  const axial = on('U1'), push = on('U2'), named = on('U3'), faces = on('U4');
  const rod = P ? { x: 70, y: 210, len: 300 } : { x: 90, y: 210, len: 280 };
  const b = P ? { x: 190, y: 600, w: 190, h: 150 } : { x: 600, y: 330, w: 190, h: 150 };
  const dx = 46 * push;
  return (
    <g>
      <g opacity={axial * (1 - 0.5 * push)}>
        <Wall x={rod.x} y={rod.y - 40} h={80} />
        <Rod x={rod.x} y={rod.y} len={rod.len + 34 * axial} h={28} />
        <Arrow x1={rod.x + rod.len + 42} y1={rod.y} x2={rod.x + rod.len + 130} y2={rod.y} color={ink.c2} w={6} head={18} />
        <Tag x={rod.x + rod.len / 2 + 30} y={rod.y + 62} text="شد على طول القضيب ← الطول بيزيد" color={ink.soft} size={P ? 17 : 17} />
      </g>
      <g opacity={push}>
        <Base x={b.x - 40} y={b.y} w={b.w + 120} />
        <Block x={b.x} y={b.y} w={b.w} h={b.h} dx={dx} ghost={named} />
        <Push x={b.x + dx + 4} y={b.y - b.h - 8} />
        <T x={b.x + b.w / 2} y={b.y + 34} size={17} color={ink.soft} weight={500}>القاعدة مثبّتة</T>
      </g>
      <Tag x={P ? 270 : 480} y={P ? 360 : 105} text="الشكل بيميل: Shear deformation — تشوّه القص" color={ink.c4} size={P ? 17 : 18} o={named * (1 - faces)} />
      {faces > 0 ? (
        <g opacity={faces}>
          {[{ cx: P ? 140 : 300, par: false }, { cx: P ? 400 : 660, par: true }].map(({ cx, par }) => {
            const cy = P ? 820 : 450;
            return (
              <g key={cx}>
                <rect x={cx - 110} y={cy - 52} width={220} height={104} rx={16} fill={ink.panel} stroke={par ? ink.c4 : ink.line} />
                <line x1={cx - 60} y1={cy + 10} x2={cx + 20} y2={cy + 10} stroke={ink.c1} strokeWidth={6} strokeLinecap="round" />
                {par ? <Arrow x1={cx - 70} y1={cy - 6} x2={cx + 30} y2={cy - 6} color={ink.c2} w={5} head={14} />
                  : <Arrow x1={cx - 20} y1={cy + 6} x2={cx - 20} y2={cy - 46} color={ink.c2} w={5} head={14} />}
                <T x={cx + 62} y={cy - 4} size={18} color={par ? ink.c4 : ink.soft}>{par ? 'موازية' : 'عمودية'}</T>
                <T x={cx} y={cy + 36} size={18} color={ink.soft} weight={500} math>{par ? 'Shear: F ∥ face' : 'Axial: F ⟂ face'}</T>
              </g>
            );
          })}
        </g>
      ) : null}
    </g>
  );
}

export function Tau({ on, P }: SceneProps) {
  const setup = on('U1'), law = on('U2'), avg = on('U3');
  const b = P ? { x: 120, y: 470, w: 230, h: 170 } : { x: 130, y: 430, w: 250, h: 190 };
  const ty = b.y - b.h;
  return (
    <g>
      <g opacity={setup}>
        <Base x={b.x - 40} y={b.y} w={b.w + 130} />
        <Block x={b.x} y={b.y} w={b.w} h={b.h} dx={18} d={70} face={setup} />
        <Push x={b.x + 22} y={ty - 10} />
        <T x={b.x + b.w / 2 + 40} y={ty - 18} size={22} color={ink.c1} math>A</T>
        <line x1={b.x - 28} y1={b.y} x2={b.x - 28} y2={ty} stroke={ink.soft} strokeWidth={2} />
        <T x={b.x - 50} y={(b.y + ty) / 2} size={22} color={ink.soft} math>h</T>
      </g>
      {avg > 0 ? [0.2, 0.45, 0.7].map((k) => (
        <Arrow key={k} x1={b.x + 18 + b.w * k} y1={ty + 14} x2={b.x + 18 + b.w * k + 44} y2={ty + 14} color={ink.c2} w={3} head={9} o={avg} />
      )) : null}
      <g opacity={law}>
        <rect x={P ? 40 : 560} y={P ? 560 : 120} width={P ? 460 : 360} height={P ? 300 : 300} rx={22} fill={ink.panel} stroke={ink.line} />
        <T x={P ? 270 : 740} y={P ? 600 : 160} size={20} color={ink.soft}>Shear stress — إجهاد القص</T>
        <Eq x={P ? 40 : 560} y={P ? 625 : 185} w={P ? 460 : 360} h={120} src="\c1{τ} = \f{\c2{F}}{\c1{A}}" size={54} />
        <T x={P ? 270 : 740} y={P ? 765 : 325} size={17} color={ink.soft} weight={500}>F موازية للوجه · A مساحة الوجه</T>
        <Eq x={P ? 40 : 560} y={P ? 785 : 345} w={P ? 460 : 360} h={50} src="\t{Pa} = \t{N/m}^2" size={26} />
      </g>
      <Tag x={P ? 270 : 740} y={P ? 905 : 470} text="متوسط على الوجه في الحالة البسيطة" color={ink.c2} size={17} o={avg} />
    </g>
  );
}

export function Gamma({ on, P }: SceneProps) {
  const dims = on('U1'), law = on('U2'), ang = on('U3'), warn = on('U4');
  const b = P ? { x: 150, y: 460, w: 220, h: 220 } : { x: 140, y: 440, w: 230, h: 240 };
  const dx = 95, ty = b.y - b.h;
  const a = Math.atan2(dx, b.h), r = 70;
  return (
    <g>
      <Base x={b.x - 40} y={b.y} w={b.w + 150} />
      <Block x={b.x} y={b.y} w={b.w} h={b.h} dx={dx} d={50} ghost={1} />
      <Push x={b.x + dx + 4} y={ty - 10} o={0.7} />
      <Dim x1={b.x} x2={b.x + dx} y={ty - 54} label="Δx" color={ink.c2} o={dims} size={22} />
      <g opacity={dims}>
        <line x1={b.x - 26} y1={b.y} x2={b.x - 26} y2={ty} stroke={ink.soft} strokeWidth={2} />
        <T x={b.x - 48} y={(b.y + ty) / 2} size={22} color={ink.soft} math>h</T>
      </g>
      <g opacity={ang}>
        <path d={`M${b.x} ${b.y - r} A${r} ${r} 0 0 1 ${b.x + r * Math.sin(a)} ${b.y - r * Math.cos(a)}`} fill="none" stroke={ink.c3} strokeWidth={3} />
        <T x={b.x + 24} y={b.y - r - 18} size={22} color={ink.c3} math>θ</T>
      </g>
      <Eq x={P ? 20 : 470} y={P ? 520 : 110} w={P ? 500 : 460} h={130} src="\c1{γ} = \f{\c2{Δx}}{h}" size={54} o={law} />
      <Tag x={P ? 270 : 700} y={P ? 670 : 265} text="γ ملوش وحدة: طول على طول" color={ink.ok} size={18} o={law * (1 - ang)} />
      <Eq x={P ? 20 : 470} y={P ? 650 : 245} w={P ? 500 : 460} h={110} src="\t{tan}\ \c3{θ} = \f{Δx}{h}\q \c3{θ} ≈ \c1{γ}" size={36} o={ang} />
      <Tag x={P ? 270 : 700} y={P ? 790 : 385} text="θ صغيرة وبالراديان" color={ink.c3} size={18} o={ang} />
      <Tag x={P ? 270 : 700} y={P ? 860 : 455} text="ده لتشوّه صغير ومنتظم بس" color={ink.c2} size={18} o={warn} />
    </g>
  );
}
