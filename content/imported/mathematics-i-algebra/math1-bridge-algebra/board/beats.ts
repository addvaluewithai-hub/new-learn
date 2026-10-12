import type { QuestionSpec, SceneSpec } from './stage';

// Director's beat plan for "letters for numbers". Coefficients teal, constants amber,
// substituted values sky blue; one new symbol per beat.
const m = String.raw;

export const SCENES: Record<string, SceneSpec> = {
  S01: {
    kicker: 'x رقم مستخبي',
    captions: [
      { at: 'U01', ar: 'فكرت في رقم… ضربته في 3 وزودت 1 = 7' },
      { at: 'U02', ar: 'الرقم 2', tone: 'ok' },
      { at: 'U03', ar: 'بدل الصندوق: حرف x' },
      { at: 'U04', ar: 'متغير', en: 'Variable', tone: 'info' },
      { at: 'U05', ar: '3x يعني 3 في x' },
      { at: 'U06', ar: 'المعامل والثابت… و x لوحدها = 1x', en: 'Coefficient · Constant', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: [['U01', m`\box{\ ?\ } \times 3 + 1 = 7`], ['U02', m`\box{\c4{2}} \times 3 + 1 = 7\ \ok{\check}`], ['U03', m`3\g{v}{x} + 1 = 7`]], size: 1.2 },
          { at: 'U05', tex: m`3x = 3 \times x` },
          { at: 'U06', tex: m`\c1{3}x + \c2{1}\q x = \c1{1}x`, size: 0.85 },
        ],
        fx: [{ at: 'U04', until: 'U05', g: 'v', k: 'hl' }],
      },
    ],
  },
  S02: {
    kicker: 'الأسس والتعويض',
    captions: [
      { at: 'U01', ar: 'x في x = x تربيع', en: 'x squared' },
      { at: 'U02', ar: 'الأس: مضروب في نفسه كام مرة', en: 'x cubed' },
      { at: 'U03', ar: 'x² غير 2x', tone: 'warn' },
      { at: 'U04', ar: 'التعويض: رقم مكان الحرف' },
      { at: 'U05', ar: 'الترتيب: الأس ← الضرب ← الجمع والطرح', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`x \times x = x^{\c4{2}}` },
          { at: 'U02', tex: m`x \times x \times x = x^{\c4{3}}` },
          { at: 'U03', tex: m`x = \c4{3}:\q x^2 = 9\q 2x = 6`, size: 0.85 },
        ],
      },
      {
        at: 'U04',
        rows: [{ tex: m`x = \c4{4}:\q \c4{4}^2 - 3(\c4{4}) + 2 = 16 - 12 + 2 = \ok{6}` }],
        widget: {
          kind: 'steps', at: 'U05',
          items: [
            { at: 'U05', ar: 'الأس', en: 'power' },
            { at: 'U05', ar: 'الضرب', en: 'multiply' },
            { at: 'U05', ar: 'الجمع والطرح', en: 'add · subtract' },
          ],
        },
      },
    ],
  },
  S03: {
    kicker: 'الحدود المتشابهة',
    captions: [
      { at: 'U01', ar: 'كل جزء بين + و − اسمه حد', en: 'Term', tone: 'info' },
      { at: 'U02', ar: 'المتشابه بيتجمع: 3 تفاحات + 2 تفاح', tone: 'ok' },
      { at: 'U03', ar: 'تفاح وبرتقان ما بيتجمعوش', tone: 'warn' },
      { at: 'U04', ar: 'جرّب في دماغك: 5x − x؟' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`\g{t1}{x^2}\ \g{t2}{\minus 3x}\ \g{t3}{+ 2}` },
          { at: 'U02', tex: m`\c1{3x} + \c1{2x} = \c1{5x}` },
          { at: 'U03', tex: m`3x + 2 = \no{5x}\ \no{\cross}` },
          { at: 'U04', tex: m`5x - x = \ok{4x}` },
        ],
        fx: [
          { at: 'U01', until: 'U02', g: 't1', k: 'hl' }, { at: 'U01', until: 'U02', g: 't2', k: 'hl' }, { at: 'U01', until: 'U02', g: 't3', k: 'hl' },
        ],
      },
    ],
  },
  S04: {
    kicker: 'فك الأقواس',
    captions: [
      { at: 'U01', ar: '3 أكياس، في كل كيس x ناقص 1' },
      { at: 'U02', ar: 'اللي برة بيتضرب في كل حد جوه', tone: 'ok' },
      { at: 'U03', ar: 'لو اللي برة سالب…', tone: 'warn' },
      { at: 'U04', ar: 'سالب × سالب = موجب', tone: 'ok' },
    ],
    panels: [
      { at: 'U01', rows: [{ tex: [['U01', m`3(x - 1)`], ['U02', m`3(x - 1) = \c1{3x} - \c1{3}`]], size: 1.2 }] },
      { at: 'U03', rows: [{ tex: [['U03', m`-2(x - 2) = \c1{-2x}\ \mu{\dots}`], ['U04', m`-2(x - 2) = -2x\ \g{pl}{+ 4}`]], size: 1.2 }], fx: [{ at: 'U04', g: 'pl', k: 'hl' }] },
    ],
  },
  S05: {
    kicker: 'حساب هتقابله تاني',
    captions: [
      { at: 'U01', ar: 'من أول درس في الكسور الجزئية' },
      { at: 'U02', ar: 'نفك القوسين' },
      { at: 'U03', ar: 'نجمع المتشابه', tone: 'ok' },
      { at: 'U04', ar: 'هتشوفه تاني في درس الكسور الجزئية', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`3(x - 1) - 2(x - 2)` },
          { at: 'U02', tex: [['U02', m`= 3x - 3 - 2x + 4`], ['U03', m`= \ok{x + 1}`]] },
        ],
      },
    ],
  },
  S08: {
    kicker: 'الخلاصة',
    captions: [
      { at: 'U01', ar: 'x رقم بيتغير، و 3x يعني 3 في x' },
      { at: 'U02', ar: 'الأس: مضروب في نفسه كام مرة' },
      { at: 'U03', ar: 'المتشابه بس هو اللي بيتجمع' },
      { at: 'U04', ar: 'الدرس الجاي: قوسين في بعض', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`3x = 3 \times x`, size: 0.85 },
          { at: 'U02', tex: m`x^3 = x \times x \times x`, size: 0.85 },
          { at: 'U03', tex: m`3x + 2x = 5x`, size: 0.85 },
          { at: 'U04', tex: m`-2(x - 2) = -2x + 4`, size: 0.85 },
        ],
      },
    ],
  },
};

