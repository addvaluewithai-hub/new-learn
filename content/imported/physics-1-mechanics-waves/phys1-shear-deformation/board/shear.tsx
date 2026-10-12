import React from 'react';
import { Arrow, Dim, Eq, T, Tag, ink } from './parts';
import { Base, Block, Push, type SceneProps } from './block';

// Shear modulus, the worked example, which lengths to use, and when the simple model holds.

export function Modulus({ on, P }: SceneProps) {
  const law = on('U1'), solve = on('U2'), cmp = on('U3');
  const blocks = [
    { name: 'S كبير', dx: 16, tone: ink.c1, x: P ? 70 : 150 },
    { name: 'S صغير', dx: 54, tone: ink.c4, x: P ? 300 : 560 },
  ];
  const y = P ? 820 : 448;
  return (
    <g>
      <Eq x={P ? 20 : 80} y={P ? 120 : 90} w={P ? 500 : 800} h={90} src="\c1{τ} = \c3{S}\ \c1{γ}" size={48} o={law} />
      <Tag x={P ? 270 : 480} y={P ? 230 : 192} text="S في الكتاب = G في مراجع تانية (Shear modulus)" color={ink.c3} size={P ? 16 : 18} o={law * (1 - solve)} />
      <Eq x={P ? 10 : 80} y={P ? 250 : 165} w={P ? 520 : 800} h={110} src="\c3{S} = \f{τ}{γ} = \f{F/A}{Δx/h} = \f{Fh}{AΔx}" size={P ? 34 : 40} o={solve} />
      <Tag x={P ? 270 : 480} y={P ? 380 : 300} text="الوحدة Pa: إجهاد على نسبة من غير وحدة" color={ink.soft} size={17} o={solve} />
      {cmp > 0 ? (
        <g opacity={cmp}>
          {blocks.map((b) => (
            <g key={b.name}>
              <Base x={b.x - 20} y={y} w={P ? 210 : 260} />
              <Block x={b.x} y={y} w={P ? 140 : 170} h={P ? 140 : 100} dx={b.dx} ghost={1} tone={b.tone} d={40} />
              <Push x={b.x + b.dx + 4} y={y - (P ? 148 : 108)} len={80} label="" />
              <T x={b.x + (P ? 70 : 85)} y={y + 32} size={20} color={b.tone} math>{b.name}</T>
            </g>
          ))}
          <Tag x={P ? 270 : 480} y={P ? 470 : 515} text="نفس τ: S أكبر ← γ أصغر (مش مقاومة الكسر)" color={ink.c2} size={P ? 16 : 18} />
        </g>
      ) : null}
    </g>
  );
}

export function Example({ on, P }: SceneProps) {
  const data = on('U1');
  const b = P ? { x: 140, y: 330, w: 200, h: 150 } : { x: 150, y: 420, w: 160, h: 170 };
  const rows = [
    { u: 'U2', src: '\\c2{Δx} = 0.20\\ \\t{mm} = 2.0\\times 10^{-4}\\ \\t{m}' },
    { u: 'U3', src: '\\c1{τ} = \\f{F}{A} = \\f{60}{0.020} = \\ok{3000\\ \\t{Pa}}' },
    { u: 'U4', src: '\\c1{γ} = \\f{Δx}{h} = \\f{2.0\\times 10^{-4}}{0.10} = \\ok{0.002}' },
    { u: 'U5', src: '\\c3{S} = \\f{τ}{γ} = \\f{3000}{0.002} = \\ok{1.5\\times 10^{6}\\ \\t{Pa}}' },
  ];
  return (
    <g>
      <g opacity={data}>
        <Base x={b.x - 30} y={b.y} w={b.w + 110} />
        <Block x={b.x} y={b.y} w={b.w} h={b.h} dx={20} d={50} />
        <Push x={b.x + 24} y={b.y - b.h - 8} label="F = 60 N" len={120} />
        <line x1={b.x - 22} y1={b.y} x2={b.x - 22} y2={b.y - b.h} stroke={ink.soft} strokeWidth={2} />
        <T x={b.x - 30} y={b.y - b.h / 2} size={18} color={ink.soft} anchor="end" math>h = 0.10 m</T>
        <T x={b.x + b.w / 2 + 40} y={b.y + 30} size={18} color={ink.c1} math>A = 0.020 m²</T>
        <Tag x={b.x + b.w / 2 + 30} y={b.y + 70} text="Δx = 0.20 mm" color={ink.c2} size={18} math />
      </g>
      {rows.map((r, i) => (
        <Eq key={r.u} x={P ? 10 : 390} y={(P ? 440 : 95) + i * (P ? 115 : 105)} w={P ? 520 : 560} h={P ? 105 : 100} src={r.src} size={P ? 28 : 31} o={on(r.u)} />
      ))}
    </g>
  );
}

