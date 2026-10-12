import { useState } from 'react';
import { phaseChanges, phaseNames } from './physics';
import Particles from './Particles';

export default function PhaseExplorer({
  direct,
  reducedMotion,
}: {
  direct: boolean;
  reducedMotion: boolean;
}) {
  const [selected, setSelected] = useState<string>(direct ? 'sublimation' : 'melting');
  const change = phaseChanges.find((item) => item.id === selected)!;
  return (
    <>
      <div className="chem-title">
        <span className="chem-label">خريطة التحولات</span>
        <h2>من حالة لحالة… والطريق له اسم</h2>
        <p>اختار التحول وشوف اتجاهه. لكل طريق طريق عكسي.</p>
      </div>
      <div className="chem-phase-buttons">
        {phaseChanges
          .filter((item) => direct || !['sublimation', 'deposition'].includes(item.id))
          .map((item) => (
            <button
              key={item.id}
              className="chem-button"
              aria-pressed={selected === item.id}
              onClick={() => setSelected(item.id)}
            >
              <bdi>{item.name}</bdi>
            </button>
          ))}
      </div>
      <div className="chem-phase-flow" dir="ltr">
        <article>
          <Particles phase={change.from} reducedMotion={reducedMotion} />
          <strong>
            <bdi>{phaseNames[change.from]}</bdi>
          </strong>
        </article>
        <div className={`phase-direction ${change.heating ? 'is-heating' : 'is-cooling'}`}>
          <span aria-hidden="true">→</span>
          <strong>{change.heating ? 'تسخين' : 'تبريد'}</strong>
        </div>
        <article>
          <Particles phase={change.to} reducedMotion={reducedMotion} />
          <strong>
            <bdi>{phaseNames[change.to]}</bdi>
          </strong>
        </article>
      </div>
      <div className="chem-observation">
        <strong>
          <bdi>{change.name}</bdi>
        </strong>
        <p>
          {(change.from === 'solid' && change.to === 'gas') ||
          (change.from === 'gas' && change.to === 'solid')
            ? 'تحول مباشر بين الصلب والغاز، من غير المرور بحالة سائلة.'
            : 'لاحظ ترتيب الجسيمات والمسافات قبل التحول وبعده.'}
        </p>
      </div>
    </>
  );
}
