import { board, course } from './make';

const drawing = board('demo-circuit-blueprint');

export const circuitCourse = course({
  id: 'circuit',
  title: 'ليه اللمبة بتنور؟',
  englishTitle: 'Why does the bulb light up?',
  goals: [
    { id: 'G1', text: 'تعرف إن التيار محتاج دايرة مقفولة', sceneIds: ['S01'], questionIds: ['Q1'] },
    { id: 'G2', text: 'تحسب التيار بقانون أوم', sceneIds: ['S02'], questionIds: ['Q2'] },
  ],
  glossary: [
    { term: 'التيار', meaning: 'كمية الشحنة اللي بتعدّي في الدايرة كل ثانية، بالأمبير.' },
    { term: 'المقاومة', meaning: 'قد إيه حاجة بتصعّب مرور التيار، بالأوم.' },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'الدايرة لازم تتقفل',
      clipId: 'S01-C',
      visual: drawing,
      steps: [
        {
          unitIds: ['a1'],
          text: 'دي دايرة بسيطة: بطارية، ومفتاح، ولمبة.',
          board: { state: { switch: 'open', volts: 3, resistor: 0 }, highlight: ['#drawing'] },
        },
        {
          unitIds: ['a2'],
          text: 'طول ما المفتاح مفتوح، الطريق مقطوع والتيار صفر. اللمبة طافية.',
          board: { highlight: ['#meters'] },
        },
        {
          unitIds: ['a3'],
          text: 'لما نقفل المفتاح، الشحنات تلف في الدايرة كلها، واللمبة تنور.',
          board: { state: { switch: 'closed' }, highlight: ['#bulb'] },
        },
        {
          unitIds: ['a4'],
          text: 'بطارية أقوى، ٩ فولت، بتزق تيار أكبر، فاللمبة تنور أكتر.',
          board: { state: { volts: 9 }, highlight: ['#meters', '#bulb'] },
        },
      ],
      question: {
        id: 'Q1',
        english: 'Why was the bulb off while the switch was open?',
        arabic: 'ليه اللمبة كانت طافية والمفتاح مفتوح؟',
        attempt: 'choice',
        options: ['البطارية كانت فاضية', 'الدايرة مقطوعة فمفيش تيار', 'اللمبة كانت بايظة'],
        answer: {
          english: 'The circuit was broken, so no current flowed',
          arabic: 'الدايرة مقطوعة فمفيش تيار',
        },
        feedback: {
          clipId: 'Q1-F',
          visual: drawing,
          steps: [
            {
              unitIds: ['f1'],
              text: 'التيار محتاج طريق مقفول يلف فيه من البطارية وليها تاني.',
              board: {
                state: { switch: 'closed', volts: 3, resistor: 0 },
                highlight: ['#drawing'],
              },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'قانون أوم',
      clipId: 'S02-C',
      visual: drawing,
      steps: [
        {
          unitIds: ['b1'],
          text: 'التيار = الجهد ÷ المقاومة. هنا ٦ فولت ÷ ٦ أوم بتاعة اللمبة = ١ أمبير.',
          board: { state: { switch: 'closed', volts: 6, resistor: 0 }, highlight: ['#meters'] },
        },
        {
          unitIds: ['b2'],
          text: 'لو زودنا مقاومة ٦ أوم كمان، المقاومة الكلية ١٢، والتيار ينزل لنص أمبير.',
          board: { state: { resistor: 6 }, highlight: ['#resistor-control', '#meters'] },
        },
        {
          unitIds: ['b3'],
          text: 'مقاومة كبيرة يعني تيار صغير، واللمبة تبهت.',
          board: { state: { resistor: 24 }, highlight: ['#bulb'] },
        },
        {
          unitIds: ['b4'],
          text: 'جرّب بنفسك: غيّر البطارية والمقاومة، وشوف التيار.',
          board: { input: 'open', highlight: ['#volts-control', '#resistor-control'] },
        },
      ],
      question: {
        id: 'Q2',
        english:
          'With a 6 Ω extra resistor and the switch closed, set the battery for a current of 0.5 A.',
        arabic: 'بمقاومة زيادة ٦ أوم والمفتاح مقفول، اضبط البطارية عشان التيار يبقى نص أمبير.',
        attempt: 'board',
        options: [],
        answer: { english: '6 V', arabic: '٦ فولت' },
        board: {
          state: { switch: 'closed', volts: 1.5, resistor: 6 },
          check: {
            kind: 'set',
            checks: [
              { variable: 'volts', kind: 'number', target: 6, tolerance: 0 },
              { variable: 'resistor', kind: 'number', target: 6, tolerance: 0 },
              { variable: 'switch', kind: 'choice', value: 'closed' },
            ],
          },
        },
        feedback: {
          clipId: 'Q2-F',
          visual: drawing,
          steps: [
            {
              unitIds: ['f2'],
              text: 'المقاومة الكلية ٦ + ٦ = ١٢ أوم، فالجهد = ٠٫٥ × ١٢ = ٦ فولت.',
              board: { state: { switch: 'closed', volts: 6, resistor: 6 }, highlight: ['#meters'] },
            },
          ],
        },
      },
    },
  ],
});
