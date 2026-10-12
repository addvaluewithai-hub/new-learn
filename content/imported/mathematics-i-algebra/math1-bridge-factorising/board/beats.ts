import type { QuestionSpec, SceneSpec } from './stage';
import type { WidgetSpec } from './widgets';

// Director's beat plan for expanding and factorising. The two numbers that build a
// bracket keep their colours (teal, amber) into the sum and product (sky blue).
const m = String.raw;
const PAIRS = (at: string, rows: Array<[string, string, string]>, hl: Array<{ at: string; row: number }> = []): WidgetSpec => ({
  kind: 'table', at, cols: ['@الرقمين', '@حاصل الضرب', '@المجموع'], rows: rows.map((cells) => ({ cells })), hl,
});

export const SCENES: Record<string, SceneSpec> = {
  S01: {
    kicker: 'مستطيل بيضرب قوسين',
    captions: [
      { at: 'U01', ar: 'قوس واحد فكيناه… النهارده قوسين' },
      { at: 'U02', ar: 'مساحة مستطيل = العرض × الطول' },
      { at: 'U03', ar: '4 حتت جوه المستطيل' },
      { at: 'U04', ar: 'نجمع الحتت', tone: 'ok' },
    ],
    panels: [
      { at: 'U01', rows: [{ tex: m`3(x - 1) = 3x - 3` }] },
      {
        at: 'U02',
        side: true,
        rows: [
          { tex: m`(x + \c2{2})(x + \c1{3})` },
          { at: 'U04', tex: m`= x^2 + 5x + 6` },
        ],
        widget: { kind: 'area', at: 'U02', a: 2, b: 3, cellsAt: 'U03' },
      },
    ],
  },
  S02: {
    kicker: 'كل حد في كل حد',
    captions: [
      { at: 'U01', ar: 'كل حد في الأول × كل حد في التاني' },
      { at: 'U02', ar: 'مع السالب: سالب × سالب = موجب' },
      { at: 'U03', ar: 'ده مقام أول مثال في الكتاب', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`(x + 2)(x + 3) = x^2 + 3x + 2x + 6`, size: 0.9 },
          { at: 'U02', tex: [['U02', m`(x - 1)(x - 2) = x^2 - 2x - x + 2`], ['U03', m`(x - 1)(x - 2) = \ok{x^2 - 3x + 2}`]], size: 0.9 },
        ],
      },
    ],
  },
  S03: {
    kicker: 'النمط… والعكس',
    captions: [
      { at: 'U01', ar: 'المجموع = معامل x · الضرب = الثابت', tone: 'info' },
      { at: 'U02', ar: 'نفس النمط مع السالب' },
      { at: 'U03', ar: 'نرجع بالعكس: رقمين ضربهم 6 وجمعهم 5' },
      { at: 'U04', ar: 'التحليل لعوامل', en: 'Factorise · Factor · Expand', tone: 'info' },
      { at: 'U05', ar: 'لما x² يكون من غير رقم قدامه' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`(x + \c1{2})(x + \c2{3}) = x^2 + \c4{5}x + \c4{6}`, size: 0.9 },
          { at: 'U02', tex: m`(x - \c1{1})(x - \c2{2}) = x^2 - \c4{3}x + \c4{2}`, size: 0.9 },
        ],
      },
      {
        at: 'U03',
        side: true,
        rows: [{ tex: [['U03', m`x^2 + 5x + 6 = (x + \ ?)(x + \ ?)`], ['U04', m`x^2 + 5x + 6 = (x + \c1{2})(x + \c2{3})`]] }],
        widget: PAIRS('U03', [['1,\\ 6', '6', '7'], ['\\c1{2},\\ \\c2{3}', '6', '\\ok{5}']], [{ at: 'U03', row: 1 }]),
      },
    ],
  },
  S04: {
    kicker: 'مثال بالسالب من الكتاب',
    captions: [
      { at: 'U01', ar: 'رقمين ضربهم −12 وجمعهم −1' },
      { at: 'U02', ar: '−4 و +3', tone: 'ok' },
      { at: 'U03', ar: 'اتأكد دايمًا بالفرد', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        side: true,
        rows: [{ tex: [['U01', m`x^2 - x - 12`], ['U03', m`x^2 - x - 12 = (x - \c1{4})(x + \c2{3})`]] }],
        widget: PAIRS('U01', [['-1,\\ 12', '-12', '11'], ['-2,\\ 6', '-12', '4'], ['-3,\\ 4', '-12', '1'], ['\\c1{-4},\\ \\c2{3}', '-12', '\\ok{-1}']], [{ at: 'U02', row: 3 }]),
      },
    ],
  },
  S05: {
    kicker: 'العامل المشترك',
    captions: [
      { at: 'U01', ar: 'x في كل الحدود ← نطلعها برة', en: 'Common factor', tone: 'info' },
      { at: 'U02', ar: 'نحلل اللي جوه: 3 و −2', tone: 'ok' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`x^3 + x^2 - 6x = \c1{x}(x^2 + x - 6)` },
          { at: 'U02', tex: m`= \c1{x}(x - 2)(x + 3)` },
        ],
      },
    ],
  },
  S06: {
    kicker: 'مش كل تعبير بيتحلل',
    captions: [
      { at: 'U01', ar: 'رقمين ضربهم 1 وجمعهم 0؟' },
      { at: 'U02', ar: 'مفيش رقمين ينفعوا', tone: 'warn' },
      { at: 'U03', ar: 'ليه معاملة خاصة في الكسور الجزئية', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        side: true,
        rows: [{ tex: [['U01', m`x^2 + 1 = (x + \ ?)(x + \ ?)`], ['U03', m`x^2 + 1\ \no{\t{does not factorise}}`]] }],
        widget: { kind: 'table', at: 'U01', cols: ['@الرقمين', '@حاصل الضرب', '@المجموع'], rows: [{ at: 'U02', cells: ['1,\\ 1', '1', '\\no{2}'] }, { at: 'U02', cells: ['-1,\\ -1', '1', '\\no{-2}'] }] },
      },
    ],
  },
  S09: {
    kicker: 'الخلاصة',
    captions: [
      { at: 'U01', ar: 'الضرب: كل حد في كل حد' },
      { at: 'U02', ar: 'التحليل: عامل مشترك، وبعدين رقمين' },
      { at: 'U03', ar: 'الدرس الجاي: نقرا السؤال بالإنجليزي', tone: 'info' },
    ],
    panels: [
      {
        at: 'U01',
        rows: [
          { tex: m`(x + 2)(x + 3) = x^2 + 5x + 6`, size: 0.85 },
          { at: 'U02', tex: m`x^2 - x - 12 = (x - 4)(x + 3)`, size: 0.85 },
          { at: 'U03', tex: m`x^2 + 1\ \no{\t{does not factorise}}`, size: 0.85 },
        ],
      },
    ],
  },
};

