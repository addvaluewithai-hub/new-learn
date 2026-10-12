import type { QuestionSpec, SceneSpec } from './stage';

// Director's beat plan for L03 (two distinct linear factors). Each constant wears the
// colour of its own denominator factor; in the numerator identity it multiplies the
// factor it is missing. Substituted values are sky blue (c4).
const m = String.raw;
const EX4 = m`\f{5x+1}{(\c1{x-4})(\c2{x+3})}`;
const ID4 = (a: string, b: string) => m`5x+1 = \g{At}{\c1{A}(\c2{${a}})} + \g{Bt}{\c2{B}(\c1{${b}})}`;

export const SCENES: Record<string, SceneSpec> = {
  S01: {
    kicker: 'من القالب للأرقام',
    captions: [
      { at: 'U01', ar: 'كتبنا A و B… طيب قيمتهم كام؟' },
      { at: 'U02', ar: 'النهارده: عاملين خطيين مختلفين' },
      { at: 'U03', ar: 'خطوات الحل' },
      { at: 'U06', ar: 'الجديد: نشيل المقام المشترك', tone: 'info' },
      { at: 'U07', ar: 'ونشتغل في البسط', tone: 'ok' },
    ],
    panels: [
      { at: 'U01', rows: [{ tex: m`\f{P(x)}{(\c1{x-a})(\c2{x-b})} = \f{\c1{\box{A}}}{\c1{x-a}} + \f{\c2{\box{B}}}{\c2{x-b}}` }] },
      {
        at: 'U03',
        rows: [{ at: 'U07', tex: m`P(x) = \c1{A}(\c2{x-b}) + \c2{B}(\c1{x-a})`, size: 0.85 }],
        widget: {
          kind: 'steps', at: 'U03',
          items: [
            { at: 'U03', ar: 'Improper؟ نقسم', en: 'divide' },
            { at: 'U04', ar: 'Proper: نحلل المقام', en: 'factor' },
            { at: 'U05', ar: 'نكتب القالب', en: 'form' },
            { at: 'U06', ar: 'نشيل المقام المشترك', en: 'clear denominators' },
          ],
        },
      },
    ],
  },
  S02: {
    kicker: 'Example 4 — صفحة 4',
    captions: [
      { at: 'U01', ar: 'Example 4 — صفحة 4' },
      { at: 'U02', ar: 'درجة 1 فوق درجة 2 ← Proper', tone: 'ok' },
      { at: 'U03', ar: 'عددين: ضربهم −12 وجمعهم −1' },
      { at: 'U04', ar: '−4 و +3', tone: 'ok' },
      { at: 'U05', ar: 'المقام = (x − 4)(x + 3)' },
      { at: 'U06', ar: 'القالب: A و B لسه مجهولين' },
      { at: 'U07', ar: 'نضرب الطرفين في المقام المشترك' },
      { at: 'U08', ar: 'الشمال: يفضل البسط بس' },
      { at: 'U09', ar: 'A بياخد العامل اللي ناقص من مقامه' },
      { at: 'U10', ar: 'و B كمان', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [{ tex: m`\f{5x+1}{x^2-x-12}` }, { at: 'U02', tex: m`\t{deg } 1 < 2\ \to\ \ok{\t{Proper}}`, size: 0.7 }],
      },
      {
        at: 'U03',
        side: true,
        rows: [{ tex: [['U03', m`x^2-x-12 = (x\ \mu{?})(x\ \mu{?})`], ['U05', m`x^2-x-12 = (\c1{x-4})(\c2{x+3})`]], size: 0.85 }],
        widget: {
          kind: 'table', at: 'U03', cols: ['@العددين', '@حاصل الضرب', '@المجموع'],
          rows: [
            { cells: [m`-1,\ 12`, m`-12`, '11'] },
            { cells: [m`-2,\ 6`, m`-12`, '4'] },
            { cells: [m`-3,\ 4`, m`-12`, '1'] },
            { at: 'U04', cells: [m`\c1{-4},\ \c2{3}`, m`-12`, m`\ok{-1}`] },
          ],
          hl: [{ at: 'U04', row: 3 }],
        },
      },
      {
        at: 'U06',
        rows: [
          { tex: m`\f{5x+1}{\g{d0}{(\c1{x-4})(\c2{x+3})}} = \f{\c1{A}}{\g{d1}{\c1{x-4}}} + \f{\c2{B}}{\g{d2}{\c2{x+3}}}` },
          { at: 'U07', tex: [['U07', m`\times\ (\c1{x-4})(\c2{x+3})`], ['U08', m`\ok{5x+1} = \mu{\dots}`], ['U09', m`5x+1 = \c1{A}(\c2{x+3}) + \mu{\dots}`], ['U10', m`5x+1 = \c1{A}(\c2{x+3}) + \c2{B}(\c1{x-4})`]] },
        ],
        fx: [{ at: 'U08', g: 'd0', k: 'strike' }, { at: 'U09', g: 'd1', k: 'strike' }, { at: 'U10', g: 'd2', k: 'strike' }],
      },
    ],
  },
  S03: {
    kicker: 'هوية كثيرات الحدود',
    captions: [
      { at: 'U01', ar: 'هوية البسط' },
      { at: 'U02', ar: 'هوية: صحيحة لكل قيم x', en: 'Polynomial Identity', tone: 'info' },
      { at: 'U03', ar: 'الكسر الأصلي: ممنوع 4 و −3', tone: 'warn' },
      { at: 'U04', ar: 'الهوية: نعوّض بيهم عادي', tone: 'ok' },
      { at: 'U05', ar: 'متساويين عند قيم كتير جدًا ← نفس كثيرة الحدود بالظبط' },
      { at: 'U06', ar: 'لكن الكسر الأصلي لسه غير معرّف هناك', tone: 'warn' },
    ],
    panels: [
      { at: 'U01', rows: [{ tex: [['U01', ID4('x+3', 'x-4')], ['U02', m`5x+1 \eq \c1{A}(\c2{x+3}) + \c2{B}(\c1{x-4})`]], note: '' }] },
      {
        at: 'U03',
        rows: [
          { tex: [['U03', m`${EX4}\q\no{x \ne 4,\ -3}`], ['U06', m`${EX4}\q\no{\t{undefined at }4,\ -3}`]] },
          { at: 'U04', tex: m`5x+1 \eq \c1{A}(\c2{x+3}) + \c2{B}(\c1{x-4})\q\ok{x = 4,\ -3\ \check}`, size: 0.85 },
          { at: 'U05', tex: m`\t{equal for infinitely many }x\ \to\ \t{same polynomial}`, size: 0.6 },
        ],
      },
    ],
  },
  S04: {
    kicker: 'نصفّر عامل… يطلع معامل',
    captions: [
      { at: 'U01', ar: 'عايزين نلغي B' },
      { at: 'U02', ar: 'x = 4 بيصفّر (x − 4)' },
      { at: 'U03', ar: 'الشمال: 21' },
      { at: 'U04', ar: '21 = 7A' },
      { at: 'U05', ar: 'A = 3', tone: 'ok' },
      { at: 'U06', ar: 'دلوقتي نلغي A' },
      { at: 'U07', ar: 'x = −3 بيصفّر (x + 3)' },
      { at: 'U08', ar: 'الشمال: −14' },
      { at: 'U09', ar: '−14 = −7B ← B = 2', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          {
            tex: [
              ['U01', ID4('x+3', 'x-4')],
              ['U02', m`5(\c4{4})+1 = \c1{A}(\c4{4}+3) + \g{Bt}{\c2{B}(\c4{4}-4)}`],
              ['U03', m`\ok{21} = \c1{A}(\c4{4}+3) + \g{Bt}{\c2{B}(\c4{4}-4)}`],
              ['U04', m`21 = 7\c1{A} + 0`],
            ],
          },
          { at: 'U05', tex: m`\c1{\box{A = 3}}` },
        ],
        fx: [{ at: 'U01', until: 'U02', g: 'Bt', k: 'hl' }, { at: 'U02', until: 'U04', g: 'Bt', k: 'zero' }],
      },
      {
        at: 'U06',
        rows: [
          {
            tex: [
              ['U06', ID4('x+3', 'x-4')],
              ['U07', m`5(\c4{-3})+1 = \g{At}{\c1{A}(\c4{-3}+3)} + \c2{B}(\c4{-3}-4)`],
              ['U08', m`\ok{-14} = \g{At}{\c1{A}(\c4{-3}+3)} + \c2{B}(\c4{-3}-4)`],
              ['U09', m`-14 = 0 - 7\c2{B}`],
            ],
          },
          { at: 'U09', tex: m`\c1{\box{A = 3}}\q\c2{\box{B = 2}}` },
        ],
        fx: [{ at: 'U06', until: 'U07', g: 'At', k: 'hl' }, { at: 'U07', until: 'U09', g: 'At', k: 'zero' }],
      },
    ],
  },
  S05: {
    kicker: 'نتحقق… ونثبّت الطريقة',
    captions: [
      { at: 'U01', ar: 'الناتج' },
      { at: 'U02', ar: 'نجمع تاني' },
      { at: 'U03', ar: 'نفك الأقواس' },
      { at: 'U04', ar: 'رجع 5x + 1', tone: 'ok' },
      { at: 'U05', ar: 'والمجال زي ما هو', tone: 'warn' },
      { at: 'U06', ar: 'رحلة الحل' },
      { at: 'U09', ar: 'دي طريقة، مش حفظ للمثال', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`\f{\c1{3}}{\c1{x-4}} + \f{\c2{2}}{\c2{x+3}}` },
          { at: 'U02', tex: [['U02', m`= \f{3(\c2{x+3}) + 2(\c1{x-4})}{(\c1{x-4})(\c2{x+3})}`], ['U03', m`= \f{3x+9+2x-8}{(\c1{x-4})(\c2{x+3})}`], ['U04', m`= \f{\ok{5x+1}}{(\c1{x-4})(\c2{x+3})}\ \ok{\check}`]] },
          { at: 'U05', tex: m`\no{x \ne 4,\ -3}`, size: 0.8 },
        ],
      },
      {
        at: 'U06',
        widget: {
          kind: 'steps', at: 'U06',
          items: [
            { at: 'U06', ar: 'القالب من المقام', en: 'form' },
            { at: 'U07', ar: 'الهوية بإزالة المقامات', en: 'identity' },
            { at: 'U08', ar: 'قيم بتصفّر العوامل', en: 'smart x' },
            { at: 'U09', ar: 'تحقق بإعادة الجمع', en: 'verify' },
          ],
        },
      },
    ],
  },
  S06: {
    kicker: 'تجربة من إعدادنا',
    captions: [
      { at: 'U01', ar: 'مثال من إعدادنا، مش من الكتاب' },
      { at: 'U02', ar: 'القالب' },
      { at: 'U03', ar: 'هوية البسط' },
      { at: 'U04', ar: 'x = 1 يلغي B' },
      { at: 'U05', ar: 'A = 1', tone: 'ok' },
      { at: 'U06', ar: 'x = −4 يلغي A' },
      { at: 'U07', ar: 'B = 1', tone: 'ok' },
      { at: 'U08', ar: 'تحقق سريع', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: [['U01', m`\f{2x+3}{(\c1{x-1})(\c2{x+4})}`], ['U02', m`\f{2x+3}{(\c1{x-1})(\c2{x+4})} = \f{\c1{A}}{\c1{x-1}} + \f{\c2{B}}{\c2{x+4}}`]] },
          { at: 'U03', tex: m`2x+3 = \c1{A}(\c2{x+4}) + \c2{B}(\c1{x-1})`, size: 0.85 },
          {
            at: 'U04',
            size: 0.85,
            tex: [
              ['U04', m`x = \c4{1}:\q 5 = 5\c1{A} + 0`],
              ['U05', m`x = \c4{1}:\q \c1{\box{A = 1}}`],
              ['U06', m`x = \c4{-4}:\q -5 = 0 - 5\c2{B}`],
              ['U07', m`\c1{\box{A = 1}}\q\c2{\box{B = 1}}`],
              ['U08', m`1(\c2{x+4}) + 1(\c1{x-1}) = \ok{2x+3}\ \ok{\check}`],
            ],
          },
        ],
      },
    ],
  },
  S08: {
    kicker: 'الخلاصة',
    captions: [
      { at: 'U01', ar: 'الطريقة كاملة' },
      { at: 'U02', ar: 'هوية البسط' },
      { at: 'U03', ar: 'قيم ذكية بتصفّر عامل' },
      { at: 'U04', ar: 'الجاي: تلات عوامل وتلات معاملات' },
      { at: 'U05', ar: 'مقارنة المعاملات', en: 'Comparing Coefficients', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        widget: {
          kind: 'steps', at: 'U01',
          items: [
            { at: 'U01', ar: 'القالب من المقام', en: 'form' },
            { at: 'U01', ar: 'هوية البسط', en: 'identity' },
            { at: 'U01', ar: 'قيم بتصفّر العوامل', en: 'smart x' },
            { at: 'U01', ar: 'تحقق', en: 'verify' },
          ],
          focus: [{ at: 'U01', until: 'U02', index: 3 }, { at: 'U02', until: 'U03', index: 1 }, { at: 'U03', index: 2 }],
        },
      },
      { at: 'U04', rows: [{ tex: m`\f{x+1}{\c1{x}(\c2{x-2})(\c3{x+3})} = \f{\c1{A}}{\c1{x}} + \f{\c2{B}}{\c2{x-2}} + \f{\c3{C}}{\c3{x+3}}` }] },
    ],
  },
};

