import React from 'react';
import { Arrow, Ball, Spring, T, Tag, ink } from './parts';

// Matter scenes: states of matter, the particle–spring model, crystalline vs amorphous.
export type On = (unit: string, ms?: number) => number;
export type SceneProps = { on: On; P: boolean };

/** Deterministic jitter so the same frame always draws the same "random" particles. */
const rnd = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function Container({ x, y, w, h, o = 1 }: { x: number; y: number; w: number; h: number; o?: number }) {
  return <path d={`M${x} ${y} V${y + h} H${x + w} V${y}`} fill="none" stroke={ink.soft} strokeWidth={4} strokeLinecap="round" opacity={o} />;
}

function Hook({ P, o }: { P: boolean; o: number }) {
  if (o <= 0) return null;
  const cx = P ? 270 : 480, cy = P ? 470 : 300;
  return (
    <g opacity={o}>
      <rect x={cx - 230} y={cy - 22} width={250} height={44} rx={8} fill="url(#steel)" />
      <path d={`M${cx + 60} ${cy + 60} l40 -120 h90 l40 120 z`} fill="url(#glassFill)" stroke={ink.glass} strokeWidth={2} />
      <T x={cx - 105} y={cy + 62} size={20} color={ink.soft}>قضيب معدني</T>
      <T x={cx + 145} y={cy + 92} size={20} color={ink.soft}>حتة زجاج</T>
      <T x={cx} y={cy - 120} size={88} color={ink.c2} weight={700}>?</T>
    </g>
  );
}

export function States({ on, P }: SceneProps) {
  const hook = 1 - on('U2'), focus = on('U5');
  const W = P ? 190 : 200, H = P ? 190 : 220;
  const slots = P
    ? [{ x: 60, y: 150 }, { x: 60, y: 430 }, { x: 60, y: 710 }]
    : [{ x: 100, y: 130 }, { x: 380, y: 130 }, { x: 660, y: 130 }];
  const info = [
    { u: 'U2', en: 'Solid', ar: 'صلب', note: 'شكل ثابت وحجم ثابت', tone: 'c1' as const },
    { u: 'U3', en: 'Liquid', ar: 'سائل', note: 'حجم ثابت · بياخد شكل الوعاء', tone: 'c4' as const },
    { u: 'U4', en: 'Gas', ar: 'غاز', note: 'بيملا الحيز كله', tone: 'c3' as const },
  ];
  return (
    <g>
      <Hook P={P} o={hook} />
      {info.map((s, k) => {
        const o = on(s.u), { x, y } = slots[k];
        if (o <= 0) return null;
        const dim = k > 0 ? 1 - 0.55 * focus : 1;
        const balls: Array<[number, number]> = [];
        if (k === 0) for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) balls.push([x + W / 2 - 51 + c * 34, y + H - 30 - r * 34]);
        if (k === 1) for (let i = 0; i < 18; i++) balls.push([x + 22 + (i % 6) * 31 + rnd(i) * 8, y + H - 22 - Math.floor(i / 6) * 27 - rnd(i + 9) * 6]);
        if (k === 2) for (let i = 0; i < 9; i++) balls.push([x + 25 + rnd(i * 3) * (W - 50), y + 25 + rnd(i * 7 + 1) * (H - 50)]);
        const lx = P ? 330 : x + W / 2, ly = P ? y + 70 : y + H + 44;
        return (
          <g key={k} opacity={o * dim} transform={`translate(0 ${(1 - o) * 14})`}>
            {k === 1 ? <rect x={x + 3} y={y + H - 98} width={W - 6} height={96} fill="url(#water)" /> : null}
            <Container x={x} y={y} w={W} h={H} />
            {balls.map(([bx, by], i) => <Ball key={i} x={bx} y={by} r={12} tone={s.tone} vib={k === 0 ? 1 : 0} />)}
            {k === 2 ? balls.slice(0, 5).map(([bx, by], i) => (
              <Arrow key={i} x1={bx} y1={by} x2={bx + (rnd(i + 4) - 0.5) * 60} y2={by + (rnd(i + 8) - 0.5) * 60} color={ink.c3} w={2.5} head={9} o={0.7} />
            )) : null}
            <T x={lx} y={ly} size={P ? 26 : 25} color={ink[s.tone]}>{`${s.en} — ${s.ar}`}</T>
            <T x={lx} y={ly + (P ? 38 : 34)} size={P ? 19 : 18} color={ink.soft} weight={500}>{s.note}</T>
          </g>
        );
      })}
      {focus > 0 ? (
        <g opacity={focus}>
          <rect x={slots[0].x - 14} y={slots[0].y - 14} width={W + 28} height={H + 28} rx={18} fill="none" stroke={ink.c1} strokeWidth={3} filter="url(#glow)" />
          <Tag x={P ? 330 : slots[0].x + W / 2} y={P ? slots[0].y + 150 : slots[0].y + H + 120} text="بيقاوم تغيير شكله" color={ink.c1} size={P ? 21 : 20} />
        </g>
      ) : null}
    </g>
  );
}

