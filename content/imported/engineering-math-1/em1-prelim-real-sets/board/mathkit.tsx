import React from 'react';

// Mathematics I (Calculus) math kit: the Physics I/Algebra kit plus roots, bars and set symbols.
// A tiny TeX-like markup is typeset with real stacked fractions and colour-coded factors:
//   \f{num}{den}  fraction      x^2 / x^{n}  superscript   \c1{..}…\c4{..}  factor colours
//   \ok{..} \no{..} \mu{..}  tone   \g{name}{..}  named group for highlight/strike/zero effects
//   \box{..}  boxed result   \t{..}  upright words   \ne \ge \eq \to \cdot \q (wide space)  '\ ' (space)
//   \sqrt{..} radical   \bar{..} repeating block   \in \notin \cup \cap \empty \sub \pm \approx \mid   \{ \} braces

export const palette = {
  bg: '#0d1626', panel: '#15233a', line: '#2b3d5a', ink: '#eef3fa', soft: '#b9c6d8', muted: '#7d8fa9',
  c1: '#3dd6c6', c2: '#f6b84b', c3: '#b79dff', c4: '#6cb8ff', ok: '#5be08a', no: '#ff7a93',
};
export const toneColor: Record<string, string> = {
  c1: palette.c1, c2: palette.c2, c3: palette.c3, c4: palette.c4, ok: palette.ok, no: palette.no, mu: palette.muted,
};
export const mathFont = '"STIX Two Text", "Cambria Math", "Times New Roman", serif';
export const uiFont = '"IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif';

export type Effect = { hl?: number; strike?: number; zero?: number; dim?: number };
export type Effects = Record<string, Effect>;

type Node =
  | { k: 'txt'; s: string }
  | { k: 'frac'; n: Node[]; d: Node[] }
  | { k: 'sup'; b: Node[] }
  | { k: 'root'; b: Node[] }
  | { k: 'bar'; b: Node[] }
  | { k: 'grp'; tone?: string; name?: string; box?: boolean; upright?: boolean; c: Node[] };

const SYMBOLS: Record<string, string> = {
  ne: '≠', ge: '≥', q: '\u2003', eq: '≡', to: '→', cdot: '·', check: '✓', cross: '✗', times: '×', R: 'ℝ', dots: '…', le: '≤', lt: '<', gt: '>',
  div: '÷', leftrightarrow: '↔', in: '∈', notin: '∉', cup: '∪', cap: '∩', empty: '∅', sub: '⊂', pm: '±', approx: '≈', mid: '|', Z: 'ℤ', Q: 'ℚ', N: 'ℕ', pi: 'π',
};

