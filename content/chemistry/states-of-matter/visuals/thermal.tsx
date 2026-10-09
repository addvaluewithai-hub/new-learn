import { Img } from 'remotion';
import type { ReactNode } from 'react';
import { STATE_LABELS, particlesAt, type StateKind } from '../statesLesson';
import { INK, EDGE, C } from './palette';
import { Text, Svg, Vessel } from './primitives';

export function Thermal({
  progress,
  rigidProgress,
  showRigid,
  condition,
  volume,
  pressure,
  frame,
  reducedMotion,
}: {
  progress: number;
  rigidProgress: number;
  showRigid: boolean;
  condition: boolean;
  volume: boolean;
  pressure: boolean;
  frame: number;
  reducedMotion: boolean;
}) {
  const h = 120 + progress * 70;
  const shift = showRigid ? 0 : 132;
  return (
    <Svg label="كمية ثابتة من الغاز: مكبس عند ضغط ثابت مقابل وعاء صلب ثابت الحجم">
      <g transform={`translate(${shift} 0)`} data-board-part="piston">
        {condition ? (
          <Text x={138} y={26} size={38}>
            ضغط ثابت
          </Text>
        ) : null}
        <Vessel
          kind="gas"
          x={44}
          y={252 - h}
          width={188}
          height={h}
          frame={frame}
          reducedMotion={reducedMotion}
        />
        <rect x={39} y={245 - h} width={198} height="12" rx="3" fill={INK} />
        <path d={`M138 47V${245 - h}`} stroke={INK} strokeWidth="6" />
        {progress > 0 ? (
          <path
            d="M105 280v-22m-6 6 6-6 6 6m26 16v-22m-6 6 6-6 6 6m26 16v-22m-6 6 6-6 6 6"
            stroke="#bd7536"
            fill="none"
            strokeWidth="3"
          />
        ) : null}
        {progress > 0 ? (
          <Text x={138} y={325} color={C.liquid} size={38}>
            الحجم يزيد
          </Text>
        ) : null}
      </g>
      {showRigid ? (
        <g data-board-part="rigid">
          <Text x={408} y={26} size={38}>
            حجم ثابت
          </Text>
          <Vessel
            kind="gas"
            x={314}
            y={62}
            width={188}
            height={190}
            frame={frame}
            reducedMotion={reducedMotion}
          />
          <rect x="310" y="55" width="196" height="12" fill={INK} />
          {rigidProgress > 0 ? (
            <path
              d="M375 280v-22m-6 6 6-6 6 6m26 16v-22m-6 6 6-6 6 6m26 16v-22m-6 6 6-6 6 6"
              stroke="#bd7536"
              fill="none"
              strokeWidth="3"
            />
          ) : null}
          {pressure ? (
            <Text x={408} y={325} color={C.liquid} size={38}>
              الضغط يزيد
            </Text>
          ) : volume ? (
            <Text x={408} y={325} size={38}>
              الحجم لا يزيد
            </Text>
          ) : null}
        </g>
      ) : null}
    </Svg>
  );
}

export function WarmMaterials({ progress }: { progress: number }) {
  return (
    <Svg label="التمدد الحراري في كثير من المواد الصلبة والسوائل صغير في الظروف المعتادة">
      <rect
        x="45"
        y="83"
        width={190 + progress * 10}
        height="100"
        rx="4"
        fill={C.solid}
        fillOpacity=".2"
        stroke={C.solid}
        strokeWidth="3"
      />
      <Vessel
        kind="liquid"
        x={315}
        y={150 - progress * 8}
        width={155}
        height={90 + progress * 8}
        headspace={66 - progress * 8}
        frame={0}
        reducedMotion
        particles={false}
      />
      <Text x={140} y={292}>
        صلب
      </Text>
      <Text x={392} y={292}>
        سائل
      </Text>
      {progress > 0 ? (
        <path
          d="M117 222v-22m-6 6 6-6 6 6m25 16v-22m-6 6 6-6 6 6m215 16v-22m-6 6 6-6 6 6m25 16v-22m-6 6 6-6 6 6"
          stroke="#bd7536"
          fill="none"
          strokeWidth="3"
        />
      ) : null}
    </Svg>
  );
}