export const QUESTIONS: Record<string, QuestionSpec> = {
  S06: { kicker: 'جرّب بنفسك — Q01', formula: m`2x^2 - x\q x = 3`, asks: ['evaluate', 'power first'] },
  S07: { kicker: 'جرّب بنفسك — Q02', formula: m`4(x + 2) - 3(x - 1)`, asks: ['expand', 'simplify'] },
};

export const FEEDBACK: Record<string, SceneSpec> = {
  S06: {
    kicker: 'الإجابة النموذجية — Q01',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: 'الأس الأول: 3² = 9', tone: 'ok' },
      { at: 'U2', ar: 'غلطة: نضرب قبل الأس فيطلع 33', tone: 'warn' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`2(\c4{3})^2 - \c4{3} = 2(9) - 3 = 18 - 3 = \ok{15}` },
          { at: 'U2', tex: m`(2 \times 3)^2 - 3 = \no{33}\ \no{\cross}`, size: 0.8 },
        ],
      },
    ],
  },
  S07: {
    kicker: 'الإجابة النموذجية — Q02',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: 'نفك القوسين: −3 × −1 = +3' },
      { at: 'U2', ar: 'نجمع المتشابه', tone: 'ok' },
      { at: 'U3', ar: 'غلطة: x + 5', tone: 'warn' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`4(x + 2) - 3(x - 1)` },
          { at: 'U1', tex: m`= 4x + 8 - 3x + 3` },
          { at: 'U2', tex: m`= \ok{x + 11}` },
          { at: 'U3', tex: m`\no{x + 5}\ \no{\cross}`, size: 0.8 },
        ],
      },
    ],
  },
};
