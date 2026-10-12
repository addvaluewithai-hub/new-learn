import React from 'react';
import { Tex, palette, uiFont } from './mathkit';
import { progress, type Clock } from './clock';
import { Area, Pies, type AreaSpec, type PieSpec } from './shapes';

// Cue-driven diagram widgets for the Mathematics I boards (identical copy per lesson).
type Beat = { at?: string };
export type WidgetSpec =
  | (Beat & { kind: 'steps'; items: Array<{ at: string; ar: string; en?: string }>; focus?: Array<{ at: string; until?: string; index: number }> })
  | (Beat & { kind: 'table'; cols: string[]; rows: Array<{ at?: string; cells: string[] }>; hl?: Array<{ at: string; until?: string; row?: number; col?: number }> })
  | (Beat & { kind: 'graph'; curves: Array<{ at: string; c: number; tone: 'c1' | 'c2' | 'c3'; label: string }> })
  | (Beat & { kind: 'numberline'; holes: number[]; range: [number, number]; label: string })
  | (Beat & { kind: 'bars'; num: number; den: number; numLabel: string; denLabel: string })
  | (Beat & { kind: 'pies'; pies: PieSpec[] })
  | (Beat & { kind: 'area' } & AreaSpec);

const tone = { c1: palette.c1, c2: palette.c2, c3: palette.c3 };

function Cell({ v, size }: { v: string; size: number }) {
  return v.startsWith('@') ? (
    <span dir="rtl" style={{ fontFamily: uiFont, fontSize: size * 0.62, color: palette.soft }}>{v.slice(1)}</span>
  ) : (
    <Tex src={v} size={size} />
  );
}

