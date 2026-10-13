import React from 'react';
import { Eq, T, Tag, ink } from './parts';
import { Axis, Card, Dot, Pin, Ticks, ltr, scale, type SceneProps, type Tone } from './axis';
import { Elem, Venn } from './sets';

// Question boards show the data only; feedback boards solve it on the cue of each feedback unit.
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function Q1({ on, P, feedback }: SceneProps) {
  const nums = [
    { src: '-\\f{9}{5}', u: 'U1', note: '\\f{m}{n}\\ \\ok{\\t{✓}}', slot: 0 },
    { src: '\\sqrt{7}', u: 'U4', note: '2 < \\sqrt{7} < 3', slot: 3 },
    { src: '0.375', u: 'U2', note: '= \\f{3}{8}', slot: 1 },
    { src: '\\sqrt{16}', u: 'U3', note: '= 4', slot: 2 },
  ];
  const top = (i: number) => (P ? { x: 75 + i * 130, y: 150 } : { x: 150 + i * 220, y: 120 });
  const slot = (k: number) => (P ? (k < 3 ? { x: 100 + k * 170, y: 370 } : { x: 270, y: 700 }) : k < 3 ? { x: 130 + k * 190, y: 340 } : { x: 775, y: 340 });
  const Q = P ? [20, 250, 520, 570] : [40, 230, 600, 520];
  const I = P ? [20, 600, 520, 880] : [630, 230, 920, 520];
  return (
    <g>
      {[{ b: Q, t: 'ℚ  نسبي', c: ink.ok }, { b: I, t: 'غير نسبي', c: ink.c3 }].map((k) => (
        <g key={k.t}>
          <rect x={k.b[0]} y={k.b[1]} width={k.b[2] - k.b[0]} height={k.b[3] - k.b[1]} rx={24} fill={ink.panel} fillOpacity={0.5} stroke={k.c} strokeDasharray="8 6" strokeWidth={2} />
          <T x={(k.b[0] + k.b[2]) / 2} y={k.b[1] + 28} size={22} color={k.c}>{k.t}</T>
        </g>
      ))}
      {nums.map((n, i) => {
        const o = feedback ? on(n.u) : 0, a = top(i), b = slot(n.slot);
        const x = mix(a.x, b.x, o), y = mix(a.y, b.y, o), w = P ? 120 : 170;
        return (
          <g key={n.src}>
            <rect x={x - w / 2} y={y - 42} width={w} height={84} rx={18} fill={ink.panel} stroke={o > 0.5 ? (n.slot === 3 ? ink.c3 : ink.ok) : ink.line} strokeWidth={1.8} />
            <Eq x={x - w / 2} y={y - 42} w={w} h={84} src={n.src} size={P ? 30 : 36} />
            <Eq x={b.x - 110} y={b.y + 52} w={220} h={64} src={n.note} size={P ? 22 : 24} o={o} />
          </g>
        );
      })}
    </g>
  );
}

