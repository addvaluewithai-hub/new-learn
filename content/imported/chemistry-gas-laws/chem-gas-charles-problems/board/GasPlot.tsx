import { gasState, lawGraph, kelvinToCelsius, type GasLaw } from './physics';
import { gasLawLabels } from './boardContent';
import { format } from './format';

export default function GasPlot({
  law,
  pressure,
  temperature,
  reciprocal = false,
  celsius = false,
  label = true,
}: {
  law: GasLaw;
  pressure: number;
  temperature: number;
  reciprocal?: boolean;
  celsius?: boolean;
  label?: boolean;
}) {
  const state = gasState(law, pressure, temperature);
  const maxY = law === 'pressure' ? 2 : law === 'combined' ? 10 : 5;
  const minX = law === 'boyle' && !reciprocal ? 0.5 : 0;
  const maxX = law === 'boyle' ? (reciprocal ? 2 : 3) : 550;
  const x = (value: number) => 70 + ((value - minX) / (maxX - minX)) * 304;
  const y = (value: number) => 189 - (value / maxY) * 151;
  const points = lawGraph(law, reciprocal).map((p) => ({
    ...p,
    y: law === 'combined' ? p.y / pressure : p.y,
  }));
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.x)},${y(p.y)}`).join(' ');
  const currentX =
    law === 'boyle' ? (reciprocal ? 1 / state.pressure : state.pressure) : state.temperature;
  const currentY = law === 'pressure' ? state.pressure : state.volume;
  const xName =
    law === 'boyle' ? (reciprocal ? 'P⁻¹ (atm⁻¹)' : 'P (atm)') : celsius ? 'T (°C)' : 'T (K)';
  const description =
    law === 'boyle'
      ? reciprocal
        ? 'الحجم مقابل مقلوب الضغط'
        : 'الحجم مقابل الضغط'
      : law === 'pressure'
        ? 'الضغط مقابل درجة الحرارة المطلقة'
        : 'الحجم مقابل درجة الحرارة';
  return (
    <div className="chem-plot">
      <div className="chem-plot-heading">
        <span>{description}</span>
        {label && (
          <small>
            {law === 'combined'
              ? `للرسم الحالي: P = ${format(pressure)} atm`
              : gasLawLabels[law].constant}
          </small>
        )}
      </div>
      <svg
        viewBox="0 0 420 244"
        role="img"
        aria-label={`رسم ${description} مع النقطة الحالية`}
        style={{ direction: 'ltr' }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <path d={`M70 ${y((maxY * i) / 4)}H374`} stroke="#e2e9e2" />
            <text x="59" y={y((maxY * i) / 4) + 4} textAnchor="end">
              {format((maxY * i) / 4, law === 'pressure' ? 1 : 2)}
            </text>
          </g>
        ))}
        <path d="M70 28V189H388" fill="none" stroke="#728878" strokeWidth="1.6" />
        {[0, 1, 2, 3, 4].map((i) => {
          const tick = minX + ((maxX - minX) * i) / 4;
          return (
            <text key={i} x={x(tick)} y="209" textAnchor="middle">
              {format(
                celsius ? kelvinToCelsius(tick) : tick,
                law === 'boyle' ? 2 : celsius ? 1 : 0,
              )}
            </text>
          );
        })}
        <path
          d={path}
          fill="none"
          stroke="#8671b8"
          strokeWidth="3"
          strokeDasharray={celsius ? '5 3' : undefined}
        />
        <path
          d={`M${x(currentX)} 189V${y(currentY)}H70`}
          fill="none"
          stroke="#ab9ccb"
          strokeDasharray="4 4"
        />
        <circle
          cx={x(currentX)}
          cy={y(currentY)}
          r="6"
          fill="#5b9276"
          stroke="white"
          strokeWidth="2"
        />
        <text x="20" y="20">
          {law === 'pressure' ? 'P (atm)' : 'V (L)'}
        </text>
        <text x="217" y="235" textAnchor="middle">
          {xName}
        </text>
      </svg>
    </div>
  );
}
