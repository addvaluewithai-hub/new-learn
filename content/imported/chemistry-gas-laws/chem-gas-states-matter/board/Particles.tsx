import { useCurrentFrame } from 'remotion';
import { phaseNames, type MatterPhase } from './physics';

export default function Particles({
  phase,
  narrow = false,
  compression = 0,
  reducedMotion = false,
}: {
  phase: MatterPhase;
  narrow?: boolean;
  compression?: number;
  reducedMotion?: boolean;
}) {
  const frame = useCurrentFrame();
  const drift = reducedMotion ? 0 : Math.sin(frame / 7) * 1.5;
  const width = phase === 'gas' ? 184 - compression * 0.9 : narrow ? 125 : 184;
  const left = (240 - width) / 2;
  const liquidDepth = (67 * 184) / width;
  return (
    <svg
      className="chem-particles"
      viewBox="0 0 240 174"
      role="img"
      aria-label={`تمثيل ترتيب الجسيمات في ${phaseNames[phase]}`}
      data-motion={reducedMotion ? 'reduced' : 'full'}
    >
      <path
        d={`M${left} 15 V155 H${left + width} V15`}
        fill="none"
        stroke="#97aca0"
        strokeWidth="3"
      />
      {phase === 'liquid' && (
        <rect
          x={left + 3}
          y={155 - liquidDepth}
          width={width - 6}
          height={liquidDepth - 3}
          rx="4"
          fill="#e5eff8"
        />
      )}
      {Array.from({ length: 24 }, (_, i) => {
        const x =
          phase === 'solid'
            ? 66 + (i % 6) * 21
            : left + 13 + (((i * 37) % 101) / 101) * (width - 26);
        const y =
          phase === 'solid'
            ? 74 + Math.floor(i / 6) * 21
            : phase === 'liquid'
              ? 155 - liquidDepth + 12 + (((i * 29) % 67) / 67) * (liquidDepth - 24)
              : 30 + (((i * 47) % 113) / 113) * 109;
        return (
          <circle
            key={i}
            cx={x + (phase === 'solid' ? 0 : drift)}
            cy={y + (phase === 'solid' ? drift / 5 : 0)}
            r="5.7"
            fill={phase === 'solid' ? '#c69b61' : phase === 'liquid' ? '#70a0c3' : '#9482c6'}
            className={
              phase === 'solid'
                ? 'particle-solid'
                : phase === 'gas'
                  ? 'particle-gas'
                  : 'particle-liquid'
            }
          />
        );
      })}
      {phase === 'gas' && compression > 0 && (
        <path d={`M${left + width} 20V150`} stroke="#7667a8" strokeWidth="7" />
      )}
    </svg>
  );
}
