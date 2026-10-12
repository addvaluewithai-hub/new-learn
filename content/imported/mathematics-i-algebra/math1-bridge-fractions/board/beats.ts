import type { QuestionSpec, SceneSpec } from './stage';

// Director's beat plan for the fractions bridge. Pies are the concrete picture;
// numerator teal (pieces taken), denominator amber (equal pieces).
const m = String.raw;
const HALF = m`\f{\c1{1}}{\c2{2}}`;

export const SCENES: Record<string, SceneSpec> = {
  S01: {
    kicker: 'يعني إيه كسر؟',
    captions: [
      { at: 'U01', ar: 'بيتزا مقطعة حتتين متساويين' },
      { at: 'U02', ar: 'ده نص: ½' },
      { at: 'U03', ar: 'تحت: اتقسمت كام حتة · فوق: خدت كام' },
      { at: 'U04', ar: 'تلات حتت متساوية: ⅓' },
      { at: 'U05', ar: 'البسط: عدد الحتت اللي معاك', en: 'Fraction · Numerator', tone: 'info' },
      { at: 'U06', ar: 'المقام: حجم الحتة، ⅓ أصغر من ½', en: 'Denominator', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        side: true,
        rows: [{ at: 'U02', tex: [['U02', m`\f{1}{2}`], ['U03', m`\f{\g{num}{\c1{1}}}{\g{den}{\c2{2}}}`]], size: 1.5 }],
        fx: [{ at: 'U05', until: 'U06', g: 'num', k: 'hl' }, { at: 'U06', g: 'den', k: 'hl' }],
        widget: {
          kind: 'pies', at: 'U01',
          pies: [
            { at: 'U01', labels: [['U02', HALF]], states: [{ at: 'U01', parts: 2, fills: [[1, 'c1']] }] },
            { at: 'U04', labels: [['U04', m`\f{\c1{1}}{\c2{3}}`]], states: [{ at: 'U04', parts: 3, fills: [[1, 'c1']] }] },
          ],
        },
      },
    ],
  },
  S02: {
    kicker: 'نفس القيمة بشكل تاني',
    captions: [
      { at: 'U01', ar: 'نقطّع كل حتة 3 حتت أصغر' },
      { at: 'U02', ar: '½ هي هي 3/6' },
      { at: 'U03', ar: 'ما زودتش ولا نقصت', tone: 'ok' },
      { at: 'U04', ar: 'نضرب فوق وتحت في نفس الرقم' },
      { at: 'U05', ar: 'القيمة واحدة… الشكل بس اتغير', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        side: true,
        rows: [
          { at: 'U02', tex: m`\f{1}{2}\ \g{eq}{=}\ \f{3}{6}`, size: 1.2 },
          { at: 'U04', tex: m`\f{1 \times \c4{3}}{2 \times \c4{3}} = \f{3}{6}` },
        ],
        fx: [{ at: 'U05', g: 'eq', k: 'hl' }],
        widget: {
          kind: 'pies', at: 'U01',
          pies: [{ at: 'U01', labels: [['U01', HALF], ['U02', m`\f{\c1{3}}{\c2{6}}`]], states: [{ at: 'U01', parts: 2, fills: [[1, 'c1']] }, { at: 'U02', parts: 6, fills: [[3, 'c1']] }] }],
        },
      },
    ],
  },
  S03: {
    kicker: 'نجمع ونطرح الكسور',
    captions: [
      { at: 'U01', ar: 'نص + تلت = ؟' },
      { at: 'U02', ar: 'غلطة: نجمع فوق مع فوق وتحت مع تحت', tone: 'warn' },
      { at: 'U03', ar: 'الحتت مش نفس الحجم', tone: 'warn' },
      { at: 'U04', ar: 'نخلي الحتت كلها سُدس' },
      { at: 'U05', ar: 'دلوقتي نعدّ: 3 + 2 = 5 حتت', tone: 'ok' },
      { at: 'U06', ar: 'توحيد المقامات: 2 × 3 = 6', en: 'Common Denominator', tone: 'info' },
      { at: 'U07', ar: 'والطرح نفس الفكرة' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`\f{1}{2} + \f{1}{3} = \ ?` },
          { at: 'U02', tex: m`\g{bad}{\f{1 + 1}{2 + 3} = \f{2}{5}}`, size: 0.85 },
        ],
        fx: [{ at: 'U02', g: 'bad', k: 'strike' }],
        widget: {
          kind: 'pies', at: 'U01',
          pies: [
            { at: 'U01', labels: [['U01', m`\f{1}{2}`]], states: [{ at: 'U01', parts: 2, fills: [[1, 'c1']] }] },
            { at: 'U01', labels: [['U01', m`\f{1}{3}`]], states: [{ at: 'U01', parts: 3, fills: [[1, 'c2']] }] },
          ],
        },
      },
      {
        at: 'U04',
        rows: [
          { tex: [['U04', m`\f{1}{2} + \f{1}{3} = \f{\c1{3}}{6} + \f{\c2{2}}{6}`], ['U05', m`\f{1}{2} + \f{1}{3} = \f{\c1{3}}{6} + \f{\c2{2}}{6} = \f{\ok{5}}{6}`]] },
          { at: 'U06', tex: m`2 \times 3 = \c4{6}`, size: 0.7 },
        ],
        widget: {
          kind: 'pies', at: 'U04',
          pies: [
            { at: 'U04', labels: [['U04', m`\f{3}{6}`]], states: [{ at: 'U04', parts: 6, fills: [[3, 'c1']] }] },
            { at: 'U04', labels: [['U04', m`\f{2}{6}`]], states: [{ at: 'U04', parts: 6, fills: [[2, 'c2']] }] },
            { at: 'U05', labels: [['U05', m`\f{5}{6}`]], states: [{ at: 'U05', parts: 6, fills: [[3, 'c1'], [2, 'c2']] }] },
          ],
        },
      },
      {
        at: 'U07',
        rows: [{ tex: m`\f{1}{2} - \f{1}{3} = \f{3}{6} - \f{2}{6} = \f{\ok{1}}{6}` }],
        widget: { kind: 'pies', at: 'U07', pies: [{ at: 'U07', labels: [['U07', m`\f{1}{6}`]], states: [{ at: 'U07', parts: 6, fills: [[1, 'c1']] }] }] },
      },
    ],
  },
  S04: {
    kicker: 'المقام صفر؟ وفكرة التفكيك',
    captions: [
      { at: 'U01', ar: 'نقسم لصفر حتت؟ مالوش معنى' },
      { at: 'U02', ar: 'القسمة على صفر غير معرّفة', tone: 'warn' },
      { at: 'U03', ar: 'جمعنا… طب نرجع بالعكس؟' },
      { at: 'U04', ar: 'العكس اسمه Partial Fractions', tone: 'info' },
    ],
    panels: [
      { at: 'U01', rows: [{ tex: [['U01', m`\f{1}{0} = \ ?`], ['U02', m`\g{z}{\f{1}{0}}\ \to\ \no{\t{undefined}}`]], size: 1.3 }], fx: [{ at: 'U02', g: 'z', k: 'strike' }] },
      {
        at: 'U03',
        rows: [
          { tex: m`\f{1}{2} + \f{1}{3}\ \to\ \f{5}{6}` },
          { tex: m`\f{5}{6}\ \g{rev}{\to}\ \f{1}{2} + \f{1}{3}` },
        ],
        fx: [{ at: 'U04', g: 'rev', k: 'hl' }],
      },
    ],
  },
  S07: {
    kicker: 'الخلاصة',
    captions: [
      { at: 'U01', ar: 'البسط فوق والمقام تحت' },
      { at: 'U02', ar: 'نضرب فوق وتحت في نفس الرقم' },
      { at: 'U03', ar: 'نوحّد المقامات… والمقام عمره ما يبقى صفر', tone: 'warn' },
      { at: 'U04', ar: 'الدرس الجاي: حروف مكان الأرقام', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`\f{\c1{\t{Numerator}}}{\c2{\t{Denominator}}}`, size: 0.8 },
          { at: 'U02', tex: m`\f{1}{2} = \f{3}{6}`, size: 0.85 },
          { at: 'U03', tex: m`\f{1}{2} + \f{1}{3} = \f{5}{6}\q\t{denominator } \ne 0`, size: 0.85 },
          { at: 'U04', tex: m`\f{5}{6}\ \to\ \f{1}{2} + \f{1}{3}`, size: 0.85 },
        ],
      },
    ],
  },
};