function Steps({ spec, clock }: { spec: Extract<WidgetSpec, { kind: 'steps' }>; clock: Clock }) {
  const shown = spec.items.map((it) => progress(clock, it.at));
  const latest = shown.reduce((acc, p, i) => (p > 0 ? i : acc), -1);
  const focused = (spec.focus ?? []).filter((f) => progress(clock, f.at, 1) > 0 && !(f.until && progress(clock, f.until, 1) > 0)).map((f) => f.index);
  const active = focused.length ? focused : [latest];
  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: clock.portrait ? 'column' : 'row', gap: 12, alignItems: 'stretch', justifyContent: 'center', width: '100%' }}>
      {spec.items.map((it, i) => (
        <div key={i} style={{ opacity: 0.25 + 0.75 * shown[i], flex: 1, maxWidth: clock.portrait ? undefined : 220, background: palette.panel, borderRadius: 16, padding: clock.portrait ? '14px 18px' : '10px 14px', border: `2px solid ${active.includes(i) && shown[i] > 0 ? palette.c4 : palette.line}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 15, color: palette.muted }}>{i + 1}</span>
          <span style={{ fontSize: clock.portrait ? 26 : 19, fontWeight: 600 }}>{it.ar}</span>
          {it.en ? <span dir="ltr" style={{ fontSize: 15, color: palette.soft }}>{it.en}</span> : null}
        </div>
      ))}
    </div>
  );
}

function Table({ spec, clock }: { spec: Extract<WidgetSpec, { kind: 'table' }>; clock: Clock }) {
  const size = clock.portrait ? 30 : 27;
  const hl = (spec.hl ?? []).map((h) => ({ ...h, v: progress(clock, h.at, 400) * (1 - progress(clock, h.until, 300)) })).filter((h) => h.v > 0);
  const glow = (r: number, c: number) => Math.max(0, ...hl.filter((h) => (h.row == null || h.row === r) && (h.col == null || h.col === c)).map((h) => h.v));
  return (
    <div dir="rtl" style={{ display: 'grid', gridTemplateColumns: `repeat(${spec.cols.length}, auto)`, gap: 0, background: palette.panel, borderRadius: 16, border: `1px solid ${palette.line}`, overflow: 'hidden', maxWidth: '100%' }}>
      {spec.cols.map((c, i) => (
        <div key={`h${i}`} style={{ padding: '8px 14px', borderBottom: `1px solid ${palette.line}`, display: 'grid', placeItems: 'center', color: palette.soft, background: `rgba(108,184,255,${0.16 * glow(-1, i)})` }}><Cell v={c} size={size * 0.85} /></div>
      ))}
      {spec.rows.map((r, ri) => {
        const p = progress(clock, r.at ?? spec.at);
        return r.cells.map((cell, ci) => (
          <div key={`${ri}-${ci}`} style={{ opacity: p, padding: '7px 14px', display: 'grid', placeItems: 'center', borderTop: ri ? `1px solid ${palette.line}55` : undefined, background: `rgba(108,184,255,${0.18 * glow(ri, ci)})` }}><Cell v={cell} size={size} /></div>
        ));
      })}
    </div>
  );
}

function Graph({ spec, clock }: { spec: Extract<WidgetSpec, { kind: 'graph' }>; clock: Clock }) {
  const W = clock.portrait ? 420 : 380, H = clock.portrait ? 260 : 250;
  const sx = (x: number) => W / 2 + x * (W / 6), sy = (y: number) => H * 0.72 - y * (H / 7);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ background: palette.panel, borderRadius: 16, border: `1px solid ${palette.line}` }}>
      <line x1={12} x2={W - 12} y1={sy(0)} y2={sy(0)} stroke={palette.muted} strokeWidth={1.5} />
      <line x1={sx(0)} x2={sx(0)} y1={10} y2={H - 10} stroke={palette.muted} strokeWidth={1.5} />
      <text x={W - 22} y={sy(0) - 8} fill={palette.muted} fontSize={15} fontStyle="italic">x</text>
      {spec.curves.map((cv, i) => {
        const p = progress(clock, cv.at, 900);
        if (p <= 0) return null;
        const pts = Array.from({ length: 61 }, (_, k) => -2.6 + (5.2 * k) / 60).filter((x) => x <= -2.6 + 5.2 * p);
        const d = pts.map((x, k) => `${k ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(x * x + cv.c).toFixed(1)}`).join(' ');
        const roots = cv.c < 0 ? [-Math.sqrt(-cv.c), Math.sqrt(-cv.c)] : [];
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={tone[cv.tone]} strokeWidth={3.5} strokeLinecap="round" />
            {roots.map((r) => <circle key={r} cx={sx(r)} cy={sy(0)} r={6 * p} fill={tone[cv.tone]} />)}
            <text x={sx(1.05)} y={sy(1.1 + cv.c) - 10} fill={tone[cv.tone]} fontSize={17} fontFamily='"STIX Two Text", serif' fontStyle="italic" opacity={p}>{cv.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function NumberLine({ spec, clock }: { spec: Extract<WidgetSpec, { kind: 'numberline' }>; clock: Clock }) {
  const W = clock.portrait ? 460 : 560, [a, b] = spec.range;
  const sx = (x: number) => 30 + ((x - a) / (b - a)) * (W - 60);
  const p = progress(clock, spec.at, 700);
  return (
    <svg width={W} height={110} viewBox={`0 0 ${W} 110`}>
      <line x1={20} x2={20 + (W - 40) * p} y1={50} y2={50} stroke={palette.c4} strokeWidth={4} strokeLinecap="round" />
      {Array.from({ length: b - a + 1 }, (_, k) => a + k).map((n) => (
        <g key={n} opacity={p}>
          <line x1={sx(n)} x2={sx(n)} y1={42} y2={58} stroke={palette.muted} />
          <text x={sx(n)} y={86} fill={palette.soft} fontSize={20} textAnchor="middle">{n < 0 ? `−${-n}` : n}</text>
        </g>
      ))}
      {spec.holes.map((h) => <circle key={h} cx={sx(h)} cy={50} r={9} fill={palette.bg} stroke={palette.no} strokeWidth={3.5} opacity={p} />)}
      <text x={W / 2} y={22} fill={palette.no} fontSize={22} textAnchor="middle" opacity={p} fontFamily={uiFont}>{spec.label}</text>
    </svg>
  );
}

function Bars({ spec, clock }: { spec: Extract<WidgetSpec, { kind: 'bars' }>; clock: Clock }) {
  const p = progress(clock, spec.at, 700), unit = clock.portrait ? 70 : 62;
  const proper = spec.num < spec.den;
  const bar = (n: number, label: string, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span dir="rtl" style={{ width: 92, textAlign: 'right', fontSize: 17, color: palette.soft }}>{label}</span>
      <div style={{ height: 22, width: Math.max(6, n * unit * p), background: color, borderRadius: 11 }} />
      <span style={{ fontSize: 20, fontWeight: 600 }}>{n}</span>
    </div>
  );
  return (
    <div dir="ltr" style={{ display: 'flex', flexDirection: 'column', gap: 12, background: palette.panel, padding: '16px 22px', borderRadius: 16, border: `1px solid ${palette.line}` }}>
      {bar(spec.num, spec.numLabel, palette.c1)}
      {bar(spec.den, spec.denLabel, palette.c2)}
      <div style={{ alignSelf: 'center', marginTop: 4, fontSize: 21, fontWeight: 700, color: proper ? palette.ok : palette.c2, opacity: p }}>{proper ? 'Proper' : 'Improper'}</div>
    </div>
  );
}

export function Widget({ spec, clock }: { spec: WidgetSpec; clock: Clock }): React.ReactElement {
  if (spec.kind === 'steps') return <Steps spec={spec} clock={clock} />;
  if (spec.kind === 'table') return <Table spec={spec} clock={clock} />;
  if (spec.kind === 'graph') return <Graph spec={spec} clock={clock} />;
  if (spec.kind === 'numberline') return <NumberLine spec={spec} clock={clock} />;
  if (spec.kind === 'pies') return <Pies pies={spec.pies} clock={clock} />;
  if (spec.kind === 'area') return <Area spec={spec} clock={clock} />;
  return <Bars spec={spec} clock={clock} />;
}
