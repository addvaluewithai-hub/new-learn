import type { QuestionSpec, SceneSpec } from './stage';

// Director's beat plan for L01. Beat keys are semantic unit suffixes of the
// scene (teaching/question) or of the feedback clip; colours: (x−1) teal c1, (x−2) amber c2.
const m = String.raw;
const EX1 = m`\f{x+1}{x^2-3x+2}`;
const SPLIT = m`\f{3}{\c2{x-2}} - \f{2}{\c1{x-1}}`;

export const SCENES: Record<string, SceneSpec> = {
  S01: {
    kicker: 'الفكرة: نوحّد المقامات… وبالعكس',
    captions: [
      { at: 'U01', ar: 'جمع أو طرح كسرين بمقامين مختلفين' },
      { at: 'U02', ar: 'نوحّد المقامات على 6' },
      { at: 'U03', ar: 'كسر واحد: 5/6' },
      { at: 'U04', ar: 'مقام مشترك، وبعدين نجمع أو نطرح البسطين' },
      { at: 'U05', ar: 'طيب نقدر نرجع بالعكس؟' },
      { at: 'U06', ar: 'نفس السؤال… بس فيه x' },
      { at: 'U07', ar: 'تحليل إلى كسور جزئية', en: 'Partial Fractions', tone: 'info' },
      { at: 'U08', ar: 'نفس القيمة… صورة تانية', tone: 'ok' },
      { at: 'U09', ar: 'Example 1 — صفحة 1' },
      { at: 'U10', ar: 'ركّز في المقام' },
      { at: 'U11', ar: 'المقام = حاصل ضرب عاملين' },
      { at: 'U12', ar: 'نفس الكسر في صورة كسور جزئية', tone: 'ok' },
      { at: 'U13', ar: 'هنا طرح: والطرح جمع بإشارة سالبة', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          {
            tex: [
              ['U01', m`\f{1}{2} + \f{1}{3}`],
              ['U02', m`\f{1}{2} + \f{1}{3} = \f{\c1{3}}{6} + \f{\c2{2}}{6}`],
              ['U03', m`\f{1}{2} + \f{1}{3} = \f{\c1{3}}{6} + \f{\c2{2}}{6} = \f{\ok{5}}{6}`],
              ['U05', m`\f{5}{6}\ \to\ \f{?}{\ \ } + \f{?}{\ \ }`],
              ['U08', m`\f{5}{6}\ \g{eq}{=}\ \f{1}{2} + \f{1}{3}`],
            ],
          },
          { at: 'U06', tex: m`${EX1}\ \to\ \f{?}{\ \ \ } + \f{?}{\ \ \ }` },
        ],
        fx: [{ at: 'U08', g: 'eq', k: 'hl' }],
      },
      {
        at: 'U09',
        rows: [
          { tex: [['U09', m`\f{x+1}{\g{den}{x^2-3x+2}}`], ['U11', m`\f{x+1}{\g{den}{(\c1{x-1})(\c2{x-2})}}`]] },
          { at: 'U12', tex: m`= \f{3}{\c2{x-2}}\ \g{minus}{\minus}\ \f{2}{\c1{x-1}}` },
        ],
        fx: [{ at: 'U10', until: 'U12', g: 'den', k: 'hl' }, { at: 'U13', g: 'minus', k: 'hl' }],
      },
    ],
  },
  S02: {
    kicker: 'نتأكد ونتعرف على الدرجة',
    captions: [
      { at: 'U01', ar: 'وحّد المقامين' },
      { at: 'U02', ar: 'فك الأقواس' },
      { at: 'U03', ar: 'رجعنا للبسط الأصلي', tone: 'ok' },
      { at: 'U04', ar: 'المقام ما يصفّرش: x ≠ 1 و 2', tone: 'warn' },
      { at: 'U05', ar: 'بص على المقدار ده' },
      { at: 'U06', ar: 'أسس صحيحة غير سالبة' },
      { at: 'U07', ar: 'اسمه كثيرة حدود', en: 'Polynomial', tone: 'info' },
      { at: 'U08', ar: 'أعلى أس = الدرجة', en: 'Degree', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: [['U01', m`${SPLIT} = \f{3(\c1{x-1}) - 2(\c2{x-2})}{(\c1{x-1})(\c2{x-2})}`], ['U02', m`${SPLIT} = \f{3x-3-2x+4}{(\c1{x-1})(\c2{x-2})}`], ['U03', m`${SPLIT} = \f{\ok{x+1}}{(\c1{x-1})(\c2{x-2})}`]] },
        ],
        widget: { kind: 'numberline', at: 'U04', holes: [1, 2], range: [-1, 4], label: 'x ≠ 1 ، 2' },
      },
      {
        at: 'U05',
        side: true,
        rows: [{ tex: [['U05', m`x^2 - 3x + 2`], ['U06', m`x^{\c4{2}} - 3x^{\c4{1}} + 2x^{\c4{0}}`], ['U08', m`\g{lead}{x^{\c4{2}}} - 3x + 2`]] }],
        fx: [{ at: 'U08', g: 'lead', k: 'hl' }],
        widget: {
          kind: 'table', at: 'U08', cols: ['@المقدار', '@الدرجة'],
          rows: [
            { at: 'U08', cells: [m`x^2-3x+2`, '2'] },
            { at: 'U09', cells: [m`x+1`, '1'] },
            { at: 'U10', cells: ['5', '0'] },
          ],
        },
      },
    ],
  },
  S03: {
    kicker: 'الكسر الجبري ونوعه',
    captions: [
      { at: 'U01', ar: 'بسط ومقام: كثيرتا حدود' },
      { at: 'U02', ar: 'كسر جبري نسبي', en: 'Rational Fraction', tone: 'info' },
      { at: 'U03', ar: 'المقام صفر ← الكسر غير معرّف', tone: 'warn' },
      { at: 'U04', ar: 'Example 1: نستبعد 1 و 2', tone: 'warn' },
      { at: 'U05', ar: 'قارن الدرجات قبل أي خطوة' },
      { at: 'U06', ar: 'درجة البسط أقل ← Proper', tone: 'ok' },
      { at: 'U07', ar: 'مثالنا: 1 أقل من 2 ← Proper', tone: 'ok' },
      { at: 'U08', ar: 'درجة البسط مساوية أو أكبر ← Improper', tone: 'warn' },
      { at: 'U09', ar: 'Improper: قسمة الأول، بعدين تفكيك' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`\f{\c1{P(x)}}{\c2{Q(x)}}`, size: 1.15 },
          { at: 'U03', tex: m`\c2{Q(a)} = 0\ \to\ \no{\t{undefined at }x = a}`, size: 0.8 },
        ],
        widget: { kind: 'numberline', at: 'U04', holes: [1, 2], range: [-1, 4], label: 'Example 1: x ≠ 1 ، 2' },
      },
      {
        at: 'U05',
        side: true,
        rows: [
          { tex: [['U05', m`\t{deg }\c1{P}\ \ \mu{?}\ \ \t{deg }\c2{Q}`], ['U06', m`\t{deg }\c1{P} < \t{deg }\c2{Q}\ \to\ \ok{\t{Proper}}`]], size: 0.85 },
          { at: 'U07', tex: EX1 },
        ],
        widget: { kind: 'bars', at: 'U07', num: 1, den: 2, numLabel: 'درجة البسط', denLabel: 'درجة المقام' },
      },
      {
        at: 'U08',
        rows: [{ tex: m`\t{deg }\c1{P} \ge \t{deg }\c2{Q}\ \to\ \c2{\t{Improper}}`, size: 0.85 }],
        widget: {
          kind: 'steps', at: 'U08',
          items: [
            { at: 'U08', ar: 'كسر Improper', en: 'deg P ≥ deg Q' },
            { at: 'U09', ar: 'قسمة كثيرات حدود', en: 'divide first' },
            { at: 'U09', ar: 'بعدين نفك الباقي', en: 'then decompose' },
          ],
        },
      },
    ],
  },
  S04: {
    kicker: 'Improper: القسمة قبل التفكيك',
    captions: [
      { at: 'U01', ar: 'مثال الكتاب' },
      { at: 'U02', ar: 'درجة 2 فوق درجة 2 ← Improper', tone: 'warn' },
      { at: 'U03', ar: 'الهدف: عدد + كسر Proper' },
      { at: 'U04', ar: 'نكتب البسط بدلالة المقام' },
      { at: 'U05', ar: 'الجزء الأول = 1' },
      { at: 'U06', ar: 'الباقي Proper: درجة 0 أقل من 2', tone: 'ok' },
      { at: 'U07', ar: 'مثال الكتاب التاني' },
      { at: 'U08', ar: 'x جزء Polynomial، والباقي Proper' },
      { at: 'U09', ar: 'خطوتين منفصلتين: قسمة ثم تفكيك', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        side: true,
        rows: [
          { tex: [['U01', m`\f{x^2}{x^2+2}`], ['U04', m`\f{\g{a}{(x^2+2)} - 2}{x^2+2}`], ['U05', m`\f{\g{a}{x^2+2}}{x^2+2} - \f{2}{x^2+2}`], ['U06', m`\ok{1} - \f{2}{x^2+2}`]] },
          { at: 'U03', tex: m`\f{x^2}{x^2+2} = 1 - \f{2}{x^2+2}`, size: 0.8 },
        ],
        fx: [{ at: 'U04', until: 'U06', g: 'a', k: 'hl' }],
        widget: { kind: 'bars', at: 'U02', num: 2, den: 2, numLabel: 'درجة البسط', denLabel: 'درجة المقام' },
      },
      {
        at: 'U07',
        rows: [{ tex: m`\f{x^3}{x^2+2} = \g{poly}{\c4{x}} - \g{rem}{\f{2x}{x^2+2}}` }],
        fx: [{ at: 'U08', g: 'poly', k: 'hl' }, { at: 'U08', g: 'rem', k: 'hl' }],
        widget: {
          kind: 'steps', at: 'U09',
          items: [
            { at: 'U09', ar: 'Improper', en: 'deg P ≥ deg Q' },
            { at: 'U09', ar: 'جزء Polynomial + باقي Proper', en: 'divide' },
            { at: 'U09', ar: 'نفك الباقي', en: 'decompose' },
          ],
        },
      },
    ],
  },
  S05: {
    kicker: 'قبل الأسئلة',
    captions: [
      { at: 'U01', ar: 'سؤالين صغيرين نتأكد بيهم' },
      { at: 'U04', ar: 'جرّب على ورقة… والحل بعد ما تجاوب', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        widget: {
          kind: 'steps', at: 'U01',
          items: [
            { at: 'U02', ar: 'جمع الكسور ورجوعها', en: 'Q01' },
            { at: 'U03', ar: 'الدرجات وأول خطوة', en: 'Q02' },
          ],
        },
      },
    ],
  },
  S08: {
    kicker: 'الخلاصة',
    captions: [
      { at: 'U01', ar: 'عكس توحيد المقامات', en: 'Partial Fractions', tone: 'info' },
      { at: 'U02', ar: 'وماننساش قيم x الممنوعة', tone: 'warn' },
      { at: 'U03', ar: 'المصطلحات' },
      { at: 'U05', ar: 'الدرس الجاي: شكل عوامل المقام', tone: 'info' },
    ],
    panels: [
      { at: 'U01', rows: [{ tex: m`${EX1} = ${SPLIT}` }, { at: 'U02', tex: m`\no{x \ne 1,\ 2}` }] },
      {
        at: 'U03',
        widget: {
          kind: 'steps', at: 'U03',
          items: [
            { at: 'U03', ar: 'كثيرة حدود', en: 'Polynomial' },
            { at: 'U03', ar: 'الدرجة', en: 'Degree' },
            { at: 'U03', ar: 'كسر جبري نسبي', en: 'Rational Fraction' },
            { at: 'U04', ar: 'Proper / Improper', en: 'compare degrees' },
          ],
        },
      },
      { at: 'U05', rows: [{ tex: m`\f{P(x)}{(\c1{x-a})(\c2{x-b})\cdots}` }] },
    ],
  },
};