export const QUESTIONS: Record<string, QuestionSpec> = {
  S05: { kicker: 'جرّب بنفسك — Q01', formula: m`\f{1}{3} + \f{1}{4}`, asks: ['one single fraction'] },
  S06: { kicker: 'جرّب بنفسك — Q02', formula: m`\f{3}{4} - \f{1}{2}`, asks: ['subtract', 'why is a zero denominator impossible?'] },
};

export const FEEDBACK: Record<string, SceneSpec> = {
  S05: {
    kicker: 'الإجابة النموذجية — Q01',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: 'المقام المشترك 12' },
      { at: 'U2', ar: '⅓ = 4/12 و ¼ = 3/12', tone: 'ok' },
      { at: 'U3', ar: 'غلطة مشهورة: 2/7', tone: 'warn' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`\f{1}{3} + \f{1}{4} = \f{4}{12} + \f{3}{12} = \f{\ok{7}}{12}` },
          { at: 'U1', tex: m`3 \times 4 = \c4{12}`, size: 0.7 },
          { at: 'U3', tex: m`\g{bad}{\f{1 + 1}{3 + 4} = \f{2}{7}}`, size: 0.8 },
        ],
        fx: [{ at: 'U3', g: 'bad', k: 'strike' }],
      },
    ],
  },
  S06: {
    kicker: 'الإجابة النموذجية — Q02',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: '½ = 2/4' },
      { at: 'U2', ar: '4 تنفع مقام مشترك أصلًا', tone: 'info' },
      { at: 'U3', ar: 'تقسيم لصفر حتت مالوش معنى', tone: 'warn' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`\f{3}{4} - \f{1}{2} = \f{3}{4} - \f{2}{4} = \f{\ok{1}}{4}` },
          { at: 'U3', tex: m`\g{z}{\f{1}{0}}\ \to\ \no{\t{undefined}}`, size: 0.85 },
        ],
        fx: [{ at: 'U3', g: 'z', k: 'strike' }],
      },
    ],
  },
};