export const QUESTIONS: Record<string, QuestionSpec> = {
  S07: { kicker: 'جرّب بنفسك — Q01', formula: m`x^2 + 7x + 10`, asks: ['factorise', 'check by expanding'] },
  S08: { kicker: 'جرّب بنفسك — Q02', formula: m`x^2 - 2x - 15`, asks: ['factorise', 'check by expanding'] },
};

export const FEEDBACK: Record<string, SceneSpec> = {
  S07: {
    kicker: 'الإجابة النموذجية — Q01',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: '2 و 5: ضربهم 10 وجمعهم 7', tone: 'ok' },
      { at: 'U2', ar: 'التأكيد بالفرد', tone: 'info' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`x^2 + 7x + 10 = (x + \c1{2})(x + \c2{5})` },
          { at: 'U2', tex: m`x^2 + 5x + 2x + 10 = x^2 + 7x + 10\ \ok{\check}`, size: 0.8 },
        ],
      },
    ],
  },
  S08: {
    kicker: 'الإجابة النموذجية — Q02',
    captions: [
      { at: 'UEN', ar: 'الإجابة النموذجية', en: 'Model answer' },
      { at: 'U1', ar: '−5 و +3: ضربهم −15 وجمعهم −2', tone: 'ok' },
      { at: 'U2', ar: 'غلطة: الإشارتين متبدلين', tone: 'warn' },
    ],
    panels: [
      {
        at: 'UEN',
        rows: [
          { tex: m`x^2 - 2x - 15 = (x - \c1{5})(x + \c2{3})` },
          { at: 'U2', tex: m`\g{bad}{(x + 5)(x - 3) = x^2 + 2x - 15}`, size: 0.8 },
        ],
        fx: [{ at: 'U2', g: 'bad', k: 'strike' }],
      },
    ],
  },
};
