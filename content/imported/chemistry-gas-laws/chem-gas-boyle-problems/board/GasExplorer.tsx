import { useState } from 'react';
import { gasState, type GasLaw } from './physics';
import { gasLawLabels, type ChemistryBoardSpec } from './boardContent';
import { format } from './format';
import { Equation } from './Notation';
import GasPlot from './GasPlot';

export default function GasExplorer({
  law,
  focus,
  onDiscuss,
  canDiscuss,
  reducedMotion,
  referenceVolume = 2.4,
}: {
  law: GasLaw;
  focus: Extract<ChemistryBoardSpec, { kind: 'gas' }>['focus'];
  onDiscuss: (text: string) => void;
  canDiscuss: boolean;
  reducedMotion: boolean;
  referenceVolume?: number;
}) {
  const [pressure, setPressure] = useState(1),
    [temperature, setTemperature] = useState(300),
    [reciprocal, setReciprocal] = useState(false);
  const base = gasState(law, pressure, temperature);
  const state = { ...base, volume: (base.volume * referenceVolume) / 2.4 },
    info = gasLawLabels[law];
  const pressureChanges = law === 'boyle' || law === 'combined';
  const temperatureChanges = law !== 'boyle';
  const invariant =
    law === 'boyle'
      ? state.pressure * state.volume
      : law === 'charles'
        ? state.volume / state.temperature
        : law === 'pressure'
          ? state.pressure / state.temperature
          : (state.pressure * state.volume) / state.temperature;
  const chamberHeight = 32 + (state.volume / 9) * 110,
    top = 164 - chamberHeight;
  return (
    <div className="chem-gas-explorer" data-focus={focus}>
      <div className="chem-title">
        <span className="chem-label">حرّك المتغير… واقرأ أثره</span>
        <h2>
          <bdi>{info.name}</bdi>
        </h2>
        <p>
          {focus === 'conditions'
            ? `الشرط أولًا: ${info.constant}. المتغير الثابت مقفول في التجربة.`
            : 'نفس كمية الغاز في كل مرة. جرّب، لاحظ، وبعدين اشرح العلاقة بطريقتك.'}
        </p>
      </div>
      <div className="chem-gas-readouts">
        <div className={law === 'charles' ? 'is-constant' : ''}>
          <span>P — الضغط</span>
          <output>
            <bdi>
              {format(state.pressure)} <small>atm</small>
            </bdi>
          </output>
          {!pressureChanges && <small>{law === 'pressure' ? 'يتبع الحرارة' : 'ثابت'}</small>}
        </div>
        <div className={law === 'pressure' ? 'is-constant' : ''}>
          <span>V — الحجم</span>
          <output>
            <bdi>
              {format(state.volume)} <small>L</small>
            </bdi>
          </output>
          {law === 'pressure' && <small>ثابت</small>}
        </div>
        <div className={!temperatureChanges ? 'is-constant' : ''}>
          <span>T — درجة الحرارة</span>
          <output>
            <bdi>
              {format(state.temperature, 0)} <small>K</small>
            </bdi>
          </output>
          {!temperatureChanges && <small>ثابت</small>}
        </div>
      </div>
      <div className="chem-gas-controls">
        {law === 'pressure' ? (
          <div className="chem-slider">P — الضغط يتبع T؛ غيّر الحرارة وشوف أثرها.</div>
        ) : (
          <label className={`chem-slider ${!pressureChanges ? 'control-locked' : ''}`}>
            P — الضغط{' '}
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={pressure}
              disabled={!pressureChanges}
              onChange={(e) => setPressure(Number(e.target.value))}
            />
            <output>
              <bdi>{format(state.pressure)} atm</bdi>
            </output>
          </label>
        )}
        <label className={`chem-slider ${!temperatureChanges ? 'control-locked' : ''}`}>
          T — درجة الحرارة{' '}
          <input
            type="range"
            min="200"
            max="550"
            step="5"
            value={temperature}
            disabled={!temperatureChanges}
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
          <output>
            <bdi>{format(state.temperature, 0)} K</bdi>
          </output>
        </label>
      </div>
      <div className="chem-gas-stage">
        <div className="chem-piston">
          <svg
            viewBox="0 0 240 210"
            role="img"
            aria-label={
              law === 'pressure' ? 'غاز في وعاء ثابت الحجم' : 'مكبس متحرك يوضح حجم الغاز الحالي'
            }
            data-motion={reducedMotion ? 'reduced' : 'full'}
          >
            <rect
              x="39"
              y={law === 'pressure' ? 62 : top}
              width="162"
              height={law === 'pressure' ? 102 : chamberHeight}
              rx="5"
              fill="#edf2f8"
            />
            <path d="M36 28V168H204V28" stroke="#8da595" strokeWidth="4" fill="none" />
            <path d={`M37 ${law === 'pressure' ? 62 : top}H203`} stroke="#8975b3" strokeWidth="9" />
            {law !== 'pressure' && <path d={`M120 20V${top}`} stroke="#8975b3" strokeWidth="5" />}
            {Array.from({ length: 24 }, (_, i) => (
              <circle
                key={i}
                cx={50 + ((i * 37) % 137)}
                cy={
                  (law === 'pressure' ? 62 : top) +
                  13 +
                  (((i * 31) % 79) / 79) * ((law === 'pressure' ? 102 : chamberHeight) - 26)
                }
                r="4"
                fill="#9383bd"
              />
            ))}
            <text x="120" y="199" textAnchor="middle">
              {law === 'pressure' ? 'V ثابت' : `V = ${format(state.volume)} L`}
            </text>
          </svg>
          <div className="chem-invariant">
            <span>حافظ على العلاقة</span>
            {focus === 'equation' && (
              <Equation text={`${info.invariant} = ${invariant.toPrecision(4)}`} size={24} />
            )}
            <small>{info.constant}</small>
          </div>
        </div>
        <div>
          <GasPlot
            law={law}
            pressure={pressure}
            temperature={temperature}
            reciprocal={reciprocal}
            celsius={focus === 'absolute-zero'}
          />
          {law === 'boyle' && focus === 'graph' && (
            <button
              className="chem-button"
              aria-pressed={reciprocal}
              onClick={() => setReciprocal((v) => !v)}
            >
              {reciprocal ? 'ارجع لمحور P — الضغط' : 'جرّب محور 1/P — مقلوب الضغط'}
            </button>
          )}
          {focus === 'absolute-zero' && (
            <p className="chem-note">
              امتداد نظري يصل إلى −273.15°C = 0 K. الغاز الحقيقي قد يتكثف قبل الوصول؛ ده مش مسار
              عملي لحجم يختفي.
            </p>
          )}
        </div>
      </div>
      <div className="chem-equation-bar">
        <span>من المعنى للرموز</span>
        <Equation text={info.equation} size={28} />
      </div>
      <div className="chem-explore-controls">
        <button
          className="chem-button"
          onClick={() => {
            setPressure(1);
            setTemperature(300);
          }}
        >
          ارجع للبداية
        </button>

        <span className="chem-note">نموذج غاز مثالي · القيم للتوضيح وليست إجابة التقييم</span>
      </div>
    </div>
  );
}