export const QUESTIONS: Record<string, QuestionSpec> = {
  S06: { kicker: 'جرّب بنفسك — Q01', formula: m`\f{2}{x-1} + \f{1}{x+2}\ = \f{3x+3}{(x-1)(x+2)}`, asks: ['combine the fractions', 'state the excluded values of x'] },
  S07: { kicker: 'جرّب بنفسك — Q02', formula: m`\f{2x+3}{x^2+4}\q\f{x^2+1}{x+1}`, asks: ['proper or improper?', 'numerator & denominator degrees', 'which needs division first?'] },
};

export const FEEDBACK: Record<string, SceneSpec> = {
  S06: {
    kicker: 'الإجابة النموذجية — Q01',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: 'كل بسط × العامل الناقص من مقامه' },
      { at: 'U2', ar: 'البسط = 3x + 3', tone: 'ok' },
      { at: 'U3', ar: 'ممنوع: x = 1 و x = −2', tone: 'warn' },
      { at: 'U4', ar: 'البسط مختلف؟ راجع الضرب في العامل الناقص', tone: 'info' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`\f{2}{\c1{x-1}} + \f{1}{\c2{x+2}}` },
          { at: 'U1', tex: [['U1', m`= \f{2(\c2{x+2}) + 1(\c1{x-1})}{(\c1{x-1})(\c2{x+2})}`], ['U2', m`= \f{\ok{3x+3}}{(\c1{x-1})(\c2{x+2})}`]] },
          { at: 'U3', tex: m`\no{x \ne 1,\ -2}` },
        ],
      },
    ],
  },
  S07: {
    kicker: 'الإجابة النموذجية — Q02',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: 'الأول: 1 أقل من 2 ← Proper', tone: 'ok' },
      { at: 'U2', ar: 'التاني: 2 أكبر من 1 ← Improper، قسمة الأول', tone: 'warn' },
      { at: 'U3', ar: 'بنعد أعلى أس، مش عدد الحدود', tone: 'info' },
    ],
    panels: [
      {
        at: 'UEN',
        widget: {
          kind: 'table', at: 'UEN', cols: ['@الكسر', '@درجة البسط', '@درجة المقام', '@النوع'],
          rows: [
            { at: 'U1', cells: [m`\f{2x+3}{x^2+4}`, '1', '2', m`\ok{\t{Proper}}`] },
            { at: 'U2', cells: [m`\f{x^2+1}{x+1}`, '2', '1', m`\c2{\t{Improper}}`] },
          ],
          hl: [{ at: 'U3', col: 1 }, { at: 'U3', col: 2 }],
        },
      },
    ],
  },
};
