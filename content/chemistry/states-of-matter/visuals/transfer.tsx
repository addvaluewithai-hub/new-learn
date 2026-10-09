import { Img } from 'remotion';
import type { ReactNode } from 'react';
import { STATE_LABELS, particlesAt, type StateKind } from '../statesLesson';
import { INK, EDGE, C } from './palette';
import { Svg, Vessel } from './primitives';

export function Transfer({
  kind,
  progress,
  showTarget,
  showArrow = true,
  particles = false,
  frame,
  reducedMotion,
}: {
  kind: StateKind;
  progress: number;
  showTarget: boolean;
  showArrow?: boolean;
  particles?: boolean;
  frame: number;
  reducedMotion: boolean;
}) {
  const rightWidth = kind === 'solid' ? 220 : 150 + 90 * progress;
  const rightHeight = kind === 'liquid' ? 27000 / rightWidth : 210;
  return (
    <Svg
      label={
        kind === 'liquid'
          ? 'نفس كمية المية في وعاءين: يتغير الشكل بدون زيادة الكمية'
          : kind === 'solid'
            ? 'مكعب تلج أمام وعاء مختلف'
            : 'نفس كمية الغاز تتمدد داخل وعاء أكبر'
      }
    >
      <g opacity={showTarget && progress > 0 ? 0.32 : 1}>
        <Vessel
          kind={kind}
          x={showTarget ? 24 : 195}
          y={kind === 'liquid' ? 76 : 45}
          width={150}
          height={kind === 'liquid' ? 180 : 210}
          headspace={kind === 'liquid' ? 45 : 0}
          frame={frame}
          reducedMotion={reducedMotion}
          particles={particles}
        />
      </g>
      {showTarget ? (
        <g data-board-part="target">
          {showArrow && progress > 0 ? (
            <path d="M195 150h50m-14 -12 14 12 -14 12" fill="none" stroke={INK} strokeWidth="3" />
          ) : null}
          {kind === 'solid' && progress === 0 ? (
            <path d="M276 45V255H496V45" fill="none" stroke={EDGE} strokeWidth="3" />
          ) : (
            <g opacity={kind === 'solid' ? progress : 1}>
              <Vessel
                kind={kind}
                x={276}
                y={256 - rightHeight}
                width={rightWidth}
                height={rightHeight}
                headspace={kind === 'liquid' ? 225 - rightHeight : 0}
                frame={frame}
                reducedMotion={reducedMotion}
                particles={particles}
              />
            </g>
          )}
        </g>
      ) : null}
    </Svg>
  );
}

export function Compression({
  progress,
  frame,
  reducedMotion,
  arrow = progress > 0,
}: {
  progress: number;
  frame: number;
  reducedMotion: boolean;
  arrow?: boolean;
}) {
  const height = 230 * (1 - progress * 0.48);
  return (
    <Svg label="مكبس يقلل الفراغات بين نفس عدد الجسيمات مع ثبات حجمها">
      <Vessel
        kind="gas"
        x={151}
        y={285 - height}
        width={238}
        height={height}
        frame={frame}
        reducedMotion={reducedMotion}
      />
      <rect x="146" y={278 - height} width="248" height="12" rx="3" fill={INK} />
      <path
        d={`M270 15V${278 - height}M225 15h90`}
        stroke={INK}
        strokeWidth="6"
        strokeLinecap="round"
      />
      {arrow ? (
        <path d="M105 80v145m-10 -12 10 12 10 -12" fill="none" stroke={C.gas} strokeWidth="4" />
      ) : null}
    </Svg>
  );
}