export const QUESTIONS: Record<string, QuestionSpec> = {
  S07: { kicker: 'جرّب بنفسك — Q01', formula: m`\f{7x-1}{(x+1)(x-3)}`, asks: ['resolve into partial fractions', 'find the constants', 'verify the identity', 'excluded values'] },
};

export const FEEDBACK: Record<string, SceneSpec> = {
  S07: {
    kicker: 'الإجابة النموذجية — Q01',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: 'القالب' },
      { at: 'U2', ar: 'هوية البسط' },
      { at: 'U3', ar: 'x = −1 ← A = 2', tone: 'ok' },
      { at: 'U4', ar: 'x = 3 ← B = 5', tone: 'ok' },
      { at: 'U6', ar: 'نتحقق بإعادة الجمع', tone: 'ok' },
      { at: 'U5', ar: 'ممنوع: x = −1 و x = 3', tone: 'warn' },
    ],
    panels: [
      { at: 'UEN', rows: [{ tex: m`\f{7x-1}{(\c1{x+1})(\c2{x-3})} = \f{\c1{2}}{\c1{x+1}} + \f{\c2{5}}{\c2{x-3}}` }] },
      {
        at: 'U1',
        rows: [
          { tex: m`\f{7x-1}{(\c1{x+1})(\c2{x-3})} = \f{\c1{A}}{\c1{x+1}} + \f{\c2{B}}{\c2{x-3}}`, size: 0.85 },
          { at: 'U2', tex: m`7x-1 = \c1{A}(\c2{x-3}) + \c2{B}(\c1{x+1})`, size: 0.85 },
          { at: 'U3', size: 0.85, tex: [['U3', m`x = \c4{-1}:\ -8 = -4\c1{A}\ \to\ \c1{\box{A = 2}}`], ['U4', m`x = \c4{3}:\ 20 = 4\c2{B}\ \to\ \c2{\box{B = 5}}`], ['U6', m`\c1{2}(\c2{x-3}) + \c2{5}(\c1{x+1}) = \ok{7x-1}\ \ok{\check}`], ['U5', m`\c1{\box{A = 2}}\q\c2{\box{B = 5}}\q\no{x \ne \no{-1},\ 3}`]] },
        ],
      },
    ],
  },
};