export function Dims({ on, P }: SceneProps) {
  const right = on('U1'), area = on('U2'), tall = on('U3');
  const y = P ? 470 : 440;
  return (
    <g>
      <g opacity={right * (1 - area)}>
        <Base x={P ? 100 : 300} y={y} w={300} />
        <Block x={P ? 150 : 350} y={y} w={190} h={180} dx={40} ghost={1} />
        <line x1={(P ? 150 : 350) - 24} y1={y} x2={(P ? 150 : 350) - 24} y2={y - 180} stroke={ink.ok} strokeWidth={3} />
        <T x={(P ? 150 : 350) - 50} y={y - 90} size={22} color={ink.ok} math>h ✓</T>
        <Dim x1={P ? 150 : 350} x2={(P ? 150 : 350) + 40} y={y - 215} label="Δx ✓" color={ink.ok} />
        <T x={(P ? 150 : 350) + 300} y={y - 100} size={22} color={ink.no} math>ΔL/L₀ ✗</T>
        <Tag x={P ? 270 : 480} y={P ? 640 : 505} text="h بين الوجه المتحرك والمثبّت · Δx حركة جانبية نسبية" color={ink.c1} size={P ? 15 : 17} />
      </g>
      {area > 0 ? (
        <g opacity={area}>
          {[{ x: P ? 60 : 70, d: 40, dx: 44, name: 'A' }, { x: P ? 290 : 300, d: 90, dx: 22, name: '2A' }].map((k) => (
            <g key={k.name}>
              <Base x={k.x - 20} y={y} w={210} />
              <Block x={k.x} y={y} w={130} h={140} dx={k.dx} d={k.d} ghost={1} />
              <Push x={k.x + k.dx + 4} y={y - 148} len={70} label="" />
              <T x={k.x + 65} y={y + 30} size={20} color={ink.c1} math>{k.name}</T>
              <Dim x1={k.x} x2={k.x + k.dx} y={y - 180 - k.d * 0.45} label={k.name === 'A' ? 'Δx' : 'Δx/2'} color={ink.c2} size={18} />
            </g>
          ))}
          <Eq x={P ? 20 : 40} y={P ? 120 : 80} w={P ? 500 : 480} h={80} src="A \to 2A\ ⇒\ τ,\ γ,\ Δx \to \f{1}{2}" size={P ? 30 : 30} />
        </g>
      ) : null}
      {tall > 0 ? (
        <g opacity={tall}>
          <Base x={P ? 150 : 600} y={P ? 880 : y} w={220} />
          <Block x={P ? 200 : 650} y={P ? 880 : y} w={120} h={P ? 230 : 280} dx={P ? 46 : 56} ghost={1} tone={ink.c3} d={40} />
          <T x={P ? 120 : 600} y={P ? 760 : 300} size={20} color={ink.c3} anchor="end" math>2h</T>
          <Tag x={P ? 270 : 740} y={P ? 590 : 105} text="نفس γ وارتفاع أكبر ← Δx أكبر" color={ink.c3} size={P ? 16 : 18} />
        </g>
      ) : null}
    </g>
  );
}

export function Conditions({ on, P }: SceneProps) {
  const list = on('U1'), other = on('U2');
  const b = P ? { x: 150, y: 400, w: 200, h: 160 } : { x: 110, y: 400, w: 200, h: 170 };
  const items = ['أوجه مستوية', 'القاعدة مثبّتة', 'F موازية للوجه', 'تشوّه صغير', 'قص منتظم (متوسط)', 'مرن خطي'];
  return (
    <g>
      <g opacity={list}>
        <Base x={b.x - 30} y={b.y} w={b.w + 120} />
        <Block x={b.x} y={b.y} w={b.w} h={b.h} dx={18} d={50} />
        <Push x={b.x + 22} y={b.y - b.h - 8} />
        {items.map((t, i) => (
          <g key={t}>
            <rect x={P ? 50 + (i % 2) * 225 : 470} y={(P ? 470 : 95) + (P ? Math.floor(i / 2) * 58 : i * 54)} width={P ? 215 : 300} height={44} rx={22} fill={ink.panel} stroke={ink.ok} strokeOpacity={0.6} />
            <T x={(P ? 50 + (i % 2) * 225 : 470) + (P ? 108 : 150)} y={(P ? 492 : 117) + (P ? Math.floor(i / 2) * 58 : i * 54)} size={P ? 16 : 18} color={ink.ink}>{`✓ ${t}`}</T>
          </g>
        ))}
      </g>
      {other > 0 ? (
        <g opacity={other}>
          <g transform={P ? 'translate(0 0)' : undefined}>
            <rect x={P ? 60 : 480} y={P ? 680 : 420} width={150} height={30} rx={8} fill="url(#steel)" />
            <path d={`M${P ? 220 : 640} ${P ? 672 : 412} a26 26 0 1 1 0 46`} fill="none" stroke={ink.no} strokeWidth={4} />
            <T x={P ? 135 : 555} y={P ? 740 : 485} size={18} color={ink.soft}>التواء</T>
            <path d={`M${P ? 290 : 720} ${P ? 690 : 425} Q${P ? 370 : 800} ${P ? 730 : 465} ${P ? 450 : 880} ${P ? 690 : 425}`} fill="none" stroke={ink.steel} strokeWidth={14} strokeLinecap="round" />
            <Arrow x1={P ? 370 : 800} y1={P ? 640 : 380} x2={P ? 370 : 800} y2={P ? 692 : 432} color={ink.no} w={4} head={12} />
            <T x={P ? 370 : 800} y={P ? 740 : 495} size={18} color={ink.soft}>انحناء</T>
          </g>
          <Tag x={P ? 270 : 680} y={P ? 820 : 525} text="التواء أو انحناء ← علاقات تانية" color={ink.no} size={17} />
        </g>
      ) : null}
    </g>
  );
}