export function Lattice({ on, P }: SceneProps) {
  const cols = P ? 4 : 6, rows = P ? 5 : 4, gap = P ? 105 : 92;
  const x0 = (P ? 540 : 960) / 2 - ((cols - 1) * gap) / 2, y0 = P ? 200 : 105;
  const springs = on('U2'), pull = on('U3'), push = on('U4');
  // Highlighted pairs: one pulled apart (U3), one pushed together (U4).
  const pr = 1, pc = 1, qr = P ? 3 : 2, qc = P ? 1 : 3;
  const pos = (r: number, c: number): [number, number] => {
    let x = x0 + c * gap;
    if (r === pr && c === pc) x -= 17 * pull;
    if (r === pr && c === pc + 1) x += 17 * pull;
    if (r === qr && c === qc) x += 14 * push;
    if (r === qr && c === qc + 1) x -= 14 * push;
    return [x, y0 + r * gap];
  };
  const cells = Array.from({ length: rows * cols }, (_, i) => [Math.floor(i / cols), i % cols] as [number, number]);
  return (
    <g>
      {cells.map(([r, c]) => {
        const [x, y] = pos(r, c);
        const right = c < cols - 1 ? pos(r, c + 1) : null, down = r < rows - 1 ? pos(r + 1, c) : null;
        const hot = (r === pr && c === pc && pull > 0) || (r === qr && c === qc && push > 0);
        return (
          <g key={`s${r}${c}`} opacity={springs}>
            {right ? <Spring x1={x + 13} y1={y} x2={right[0] - 13} y2={right[1]} color={hot ? (r === pr ? ink.c2 : ink.no) : ink.muted} w={hot ? 3.5 : 2.5} amp={hot ? 7 : 5} /> : null}
            {down ? <Spring x1={x} y1={y + 13} x2={down[0]} y2={down[1] - 13} /> : null}
          </g>
        );
      })}
      {cells.map(([r, c]) => {
        const [x, y] = pos(r, c);
        const hl = (r === pr && (c === pc || c === pc + 1) && pull > 0) || (r === qr && (c === qc || c === qc + 1) && push > 0);
        return <Ball key={`b${r}${c}`} x={x} y={y} r={14} tone={hl ? 'c2' : 'c1'} vib={on('U1')} o={on('U1')} />;
      })}
      {pull > 0 ? (() => {
        const [ax, ay] = pos(pr, pc), [bx] = pos(pr, pc + 1);
        return (
          <g opacity={pull * (1 - 0.5 * push)}>
            <Arrow x1={bx + 46} y1={ay - 32} x2={bx + 6} y2={ay - 32} color={ink.c2} w={4} head={12} />
            <Arrow x1={ax - 46} y1={ay - 32} x2={ax - 6} y2={ay - 32} color={ink.c2} w={4} head={12} />
            <Tag x={P ? 270 : 300} y={P ? 700 : 435} text="اتبعدوا ← التآثر يشدّهم يرجعوا" color={ink.c2} size={P ? 17 : 17} />
          </g>
        );
      })() : null}
      {push > 0 ? (() => {
        const [ax, ay] = pos(qr, qc), [bx] = pos(qr, qc + 1);
        return (
          <g opacity={push}>
            <Arrow x1={ax + 6} y1={ay + 34} x2={ax - 40} y2={ay + 34} color={ink.no} w={4} head={12} />
            <Arrow x1={bx - 6} y1={ay + 34} x2={bx + 40} y2={ay + 34} color={ink.no} w={4} head={12} />
            <Tag x={P ? 270 : 680} y={P ? 750 : 435} text="اتقرّبوا ← التآثر يزقّهم" color={ink.no} size={17} />
          </g>
        );
      })() : null}
      <Tag x={P ? 270 : 480} y={P ? 880 : 495} text="نموذج توضيحي: السوست بتمثّل التآثر، مش سوست حقيقية" color={ink.soft} size={P ? 16 : 17} o={springs * (1 - pull)} />
      <Tag x={P ? 270 : 480} y={P ? 880 : 495} text="كل تشويه بتقابله قوى بترجّع الجسيمات لمكانها" color={ink.c1} size={P ? 17 : 18} o={push} />
    </g>
  );
}

