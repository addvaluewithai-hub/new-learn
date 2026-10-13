import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { VisualProps } from '@learn/lesson-runtime';
import { makeClock, progress } from './clock';
import { fontFaces, palette, uiFont } from './mathkit';
import { Defs } from './parts';
import type { SceneProps } from './axis';
import { Line, Order, Rules } from './line';
import { Classify, Decimals, Families, Irrational } from './numbers';
import { Ops, Sets } from './sets';
import { Q1, Q2, Q3, Recap } from './qa';

// One renderer for the whole lesson: params.view picks the drawing, and every change in it
// is bound to the cue of the text unit that explains it (teaching, question and feedback).
const VIEWS: Record<string, (p: SceneProps) => React.ReactElement> = {
  line: Line, order: Order, rules: Rules, families: Families, decimals: Decimals, irrational: Irrational,
  classify: Classify, sets: Sets, ops: Ops, q1: Q1, q2: Q2, q3: Q3, recap: Recap,
};

export default function CalcBoard(props: VisualProps) {
  const scene = String(props.spec.params.scene ?? '');
  const view = String(props.spec.params.view ?? '');
  const feedback = props.phase === 'feedback';
  const clock = makeClock(props, feedback ? props.recording.id : scene);
  const View = VIEWS[view];
  if (!View) throw new Error(`CalcBoard: unknown view ${view}`);
  const P = props.layout === 'portrait';
  const on = (unit: string, ms = 450) => progress(clock, unit, ms);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 0%, #182c4d 0%, ${palette.bg} 62%)`, color: palette.ink, fontFamily: uiFont, overflow: 'hidden' }}>
      <style>{fontFaces(props.spec.params.assetBase)}</style>
      <div dir="rtl" style={{ position: 'absolute', top: P ? 40 : 18, right: P ? 22 : 30, left: P ? 22 : 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: P ? 17 : 15, color: palette.muted }}>
        <span>{String(props.spec.params.kicker ?? '')}</span>
        <span dir="ltr" style={{ letterSpacing: 1 }}>Mathematics I · Calculus</span>
      </div>
      <svg viewBox={P ? '0 0 540 960' : '0 0 960 540'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <Defs />
        <View on={on} P={P} feedback={feedback} />
      </svg>
    </AbsoluteFill>
  );
}