export function Q2({ on, P, feedback }: SceneProps) {
  const place = feedback ? on('U1', 700) : 0, uni = feedback ? on('U2') : 0, int = feedback ? on('U3') : 0, five = feedback ? on('U4') : 0;
  const a: [number, number] = P ? [195, 350] : [250, 320], b: [number, number] = P ? [345, 350] : [410, 320], r = P ? 110 : 118;
  const dx = P ? 130 : 140, mid = (a[0] + b[0]) / 2;
  const els = [
    { v: '0', x: mid - dx, y: a[1] - 32, tone: 'c1' as Tone }, { v: '5', x: mid - dx, y: a[1] + 34, tone: 'c1' as Tone },
    { v: '2', x: mid, y: a[1] - 32, tone: 'c2' as Tone }, { v: '7', x: mid, y: a[1] + 34, tone: 'c2' as Tone },
    { v: '1', x: mid + dx, y: a[1] - 32, tone: 'c4' as Tone }, { v: '6', x: mid + dx, y: a[1] + 34, tone: 'c4' as Tone },
  ];
  const col = P ? { x: 40, w: 460, y: [520, 610, 700] } : { x: 570, w: 370, y: [190, 280, 370] };
  return (
    <g>
      <Card x={P ? 40 : 40} y={P ? 70 : 60} w={P ? 460 : 420} h={60} src="A = \{0, 2, 5, 7\}" size={30} tone="c1" />
      <Card x={P ? 40 : 500} y={P ? 145 : 60} w={P ? 460 : 420} h={60} src="B = \{1, 2, 6, 7\}" size={30} tone="c4" />
      <Venn id="q2" a={a} b={b} r={r} union={uni * (1 - int)} inter={int} />
      {els.map((e, k) => <Elem key={e.v} x={e.x} y={e.y} v={e.v} tone={five > 0 && e.v === '5' ? 'no' : e.tone} o={clamp(place * 6 - k)} r={19} />)}
      {feedback ? (
        <g>
          <Card x={col.x} y={col.y[0]} w={col.w} h={70} src="A \cup B = \{0, 1, 2, 5, 6, 7\}" size={P ? 28 : 26} tone="c1" o={uni} />
          <Card x={col.x} y={col.y[1]} w={col.w} h={70} src="A \cap B = \{\c2{2}, \c2{7}\}" size={30} tone="c2" o={int} />
          <Card x={col.x} y={col.y[2]} w={col.w} h={70} src="5 \notin B" size={32} tone="no" o={five} />
        </g>
      ) : (
        <g>
          {['A \\cup B = ?', 'A \\cap B = ?', '5 \\in B\\ ?'].map((s, i) => (
            <Card key={s} x={col.x + (P ? 60 : 40)} y={col.y[i]} w={col.w - (P ? 120 : 80)} h={64} src={s} size={30} tone="c2" />
          ))}
        </g>
      )}
    </g>
  );
}

export function Q3({ on, P, feedback }: SceneProps) {
  const pts = [
    { v: 2, src: '-2', img: '2', tone: 'c2' as Tone },
    { v: Math.sqrt(3), src: '-\\sqrt{3}', img: '\\sqrt{3}', tone: 'c1' as Tone },
    { v: 1.5, src: '-\\f{3}{2}', img: '\\f{3}{2}', tone: 'c4' as Tone },
  ];
  if (!feedback) {
    return (
      <g>
        {pts.map((p, i) => (
          <Card key={p.src} x={P ? 30 + i * 165 : 160 + i * 230} y={P ? 220 : 130} w={P ? 150 : 180} h={100} src={p.src} size={P ? 36 : 42} />
        ))}
        <Card x={P ? 70 : 280} y={P ? 400 : 290} w={P ? 400 : 400} h={70} src="? < ? < ?" size={34} tone="c2" />
        <Card x={P ? 70 : 280} y={P ? 500 : 385} w={P ? 400 : 400} h={70} src="\times (-1)\ \to\ ? < ? < ?" size={30} tone="c2" />
      </g>
    );
  }
  const est = on('U1'), neg = on('U2', 700), flip = on('U3', 800), trap = on('U4');
  const x1 = P ? 50 : 80, x2 = P ? 490 : 640, y1 = P ? 400 : 220, y2 = P ? 640 : 420;
  const n = scale(-2.1, -1.4, x1, x2), p = scale(1.4, 2.1, x1, x2);
  return (
    <g>
      <g opacity={1 - est}>
        {pts.map((q, i) => (
          <Card key={q.src} x={P ? 30 + i * 165 : 160 + i * 230} y={P ? 220 : 130} w={P ? 150 : 180} h={100} src={q.src} size={P ? 36 : 42} />
        ))}
      </g>
      <Card x={P ? 20 : 40} y={P ? 70 : 52} w={P ? 500 : 880} h={P ? 110 : 64} src="1.7^2 = 2.89 < 3 < 3.24 = 1.8^2\q \sqrt{3} \approx 1.73" size={P ? 26 : 26} o={est * (1 - trap)} />
      <Tag x={P ? 270 : 480} y={P ? 125 : 84} text={`غلط: ${ltr('−2 > −1.5')} عشان ${ltr('2 > 1.5')} ✗`} color={ink.no} size={P ? 18 : 20} o={trap} />
      <g opacity={neg}>
        <Axis x1={x1} x2={x2} y={y1} />
        <Ticks at={n} y={y1} values={[-2, -1.5]} labels={(v) => (v === -2 ? '−2' : '−1.5')} size={16} />
        {pts.map((q) => <Dot key={q.src} x={n(-q.v)} y={y1} tone={q.tone} />)}
        {pts.map((q, i) => <Pin key={q.src} x={n(-q.v)} y={y1} dy={i === 1 ? -50 : -50} src={q.src} tone={q.tone} size={22} w={100} />)}
        <Card x={P ? 40 : 670} y={P ? 250 : 186} w={P ? 460 : 270} h={64} src="-2 < -\sqrt{3} < -\f{3}{2}" size={P ? 28 : 24} tone="ok" />
      </g>
      <g opacity={flip}>
        {pts.map((q) => (
          <path key={q.src} d={`M${n(-q.v)} ${y1 + 14} C${n(-q.v)} ${(y1 + y2) / 2}, ${p(q.v)} ${(y1 + y2) / 2}, ${p(q.v)} ${y2 - 14}`} fill="none" stroke={ink[q.tone]} strokeWidth={2} strokeDasharray="5 5" />
        ))}
        <Axis x1={x1} x2={x2} y={y2} />
        <Ticks at={p} y={y2} values={[1.5, 2]} labels={false} />
        {pts.map((q) => <Dot key={q.src} x={p(q.v)} y={y2} tone={q.tone} />)}
        {pts.map((q) => <Pin key={q.src} x={p(q.v)} y={y2} dy={56} src={q.img} tone={q.tone} size={22} w={90} />)}
        <Tag x={P ? 270 : 805} y={P ? (y1 + y2) / 2 : 318} text="× (−1)" color={ink.c2} size={20} math />
        <Card x={P ? 40 : 670} y={P ? 740 : 386} w={P ? 460 : 270} h={64} src="\f{3}{2} < \sqrt{3} < 2" size={P ? 28 : 26} tone="no" />
        <T x={P ? 270 : 805} y={P ? 832 : 475} size={17} color={ink.no} weight={600}>الترتيب اتقلب ⇄</T>
      </g>
    </g>
  );
}

