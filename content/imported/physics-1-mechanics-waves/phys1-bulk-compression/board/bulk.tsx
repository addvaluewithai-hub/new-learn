import React from 'react';
import { Eq, T, Tag, ink } from './parts';
import { Cube, Squeeze, Tank, type SceneProps } from './cube';

// When the bulk relation holds, the worked example, and whether the answer makes sense.

export function Conditions({ on, P }: SceneProps) {
  const ok = on('U1'), total = on('U2');
  const c = P ? { cx: 270, cy: 330 } : { cx: 250, cy: 300 };
  const items = ['تغيّر صغير في الحجم', 'ضغط منتظم تقريبًا حوالين الجسم', 'B مناسب للمادة وظروفها'];
  return (
    <g>
      <Tank cx={c.cx} cy={c.cy} w={300} h={260} o={ok} />
      <Cube cx={c.cx} cy={c.cy} a={120} o={ok * (1 - total)} />
      <Cube cx={c.cx} cy={c.cy} a={112} sx={0.82} ghost={1} ghostA={120} o={total} />
      <Squeeze cx={c.cx} cy={c.cy} r={78} len={34} o={ok} />
      {items.map((t, i) => (
        <g key={t} opacity={ok}>
          <rect x={P ? 60 : 470} y={(P ? 520 : 110) + i * 62} width={P ? 420 : 420} height={46} rx={23} fill={ink.panel} stroke={ink.ok} strokeOpacity={0.6} />
          <T x={(P ? 60 : 470) + 210} y={(P ? 543 : 133) + i * 62} size={P ? 17 : 19} color={ink.ink}>{`✓ ${t}`}</T>
        </g>
      ))}
      <g opacity={total}>
        <Tag x={P ? 270 : 680} y={P ? 760 : 340} text="مش لازم كل اتجاه يقل بنفس النسبة" color={ink.c2} size={P ? 17 : 18} />
        <Tag x={P ? 270 : 680} y={P ? 820 : 400} text="بنستخدم تغيّر الحجم الكلي ΔV" color={ink.c3} size={P ? 17 : 18} />
      </g>
    </g>
  );
}

export function Example({ on, P }: SceneProps) {
  const data = on('U1');
  const c = P ? { cx: 270, cy: 250 } : { cx: 200, cy: 270 };
  const rows = [
    { u: 'U2', src: '|\\c3{ΔV}| ≈ \\f{\\c2{ΔP}}{\\c1{B}}\\ V₀' },
    { u: 'U3', src: '\\f{ΔP}{B} = \\f{2\\times 10^{6}}{1\\times 10^{9}} = 0.002' },
    { u: 'U4', src: '|ΔV| = 0.002 \\times 0.005 = \\ok{1\\times 10^{-5}\\ \\t{m}^3} = \\ok{10\\ \\t{cm}^3}' },
    { u: 'U5', src: '\\t{signed:}\\ \\c3{ΔV} = −1\\times 10^{-5}\\ \\t{m}^3' },
  ];
  return (
    <g>
      <g opacity={data}>
        <Tank cx={c.cx} cy={c.cy} w={260} h={230} />
        <Cube cx={c.cx} cy={c.cy} a={100} />
        <Squeeze cx={c.cx} cy={c.cy} r={66} len={30} />
        <T x={c.cx} y={c.cy + 145} size={18} color={ink.c3} math>V₀ = 0.005 m³</T>
        <T x={c.cx} y={c.cy + 175} size={18} color={ink.c2} math>ΔP = 2 × 10⁶ Pa</T>
        <T x={c.cx} y={c.cy + 205} size={18} color={ink.c1} math>B = 1 × 10⁹ Pa</T>
      </g>
      {rows.map((r, i) => (
        <Eq key={r.u} x={P ? 10 : 390} y={(P ? 490 : 85) + i * (P ? 108 : 105)} w={P ? 520 : 560} h={P ? 100 : 100} src={r.src} size={P ? 26 : 30} o={on(r.u)} />
      ))}
      <Tag x={P ? 270 : 670} y={P ? 930 : 515} text="1 m³ = 10⁶ cm³" color={ink.soft} size={16} math o={on('U4')} />
    </g>
  );
}

export function Sense({ on, P }: SceneProps) {
  const size = on('U1'), meaning = on('U2');
  const bx = P ? 60 : 120, bw = P ? 420 : 720, by = P ? 200 : 140;
  return (
    <g>
      <g opacity={size * (1 - 0.6 * meaning)}>
        <rect x={bx} y={by} width={bw} height={50} rx={10} fill={ink.c3} fillOpacity={0.35} stroke={ink.c3} />
        <T x={bx + bw / 2} y={by + 26} size={20} color={ink.ink} math>V₀ = 100%</T>
        <rect x={bx} y={by + 80} width={Math.max(4, bw * 0.002)} height={50} fill={ink.c2} />
        <T x={bx + 20} y={by + 106} size={20} color={ink.c2} anchor="start" math>|ΔV| = 0.2%</T>
        <Tag x={P ? 270 : 480} y={by + 175} text="نسبة صغيرة ← متماشية مع فرض التغيّر الصغير" color={ink.ok} size={P ? 16 : 18} />
        <Tag x={P ? 270 : 480} y={by + 230} text="لو |ΔV| طلع أكبر من V₀ ← راجع الوحدات والأُسس" color={ink.no} size={P ? 16 : 18} />
      </g>
      {meaning > 0 ? (
        <g opacity={meaning}>
          {[{ t: 'ΔP', d: 'الضغط اللي اتطبّق', c: ink.c2, x: P ? 140 : 300 }, { t: 'B', d: 'مقاومة المادة', c: ink.c1, x: P ? 400 : 660 }].map((k) => (
            <g key={k.t}>
              <rect x={k.x - 110} y={P ? 560 : 330} width={220} height={140} rx={18} fill={ink.panel} stroke={k.c} />
              <T x={k.x} y={(P ? 560 : 330) + 42} size={34} color={k.c} math>{k.t}</T>
              <T x={k.x} y={(P ? 560 : 330) + 84} size={18} color={ink.soft}>{k.d}</T>
              <T x={k.x} y={(P ? 560 : 330) + 116} size={18} color={ink.muted} math>Pa</T>
            </g>
          ))}
          <T x={P ? 270 : 480} y={P ? 632 : 402} size={40} color={ink.no} weight={700}>≠</T>
          <T x={P ? 270 : 480} y={P ? 740 : 500} size={18} color={ink.soft} weight={500}>نفس الوحدة مش معناها نفس المعنى (زي σ وY)</T>
        </g>
      ) : null}
    </g>
  );
}
