import GasPlot from './GasPlot';

const reviewPrompts = {
  matter: ['قارن الشكل والحجم', 'اربط المسافات بالانضغاط', 'سمِّ التحولات واتجاهاتها'],
  laws: [
    'T ثابتة: إيه القانون؟',
    'P ثابت: إيه القانون؟',
    'V ثابت: إيه القانون؟',
    'الكل يتغير: إيه القانون؟',
  ],
  graphs: ['اقرأ اسم كل محور', 'تابع اتجاه التغيّر', 'اربط الرسم بشرط القانون'],
  errors: ['فحص مقياس الحرارة', 'فحص ربط الحالتين', 'فحص الوحدات', 'فحص منطق الاتجاه'],
  strategy: ['اقرأ وحدّد الثابت', 'نظّم الحالتين', 'اختار العلاقة', 'راجع الوحدة والاتجاه'],
};

export default function ReviewBoard({ topic }: { topic: keyof typeof reviewPrompts }) {
  return (
    <>
      <div className="chem-title">
        <span className="chem-label">اجمع فهمك</span>
        <h2>الفكرة بطريقتك</h2>
        <p>خريطة تساعدك ترتّب الشرح. راجع العلاقات، ثم حاول في خطوة السؤال.</p>
      </div>
      <ol className="chem-review-path">
        {reviewPrompts[topic].map((item, i) => (
          <li key={item}>
            <span>{i + 1}</span>
            <strong>{item}</strong>
          </li>
        ))}
      </ol>
      {topic === 'graphs' && (
        <div className="chem-review-graphs">
          <GasPlot law="boyle" pressure={1} temperature={300} label={false} />
          <GasPlot law="charles" pressure={1} temperature={300} label={false} />
        </div>
      )}
    </>
  );
}
