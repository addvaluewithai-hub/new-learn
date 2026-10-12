import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { VisualProps } from '@learn/lesson-runtime';
import { Tex, fontFaces, palette, uiFont, type Effects } from './mathkit';
import { Widget, type WidgetSpec } from './widgets';
import { progress, type Clock } from './clock';
export { makeClock, progress } from './clock';

// Cue-driven stage shared by the B01 boards: every visible change is bound to a
// semantic unit cue of the selected recording; nothing runs on its own clock.

export type Row = { at?: string; tex: string | Array<[string, string]>; size?: number; note?: string };
export type Fx = { at: string; until?: string; g: string; k: 'hl' | 'strike' | 'zero' | 'dim' };
export type Panel = { at: string; rows?: Row[]; fx?: Fx[]; widget?: WidgetSpec; side?: boolean };
export type Caption = { at: string; ar: string; en?: string; tone?: 'ok' | 'warn' | 'info' };
export type SceneSpec = { kicker: string; panels: Panel[]; captions?: Caption[] };
export type QuestionSpec = { kicker: string; formula: string; asks: string[] };

function effectsAt(clock: Clock, fx: Fx[] = []): Effects {
  const out: Effects = {};
  for (const f of fx) {
    const v = progress(clock, f.at, 450) * (1 - progress(clock, f.until, 300));
    if (v > 0) out[f.g] = { ...out[f.g], [f.k]: v };
  }
  return out;
}

