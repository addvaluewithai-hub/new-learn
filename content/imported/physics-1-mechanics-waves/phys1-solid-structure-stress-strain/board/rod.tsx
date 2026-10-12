import React from 'react';
import { Arrow, Dim, Eq, Rod, T, Tag, Wall, ink } from './parts';
import type { SceneProps } from './matter';

// Rod scenes: deformation (elastic/plastic/fracture), stress, strain and the worked example.

export function Deform({ on, P }: SceneProps) {
  const pull = on('U1'), free = on('U2'), perm = on('U3'), brk = on('U4');
  const x0 = P ? 60 : 150, y = P ? 400 : 250, L0 = P ? 270 : 440, stretch = P ? 40 : 64;
  // Extension drawn exaggerated: elastic stretch, back to L0, permanent remainder, then fracture.
  const ext = stretch * pull * (1 - free) + stretch * 0.45 * perm;
  const force = pull * (1 - free) * (1 - perm) + brk;
  const end = x0 + L0 + ext;
  const crack = x0 + L0 * 0.62;
  return (
    <g>
      <Wall x={x0} y={y - 70} h={140} />
      <rect x={x0} y={y - 15} width={L0} height={30} rx={5} fill="none" stroke={ink.soft} strokeDasharray="6 6" opacity={pull * 0.8} />
      {brk > 0 ? (
        <g>
          <Rod x={x0} y={y} len={crack - x0} hot={brk * 0.7} />
          <g transform={`translate(${34 * brk} 0)`}><Rod x={crack + 4} y={y} len={end - crack - 4} hot={brk * 0.7} /></g>
          <path d={`M${crack} ${y - 16} l6 8 -7 8 6 8 -5 8`} stroke={ink.no} strokeWidth={3} fill="none" opacity={brk} />
        </g>
      ) : <Rod x={x0} y={y} len={end - x0} />}
      <Arrow x1={end + 8 + 34 * brk} y1={y} x2={end + (P ? 80 : 110) + 34 * brk + (P ? 10 : 40) * brk} y2={y} color={brk > 0 ? ink.no : ink.c2} w={brk > 0 ? 9 : 7} o={force} head={22} />
      <T x={end + (P ? 50 : 75) + 34 * brk} y={y - 40} size={30} color={brk > 0 ? ink.no : ink.c2} o={force} math>{brk > 0 ? 'F ↑↑' : 'F'}</T>
      <Dim x1={x0} x2={x0 + L0} y={y + 62} label="L₀" o={pull} />
      <Dim x1={x0 + L0} x2={end} y={y + 62} label={perm > 0 ? 'باقي' : 'ΔL'} color={perm > 0 ? ink.c2 : ink.c1} o={ext > 4 ? 1 : 0} math={perm <= 0} />
      <Tag x={P ? 270 : 480} y={P ? 190 : 110} text="Deformation — تشوّه: الأبعاد اتغيّرت" color={ink.c2} size={P ? 19 : 21} o={pull * (1 - free)} />
      <Tag x={P ? 270 : 480} y={P ? 190 : 110} text="شلنا القوة ← رجع لطوله: Elastic ✓" color={ink.ok} size={P ? 19 : 21} o={free * (1 - perm)} />
      <Tag x={P ? 270 : 480} y={P ? 190 : 110} text="حمل أكبر وشلناه ← فضل أطول: Plastic" color={ink.c2} size={P ? 19 : 21} o={perm * (1 - brk)} />
      <Tag x={P ? 270 : 480} y={P ? 190 : 110} text="حمل أكبر كمان ← كسر (Fracture)" color={ink.no} size={P ? 19 : 21} o={brk} />
      <g opacity={free}>
        {[
          { t: 'Elastic', d: 'يرجع بالكامل', c: ink.ok, o: free },
          { t: 'Plastic', d: 'يفضل جزء', c: ink.c2, o: perm },
          { t: 'Fracture', d: 'يتكسر', c: ink.no, o: brk },
        ].map((s, i) => {
          const cx = P ? 100 + i * 170 : 300 + i * 180, cy = P ? 620 : 430;
          return (
            <g key={i} opacity={s.o > 0 ? 1 : 0.25}>
              <rect x={cx - 76} y={cy - 34} width={152} height={68} rx={14} fill={ink.panel} stroke={s.o > 0 ? s.c : ink.line} />
              <T x={cx} y={cy - 10} size={20} color={s.c} math>{s.t}</T>
              <T x={cx} y={cy + 16} size={16} color={ink.soft} weight={500}>{s.d}</T>
            </g>
          );
        })}
      </g>
    </g>
  );
}

function Section({ cx, cy, r, o = 1, hl = 0, arrows = 0 }: { cx: number; cy: number; r: number; o?: number; hl?: number; arrows?: number }) {
  return (
    <g opacity={o}>
      <ellipse cx={cx} cy={cy} rx={r * 0.42} ry={r} fill={ink.steelLo} stroke={hl > 0 ? ink.c1 : ink.steel} strokeWidth={hl > 0 ? 3 : 1.5} />
      {hl > 0 ? <ellipse cx={cx} cy={cy} rx={r * 0.42} ry={r} fill={ink.c1} opacity={0.35 * hl} /> : null}
      {arrows > 0 ? [-0.6, -0.2, 0.2, 0.6].map((k) => (
        <Arrow key={k} x1={cx + 4} y1={cy + k * r} x2={cx + 36} y2={cy + k * r} color={ink.c2} w={3} head={9} o={arrows} />
      )) : null}
    </g>
  );
}

