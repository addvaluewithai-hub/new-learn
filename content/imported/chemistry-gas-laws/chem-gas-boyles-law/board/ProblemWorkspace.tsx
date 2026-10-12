import { useState } from 'react';
import { chemistryProblems, type ProblemKey } from './boardContent';
import { Equation } from './Notation';

export default function ProblemWorkspace({
  problem,
  worked,
}: {
  problem: ProblemKey;
  worked: boolean;
}) {
  const data = chemistryProblems[problem];
  const [step, setStep] = useState(0);
  const steps = ['التوقع', 'القانون', 'التعويض', 'الناتج', 'التحقق'];
  const values = data.worked
    ? [
        data.worked.prediction,
        data.worked.law,
        data.worked.substitution,
        data.worked.answer,
        data.worked.check,
      ]
    : [];
  return (
    <>
      <div className="chem-title">
        <span className="chem-label">{worked ? 'مثال محلول للتعليم' : 'مساحة حلّك'}</span>
        <h2>حالتين… وخطوات واضحة</h2>
        <p>
          {worked
            ? 'ده مثال الشرح. سؤال التطبيق التالي قد يستخدم أرقامًا مختلفة.'
            : 'المعطيات موجودة؛ اختار القانون واشرح الخطوات بنفسك.'}
        </p>
      </div>
      <div className="chem-problem-meta">
        <span>{data.constant}</span>
        <span>
          المطلوب: <bdi>{data.unknown}</bdi>
        </span>
      </div>
      <table className="chem-state-table">
        <thead>
          <tr>
            <th scope="col">المتغير</th>
            <th scope="col">State 1 — الحالة الأولى</th>
            <th scope="col">State 2 — الحالة الثانية</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.quantity}>
              <th scope="row">
                <bdi>{row.quantity}</bdi>
              </th>
              <td>
                <bdi dir="ltr">{row.first}</bdi>
              </td>
              <td className={row.second === '?' ? 'unknown-value' : ''}>
                <bdi dir="ltr">{row.second}</bdi>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {problem === 'source-error' && (
        <div className="chem-observation">
          <strong>اختيارات المصدر المطبوعة</strong>
          <p dir="ltr">11°C · 44°C · 33°C · 22°C</p>
          <p>
            اختبر اتساق الاختيارات مع العلاقة. مش لازم تغيّر القانون عشان يطابق اختيارًا مطبوعًا.
          </p>
        </div>
      )}
      {worked && data.worked ? (
        <>
          <div className="chem-worked-tabs">
            {steps.map((name, i) => (
              <button
                key={name}
                className="chem-button"
                aria-pressed={step === i}
                onClick={() => setStep(i)}
              >
                <span>{i + 1}</span>
                {name}
              </button>
            ))}
          </div>
          <div className="chem-worked-step">
            <span>{steps[step]}</span>
            {step > 0 && step < 4 ? (
              <Equation text={values[step]} size={30} />
            ) : (
              <strong>{values[step]}</strong>
            )}
          </div>
        </>
      ) : (
        <p className="chem-note">رتّب المعطيات؛ المحاولة والحل في خطوتين منفصلتين.</p>
      )}
    </>
  );
}
