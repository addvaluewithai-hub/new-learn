import type { QuestionSpec, SceneSpec } from './stage';

// Director's beat plan for L04 (three distinct linear factors, comparing coefficients).
// Colours: x teal c1 (A), (x−2) amber c2 (B), (x+3) violet c3 (C); substituted values sky c4.
const m = String.raw;
const DEN = m`\c1{x}(\c2{x-2})(\c3{x+3})`;
const EX5 = m`\f{x+1}{${DEN}}`;
const TA = m`\c1{A}(\c2{x-2})(\c3{x+3})`;
const TB = m`\c2{B}\c1{x}(\c3{x+3})`;
const TC = m`\c3{C}\c1{x}(\c2{x-2})`;
const ID5 = m`x+1 = \g{At}{${TA}} + \g{Bt}{${TB}} + \g{Ct}{${TC}}`;
const AV = m`\c1{\box{A = -\f{1}{6}}}`;
const BV = m`\c2{\box{B = \f{3}{10}}}`;
const CV = m`\c3{\box{C = -\f{2}{15}}}`;

export const SCENES: Record<string, SceneSpec> = {
  S01: {
    kicker: 'تلات عوامل… ومقارنة المعاملات',
    captions: [
      { at: 'U01', ar: 'عامل خطي تالت' },
      { at: 'U02', ar: 'تلات كسور وتلات معاملات' },
      { at: 'U03', ar: 'مقارنة المعاملات', en: 'Comparing Coefficients', tone: 'info' },
      { at: 'U04', ar: 'Example 5 — صفحات 4 و 5' },
      { at: 'U05', ar: 'درجة 1 فوق درجة 3 ← Proper', tone: 'ok' },
      { at: 'U06', ar: 'x عامل مشترك' },
      { at: 'U07', ar: 'والتربيعي بيتحلل' },
      { at: 'U08', ar: 'مراجعة: نضرب ونرجع للمقام', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [{ tex: [['U01', m`\f{P(x)}{(\c1{x-a})(\c2{x-b})(\c3{x-c})}`], ['U02', m`\f{P(x)}{(\c1{x-a})(\c2{x-b})(\c3{x-c})} = \f{\c1{A}}{\c1{x-a}} + \f{\c2{B}}{\c2{x-b}} + \f{\c3{C}}{\c3{x-c}}`]] }],
      },
      {
        at: 'U04',
        rows: [
          { tex: [['U04', m`\f{x+1}{x^3+x^2-6x}`], ['U06', m`\f{x+1}{\c1{x}(x^2+x-6)}`], ['U07', EX5]] },
          { at: 'U05', tex: m`\t{deg } 1 < 3\ \to\ \ok{\t{Proper}}`, size: 0.7 },
          { at: 'U08', tex: m`(\c2{x-2})(\c3{x+3}) = x^2+x-6\ \ok{\check}`, size: 0.7 },
        ],
      },
    ],
  },
  S02: {
    kicker: 'القالب وهوية البسط',
    captions: [
      { at: 'U01', ar: 'تلات عوامل خطية مختلفة' },
      { at: 'U02', ar: 'القالب' },
      { at: 'U03', ar: 'كل بسط ثابت: العامل اللي تحته خطي' },
      { at: 'U04', ar: 'نضرب في المقام المشترك' },
      { at: 'U05', ar: 'كل معامل بياخد العاملين اللي ناقصينه' },
      { at: 'U07', ar: 'هوية البسط كاملة', tone: 'ok' },
      { at: 'U08', ar: 'ممنوع نعوّض بـ 0 و 2 و −3 في الكسر نفسه', tone: 'warn' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: [['U01', EX5], ['U02', m`${EX5} = \f{\g{n1}{\c1{A}}}{\c1{x}} + \f{\g{n2}{\c2{B}}}{\c2{x-2}} + \f{\g{n3}{\c3{C}}}{\c3{x+3}}`]] },
          { at: 'U04', size: 0.8, tex: [['U04', m`\times\ ${DEN}`], ['U05', m`x+1 = ${TA} + \mu{\dots}`], ['U06', m`x+1 = ${TA} + ${TB} + \mu{\dots}`], ['U07', m`x+1 = ${TA} + ${TB} + ${TC}`]] },
          { at: 'U08', tex: m`\no{x \ne 0,\ 2,\ -3}`, size: 0.7 },
        ],
        fx: [{ at: 'U03', until: 'U04', g: 'n1', k: 'hl' }, { at: 'U03', until: 'U04', g: 'n2', k: 'hl' }, { at: 'U03', until: 'U04', g: 'n3', k: 'hl' }],
      },
    ],
  },
  S03: {
    kicker: 'نرتب حسب قوى x',
    captions: [
      { at: 'U01', ar: 'نفك ونرتب حسب قوى x' },
      { at: 'U02', ar: 'نفك كل حاصل ضرب' },
      { at: 'U03', ar: 'حد A' },
      { at: 'U04', ar: 'حد B' },
      { at: 'U05', ar: 'حد C' },
      { at: 'U06', ar: 'معامل x²: A + B + C' },
      { at: 'U07', ar: 'معامل x: A + 3B − 2C' },
      { at: 'U08', ar: 'الثابت: −6A' },
      { at: 'U09', ar: 'الطرف التاني: 0x² + 1x + 1' },
      { at: 'U10', ar: 'نفس القوة ← نفس المعامل', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`x+1 = ${TA} + ${TB} + ${TC}`, size: 0.72 },
          { at: 'U02', tex: m`(\c2{x-2})(\c3{x+3}) = x^2+x-6`, size: 0.7 },
          { at: 'U02', tex: m`\c1{x}(\c3{x+3}) = x^2+3x`, size: 0.7 },
          { at: 'U02', tex: m`\c1{x}(\c2{x-2}) = x^2-2x`, size: 0.7 },
        ],
      },
      {
        at: 'U03',
        widget: {
          kind: 'table', at: 'U03', cols: ['@الحد', '1', 'x', 'x^2'],
          rows: [
            { at: 'U03', cells: [m`\c1{A}(x^2+x-6)`, m`-6\c1{A}`, m`\c1{A}`, m`\c1{A}`] },
            { at: 'U04', cells: [m`\c2{B}(x^2+3x)`, '0', m`3\c2{B}`, m`\c2{B}`] },
            { at: 'U05', cells: [m`\c3{C}(x^2-2x)`, '0', m`-2\c3{C}`, m`\c3{C}`] },
            { at: 'U06', cells: ['@المجموع', m`-6\c1{A}`, m`\c1{A}+3\c2{B}-2\c3{C}`, m`\c1{A}+\c2{B}+\c3{C}`] },
            { at: 'U09', cells: ['@x + 1', m`\ok{1}`, m`\ok{1}`, m`\ok{0}`] },
          ],
          hl: [{ at: 'U06', until: 'U07', col: 3 }, { at: 'U07', until: 'U08', col: 2 }, { at: 'U08', until: 'U09', col: 1 }, { at: 'U10', row: 3 }, { at: 'U10', row: 4 }],
        },
      },
    ],
  },
  S04: {
    kicker: 'نحل النظام',
    captions: [
      { at: 'U01', ar: '(1) معامل x²' },
      { at: 'U02', ar: '(2) معامل x' },
      { at: 'U03', ar: '(3) الثابت' },
      { at: 'U04', ar: 'A = −1/6', tone: 'ok' },
      { at: 'U05', ar: 'نعوّض A في (1)' },
      { at: 'U06', ar: 'ونعوّض A في (2)' },
      { at: 'U07', ar: 'C بدلالة B' },
      { at: 'U08', ar: 'نعوّض ونفك القوس' },
      { at: 'U09', ar: 'B = 3/10', tone: 'ok' },
      { at: 'U10', ar: 'C = −2/15', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`\mu{(1)}\q\c1{A}+\c2{B}+\c3{C} = 0`, size: 0.85 },
          { at: 'U02', tex: m`\mu{(2)}\q\c1{A}+3\c2{B}-2\c3{C} = 1`, size: 0.85 },
          { at: 'U03', size: 0.85, tex: [['U03', m`\mu{(3)}\q -6\c1{A} = 1`], ['U04', m`\mu{(3)}\q -6\c1{A} = 1\ \to\ ${AV}`]] },
        ],
      },
      {
        at: 'U05',
        rows: [
          { tex: AV, size: 0.75 },
          { tex: m`\c2{B}+\c3{C} = \f{1}{6}`, size: 0.8 },
          { at: 'U06', tex: m`3\c2{B}-2\c3{C} = \f{7}{6}`, size: 0.8 },
          { at: 'U07', size: 0.85, tex: [['U07', m`\c3{C} = \f{1}{6} - \c2{B}`], ['U08', m`5\c2{B} - \f{1}{3} = \f{7}{6}`], ['U09', BV], ['U10', m`${BV}\q${CV}`]] },
        ],
      },
    ],
  },
  S05: {
    kicker: 'الناتج… وتنبيه على الكتاب',
    captions: [
      { at: 'U01', ar: 'الناتج الكامل', tone: 'ok' },
      { at: 'U02', ar: 'كل حد كسر منفصل: معامل × 1 على عامله' },
      { at: 'U03', ar: 'المجال: x ≠ 0 ، 2 ، −3', tone: 'warn' },
      { at: 'U04', ar: 'تنبيه: صفحة 5 فيها سطور وسيطة متعارضة', tone: 'warn' },
      { at: 'U05', ar: 'C = −2/15 هي اللي بتحقق الهوية', tone: 'ok' },
      { at: 'U06', ar: 'المرجع: مساواة نقدر نتحقق منها', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`${EX5} = -\f{1}{6\c1{x}} + \f{3}{10(\c2{x-2})} - \f{2}{15(\c3{x+3})}`, size: 0.85 },
          { at: 'U02', tex: m`= -\f{1}{6}\cdot\f{1}{\c1{x}} + \f{3}{10}\cdot\f{1}{\c2{x-2}} - \f{2}{15}\cdot\f{1}{\c3{x+3}}`, size: 0.8 },
          { at: 'U03', tex: m`\no{x \ne 0,\ 2,\ -3}`, size: 0.7 },
        ],
      },
      {
        at: 'U04',
        rows: [
          { tex: m`\no{\t{page 5: printed value of }C}\ \cross`, size: 0.9 },
          { at: 'U05', tex: m`${CV}\ \ok{\check\ \t{satisfies the identity}}`, size: 0.85 },
        ],
      },
    ],
  },
  S06: {
    kicker: 'مراجعة بتصفير العوامل',
    captions: [
      { at: 'U01', ar: 'الهوية قبل فك الأقواس' },
      { at: 'U02', ar: 'x = 0 ← يفضل حد A بس' },
      { at: 'U03', ar: 'A = −1/6 ✓', tone: 'ok' },
      { at: 'U04', ar: 'x = 2 ← يفضل حد B بس' },
      { at: 'U05', ar: 'B = 3/10 ✓', tone: 'ok' },
      { at: 'U06', ar: 'x = −3 ← يفضل حد C بس' },
      { at: 'U07', ar: 'C = −2/15 ✓ نفس النتيجة', tone: 'ok' },
      { at: 'U08', ar: 'طريقتين… ونفس الإجابة' },
      { at: 'U09', ar: 'وفي الآخر: لازم نتحقق', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: ID5, size: 0.72 },
          {
            at: 'U02',
            tex: [
              ['U02', m`x = \c4{0}:\q 1 = -6\c1{A}`], ['U03', m`${AV}\ \ok{\check}`],
              ['U04', m`x = \c4{2}:\q 3 = 10\c2{B}`], ['U05', m`${BV}\ \ok{\check}`],
              ['U06', m`x = \c4{-3}:\q -2 = 15\c3{C}`], ['U07', m`${AV}\q${BV}\q${CV}`],
            ],
          },
        ],
        fx: [
          { at: 'U02', until: 'U04', g: 'Bt', k: 'zero' }, { at: 'U02', until: 'U04', g: 'Ct', k: 'zero' },
          { at: 'U04', until: 'U06', g: 'At', k: 'zero' }, { at: 'U04', until: 'U06', g: 'Ct', k: 'zero' },
          { at: 'U06', until: 'U08', g: 'At', k: 'zero' }, { at: 'U06', until: 'U08', g: 'Bt', k: 'zero' },
        ],
      },
      {
        at: 'U08',
        widget: {
          kind: 'steps', at: 'U08',
          items: [
            { at: 'U08', ar: 'مقارنة المعاملات', en: 'system of equations' },
            { at: 'U08', ar: 'تصفير العوامل في الهوية', en: 'zero substitution' },
            { at: 'U09', ar: 'نتحقق بالرجوع للبسط', en: 'verify' },
          ],
        },
      },
    ],
  },
  S09: {
    kicker: 'الخلاصة',
    captions: [
      { at: 'U01', ar: 'نفس المنطق من الأول للآخر' },
      { at: 'U02', ar: 'مقارنة المعاملات', en: 'Comparing Coefficients' },
      { at: 'U03', ar: 'وتصفير العوامل للمراجعة' },
      { at: 'U04', ar: 'الجاي: عوامل خطية مكررة', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        widget: {
          kind: 'steps', at: 'U01',
          items: [
            { at: 'U01', ar: 'Proper؟', en: 'classify' },
            { at: 'U01', ar: 'تحليل المقام', en: 'factor' },
            { at: 'U01', ar: 'صورة الكسور', en: 'form' },
            { at: 'U01', ar: 'هوية البسط', en: 'identity' },
            { at: 'U01', ar: 'المعاملات + تحقق', en: 'solve & verify' },
          ],
        },
      },
      {
        at: 'U02',
        rows: [
          { tex: m`\c1{A}+\c2{B}+\c3{C} = 0`, size: 0.75 },
          { tex: m`\c1{A}+3\c2{B}-2\c3{C} = 1`, size: 0.75 },
          { tex: m`-6\c1{A} = 1`, size: 0.75 },
          { at: 'U03', tex: m`x = \c4{0},\ \c4{2},\ \c4{-3}\ \to\ \t{one term survives each time}`, size: 0.7 },
        ],
      },
      { at: 'U04', rows: [{ tex: m`\f{P(x)}{\c2{(x-a)^2}} = \f{A}{\c2{x-a}} + \f{B}{\c2{(x-a)^2}}`, note: 'الجزء الجاي من المنهج' }] },
    ],
  },
};