export function Stress({ on, P }: SceneProps) {
  const cmp = on('U1'), law = on('U2'), unit = on('U3'), avg = on('U4');
  const x0 = P ? 70 : 110, len = P ? 260 : 330, ya = P ? 210 : 165, yb = P ? 380 : 330;
  const end = x0 + len;
  return (
    <g>
      <Wall x={x0} y={ya - 50} h={yb - ya + 110} />
      <Rod x={x0} y={ya} len={len} h={16} hot={cmp * 0.75} />
      <Rod x={x0} y={yb} len={len} h={56} />
      <Section cx={end} cy={ya} r={8} hl={law} />
      <Section cx={end} cy={yb} r={28} hl={law} arrows={avg} />
      {[ya, yb].map((y, i) => (
        <g key={i}>
          <Arrow x1={end + (avg && i ? 46 : 18)} y1={y} x2={end + (avg && i ? 150 : 120)} y2={y} color={ink.c2} w={6} head={18} />
          <T x={end + 90} y={y - 32} size={26} color={ink.c2} math>F</T>
        </g>
      ))}
      <T x={x0 + len / 2} y={ya - 34} size={18} color={ink.soft} weight={500}>رفيع: A صغيرة</T>
      <T x={x0 + len / 2} y={yb + 54} size={18} color={ink.soft} weight={500}>تخين: A كبيرة</T>
      <Tag x={P ? 270 : x0 + len / 2} y={P ? 500 : 455} text="نفس F على مساحة أصغر ← شد أكتر" color={ink.hot} size={P ? 18 : 19} o={cmp * (1 - law)} />
      <g transform={P ? 'translate(0 0)' : undefined}>
        <rect x={P ? 40 : 610} y={P ? 470 : 120} width={P ? 460 : 320} height={P ? 380 : 330} rx={22} fill={ink.panel} stroke={ink.line} opacity={law} />
        <T x={P ? 270 : 770} y={P ? 510 : 160} size={20} color={ink.soft} o={law}>Normal stress — الإجهاد العمودي</T>
        <Eq x={P ? 40 : 610} y={P ? 540 : 185} w={P ? 460 : 320} h={110} src="\c1{σ} = \f{\c2{F}}{\c1{A}}" size={P ? 58 : 54} o={law} />
        <T x={P ? 270 : 770} y={P ? 670 : 315} size={17} color={ink.soft} weight={500} o={law * (1 - unit)}>A = مساحة المقطع العمودية على F</T>
        <Eq x={P ? 40 : 610} y={P ? 650 : 290} w={P ? 460 : 320} h={60} src="\t{N/m}^2 = \c2{\t{Pa}}" size={P ? 32 : 30} o={unit} />
        <Eq x={P ? 40 : 610} y={P ? 715 : 345} w={P ? 460 : 320} h={60} src="1\ \t{MPa} = 10^{6}\ \t{Pa}" size={P ? 30 : 28} o={unit} />
        <Tag x={P ? 270 : 770} y={P ? 810 : 425} text="متوسط على مقطع منتظم" color={ink.c2} size={17} o={avg} />
      </g>
    </g>
  );
}

