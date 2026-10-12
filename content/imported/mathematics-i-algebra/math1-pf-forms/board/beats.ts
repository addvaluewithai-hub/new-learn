import type { QuestionSpec, SceneSpec } from './stage';
import type { WidgetSpec } from './widgets';

// Director's beat plan for L02 (choosing the form). Colour = factor identity:
// first linear factor teal c1, second/repeated linear amber c2, irreducible quadratic violet c3.
const m = String.raw;

const MAP = (at: { r1: string; r2: string; r3: string; r4: string; table: string }, hl: Array<{ at: string; until?: string; row: number }> = []): WidgetSpec => ({
  kind: 'table', at: at.table, cols: ['@نوع العامل', '@في المقام', '@حدوده في الصورة'],
  rows: [
    { at: at.r1, cells: ['@خطي مختلف', m`\c1{x-a}`, m`\f{A}{x-a}`] },
    { at: at.r2, cells: ['@خطي مكرر', m`\c2{(x-a)^2}`, m`\f{A}{x-a} + \f{B}{(x-a)^2}`] },
    { at: at.r3, cells: ['@تربيعي غير قابل للتحليل', m`\c3{q(x)}`, m`\f{Ax+B}{q}`] },
    { at: at.r4, cells: ['@تربيعي مكرر', m`\c3{q(x)^2}`, m`\f{Ax+B}{q} + \f{Cx+D}{q^2}`] },
  ],
  hl,
});

