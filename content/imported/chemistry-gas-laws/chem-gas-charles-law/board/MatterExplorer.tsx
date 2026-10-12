import { useState } from 'react';
import { phaseNames, type MatterPhase } from './physics';
import type { ChemistryBoardSpec } from './boardContent';
import Particles from './Particles';

const phases: MatterPhase[] = ['solid', 'liquid', 'gas'];
const matterFacts = {
  shape: {
    solid: ['شكل وحجم محددان', 'الجسم الصلب يحتفظ بشكله لما يتغيّر الوعاء.'],
    liquid: ['شكل الوعاء · حجم ثابت تقريبًا', 'السائل يعيد توزيع نفسه، لكن نفس الكمية تظل موجودة.'],
    gas: ['يملأ الحيز المتاح', 'الغاز ينتشر في الوعاء؛ شكله وحجمه يتبعان الحيز المتاح.'],
  },
  compression: {
    solid: ['صعب الانضغاط', 'الجسيمات متقاربة، فالفراغ المتاح لتقليل الحجم صغير.'],
    liquid: ['صعب الانضغاط', 'الجسيمات متقاربة أيضًا، رغم قدرتها على الحركة.'],
    gas: ['قابل للانضغاط', 'نفس الجسيمات في حيز أصغر؛ الفراغات تقل والكثافة تزيد.'],
  },
  diffusion: {
    solid: ['انتشار بطيء جدًا', 'الجسيمات تهتز حول مواضعها؛ الصلب لا يسيل كالسائل.'],
    liquid: ['يسيل وينتشر', 'الجسيمات تتحرك وتتبادل أماكنها؛ الانتشار أبطأ عادةً من الغاز.'],
    gas: ['ينتشر سريعًا', 'الجسيمات المتباعدة تتحرك خلال الحيز المتاح.'],
  },
  particles: {
    solid: ['متقاربة ومنظمة نسبيًا', 'حركة اهتزازية حول مواضع شبه ثابتة في التمثيل المبسّط.'],
    liquid: ['متقاربة وأقل انتظامًا', 'تتحرك حول بعضها بدل التثبيت في شبكة منتظمة.'],
    gas: ['متباعدة وحرة الحركة', 'تملأ الوعاء وتتصادم بجدرانه.'],
  },
  summary: {
    solid: ['شكل وحجم محددان', 'اربط ترتيب الجسيمات بصعوبة الانضغاط.'],
    liquid: ['حجم محدد تقريبًا · شكل الوعاء', 'اربط حركة الجسيمات بالميوعة.'],
    gas: ['يملأ الوعاء · قابل للانضغاط', 'اربط المسافات بالانضغاط والانتشار.'],
  },
} as const;

export default function MatterExplorer({
  focus,
  reducedMotion,
}: {
  focus: Extract<ChemistryBoardSpec, { kind: 'matter' }>['focus'];
  reducedMotion: boolean;
}) {
  const [narrow, setNarrow] = useState(false),
    [compression, setCompression] = useState(0);
  return (
    <>
      <div className="chem-title">
        <span className="chem-label">شوف الفكرة</span>
        <h2>نفس الجسيمات… تنظيم مختلف</h2>
        <p>قارن ترتيب الجسيمات والمسافات في الحالات الثلاث.</p>
      </div>
      <div className="chem-matter-grid">
        {phases.map((phase) => (
          <article className={`chem-matter-card phase-${phase}`} key={phase}>
            <h3>
              <bdi>{phaseNames[phase]}</bdi>
            </h3>
            <Particles
              phase={phase}
              narrow={narrow}
              compression={phase === 'gas' ? compression : 0}
              reducedMotion={reducedMotion}
            />
            <strong>{matterFacts[focus][phase][0]}</strong>
            <p>{matterFacts[focus][phase][1]}</p>
          </article>
        ))}
      </div>
      <div className="chem-explore-controls">
        {focus === 'compression' ? (
          <label className="chem-slider">
            اضغط حيز الغاز{' '}
            <input
              type="range"
              min="0"
              max="100"
              value={compression}
              onChange={(e) => setCompression(Number(e.target.value))}
            />
            <output>{compression}%</output>
          </label>
        ) : (
          <button className="chem-button" onClick={() => setNarrow((v) => !v)}>
            {narrow ? 'ارجع للوعاء الأوسع' : 'جرّب وعاء أضيق'}
          </button>
        )}
        <span className="chem-note">رسم جسيمات مبسّط · العدد ثابت في كل مقارنة</span>
      </div>
    </>
  );
}