export function Strain({ on, P }: SceneProps) {
  const ask = on('U1'), dims = on('U2'), law = on('U3'), unit = on('U4'), cmp = on('U5');
  const x0 = P ? 70 : 120, y = P ? 260 : 190, L0 = P ? 300 : 400, dL = P ? 70 : 90;
  const rodO = 1 - cmp;
  return (
    <g>
      <g opacity={rodO}>
        <Wall x={x0} y={y - 55} h={110} />
        <rect x={x0} y={y - 15} width={L0} height={30} rx={5} fill="none" stroke={ink.soft} strokeDasharray="6 6" opacity={ask} />
        <Rod x={x0} y={y} len={L0 + dL * ask} />
        <Arrow x1={x0 + L0 + dL + 10} y1={y} x2={x0 + L0 + dL + 90} y2={y} color={ink.c2} w={6} head={18} o={ask} />
        <Tag x={x0 + L0 + dL - 40} y={y - 62} text="اتغيّر أد إيه؟" color={ink.c2} size={18} o={ask * (1 - dims)} />
        <Dim x1={x0} x2={x0 + L0 + dL} y={y - 58} label="L" o={dims} />
        <Dim x1={x0} x2={x0 + L0} y={y + 52} label="L₀" o={dims} />
        <Dim x1={x0 + L0} x2={x0 + L0 + dL} y={y + 52} label="ΔL" color={ink.c2} o={dims} />
        <Eq x={P ? 20 : 120} y={P ? 360 : 290} w={P ? 500 : 720} h={70} src="\c2{ΔL} = L − L₀" size={P ? 40 : 40} o={dims * (1 - law)} />
        <Eq x={P ? 20 : 120} y={P ? 335 : 262} w={P ? 500 : 720} h={150} src="\c1{ε} = \f{\c2{ΔL}}{L₀}" size={P ? 56 : 52} o={law} />
        <g opacity={law * (1 - unit)}>
          <Tag x={P ? 170 : 380} y={P ? 520 : 445} text="+ في الشد" color={ink.ok} size={18} />
          <Tag x={P ? 370 : 580} y={P ? 520 : 445} text="− في الضغط" color={ink.no} size={18} />
        </g>
        <Eq x={P ? 60 : 300} y={P ? 490 : 410} w={P ? 160 : 160} h={80} src="\f{\t{m}}{\t{m}}" size={30} o={unit} />
        <Tag x={P ? 340 : 560} y={P ? 530 : 450} text="ε ملوش وحدة: نسبة" color={ink.ok} size={19} o={unit} />
      </g>
      <g opacity={cmp}>
        {[
          { L: '2 m', e: '0.0005', bar: 0.125, y: P ? 260 : 170 },
          { L: '0.25 m', e: '0.004', bar: 1, y: P ? 520 : 330 },
        ].map((r, i) => (
          <g key={i}>
            <Rod x={P ? 60 : 110} y={r.y} len={P ? (i ? 90 : 300) : i ? 120 : 420} h={22} />
            <T x={P ? 60 : 110} y={r.y - 36} size={20} anchor="start" color={ink.soft} math>{`L₀ = ${r.L},  ΔL = 1 mm`}</T>
            <rect x={P ? 60 : 620} y={P ? r.y + 50 : r.y - 22} width={(P ? 420 : 300) * r.bar} height={44} rx={8} fill={i ? ink.c2 : ink.c1} opacity={0.85} />
            <T x={P ? 70 : 630} y={P ? r.y + 72 : r.y} size={22} anchor="start" color={ink.bg} weight={700} math>{r.bar > 0.3 ? `ε = ${r.e}` : ''}</T>
            {r.bar <= 0.3 ? <T x={(P ? 60 : 620) + (P ? 420 : 300) * r.bar + 12} y={P ? r.y + 72 : r.y} size={22} anchor="start" color={ink.c1} math>{`ε = ${r.e}`}</T> : null}
          </g>
        ))}
        <Tag x={P ? 270 : 480} y={P ? 760 : 470} text="نفس المليمتر… انفعال أكبر 8 مرات في القضيب القصير" color={ink.c2} size={P ? 17 : 19} />
      </g>
    </g>
  );
}

export function Example({ on, P }: SceneProps) {
  const data = on('U1'), s = on('U2'), cv = on('U3'), e = on('U4'), next = on('U5');
  const x0 = P ? 70 : 140, y = P ? 220 : 125, len = P ? 300 : 430;
  const rows = [
    { o: s, src: '\\c1{σ} = \\f{F}{A} = \\f{300}{0.0003} = 1\\times 10^{6}\\ \\t{Pa} = \\ok{1\\ \\t{MPa}}' },
    { o: cv, src: '\\c2{ΔL} = 0.5\\ \\t{mm} = 0.0005\\ \\t{m}' },
    { o: e, src: '\\c1{ε} = \\f{ΔL}{L₀} = \\f{0.0005}{0.5} = \\ok{0.001}' },
  ];
  return (
    <g>
      <g opacity={data}>
        <Wall x={x0} y={y - 45} h={90} />
        <Rod x={x0} y={y} len={len} h={26} />
        <Arrow x1={x0 + len + 10} y1={y} x2={x0 + len + 90} y2={y} color={ink.c2} w={6} head={18} />
        <T x={x0 + len + 52} y={y - 34} size={22} color={ink.c2} math>F = 300 N</T>
        <Dim x1={x0} x2={x0 + len} y={y + 46} label="L₀ = 0.5 m" size={18} />
        <T x={x0 + len / 2} y={y - 34} size={19} color={ink.soft} math>A = 0.0003 m²</T>
        <Tag x={P ? 270 : x0 + len + 140} y={P ? y + 110 : y + 46} text="ΔL = 0.5 mm" color={ink.c2} size={18} math />
      </g>
      {rows.map((r, i) => (
        <Eq key={i} x={P ? 10 : 60} y={(P ? 380 : 200) + i * (P ? 120 : 88)} w={P ? 520 : 840} h={P ? 110 : 92} src={r.src} size={P ? 30 : 34} o={r.o} />
      ))}
      <g opacity={next}>
        <Tag x={P ? 150 : 330} y={P ? 860 : 510} text="σ = الحمل" color={ink.c1} size={18} />
        <Tag x={P ? 390 : 630} y={P ? 860 : 510} text="ε = الاستجابة" color={ink.c1} size={18} />
        <T x={P ? 270 : 480} y={P ? 860 : 510} size={30} color={ink.c2} weight={700}>?</T>
      </g>
    </g>
  );
}