function parse(src: string): Node[] {
  let i = 0;
  const block = (): Node[] => {
    if (src[i] !== '{') throw new Error(`mathkit: expected { at ${i} in ${src}`);
    i += 1;
    const out = seq('}');
    i += 1;
    return out;
  };
  const word = () => {
    const m = /^(c[1-4]|[a-zA-Z]+)/.exec(src.slice(i));
    i += m ? m[0].length : 0;
    return m ? m[0] : '';
  };
  const seq = (end?: string): Node[] => {
    const out: Node[] = [];
    while (i < src.length && src[i] !== end) {
      const ch = src[i];
      if (ch === '\\') {
        i += 1;
        const cmd = word();
        if (cmd === 'minus') out.push({ k: 'txt', s: '-' }); // explicit binary minus at a group start
        else if (cmd === '') {
          out.push({ k: 'txt', s: src[i] === ' ' ? '\u00a0' : src[i] });
          i += 1;
        } else if (cmd === 'f') out.push({ k: 'frac', n: block(), d: block() });
        else if (cmd === 'sqrt') out.push({ k: 'root', b: block() });
        else if (cmd === 'bar') out.push({ k: 'bar', b: block() });
        else if (/^c[1-4]$|^ok$|^no$|^mu$/.test(cmd)) out.push({ k: 'grp', tone: cmd, c: block() });
        else if (cmd === 'g') {
          const name = block().map((n) => (n.k === 'txt' ? n.s : '')).join('');
          out.push({ k: 'grp', name, c: block() });
        } else if (cmd === 'box') out.push({ k: 'grp', box: true, c: block() });
        else if (cmd === 't') out.push({ k: 'grp', upright: true, c: block() });
        else if (SYMBOLS[cmd]) out.push({ k: 'txt', s: SYMBOLS[cmd] });
        else throw new Error(`mathkit: unknown command \\${cmd}`);
      } else if (ch === '^') {
        i += 1;
        out.push({ k: 'sup', b: src[i] === '{' ? block() : [{ k: 'txt', s: src[i++] }] });
      } else {
        // A minus with no left operand (block start, or after ( = , : →) is unary: no operator padding.
        const prev = [...out].reverse().find((n) => n.k !== 'txt' || n.s.trim() || n.s.includes('\u2003'));
        const unary = ch === '-' && (!prev || (prev.k === 'txt' && /[(=,:→≡{<>≤≥∈|\u2003]$/.test(prev.s.trim() || prev.s)));
        out.push({ k: 'txt', s: unary ? '\u2212' : ch });
        i += 1;
      }
    }
    return out;
  };
  return seq();
}

const cache = new Map<string, Node[]>();
const parsed = (src: string) => {
  if (!cache.has(src)) cache.set(src, parse(src));
  return cache.get(src)!;
};

function Glyphs({ s, upright }: { s: string; upright?: boolean }) {
  // Letters are italic math variables; digits, operators and words stay upright.
  const pieces = upright ? [s] : s.split(/([a-zA-Z]|[+\-=<>≠≡→·×≤≥∈∉∪∩⊂≈|])/).filter(Boolean);
  return (
    <>
      {pieces.map((p, i) => {
        if (!upright && /^[+\-=<>≠≡→×≤≥∈∉∪∩⊂≈|]$/.test(p))
          return <span key={i} style={{ padding: '0 0.22em' }}>{p === '-' ? '−' : p}</span>;
        if (!upright && /^[a-zA-Z]$/.test(p))
          return <span key={i} style={{ fontStyle: 'italic', paddingRight: '0.04em' }}>{p}</span>;
        return <span key={i}>{p.replace(/ /g, '\u00a0')}</span>;
      })}
    </>
  );
}

function Render({ nodes, fx }: { nodes: Node[]; fx: Effects }): React.ReactElement {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.k === 'txt') return <Glyphs key={i} s={n.s} />;
        if (n.k === 'sup')
          return (
            <span key={i} style={{ display: 'inline-flex', fontSize: '0.62em', position: 'relative', top: '-0.62em', marginLeft: '0.05em' }}>
              <Render nodes={n.b} fx={fx} />
            </span>
          );
        if (n.k === 'root')
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'stretch', margin: '0 0.08em' }}>
              <span style={{ fontSize: '1.08em', lineHeight: 1, alignSelf: 'center', marginRight: '-0.04em' }}>√</span>
              <span style={{ borderTop: '0.06em solid currentColor', padding: '0.06em 0.12em 0 0.08em', display: 'inline-flex', alignItems: 'center' }}>
                <Render nodes={n.b} fx={fx} />
              </span>
            </span>
          );
        if (n.k === 'bar')
          return (
            <span key={i} style={{ display: 'inline-flex', borderTop: '0.06em solid currentColor', paddingTop: '0.04em' }}>
              <Render nodes={n.b} fx={fx} />
            </span>
          );
        if (n.k === 'frac')
          return (
            <span key={i} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', margin: '0 0.18em' }}>
              <span style={{ padding: '0 0.18em 0.06em' }}><Render nodes={n.n} fx={fx} /></span>
              <span style={{ alignSelf: 'stretch', height: '0.06em', minHeight: 2, background: 'currentColor', borderRadius: 2 }} />
              <span style={{ padding: '0.08em 0.18em 0' }}><Render nodes={n.d} fx={fx} /></span>
            </span>
          );
        return <Group key={i} node={n} fx={fx} />;
      })}
    </>
  );
}

