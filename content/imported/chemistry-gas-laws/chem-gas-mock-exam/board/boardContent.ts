import type { GasLaw } from './physics';

export type ProblemKey =
  | 'boyle-organize'
  | 'boyle-worked'
  | 'boyle-source'
  | 'charles-organize'
  | 'charles-worked'
  | 'charles-independent'
  | 'charles-source'
  | 'pressure-worked'
  | 'pressure-exam'
  | 'combined-organize'
  | 'combined-worked'
  | 'combined-source'
  | 'source-error';
export type ChemistryBoardSpec =
  | {
      kind: 'matter';
      focus: 'shape' | 'compression' | 'diffusion' | 'particles' | 'summary';
    }
  | { kind: 'phases'; direct: boolean }
  | {
      kind: 'gas';
      law: GasLaw;
      focus: 'overview' | 'conditions' | 'graph' | 'equation' | 'absolute-zero';
    }
  | { kind: 'kelvin' }
  | { kind: 'selector' }
  | { kind: 'stp' }
  | { kind: 'problem'; problem: ProblemKey; worked?: boolean }
  | {
      kind: 'review';
      topic: 'matter' | 'laws' | 'graphs' | 'errors' | 'strategy';
    };

export interface ChemistryProblem {
  rows: Array<{ quantity: string; first: string; second: string }>;
  constant: string;
  unknown: string;
  worked?: {
    prediction: string;
    law: string;
    substitution: string;
    answer: string;
    check: string;
  };
}
const row = (quantity: string, first: string, second: string) => ({
  quantity,
  first,
  second,
});
export const chemistryProblems: Record<ProblemKey, ChemistryProblem> = {
  'boyle-organize': {
    rows: [row('P — الضغط', 'P₁', 'P₂'), row('V — الحجم', 'V₁', '?')],
    constant: 'T — درجة الحرارة ثابتة',
    unknown: 'V₂ — الحجم النهائي',
  },
  'boyle-worked': {
    rows: [row('P — الضغط', '1.00 atm', '1.50 atm'), row('V — الحجم', '600 mL', '?')],
    constant: 'T — درجة الحرارة ثابتة',
    unknown: 'V₂ — الحجم النهائي',
    worked: {
      prediction: 'الضغط زاد، فنتوقع الحجم يقل.',
      law: 'P₁V₁ = P₂V₂',
      substitution: '(1.00 × 600) ÷ 1.50',
      answer: '400 mL',
      check: '400 < 600 · الحجم قل، زي ما توقعنا.',
    },
  },
  'boyle-source': {
    rows: [row('P — الضغط', '0.971 atm', '1.40 atm'), row('V — الحجم', '725 mL', '?')],
    constant: 'T — درجة الحرارة ثابتة',
    unknown: 'V₂ — الحجم النهائي',
  },
  'charles-organize': {
    rows: [row('V — الحجم', 'V₁', '?'), row('T — درجة الحرارة', 'T₁', 'T₂')],
    constant: 'P — الضغط ثابت',
    unknown: 'V₂ — الحجم النهائي',
  },
  'charles-worked': {
    rows: [row('V — الحجم', '250 mL', '?'), row('T — درجة الحرارة', '300 K', '360 K')],
    constant: 'P — الضغط ثابت',
    unknown: 'V₂ — الحجم النهائي',
    worked: {
      prediction: 'الحرارة المطلقة زادت، فنتوقع الحجم يزيد.',
      law: 'V₁/T₁ = V₂/T₂',
      substitution: '250 × 360 ÷ 300',
      answer: '300 mL',
      check: '300 > 250 · الحجم زاد بنفس نسبة الحرارة المطلقة.',
    },
  },
  'charles-independent': {
    rows: [row('V — الحجم', '180 mL', '?'), row('T — درجة الحرارة', '300 K', '350 K')],
    constant: 'P — الضغط ثابت',
    unknown: 'V₂ — الحجم النهائي',
  },
  'charles-source': {
    rows: [row('V — الحجم', '349 mL', '?'), row('T — درجة الحرارة', '22°C', '50°C')],
    constant: 'P — الضغط ثابت',
    unknown: 'V₂ — الحجم النهائي',
  },
  'pressure-worked': {
    rows: [row('P — الضغط', '1.00 atm', '?'), row('T — درجة الحرارة', '300 K', '450 K')],
    constant: 'V — الحجم ثابت',
    unknown: 'P₂ — الضغط النهائي',
    worked: {
      prediction: 'الحرارة المطلقة زادت، فنتوقع الضغط يزيد.',
      law: 'P₁/T₁ = P₂/T₂',
      substitution: '1.00 × 450 ÷ 300',
      answer: '1.50 atm',
      check: 'الحرارة زادت 1.5 مرة، والضغط زاد 1.5 مرة.',
    },
  },
  'pressure-exam': {
    rows: [row('P — الضغط', '1.20 bar', '?'), row('T — درجة الحرارة', '300 K', '450 K')],
    constant: 'V — الحجم ثابت',
    unknown: 'P₂ — الضغط النهائي',
  },
  'combined-organize': {
    rows: [
      row('P — الضغط', 'P₁', 'P₂'),
      row('V — الحجم', 'V₁', '?'),
      row('T — درجة الحرارة', 'T₁', 'T₂'),
    ],
    constant: 'نفس كمية الغاز · الضغط والحرارة يتغيران',
    unknown: 'V₂ — الحجم النهائي',
  },
  'combined-worked': {
    rows: [
      row('P — الضغط', '1.00 atm', '1.20 atm'),
      row('V — الحجم', '1.50 L', '?'),
      row('T — درجة الحرارة', '300 K', '330 K'),
    ],
    constant: 'نفس كمية الغاز',
    unknown: 'V₂ — الحجم النهائي',
    worked: {
      prediction: 'الضغط والحرارة زادوا؛ نقارن النسبتين بدل ما نحكم من متغير واحد.',
      law: 'P₁V₁/T₁ = P₂V₂/T₂',
      substitution: '1.00 × 1.50 × 330 ÷ (300 × 1.20)',
      answer: '1.375 L ≈ 1.38 L',
      check: 'نسبة الحرارة 1.1 ونسبة الضغط 1.2؛ الحجم يقل قليلًا.',
    },
  },
  'combined-source': {
    rows: [
      row('P — الضغط', '745 mmHg', '760 mmHg'),
      row('V — الحجم', '2.00 L', '?'),
      row('T — درجة الحرارة', '25.0°C', '273.15 K'),
    ],
    constant: 'نفس كمية الغاز · الحالة الثانية STP وفق الكورس',
    unknown: 'V₂ — الحجم النهائي',
  },
  'source-error': {
    rows: [row('P — الضغط', '1.1 bar', '2.2 bar'), row('T — درجة الحرارة', '22°C', '?')],
    constant: 'V — الحجم ثابت',
    unknown: 'T₂ — درجة الحرارة النهائية',
  },
};

export const gasLawLabels: Record<
  GasLaw,
  { name: string; constant: string; equation: string; invariant: string }
> = {
  boyle: {
    name: "Boyle's Law — قانون بويل",
    constant: 'T وكمية الغاز ثابتتان',
    equation: 'P₁V₁ = P₂V₂',
    invariant: 'PV',
  },
  charles: {
    name: 'Charles’ Law — قانون شارل',
    constant: 'P وكمية الغاز ثابتان',
    equation: 'V₁/T₁ = V₂/T₂',
    invariant: 'V/T',
  },
  pressure: {
    name: 'P–T — علاقة الضغط والحرارة',
    constant: 'V وكمية الغاز ثابتان',
    equation: 'P₁/T₁ = P₂/T₂',
    invariant: 'P/T',
  },
  combined: {
    name: 'Combined Gas Law — قانون الغازات المجمّع',
    constant: 'كمية الغاز ثابتة',
    equation: 'P₁V₁/T₁ = P₂V₂/T₂',
    invariant: 'PV/T',
  },
};
