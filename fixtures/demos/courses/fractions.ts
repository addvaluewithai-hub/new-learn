import { board, course } from './make';

const pizza = board('demo-fractions-crayon');

export const fractionsCourse = course({
  id: 'fractions',
  title: 'الكسور بالبيتزا',
  englishTitle: 'Fractions with pizza',
  goals: [
    {
      id: 'G1',
      text: 'تقرا الكسر كحتت من بيتزا متقطعة بالتساوي',
      sceneIds: ['S01'],
      questionIds: ['Q1'],
    },
    { id: 'G2', text: 'تقارن الكسور بالنص', sceneIds: ['S02'], questionIds: ['Q2'] },
  ],
  glossary: [
    { term: 'البسط', meaning: 'الرقم اللي فوق: عدد الحتت اللي أخدناها.' },
    { term: 'المقام', meaning: 'الرقم اللي تحت: البيتزا متقطعة كام حتة متساوية.' },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'يعني إيه ربع؟',
      clipId: 'S01-C',
      visual: pizza,
      steps: [
        {
          unitIds: ['a1'],
          text: 'قطعنا البيتزا ٤ حتت متساوية، وأخدنا حتة واحدة.',
          board: { state: { slices: 4, taken: 1 }, highlight: ['#pizza'] },
        },
        {
          unitIds: ['a2'],
          text: 'الحتة دي اسمها ربع: ١ من ٤، وبنكتبها ١ فوق و٤ تحت.',
          board: { highlight: ['#fraction'] },
        },
        {
          unitIds: ['a3'],
          text: 'لو أخدنا حتتين، يبقى ٢ من ٤.',
          board: { state: { taken: 2 }, highlight: ['#fraction'] },
        },
        {
          unitIds: ['a4'],
          text: 'وبص! ٢ من ٤ قد نص البيتزا بالظبط.',
          board: { highlight: ['#half', '#compare'] },
        },
      ],
      question: {
        id: 'Q1',
        english: 'The pizza is cut into 8 slices. Take exactly half of it.',
        arabic: 'البيتزا متقطعة ٨ حتت. خد حتت تساوي نص البيتزا بالظبط.',
        attempt: 'board',
        options: [],
        answer: { english: '4 slices of 8', arabic: '٤ حتت من ٨' },
        board: {
          state: { slices: 8, taken: 0 },
          check: {
            kind: 'set',
            checks: [
              { variable: 'slices', kind: 'number', target: 8, tolerance: 0 },
              { variable: 'taken', kind: 'number', target: 4, tolerance: 0 },
            ],
          },
        },
        feedback: {
          clipId: 'Q1-F',
          visual: pizza,
          steps: [
            {
              unitIds: ['f1'],
              text: '٤ من ٨ = نص، لأن ٤ نص الـ٨.',
              board: { state: { slices: 8, taken: 4 }, highlight: ['#compare'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'حتت أكتر، حتت أصغر',
      clipId: 'S02-C',
      visual: pizza,
      steps: [
        {
          unitIds: ['b1'],
          text: 'النص هو حتة من اتنين.',
          board: { state: { slices: 2, taken: 1 }, highlight: ['#pizza'] },
        },
        {
          unitIds: ['b2'],
          text: 'لو قطعنا نفس البيتزا ٦ حتت، النص يبقى ٣ حتت أصغر.',
          board: { state: { slices: 6, taken: 3 }, highlight: ['#fraction'] },
        },
        {
          unitIds: ['b3'],
          text: 'ولو ١٢ حتة، النص يبقى ٦. كل ده نفس الكمية!',
          board: { state: { slices: 12, taken: 6 }, highlight: ['#compare'] },
        },
        {
          unitIds: ['b4'],
          text: 'جرّب بنفسك: غيّر عدد الحتت، وحاول توصل للنص كل مرة.',
          board: { input: 'open', highlight: ['#slices-control', '#taken-control'] },
        },
      ],
      question: {
        id: 'Q2',
        english: 'Which is bigger: 3 of 4 slices, or a half?',
        arabic: 'إيه الأكبر: ٣ حتت من ٤، ولا نص البيتزا؟',
        attempt: 'choice',
        options: ['٣ حتت من ٤', 'نص البيتزا', 'زي بعض'],
        answer: { english: '3 of 4 slices', arabic: '٣ حتت من ٤' },
        feedback: {
          clipId: 'Q2-F',
          visual: pizza,
          steps: [
            {
              unitIds: ['f2'],
              text: 'النص من ٤ هو حتتين بس، و٣ أكتر من ٢.',
              board: { state: { slices: 4, taken: 3 }, highlight: ['#compare'] },
            },
          ],
        },
      },
    },
  ],
});
