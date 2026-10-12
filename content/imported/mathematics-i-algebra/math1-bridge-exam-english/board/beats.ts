import type { QuestionSpec, SceneSpec } from './stage';
import type { WidgetSpec } from './widgets';

// Director's beat plan for reading maths questions in English. Every word is shown
// beside its symbol or meaning; full questions are read verb → symbols → condition.
const m = String.raw;
const WORDS = (at: string, head: [string, string], rows: Array<{ at: string; cells: [string, string] }>): WidgetSpec => ({
  kind: 'table', at, cols: head, rows,
});

export const SCENES: Record<string, SceneSpec> = {
  S01: {
    kicker: 'عشرين كلمة بس',
    captions: [
      { at: 'U01', ar: 'مش محتاج إنجليزي قوي: حوالي 20 كلمة بتتكرر', tone: 'info' },
      { at: 'U02', ar: 'العمليات' },
      { at: 'U03', ar: 'over يعني «على»' },
      { at: 'U04', ar: 'قبل over فوق الخط · بعدها تحته', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        side: true,
        rows: [
          { at: 'U03', tex: m`\f{5}{6}`, note: 'five over six' },
          { at: 'U04', tex: m`\f{\g{top}{x + 1}}{\g{bottom}{x - 2}}`, note: 'x plus one over x minus two' },
        ],
        fx: [{ at: 'U04', g: 'top', k: 'hl' }],
        widget: WORDS('U02', ['@الكلمة', '@الرمز'], [
          { at: 'U02', cells: ['@plus', '+'] }, { at: 'U02', cells: ['@minus', m`-`] },
          { at: 'U02', cells: ['@times', m`\times`] }, { at: 'U02', cells: ['@equals', '='] },
          { at: 'U03', cells: ['@over', m`\f{a}{b}`] },
        ]),
      },
    ],
  },
  S02: {
    kicker: 'الأسس وأجزاء الكسر',
    captions: [
      { at: 'U01', ar: 'الأسس بالإنجليزي' },
      { at: 'U02', ar: '2x² = two x squared' },
      { at: 'U03', ar: 'البسط والمقام', en: 'numerator · denominator' },
      { at: 'U04', ar: 'كلمات هتقابلها كتير', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        widget: WORDS('U01', ['@بالإنجليزي', '@الرمز'], [
          { at: 'U01', cells: ['@x squared', m`x^2`] }, { at: 'U01', cells: ['@x cubed', m`x^3`] },
          { at: 'U01', cells: ['@x to the power four', m`x^4`] }, { at: 'U02', cells: ['@two x squared', m`2x^2`] },
        ]),
      },
      { at: 'U03', rows: [{ tex: m`\f{\c1{\t{numerator}}}{\c2{\t{denominator}}}` }] },
      {
        at: 'U04',
        widget: WORDS('U04', ['@الكلمة', '@المعنى'], [
          { at: 'U04', cells: ['@factor', '@عامل (قوس من الأقواس المضروبة)'] }, { at: 'U04', cells: ['@factorise', '@حلّل'] },
          { at: 'U04', cells: ['@expand', '@افرد الأقواس'] }, { at: 'U04', cells: ['@degree', '@الدرجة: أعلى أس'] },
        ]),
      },
    ],
  },
  S03: {
    kicker: 'أفعال الطلب والشروط',
    captions: [
      { at: 'U01', ar: 'أفعال الطلب: بتقولك تعمل إيه', tone: 'info' },
      { at: 'U02', ar: 'وكمان…' },
      { at: 'U03', ar: 'not equal to = لا يساوي' },
      { at: 'U04', ar: 'excluded values = القيم الممنوعة', tone: 'warn' },
    ],
    panels: [
      {
        at: 'U01',
        widget: WORDS('U01', ['@الفعل', '@المعنى'], [
          { at: 'U01', cells: ['@Find', '@أوجد / طلّع'] }, { at: 'U01', cells: ['@Solve', '@حل'] }, { at: 'U01', cells: ['@Simplify', '@بسّط'] },
          { at: 'U02', cells: ['@Verify', '@اتأكد إنه صح'] }, { at: 'U02', cells: ['@Express / Resolve', '@اكتبه في صورة تانية'] }, { at: 'U02', cells: ['@State', '@اذكر الإجابة'] },
        ]),
      },
      {
        at: 'U03',
        rows: [
          { tex: m`x \ne 1`, note: 'x not equal to one', size: 1.2 },
          { at: 'U04', tex: m`\f{1}{(x - 1)(x - 2)}\q \no{x \ne 1,\ 2}` },
        ],
      },
    ],
  },
  S04: {
    kicker: 'نقرا سؤال كامل',
    captions: [
      { at: 'U01', ar: 'سؤال كامل من الكسور الجزئية' },
      { at: 'U02', ar: 'Resolve: اكتبه في صورة تانية' },
      { at: 'U03', ar: 'الكسر: فوق وتحت' },
      { at: 'U04', ar: 'يعني: فكّك الكسر لكسور أبسط', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [{ tex: m`\g{v}{\t{Resolve}}\ \g{f}{\f{x + 1}{x^2 - 3x + 2}}\ \g{w}{\t{into partial fractions}}`, size: 0.9 }],
        fx: [{ at: 'U02', until: 'U03', g: 'v', k: 'hl' }, { at: 'U03', until: 'U04', g: 'f', k: 'hl' }, { at: 'U04', g: 'w', k: 'hl' }],
      },
    ],
  },
  S05: {
    kicker: 'مثال من الكتاب ونصيحة',
    captions: [
      { at: 'U01', ar: 'سؤال من الكتاب، صفحة 4' },
      { at: 'U02', ar: 'Find = طلّع · representations = الصورة', tone: 'ok' },
      { at: 'U03', ar: 'الفعل ← الرموز ← الشروط', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [{ tex: m`\g{v}{\t{Find}}\ \t{the partial fraction}\ \g{r}{\t{representations}}\ \t{of}\ \f{5x + 1}{x^2 - x - 12}`, size: 0.8 }],
        fx: [{ at: 'U02', g: 'v', k: 'hl' }, { at: 'U02', g: 'r', k: 'hl' }],
      },
      {
        at: 'U03',
        widget: {
          kind: 'steps', at: 'U03',
          items: [
            { at: 'U03', ar: 'فعل الطلب', en: 'verb' },
            { at: 'U03', ar: 'الرموز', en: 'symbols' },
            { at: 'U03', ar: 'الشروط', en: 'conditions' },
          ],
        },
      },
    ],
  },
  S08: {
    kicker: 'الخلاصة',
    captions: [
      { at: 'U01', ar: 'كلمات قليلة بتتكرر' },
      { at: 'U02', ar: 'أفعال الطلب' },
      { at: 'U03', ar: 'جاهز للكسور الجزئية', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        widget: {
          kind: 'steps', at: 'U01',
          items: [
            { at: 'U01', ar: 'العمليات والأسس', en: 'plus · minus · times · over · squared' },
            { at: 'U01', ar: 'أجزاء الكسر', en: 'numerator · denominator · factor · degree' },
            { at: 'U02', ar: 'أفعال الطلب', en: 'find · solve · verify · resolve · state' },
            { at: 'U03', ar: 'الشروط', en: 'not equal to · excluded values' },
          ],
        },
      },
    ],
  },
};