function RowView({ row, clock, fx, base, active }: { row: Row; clock: Clock; fx: Effects; base: number; active: boolean }) {
  const variants = typeof row.tex === 'string' ? [['', row.tex] as [string, string]] : row.tex;
  const size = base * (row.size ?? 1);
  // All variants share one grid cell (sized by the largest) and cross-fade on their beats.
  return (
    <div style={{ display: 'grid', opacity: active ? 1 : 0.6, transition: 'none' }}>
      {variants.map(([beat, tex], i) => {
        const inP = i === 0 ? 1 : progress(clock, beat, 320);
        const next = variants[i + 1];
        const outP = next ? progress(clock, next[0], 320) : 0;
        const o = inP * (1 - outP);
        return (
          <div key={i} style={{ gridArea: '1 / 1', opacity: o, display: 'grid', placeItems: 'center' }}>
            <Tex src={tex} size={size} fx={fx} />
            {row.note ? <div dir="rtl" style={{ fontFamily: uiFont, fontSize: size * 0.42, color: palette.soft, marginTop: 4 }}>{row.note}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

/** Scales its content down (never up) so a panel always fits its frame, centred. */
function FitBox({ children }: { children: React.ReactNode }) {
  const outer = React.useRef<HTMLDivElement>(null);
  const inner = React.useRef<HTMLDivElement>(null);
  const [fit, setFit] = React.useState({ scale: 1, width: 0 });
  React.useLayoutEffect(() => {
    const o = outer.current, i = inner.current;
    if (!o || !i) return;
    const width = o.clientWidth;
    const scale = Math.min(1, width / Math.max(1, i.scrollWidth), o.clientHeight / Math.max(1, i.scrollHeight));
    if (Math.abs(scale - fit.scale) > 0.005 || width !== fit.width) setFit({ scale, width });
  });
  return (
    <div ref={outer} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={inner} style={{ position: 'absolute', left: '50%', top: '50%', width: 'max-content', maxWidth: fit.width ? fit.width / fit.scale : '100%', transform: `translate(-50%, -50%) scale(${fit.scale})` }}>{children}</div>
    </div>
  );
}

function PanelView({ panel, clock, opacity }: { panel: Panel; clock: Clock; opacity: number }) {
  const fx = effectsAt(clock, panel.fx);
  // Every row of the panel is laid out from the panel's first beat (future rows invisible),
  // so the board never jumps when a new line is written.
  const rows = (panel.rows ?? []).map((r) => ({ r, p: progress(clock, r.at ?? panel.at) }));
  const lastLive = rows.reduce((acc, x, i) => (x.p > 0 ? i : acc), -1);
  const base = clock.portrait ? 44 : 50;
  const wp = panel.widget ? progress(clock, panel.widget.at ?? panel.at) : 0;
  const sideBySide = !clock.portrait && panel.side;
  return (
    <AbsoluteFill style={{ opacity, padding: clock.portrait ? '170px 22px 50px' : '104px 40px 24px' }}>
      <FitBox>
        <div style={{ display: 'flex', flexDirection: sideBySide ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: clock.portrait ? 30 : 30 }}>
          {rows.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: clock.portrait ? 24 : 18, alignItems: 'center', maxWidth: '100%' }}>
              {rows.map(({ r, p }, i) => (
                <div key={i} style={{ opacity: p, transform: clock.reduced ? undefined : `translateY(${(1 - p) * 14}px)`, maxWidth: '100%' }}>
                  <RowView row={r} clock={clock} fx={fx} base={base} active={i === lastLive || lastLive <= 1} />
                </div>
              ))}
            </div>
          ) : null}
          {panel.widget ? (
            <div style={{ opacity: wp, display: 'grid', placeItems: 'center', maxWidth: '100%' }}>
              <Widget spec={panel.widget} clock={clock} />
            </div>
          ) : null}
        </div>
      </FitBox>
    </AbsoluteFill>
  );
}

export function Timeline({ spec, clock }: { spec: SceneSpec; clock: Clock }) {
  const starts = spec.panels.map((p) => clock.ms(p.at));
  return (
    <>
      {spec.panels.map((panel, i) => {
        const nextBeat = spec.panels.slice(i + 1).find((_, j) => starts[i + 1 + j] != null)?.at;
        const o = progress(clock, panel.at, 300) * (1 - progress(clock, nextBeat, 260));
        return o > 0.001 ? <PanelView key={i} panel={panel} clock={clock} opacity={o} /> : null;
      })}
    </>
  );
}

// Keep Latin/maths runs (e.g. "−14 = −7B") left-to-right inside Arabic captions.
const MATH_RUN = /([−+(±]?[A-Za-z0-9][A-Za-z0-9−+=×·()²³±≠.,/\s]*[A-Za-z0-9)²³]|[−+]?[A-Za-z0-9])/;
export function Isolated({ text }: { text: string }) {
  return <>{text.split(MATH_RUN).map((part, i) => (i % 2 ? <bdi key={i} dir="ltr">{part}</bdi> : part))}</>;
}

export function CaptionStrip({ captions = [], clock }: { captions?: Caption[]; clock: Clock }) {
  const live = captions.filter((c) => progress(clock, c.at, 1) > 0);
  const tones = { ok: palette.ok, warn: palette.c2, info: palette.c4 };
  return (
    <div style={{ position: 'absolute', top: clock.portrait ? 92 : 58, left: 0, right: 0, display: 'grid', justifyItems: 'center', padding: '0 24px' }}>
      {live.map((c, i) => {
        const o = progress(clock, c.at, 300) * (1 - (live[i + 1] ? progress(clock, live[i + 1].at, 220) : 0));
        return o <= 0.001 ? null : (
          <div key={c.at + i} style={{ gridArea: '1 / 1', opacity: o, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
            <span dir="rtl" style={{ fontFamily: uiFont, fontWeight: 600, fontSize: clock.portrait ? 30 : 24, color: c.tone ? tones[c.tone] : palette.ink }}><Isolated text={c.ar} /></span>
            {c.en ? <span dir="ltr" style={{ fontFamily: uiFont, fontSize: clock.portrait ? 18 : 17, color: palette.soft, border: `1px solid ${palette.line}`, borderRadius: 999, padding: '2px 12px' }}>{c.en}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

export function Shell({ props, kicker, children }: { props: VisualProps; kicker: string; children: React.ReactNode }) {
  const portrait = props.layout === 'portrait';
  return (
    <AbsoluteFill className="pf-board" style={{ background: `radial-gradient(120% 90% at 50% 0%, #17294a 0%, ${palette.bg} 62%)`, color: palette.ink, fontFamily: uiFont, overflow: 'hidden' }}>
      <style>{fontFaces(props.spec.params.assetBase) + '.pf-board *{box-sizing:border-box}'}</style>
      <div dir="rtl" style={{ position: 'absolute', top: portrait ? 40 : 18, right: portrait ? 22 : 30, left: portrait ? 22 : 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: portrait ? 17 : 15, color: palette.muted }}>
        <span>{kicker}</span>
        <span dir="ltr" style={{ letterSpacing: 1 }}>Mathematics I · Algebra</span>
      </div>
      {children}
    </AbsoluteFill>
  );
}

export function QuestionStage({ spec, clock, props }: { spec: QuestionSpec; clock: Clock; props: VisualProps }) {
  const en = progress(clock, 'UEN');
  const ar = progress(clock, 'UAR');
  return (
    <AbsoluteFill style={{ padding: clock.portrait ? '120px 22px 40px' : '70px 56px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: clock.portrait ? 26 : 20 }}>
      <div style={{ opacity: en, background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 22, padding: clock.portrait ? '22px 14px' : '22px 34px', maxWidth: '100%' }}>
        <Tex src={spec.formula} size={clock.portrait ? 46 : 58} />
      </div>
      <div dir="ltr" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {spec.asks.map((a, i) => (
          <span key={i} style={{ opacity: en, fontSize: clock.portrait ? 21 : 19, color: palette.soft, border: `1px solid ${palette.line}`, borderRadius: 999, padding: '4px 14px' }}>{a}</span>
        ))}
      </div>
      <div dir="rtl" style={{ opacity: ar, fontSize: clock.portrait ? 25 : 23, lineHeight: 1.6, color: palette.ink, textAlign: 'center', maxWidth: 760 }}>{props.question?.title}</div>
    </AbsoluteFill>
  );
}