function Group({ node, fx }: { node: Extract<Node, { k: 'grp' }>; fx: Effects }) {
  const e = (node.name && fx[node.name]) || {};
  const color = node.tone ? toneColor[node.tone] : undefined;
  const zero = e.zero ?? 0;
  const inner = node.upright ? (
    <span style={{ fontFamily: uiFont, fontSize: '0.78em' }}>
      {node.c.map((c, i) => (c.k === 'txt' ? <Glyphs key={i} s={c.s} upright /> : <Render key={i} nodes={[c]} fx={fx} />))}
    </span>
  ) : (
    <Render nodes={node.c} fx={fx} />
  );
  return (
    <span
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', color,
        padding: node.box || e.hl ? '0.04em 0.2em' : undefined, borderRadius: 8,
        border: node.box ? `2px solid ${color ?? 'currentColor'}` : undefined,
        background: e.hl ? `rgba(255,255,255,${0.1 * e.hl})` : undefined,
        boxShadow: e.hl ? `0 0 0 ${2 * e.hl}px ${palette.c4}88` : undefined,
        opacity: 1 - 0.55 * (e.dim ?? 0),
      }}
    >
      <span style={{ opacity: 1 - 0.75 * zero }}>{inner}</span>
      {e.strike ? (
        <span style={{ position: 'absolute', left: 0, top: '52%', height: 3, width: `${100 * e.strike}%`, background: palette.no, borderRadius: 2 }} />
      ) : null}
      {zero > 0 ? (
        <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: palette.no, fontWeight: 700, opacity: zero, transform: `translateY(${-0.9 * zero}em)`, fontSize: '0.7em' }}>
          = 0
        </span>
      ) : null}
    </span>
  );
}

/**
 * Line breaking, in order of preference: after a relation (= → ≡ or a wide space),
 * keeping each side whole; only a side wider than the board then breaks before its
 * top-level + / −. Bracket depth is tracked across nodes, so "(x + \c1{2})" never splits.
 */
function sides(nodes: Node[]) {
  const out: Node[][][] = [[[]]];
  const side = () => out[out.length - 1];
  let depth = 0;
  for (const n of nodes) {
    if (n.k !== 'txt') {
      side()[side().length - 1].push(n);
      continue;
    }
    for (const piece of n.s.split(/([()=+\-→≡]|\u2003)/).filter(Boolean)) {
      if (piece === '(') depth += 1;
      if (piece === ')') depth = Math.max(0, depth - 1);
      const top = depth === 0;
      if (top && /^[+\-]$/.test(piece)) side().push([{ k: 'txt', s: piece }]);
      else side()[side().length - 1].push({ k: 'txt', s: piece });
      if (top && /^([=→≡]|\u2003)$/.test(piece)) out.push([[]]);
    }
  }
  return out.map((pieces) => pieces.filter((p) => p.length)).filter((pieces) => pieces.length);
}

export function Tex({ src, size, fx = {}, color }: { src: string; size: number; fx?: Effects; color?: string }) {
  const row = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', rowGap: size * 0.35 } as const;
  return (
    <div dir="ltr" style={{ fontFamily: mathFont, fontSize: size, lineHeight: 1.25, color: color ?? palette.ink, ...row }}>
      {sides(parsed(src)).map((pieces, i) => (
        <span key={i} style={{ ...row, display: 'inline-flex', maxWidth: '100%' }}>
          {pieces.map((piece, j) => (
            <span key={j} style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <Render nodes={piece} fx={fx} />
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

export function fontFaces(assetBase: unknown) {
  const base = typeof assetBase === 'string' ? assetBase : '';
  const face = (family: string, file: string, weight: number, style = 'normal') =>
    `@font-face{font-family:"${family}";src:url("${base}/assets/fonts/${file}") format("woff2");font-weight:${weight};font-style:${style};font-display:block;}`;
  return [
    face('STIX Two Text', 'stix-two-text-latin-400-normal.woff2', 400),
    face('STIX Two Text', 'stix-two-text-latin-400-italic.woff2', 400, 'italic'),
    face('STIX Two Text', 'stix-two-text-latin-600-normal.woff2', 600),
    face('IBM Plex Sans Arabic', 'ibm-plex-sans-arabic-arabic-400-normal.woff2', 400),
    face('IBM Plex Sans Arabic', 'ibm-plex-sans-arabic-latin-400-normal.woff2', 400),
    face('IBM Plex Sans Arabic', 'ibm-plex-sans-arabic-arabic-600-normal.woff2', 600),
    face('IBM Plex Sans Arabic', 'ibm-plex-sans-arabic-latin-600-normal.woff2', 600),
  ].join('');
}