function Crystal({ x, y, n, gap, nacl, o, cell }: { x: number; y: number; n: number; gap: number; nacl: number; o: number; cell: number }) {
  if (o <= 0) return null;
  const pts = Array.from({ length: n * n }, (_, i) => [i % n, Math.floor(i / n)]);
  return (
    <g opacity={o}>
      {pts.map(([c, r]) => {
        const big = (c + r) % 2 === 0;
        return <Ball key={`${c}${r}`} x={x + c * gap} y={y + r * gap} r={nacl > 0 ? (big ? 15 : 9) : 12} tone={nacl > 0 ? (big ? 'c1' : 'c3') : 'c1'} />;
      })}
      {[0, 2].map((k) => (
        <rect key={k} x={x + k * gap - gap / 2} y={y - gap / 2} width={gap * 2} height={gap * 2} fill="none" stroke={ink.c2}
          strokeWidth={2.5} strokeDasharray="8 6" opacity={cell * (k === 0 ? 1 : 0.55)} rx={6} />
      ))}
    </g>
  );
}

function Glass({ x, y, w, h, o }: { x: number; y: number; w: number; h: number; o: number }) {
  if (o <= 0) return null;
  const pts = Array.from({ length: 22 }, (_, i) => [x + ((i % 5) + rnd(i) * 0.8) * (w / 5), y + (Math.floor(i / 5) + rnd(i + 30) * 0.8) * (h / 5)]);
  const bonds: Array<[number, number]> = [];
  pts.forEach((a, i) => pts.forEach((b, j) => { if (j > i && Math.hypot(a[0] - b[0], a[1] - b[1]) < w / 4.2) bonds.push([i, j]); }));
  return (
    <g opacity={o}>
      {bonds.map(([i, j], k) => <line key={k} x1={pts[i][0]} y1={pts[i][1]} x2={pts[j][0]} y2={pts[j][1]} stroke={ink.muted} strokeWidth={2} />)}
      {pts.map(([px, py], i) => <Ball key={i} x={px} y={py} r={11} tone="c4" />)}
    </g>
  );
}

export function Structures({ on, P }: SceneProps) {
  const crys = on('U1'), nacl = on('U2'), amor = on('U3'), notes = on('U4');
  const L = P ? { x: 150, y: 210 } : { x: 145, y: 160 };
  const R = P ? { x: 110, y: 600 } : { x: 560, y: 150 };
  return (
    <g>
      <g transform={P ? undefined : `translate(${220 * (1 - amor)} 0)`}>
      <T x={P ? 270 : 260} y={P ? 150 : 100} size={P ? 26 : 25} color={ink.c1} o={crys}>Crystalline — بلوري</T>
      <Crystal x={L.x} y={L.y} n={5} gap={P ? 60 : 58} nacl={nacl} o={crys} cell={crys * (1 - nacl * 0.4)} />
      <g opacity={nacl}>
        <Ball x={P ? 150 : 110} y={P ? 500 : 455} r={15} tone="c1" />
        <T x={P ? 195 : 155} y={P ? 500 : 455} size={20} anchor="start" math>Cl⁻</T>
        <Ball x={P ? 280 : 240} y={P ? 500 : 455} r={9} tone="c3" />
        <T x={P ? 320 : 280} y={P ? 500 : 455} size={20} anchor="start" math>Na⁺</T>
        <Tag x={P ? 430 : 400} y={P ? 500 : 455} text="NaCl" color={ink.c2} size={19} math />
      </g>
      </g>
      <T x={P ? 270 : 700} y={P ? 560 : 100} size={P ? 26 : 25} color={ink.c4} o={amor}>Amorphous — غير متبلور</T>
      <Glass x={R.x} y={R.y} w={P ? 320 : 300} h={P ? 230 : 270} o={amor} />
      <Tag x={P ? 270 : 700} y={P ? 855 : 455} text="مثال: الزجاج" color={ink.c4} size={19} o={amor * (1 - notes)} />
      <g opacity={notes}>
        <Tag x={P ? 270 : 700} y={P ? 855 : 445} text="غير متبلور ≠ مفيش روابط" color={ink.c2} size={P ? 18 : 18} />
        <Tag x={P ? 270 : 700} y={P ? 905 : 495} text="بلوري ≠ أقوى (القوة محتاجة اختبار)" color={ink.c2} size={P ? 18 : 18} />
      </g>
    </g>
  );
}
