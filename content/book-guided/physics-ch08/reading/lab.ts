import type { ReadingScene, VisualSpec } from '@learn/lesson-runtime/core';
import { lessonText } from './text';

// After page 127's ΔL = F·L₀/(A·Y): the learner changes the quantities on a live board
// (docs/boards.md) and answers on it. Y for steel is the same teacher-added approximate value
// the page 130 solution uses (OpenStax Table 12.1), not a number printed in the book.
export const LAB_ID = 'P127-C-lab';
const board: VisualSpec = { renderer: 'html-board', params: { board: 'phys1-ch08-youngs-rod' } };
const rod = { force: 0, length: 4, area: 0.008, youngs: 2e11 };
const step = (i: number, text: string, extra: object = {}) => ({
  unitIds: [`${LAB_ID}-U${i}`],
  text: lessonText(text),
  written: true,
  ...extra,
});

export const youngsLab: ReadingScene = {
  id: LAB_ID,
  title: 'ص 127 · جرّب بنفسك: معامل يونج على البورد',
  clipId: `${LAB_ID}-teach`,
  visual: board,
  steps: [
    step(
      1,
      'جرّب العلاقة بإيدك. على البورد قضيب من الصلب طوله الأصلي $L_0 = 4$ m، ومساحة مقطعه $A = 8\\times10^{-3}$ m². معامل يونج هنا $Y = 2.0\\times10^{11}$ Pa، وهي نفس القيمة التقريبية اللي هنستخدمها في مسألة ص 130، وليست رقمًا مطبوعًا في الكتاب.',
      { board: { state: rod, highlight: ['#rod'] } },
    ),
    step(
      2,
      'نشدّ القضيب بقوة $F = 6\\times10^{4}$ N. الـ Stress يبقى $F/A = 7.5\\times10^{6}$ Pa، والاستطالة $\\Delta L = FL_0/(AY) = 0.15$ mm. الرسم مكبّر جدًا؛ القضيب الحقيقي بيطول أقل من سُمك ورقتين.',
      {
        board: {
          state: { force: 60000 },
          highlight: ['#stretch-bar'],
          notes: [{ target: '#readout', text: 'ΔL = F × L₀ ÷ (A × Y)' }],
        },
      },
    ),
    step(
      3,
      'نضاعف القوة لـ $1.2\\times10^{5}$ N والباقي ثابت: الاستطالة بقت 0.30 mm، الضعف بالظبط، لأن $F$ في البسط.',
      { board: { state: { force: 120000 }, highlight: ['#readout'] } },
    ),
    step(
      4,
      'نرجّع القوة لـ $6\\times10^{4}$ N ونضاعف المساحة لـ $16\\times10^{-3}$ m²: الاستطالة بقت 0.075 mm، النص، لأن $A$ في المقام.',
      { board: { state: { force: 60000, area: 0.016 }, highlight: ['#a-control', '#readout'] } },
    ),
    step(
      5,
      'دورك: غيّر أي قيمة وشوف الكسر $FL_0/(AY)$ بيتصرف إزاي. لو كبّرت $L_0$ الاستطالة بتزيد، لكن الـ Strain نفسه ثابت لأنه $\\sigma/Y$.',
      { board: { state: { force: 60000, area: 0.008 }, input: 'open' } },
    ),
  ],
  question: {
    id: LAB_ID,
    english: lessonText(
      'Set the force that stretches this steel rod ($L_0 = 4.0$ m, $A = 8\\times10^{-3}$ m², $Y = 2.0\\times10^{11}$ Pa) by 0.30 mm.',
    ),
    arabic: lessonText(
      'اضبط على البورد القوة اللي تخلّي القضيب ده يطول 0.30 mm، مع $L_0 = 4$ m و$A = 8\\times10^{-3}$ m² و$Y = 2.0\\times10^{11}$ Pa.',
    ),
    attempt: 'board',
    options: [],
    answer: {
      english: lessonText('$F = \\Delta L\\,A\\,Y/L_0 = 1.2\\times10^{5}$ N'),
      arabic: lessonText('$F = 1.2\\times10^{5}$ N، ضعف القوة اللي بدأنا بيها.'),
    },
    board: {
      state: rod,
      check: { variable: 'force', kind: 'number', target: 120000, tolerance: 0 },
    },
    feedback: {
      clipId: `${LAB_ID}-solution`,
      visual: board,
      steps: [
        step(
          6,
          'نرتّب نفس المعادلة عشان نطلع القوة: $F = \\Delta L\\,A\\,Y/L_0 = (3\\times10^{-4})(8\\times10^{-3})(2.0\\times10^{11})/4.0 = 1.2\\times10^{5}$ N.',
        ),
        step(
          7,
          'وده على البورد: $1.2\\times10^{5}$ N بتعمل استطالة 0.30 mm بالظبط، ضعف الـ 0.15 mm اللي شفناها بقوة $6\\times10^{4}$ N.',
          { board: { state: { ...rod, force: 120000 }, highlight: ['#readout'] } },
        ),
      ],
    },
  },
};