export function Recap({ on, P }: SceneProps) {
  const cards = [
    { u: 'U1', t: 'الخط والترتيب', s: 'الضرب في سالب والمقلوب بيقلبوا العلامة', src: '\\times(-1),\\ \\f{1}{x}\\q \\to\\q \\no{\\t{⇄}}' },
    { u: 'U2', t: 'عائلات الأعداد', s: 'نسبي: منتهي أو دوري · غير نسبي: لا ده ولا ده', src: '\\c1{ℕ} \\sub \\c4{ℤ} \\sub \\c2{ℚ} \\sub ℝ' },
    { u: 'U3', t: 'المجموعات', s: '∅ مفيهاش ولا عنصر', src: 'A \\cup B\\ \\t{«أو»}\\q A \\cap B\\ \\t{«و»}' },
    { u: 'U4', t: 'الدرس الجاي', s: 'الفترات (intervals) والمتباينات', src: '' },
  ];
  return (
    <g>
      {cards.map((c, i) => {
        const o = on(c.u);
        if (o <= 0) return null;
        const x = P ? 50 : 70 + (i % 2) * 420, y = P ? 140 + i * 190 : 80 + Math.floor(i / 2) * 215;
        const w = P ? 440 : 400, h = P ? 165 : 190;
        return (
          <g key={i} opacity={o} transform={`translate(0 ${(1 - o) * 12})`}>
            <rect x={x} y={y} width={w} height={h} rx={22} fill={ink.panel} stroke={i === 3 ? ink.c2 : ink.line} strokeWidth={i === 3 ? 2 : 1} />
            <T x={x + w / 2} y={y + 36} size={P ? 23 : 24} color={i === 3 ? ink.c2 : ink.c1}>{c.t}</T>
            {c.src ? <Eq x={x} y={y + 52} w={w} h={P ? 70 : 80} src={c.src} size={P ? 28 : 30} /> : null}
            <T x={x + w / 2} y={y + (c.src ? (P ? 140 : 156) : 100)} size={P ? 17 : 18} color={ink.soft} weight={500}>{c.s}</T>
          </g>
        );
      })}
    </g>
  );
}