export const QUESTIONS: Record<string, QuestionSpec> = {
  S07: { kicker: 'جرّب بنفسك — Q01', formula: m`\f{8x-2}{x(x-1)(x+2)}`, asks: ['partial fractions', 'equations by comparing coefficients', 'solve and verify', 'excluded values'] },
  S08: { kicker: 'جرّب بنفسك — Q02', formula: m`A(x-2)(x+3) + Bx(x+3) + Cx(x-2)`, asks: ['student says x-coefficient = A + 3B − C', 'correct?', 'explain the error'] },
};
export const FEEDBACK: Record<string, SceneSpec> = {
  S07: {
    kicker: 'الإجابة النموذجية — Q01',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: 'القالب' },
      { at: 'U2', ar: 'نجمع المعاملات حسب القوى' },
      { at: 'U3', ar: 'تلات معادلات' },
      { at: 'U4', ar: 'A = 1 ، B = 2 ، C = −3', tone: 'ok' },
      { at: 'U5', ar: 'تحقق ✓ — ممنوع 0 و 1 و −2', tone: 'warn' },
    ],
    panels: [
      { at: 'UEN', rows: [{ tex: m`\f{8x-2}{\c1{x}(\c2{x-1})(\c3{x+2})} = \f{\c1{1}}{\c1{x}} + \f{\c2{2}}{\c2{x-1}} - \f{\c3{3}}{\c3{x+2}}`, size: 0.9 }] },
      {
        at: 'U1',
        rows: [
          { tex: m`\f{\c1{A}}{\c1{x}} + \f{\c2{B}}{\c2{x-1}} + \f{\c3{C}}{\c3{x+2}}`, size: 0.95 },
          { at: 'U2', size: 0.7, tex: [['U2', m`x^2:\ \c1{A}+\c2{B}+\c3{C}\q x:\ \c1{A}+2\c2{B}-\c3{C}\q 1:\ -2\c1{A}`], ['U3', m`\c1{A}+\c2{B}+\c3{C} = 0,\q\c1{A}+2\c2{B}-\c3{C} = 8,\q -2\c1{A} = -2`]] },
          { at: 'U4', tex: m`\c1{\box{A = 1}}\q\c2{\box{B = 2}}\q\c3{\box{C = -3}}`, size: 0.95 },
          { at: 'U5', tex: m`\ok{\check}\ \t{recombines to }8x-2\q\no{x \ne 0,\ 1,\ -2}`, size: 0.8 },
        ],
      },
    ],
  },
  S08: {
    kicker: 'الإجابة النموذجية — Q02',
    captions: [
      { at: 'UEN', ar: 'غلط: المعامل الصحيح A + 3B − 2C', tone: 'warn' },
      { at: 'U1', ar: 'الحد الأخير' },
      { at: 'U2', ar: 'الاتنين اللي جوه (x − 2)' },
      { at: 'U3', ar: 'كتابة −C بس بتضيّع الاتنين', tone: 'warn' },
      { at: 'U4', ar: 'معامل واحد غلط ← النظام كله يبوظ', tone: 'info' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`\t{x-coefficient: }\c1{A}+3\c2{B}\g{fix}{\minus2\c3{C}}` },
          { at: 'U1', tex: [['U1', m`\c3{C}x(x-2)`], ['U2', m`\c3{C}x(x-2) = \c3{C}x^2\g{two}{\minus2\c3{C}x}`]], size: 0.9 },
          { at: 'U3', tex: m`\g{wrong}{\c3{C}x^2-\c3{C}x}`, size: 0.8 },
        ],
        fx: [{ at: 'U2', g: 'two', k: 'hl' }, { at: 'U3', g: 'wrong', k: 'strike' }, { at: 'U4', g: 'fix', k: 'hl' }],
      },
    ],
  },
};
