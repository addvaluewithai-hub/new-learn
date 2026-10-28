import { board, course } from './make';

const space = board('demo-seasons-3d');

export const seasonsCourse = course({
  id: 'seasons',
  title: 'ليه فيه صيف وشتا؟',
  englishTitle: 'Why are there seasons?',
  goals: [
    {
      id: 'G1',
      text: 'تشرح الصيف والشتا من ميل محور الأرض',
      sceneIds: ['S01'],
      questionIds: ['Q1'],
    },
    { id: 'G2', text: 'تعرف إن من غير ميل مفيش فصول', sceneIds: ['S02'], questionIds: ['Q2'] },
  ],
  glossary: [
    {
      term: 'محور الأرض',
      meaning: 'الخط الوهمي اللي الأرض بتلف حواليه، من القطب الشمالي للجنوبي.',
    },
    { term: 'الميل', meaning: 'زاوية المحور عن العمودي على مدار الأرض: حوالي ٢٣٫٥°.' },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'مش عشان الأرض بتقرب',
      clipId: 'S01-C',
      visual: space,
      steps: [
        {
          unitIds: ['a1'],
          text: 'ناس كتير فاكرة إن الصيف بييجي لما الأرض تقرب من الشمس. بس ده مش السبب.',
          board: { state: { month: 1, tilt: 23.5 }, highlight: ['#space'] },
        },
        {
          unitIds: ['a2'],
          text: 'محور الأرض مايل حوالي ٢٣٫٥°، وبيفضل مايل لنفس الناحية طول السنة.',
          board: { highlight: ['#tilt-control'] },
        },
        {
          unitIds: ['a3'],
          text: 'في يونيو، النص الشمالي اللي فيه مصر مايل ناحية الشمس: نهار أطول وشمس أعلى.',
          board: { state: { month: 6 }, highlight: ['#info'] },
        },
        {
          unitIds: ['a4'],
          text: 'في ديسمبر، نفس النص بقى مايل بعيد عن الشمس: نهار أقصر وشمس واطية. ده الشتا.',
          board: { state: { month: 12 }, highlight: ['#info'] },
        },
      ],
      question: {
        id: 'Q1',
        english: "Set the month with Cairo's longest day.",
        arabic: 'اضبط الشهر اللي القاهرة فيه أطول نهار.',
        attempt: 'board',
        options: [],
        answer: { english: 'June', arabic: 'يونيو' },
        board: {
          state: { month: 1, tilt: 23.5 },
          check: { variable: 'month', kind: 'number', target: 6, tolerance: 0 },
        },
        feedback: {
          clipId: 'Q1-F',
          visual: space,
          steps: [
            {
              unitIds: ['f1'],
              text: 'يونيو: الشمال مايل ناحية الشمس، فالنهار في القاهرة حوالي ١٤ ساعة.',
              board: { state: { month: 6, tilt: 23.5 }, highlight: ['#info'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'لو المحور مش مايل؟',
      clipId: 'S02-C',
      visual: space,
      steps: [
        {
          unitIds: ['b1'],
          text: 'تعالى نعدل المحور خالص، ونشوف يونيو تاني.',
          board: { state: { month: 6, tilt: 0 }, highlight: ['#tilt-control'] },
        },
        {
          unitIds: ['b2'],
          text: 'من غير ميل، النهار ١٢ ساعة، والشمس على نفس الارتفاع في أي شهر.',
          board: { state: { month: 12 }, highlight: ['#info'] },
        },
        {
          unitIds: ['b3'],
          text: 'يعني مفيش صيف ولا شتا. الميل هو السبب، مش البعد عن الشمس.',
          board: { highlight: ['#season'] },
        },
        {
          unitIds: ['b4'],
          text: 'جرّب بنفسك: غيّر الميل والشهر، وشوف طول النهار بيتغير إزاي.',
          board: {
            state: { tilt: 23.5 },
            input: 'open',
            highlight: ['#month-control', '#tilt-control'],
          },
        },
      ],
      question: {
        id: 'Q2',
        english: 'What mainly causes the seasons?',
        arabic: 'إيه السبب الأساسي في الصيف والشتا؟',
        attempt: 'choice',
        options: ['قرب الأرض من الشمس وبعدها عنها', 'ميل محور الأرض', 'سرعة لف الأرض حوالين نفسها'],
        answer: { english: "The tilt of the Earth's axis", arabic: 'ميل محور الأرض' },
        feedback: {
          clipId: 'Q2-F',
          visual: space,
          steps: [
            {
              unitIds: ['f2'],
              text: 'الميل بيخلّي كل نص من الأرض ياخد شمس أكتر نص السنة وأقل النص التاني.',
              board: { state: { month: 6, tilt: 23.5 }, highlight: ['#space'] },
            },
          ],
        },
      },
    },
  ],
});
