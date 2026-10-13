import React from 'react';
import { Tex, mathFont, palette, uiFont } from './mathkit';

// SVG building blocks from the Physics I board kit, reused for the Mathematics I (Calculus) boards.
// Every element is static for a given step; entrance motion comes from the cue progress.

export const ink = {
  ...palette,
  steel: '#9fb3c8', steelHi: '#e3ebf4', steelLo: '#53657c', hot: '#ff8a5c', glass: '#8fd3ff',
};
const ARABIC = /[؀-ۿ]/;

export function Defs() {
  return (
    <defs>
      <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ink.steelHi} />
        <stop offset="0.45" stopColor={ink.steel} />
        <stop offset="1" stopColor={ink.steelLo} />
      </linearGradient>
      <linearGradient id="steelHot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffd9c7" />
        <stop offset="0.45" stopColor={ink.hot} />
        <stop offset="1" stopColor="#8a3a22" />
      </linearGradient>
      <linearGradient id="glassFill" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={ink.glass} stopOpacity="0.55" />
        <stop offset="1" stopColor={ink.glass} stopOpacity="0.12" />
      </linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ink.c4} stopOpacity="0.35" />
        <stop offset="1" stopColor={ink.c4} stopOpacity="0.12" />
      </linearGradient>
      {(['c1', 'c2', 'c3', 'c4', 'no', 'ok'] as const).map((c) => (
        <radialGradient key={c} id={`ball-${c}`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.35" stopColor={ink[c]} />
          <stop offset="1" stopColor={ink[c]} stopOpacity="0.55" />
        </radialGradient>
      ))}
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** Text in the board: Arabic runs right-to-left, math in the math face. */
export function T({ x, y, children, size = 22, color = ink.ink, anchor = 'middle', o = 1, weight = 600, math = false }: {
  x: number; y: number; children: React.ReactNode; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end';
  o?: number; weight?: number; math?: boolean;
}) {
  const rtl = typeof children === 'string' && ARABIC.test(children);
  return (
    <text x={x} y={y} fontSize={size} fill={color} opacity={o} textAnchor={anchor} fontWeight={weight}
      fontFamily={math ? mathFont : uiFont} fontStyle={math ? 'italic' : undefined}
      direction={rtl ? 'rtl' : 'ltr'} unicodeBidi="isolate" dominantBaseline="middle">
      {children}
    </text>
  );
}

export function Arrow({ x1, y1, x2, y2, color = ink.c2, w = 6, o = 1, head = 16 }: {
  x1: number; y1: number; x2: number; y2: number; color?: string; w?: number; o?: number; head?: number;
}) {
  if (o <= 0) return null;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - Math.cos(a) * head * 0.8, by = y2 - Math.sin(a) * head * 0.8;
  const p = (d: number, s: number) => `${x2 - Math.cos(a + s) * d},${y2 - Math.sin(a + s) * d}`;
  return (
    <g opacity={o}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${p(head, 0.45)} ${p(head, -0.45)}`} fill={color} />
    </g>
  );
}

/** Engineering dimension line with end ticks and a centred label. */
export function Dim({ x1, x2, y, label, color = ink.soft, o = 1, size = 20, math = true }: {
  x1: number; x2: number; y: number; label: string; color?: string; o?: number; size?: number; math?: boolean;
}) {
  if (o <= 0) return null;
  const mid = (x1 + x2) / 2;
  return (
    <g opacity={o} stroke={color} strokeWidth={2}>
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 9} x2={x1} y2={y + 9} />
      <line x1={x2} y1={y - 9} x2={x2} y2={y + 9} />
      <g stroke="none">
        <rect x={mid - label.length * size * 0.3 - 8} y={y - size * 0.75} width={label.length * size * 0.6 + 16} height={size * 1.5} rx={6} fill={ink.bg} />
        <T x={mid} y={y + 1} size={size} color={color} math={math} weight={500}>{label}</T>
      </g>
    </g>
  );
}

/** A particle; `vib` draws the small arcs that show it vibrating about its place. */
export function Ball({ x, y, r = 11, tone = 'c1', o = 1, vib = 0 }: { x: number; y: number; r?: number; tone?: 'c1' | 'c2' | 'c3' | 'c4' | 'no' | 'ok'; o?: number; vib?: number }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      {vib > 0 ? (
        <g stroke={ink[tone]} strokeWidth={2} fill="none" opacity={0.55 * vib} strokeLinecap="round">
          <path d={`M${x - r - 6} ${y - 5} q-4 5 0 10`} />
          <path d={`M${x + r + 6} ${y - 5} q4 5 0 10`} />
        </g>
      ) : null}
      <circle cx={x} cy={y} r={r} fill={`url(#ball-${tone})`} />
    </g>
  );
}

/** Zig-zag spring between two points; it stretches or squeezes with its ends. */
export function Spring({ x1, y1, x2, y2, coils = 5, amp = 5, color = ink.muted, w = 2.5, o = 1 }: {
  x1: number; y1: number; x2: number; y2: number; coils?: number; amp?: number; color?: string; w?: number; o?: number;
}) {
  if (o <= 0) return null;
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const pts: string[] = [`${x1},${y1}`];
  const n = coils * 2;
  for (let i = 1; i < n; i++) {
    const t = 0.15 + (0.7 * i) / n, s = i % 2 ? amp : -amp;
    pts.push(`${x1 + ux * len * t - uy * s},${y1 + uy * len * t + ux * s}`);
  }
  pts.push(`${x2},${y2}`);
  return <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={w} strokeLinejoin="round" opacity={o} />;
}

/** Wall with hatching that a rod is clamped to. */
export function Wall({ x, y, h, o = 1 }: { x: number; y: number; h: number; o?: number }) {
  return (
    <g opacity={o}>
      <rect x={x - 18} y={y} width={18} height={h} fill={ink.panel} stroke={ink.line} />
      {Array.from({ length: Math.floor(h / 14) }, (_, i) => (
        <line key={i} x1={x - 18} y1={y + 14 * i + 14} x2={x} y2={y + 14 * i} stroke={ink.muted} strokeWidth={1.5} />
      ))}
    </g>
  );
}

/** Metal rod from x with length `len`; `hot` tints it for overload. */
export function Rod({ x, y, len, h = 30, hot = 0, o = 1 }: { x: number; y: number; len: number; h?: number; hot?: number; o?: number }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <rect x={x} y={y - h / 2} width={len} height={h} rx={5} fill="url(#steel)" />
      {hot > 0 ? <rect x={x} y={y - h / 2} width={len} height={h} rx={5} fill="url(#steelHot)" opacity={hot} /> : null}
      <ellipse cx={x + len} cy={y} rx={5} ry={h / 2} fill={ink.steelLo} />
    </g>
  );
}

/** Rounded label box drawn in the SVG. */
export function Tag({ x, y, text, color = ink.c1, o = 1, size = 19, math = false }: {
  x: number; y: number; text: string; color?: string; o?: number; size?: number; math?: boolean;
}) {
  if (o <= 0) return null;
  const w = text.length * size * (math ? 0.55 : 0.58) + 28;
  return (
    <g opacity={o}>
      <rect x={x - w / 2} y={y - size} width={w} height={size * 2} rx={size} fill={ink.panel} stroke={color} strokeWidth={1.5} />
      <T x={x} y={y + 1} size={size} color={color} math={math} weight={600}>{text}</T>
    </g>
  );
}

/** Typeset math (mathkit markup) placed in the SVG, centred in its box; slides in with `o`. */
export function Eq({ x, y, w, h = 80, src, size = 40, o = 1 }: { x: number; y: number; w: number; h?: number; src: string; size?: number; o?: number }) {
  if (o <= 0) return null;
  return (
    <foreignObject x={x} y={y + (1 - o) * 12} width={w} height={h} opacity={o}>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Tex src={src} size={size} />
      </div>
    </foreignObject>
  );
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