export const SCENES: Record<string, SceneSpec> = {
  S01: {
    kicker: 'نختار الشكل قبل الحساب',
    captions: [
      { at: 'U01', ar: 'من الدرس اللي فات' },
      { at: 'U02', ar: 'كام كسر؟ وكل كسر مقامه إيه؟' },
      { at: 'U03', ar: 'تخمين من غير تحليل المقام ← شكل غلط', tone: 'warn' },
      { at: 'U04', ar: 'الشكل العام', en: 'general partial-fraction form', tone: 'info' },
      { at: 'U05', ar: 'A و B: لسه مش هنحسبهم' },
      { at: 'U06', ar: 'ترتيب القرار' },
      { at: 'U09', ar: 'على الأعداد الحقيقية: نوعين من التربيعي', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: [['U01', m`\f{x+1}{x^2-3x+2} = \f{3}{x-2} - \f{2}{x-1}`], ['U02', m`\f{P(x)}{Q(x)} = \f{\mu{?}}{\mu{?}} + \f{\mu{?}}{\mu{?}} + \mu{\dots}`]] },
          { at: 'U03', tex: m`\g{bad}{\f{A}{\mu{?}} + \f{B}{\mu{?}}}` },
        ],
        fx: [{ at: 'U03', g: 'bad', k: 'strike' }],
      },
      {
        at: 'U06',
        rows: [{ at: 'U09', tex: m`\t{reducible: }x^2-1 = (x-1)(x+1)\q\t{irreducible: }\c3{x^2+1}`, size: 0.7 }],
        widget: {
          kind: 'steps', at: 'U06',
          items: [
            { at: 'U06', ar: 'Improper؟ قسمة الأول', en: 'divide first' },
            { at: 'U07', ar: 'Proper: حلّل المقام', en: 'factor Q(x)' },
            { at: 'U08', ar: 'نوع العامل ← شكل البسط', en: 'factor → numerator' },
          ],
        },
      },
    ],
  },
  S02: {
    kicker: 'عاملان خطيان مختلفان',
    captions: [
      { at: 'U01', ar: 'مقام فيه عاملين خطيين' },
      { at: 'U02', ar: 'خطي = أعلى درجة 1', en: 'linear' },
      { at: 'U03', ar: 'كسر مستقل لكل عامل', tone: 'ok' },
      { at: 'U04', ar: 'ليه A و B ثوابت؟' },
      { at: 'U05', ar: 'درجة البسط أقل من 1 ← ثابت', tone: 'ok' },
      { at: 'U06', ar: 'Example 2 — صفحة 3' },
      { at: 'U07', ar: 'حساب الثوابت: الدرس الجاي', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: [['U01', m`\f{P(x)}{(\c1{x-1})(\c2{x+4})}`], ['U03', m`\f{P(x)}{(\c1{x-1})(\c2{x+4})} = \f{\g{A}{A}}{\c1{x-1}} + \f{\g{B}{B}}{\c2{x+4}}`]] },
          { at: 'U02', tex: m`\t{deg}(\c1{x-1}) = 1\q\t{deg}(\c2{x+4}) = 1`, size: 0.7 },
          { at: 'U05', tex: m`\t{deg(numerator)} < 1\ \to\ \ok{\t{constant}}`, size: 0.7 },
        ],
        fx: [{ at: 'U04', until: 'U06', g: 'A', k: 'hl' }, { at: 'U04', until: 'U06', g: 'B', k: 'hl' }],
      },
      {
        at: 'U06',
        rows: [
          { tex: m`\f{x-19}{(\c1{x+2})(\c2{x-5})} = \f{A}{\c1{x+2}} + \f{B}{\c2{x-5}}`, note: 'حد واحد لكل عامل خطي مختلف' },
          { at: 'U07', tex: m`A = \mu{?}\q B = \mu{?}`, size: 0.8 },
        ],
      },
    ],
  },
  S03: {
    kicker: 'العامل المتكرر',
    captions: [
      { at: 'U01', ar: 'عامل متكرر' },
      { at: 'U02', ar: 'حد واحد للمربع؟ مش كفاية', tone: 'warn' },
      { at: 'U03', ar: 'القوة الأولى + القوة التانية', tone: 'ok' },
      { at: 'U04', ar: 'قوة تالتة ← تلات حدود' },
      { at: 'U05', ar: 'كل القوى من 1 لحد أعلى تكرار', tone: 'info' },
      { at: 'U11', ar: 'جرّب: (x − 5)⁴ محتاجة كام حد؟' },
      { at: 'U12', ar: 'أربعة: القوى 1 و 2 و 3 و 4', tone: 'ok' },
      { at: 'U06', ar: 'عامل مختلف + عامل متكرر' },
      { at: 'U07', ar: 'Example 3 — صفحة 3' },
      { at: 'U08', ar: 'الشكل طالع من المقام نفسه', tone: 'ok' },
      { at: 'U09', ar: 'تنبيه: القالب المطبوع في الكتاب مختلف', tone: 'warn' },
      { at: 'U10', ar: 'كل قالب لازم يتبرر من التحليل', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          {
            tex: [
              ['U01', m`\f{P(x)}{\c2{(x-2)^2}}`],
              ['U02', m`\f{P(x)}{\c2{(x-2)^2}} = \g{one}{\f{A}{\c2{(x-2)^2}}}`],
              ['U03', m`\f{P(x)}{\c2{(x-2)^2}} = \f{A}{\c2{x-2}} + \f{B}{\c2{(x-2)^2}}`],
            ],
          },
          { at: 'U03', tex: m`= \f{A(\c2{x-2}) + B}{\c2{(x-2)^2}}`, size: 0.85, note: 'بعد توحيد المقامات' },
        ],
        fx: [{ at: 'U02', until: 'U03', g: 'one', k: 'strike' }],
      },
      { at: 'U04', rows: [{ tex: m`\f{P(x)}{\c2{(x-2)^3}} = \f{A}{\c2{x-2}} + \f{B}{\c2{(x-2)^2}} + \f{C}{\c2{(x-2)^3}}` }] },
      {
        at: 'U11',
        rows: [
          { tex: m`\f{P(x)}{\c2{(x-5)^4}}` },
          { at: 'U12', tex: m`= \f{A}{\c2{x-5}} + \f{B}{\c2{(x-5)^2}} + \f{C}{\c2{(x-5)^3}} + \f{D}{\c2{(x-5)^4}}`, size: 0.85 },
        ],
      },
      {
        at: 'U06',
        rows: [
          { tex: m`\f{P(x)}{(\c1{x+3})\c2{(x-2)^2}}` },
          { at: 'U08', tex: m`= \f{A}{\c1{x+3}} + \f{B}{\c2{x-2}} + \f{C}{\c2{(x-2)^2}}` },
        ],
      },
    ],
  },
  S04: {
    kicker: 'العامل التربيعي غير القابل للتحليل',
    captions: [
      { at: 'U01', ar: 'عامل تربيعي' },
      { at: 'U02', ar: 'درجته 2' },
      { at: 'U03', ar: 'ما بيقطعش محور x ← مالوش جذور حقيقية' },
      { at: 'U04', ar: 'غير قابل للتحليل على ℝ', en: 'irreducible', tone: 'info' },
      { at: 'U05', ar: 'البسط درجته أقل من 2' },
      { at: 'U06', ar: 'بسط خطي: Ax + B', tone: 'ok' },
      { at: 'U07', ar: 'قارن بـ x² − 1' },
      { at: 'U08', ar: 'بيقطع عند ±1 ← عاملين خطيين' },
      { at: 'U09', ar: 'التصنيف على حسب الأعداد الحقيقية', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        side: true,
        rows: [
          { tex: [['U01', m`\c3{x^2+1}`], ['U05', m`\f{\mu{\t{deg} < 2}}{\c3{x^2+1}}`], ['U06', m`\f{Ax+B}{\c3{x^2+1}}`]] },
          { at: 'U07', tex: [['U07', m`\c2{x^2-1}`], ['U08', m`\c2{x^2-1} = (x-1)(x+1)`]], size: 0.8 },
        ],
        widget: { kind: 'graph', at: 'U03', curves: [{ at: 'U03', c: 1, tone: 'c3', label: 'x²+1' }, { at: 'U07', c: -1, tone: 'c2', label: 'x²−1' }] },
      },
    ],
  },
  S05: {
    kicker: 'التربيعي المتكرر… والخريطة',
    captions: [
      { at: 'U01', ar: 'تربيعي غير قابل للتحليل ومتكرر' },
      { at: 'U02', ar: 'حد لكل قوة، وكل بسط خطي' },
      { at: 'U03', ar: 'A، B غير C، D: معاملات مستقلة', tone: 'info' },
      { at: 'U04', ar: 'خريطة الأشكال' },
      { at: 'U09', ar: 'مقام مختلط ← اجمع الصفوف المناسبة', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [{ tex: [['U01', m`\f{P(x)}{\c3{(x^2+1)^2}}`], ['U02', m`\f{\c4{A}x+\c4{B}}{\c3{x^2+1}} + \f{\c1{C}x+\c1{D}}{\c3{(x^2+1)^2}}`]] }],
      },
      { at: 'U04', widget: MAP({ table: 'U04', r1: 'U05', r2: 'U06', r3: 'U07', r4: 'U08' }) },
    ],
  },
  S06: {
    kicker: 'تطبيق: نكتب القالب بس',
    captions: [
      { at: 'U01', ar: 'مثال من إعدادنا' },
      { at: 'U02', ar: 'درجة 1 فوق درجة 3 ← Proper', tone: 'ok' },
      { at: 'U03', ar: 'x − 1 مرة واحدة ← حد واحد' },
      { at: 'U04', ar: 'x + 4 مرتين ← حدين' },
      { at: 'U05', ar: 'القالب كامل: تلات حدود', tone: 'ok' },
      { at: 'U06', ar: 'من غير ما نحسب A و B و C', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`\f{2x+3}{\g{f1}{(\c1{x-1})}\g{f2}{\c2{(x+4)^2}}}` },
          { at: 'U02', tex: m`\t{deg } 1 < 3\ \to\ \ok{\t{Proper}}`, size: 0.7 },
          { at: 'U05', tex: m`= \f{A}{\c1{x-1}} + \f{B}{\c2{x+4}} + \f{C}{\c2{(x+4)^2}}` },
        ],
        fx: [{ at: 'U03', until: 'U04', g: 'f1', k: 'hl' }, { at: 'U04', until: 'U05', g: 'f2', k: 'hl' }],
      },
    ],
  },
  S09: {
    kicker: 'الخلاصة',
    captions: [
      { at: 'U01', ar: 'تكتب شكل الحل قبل ما تحسبه' },
      { at: 'U02', ar: 'فين البسط ثابت' },
      { at: 'U03', ar: 'وفين البسط خطي' },
      { at: 'U04', ar: 'وفين نكرر القوى' },
      { at: 'U05', ar: 'الدرس الجاي: نطلع A و B بالأرقام', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        widget: MAP({ table: 'U01', r1: 'U01', r2: 'U01', r3: 'U01', r4: 'U01' }, [
          { at: 'U02', until: 'U03', row: 0 }, { at: 'U02', until: 'U03', row: 1 },
          { at: 'U03', until: 'U04', row: 2 }, { at: 'U03', until: 'U04', row: 3 },
          { at: 'U04', row: 1 }, { at: 'U04', row: 3 },
        ]),
      },
      { at: 'U05', rows: [{ tex: m`\f{P(x)}{(\c1{x-a})(\c2{x-b})} = \f{\c1{A}}{\c1{x-a}} + \f{\c2{B}}{\c2{x-b}}`, note: 'قيم A و B: في الدرس الجاي' }] },
    ],
  },
};

