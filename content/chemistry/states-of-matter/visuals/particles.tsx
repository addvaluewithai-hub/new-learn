import { Img } from 'remotion';
import type { ReactNode } from 'react';
import { STATE_LABELS, particlesAt, type StateKind } from '../statesLesson';
import { INK, EDGE, C } from './palette';
import { Svg, Vessel } from './primitives';

export function Particles({
  kind,
  frame,
  reducedMotion,
}: {
  kind: StateKind;
  frame: number;
  reducedMotion: boolean;
}) {
  return (
    <Svg label={`نموذج جسيمات ${STATE_LABELS[kind].arabic}`} viewBox="0 0 430 300">
      <Vessel
        kind={kind}
        x={95}
        y={45}
        width={240}
        height={kind === 'liquid' ? 155 : 205}
        headspace={kind === 'liquid' ? 0 : 0}
        frame={frame}
        reducedMotion={reducedMotion}
      />
    </Svg>
  );
}

export function ParticleQuestionDiagram({
  frame = 0,
  reducedMotion = true,
}: {
  frame?: number;
  reducedMotion?: boolean;
}) {
  return (
    <Svg label="نموذج جسيمات متباعدة تتحرك في اتجاهات مختلفة">
      <Vessel
        kind="gas"
        x={55}
        y={32}
        width={430}
        height={250}
        frame={frame}
        reducedMotion={reducedMotion}
      />
    </Svg>
  );
}

export function Dots({ plural }: { plural: boolean }) {
  return (
    <Svg label={plural ? 'كل نقطة تمثل جسيمًا' : 'نقطة واحدة تمثل جسيمًا'}>
      {(plural ? [160, 270, 380] : [270]).map((x) => (
        <circle key={x} cx={x} cy="160" r="20" fill={C.gas} />
      ))}
    </Svg>
  );
}