export const QUESTIONS: Record<string, QuestionSpec> = {
  S06: { kicker: 'جرّب بنفسك — Q01', formula: m`\t{“x squared minus four over x plus two”}`, asks: ['write it in symbols'] },
  S07: { kicker: 'جرّب بنفسك — Q02', formula: m`\t{Expand }2(x - 3)\t{ and state the coefficient of }x`, asks: ['what is the question asking?'] },
};

export const FEEDBACK: Record<string, SceneSpec> = {
  S06: {
    kicker: 'الإجابة النموذجية — Q01',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: 'قبل over فوق · بعدها تحت', tone: 'ok' },
      { at: 'U2', ar: 'غلطة: قسمة في المكان الغلط', tone: 'warn' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`\f{\c1{x^2 - 4}}{\c2{x + 2}}`, size: 1.2 },
          { at: 'U2', tex: m`\g{bad}{\f{x^2 - 4}{x} + 2}`, size: 0.85 },
        ],
        fx: [{ at: 'U2', g: 'bad', k: 'strike' }],
      },
    ],
  },
  S07: {
    kicker: 'الإجابة النموذجية — Q02',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: 'طلبين: Expand و state the coefficient' },
      { at: 'U2', ar: 'المعامل 2… و −6 ده الثابت', tone: 'warn' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`2(x - 3) = \c1{2}x - \c2{6}` },
          { at: 'U2', tex: m`\t{coefficient of }x = \c1{\box{2}}`, size: 0.85 },
        ],
      },
    ],
  },
};