export const QUESTIONS: Record<string, QuestionSpec> = {
  S07: { kicker: 'جرّب بنفسك — Q01', formula: m`\f{3x+2}{(x-3)(x+2)^2}`, asks: ['general form only', 'do not evaluate constants', 'why that many terms?'] },
  S08: { kicker: 'جرّب بنفسك — Q02', formula: m`\f{x+4}{(x-2)^2(x^2+1)}`, asks: ['over the reals', 'general form, no constants', 'justify each numerator'] },
};

export const FEEDBACK: Record<string, SceneSpec> = {
  S07: {
    kicker: 'الإجابة النموذجية — Q01',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: 'x − 3 مرة واحدة ← حد واحد' },
      { at: 'U2', ar: '(x + 2)² ← حدين: القوة 1 و 2' },
      { at: 'U3', ar: 'تلات حدود، مش اتنين', tone: 'ok' },
      { at: 'U4', ar: 'غلطة شائعة: نسيان القوة الأولى', tone: 'warn' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`\f{3x+2}{(\c1{x-3})\c2{(x+2)^2}}` },
          { tex: m`= \f{A}{\c1{x-3}} + \f{B}{\c2{x+2}} + \f{C}{\c2{(x+2)^2}}` },
          { at: 'U4', tex: m`\g{bad}{\f{A}{\c1{x-3}} + \f{C}{\c2{(x+2)^2}}}`, size: 0.8 },
        ],
        fx: [{ at: 'U4', g: 'bad', k: 'strike' }],
      },
    ],
  },
  S08: {
    kicker: 'الإجابة النموذجية — Q02',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: 'خطي مكرر: ثابت فوق كل قوة' },
      { at: 'U2', ar: 'x² + 1 مالوش جذور حقيقية ← بسط خطي', tone: 'ok' },
      { at: 'U3', ar: 'المجال: x ≠ 2 بس', tone: 'warn' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`\f{x+4}{\c2{(x-2)^2}\c3{(x^2+1)}}` },
          { tex: m`= \g{lin}{\f{A}{\c2{x-2}} + \f{B}{\c2{(x-2)^2}}} + \g{quad}{\f{Cx+D}{\c3{x^2+1}}}` },
          { at: 'U3', tex: m`\no{x \ne 2}`, size: 0.8 },
        ],
        fx: [{ at: 'U1', until: 'U2', g: 'lin', k: 'hl' }, { at: 'U2', until: 'U3', g: 'quad', k: 'hl' }],
      },
    ],
  },
};
