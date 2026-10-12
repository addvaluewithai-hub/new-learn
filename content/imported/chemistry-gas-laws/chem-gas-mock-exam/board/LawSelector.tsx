import { useState } from 'react';
import type { GasLaw } from './physics';
import { gasLawLabels } from './boardContent';
import { Equation } from './Notation';

export default function LawSelector({
  available = 4,
  initial = 'boyle',
  showEquation = true,
}: {
  available?: number;
  initial?: GasLaw;
  showEquation?: boolean;
}) {
  const [law, setLaw] = useState<GasLaw>(initial);
  const info = gasLawLabels[law];
  return (
    <>
      <div className="chem-title">
        <span className="chem-label">ابدأ بالشرط</span>
        <h2>إيه اللي ثابت؟</h2>
        <p>اختيار القانون يبدأ من نص السؤال، قبل ترتيب الرموز.</p>
      </div>
      <div className="chem-selector-buttons">
        {(
          [
            ['boyle', 'T ثابتة'],
            ['charles', 'P ثابت'],
            ['pressure', 'V ثابت'],
            ['combined', 'P وV وT يتغيروا'],
          ] as const
        )
          .slice(0, available)
          .map(([id, text]) => (
            <button
              key={id}
              className="chem-button"
              aria-pressed={law === id}
              onClick={() => setLaw(id)}
            >
              {text}
            </button>
          ))}
      </div>
      <div className="chem-law-reveal">
        <span className="chem-label">في نفس كمية الغاز</span>
        <h3>
          <bdi>{info.name}</bdi>
        </h3>
        {available > 2 && showEquation && <Equation text={info.equation} size={34} />}
        <p>
          {law === 'boyle'
            ? 'P ↑ يقابل V ↓ · علاقة عكسية عند درجة حرارة ثابتة.'
            : law === 'charles'
              ? 'T ↑ يقابل V ↑ · علاقة طردية عند ضغط ثابت.'
              : law === 'pressure'
                ? 'T ↑ يقابل P ↑ · علاقة طردية عند حجم ثابت.'
                : 'رتّب الحالتين معًا. أثر الضغط وأثر الحرارة قد يتنافسا على الحجم.'}
        </p>
        <span className="chem-note">أي T داخل نسبة تكون بالكلفن.</span>
      </div>
      <div className="chem-reflection">بدّل الشرط، واشرح بطريقتك ليه القانون اتغيّر.</div>
    </>
  );
}
