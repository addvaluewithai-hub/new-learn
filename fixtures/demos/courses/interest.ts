import { board, course } from './make';

const chalk = board('demo-interest-chalk');

export const interestCourse = course({
  id: 'interest',
  title: 'فلوسك بتكبر إزاي؟',
  englishTitle: 'How your money grows',
  goals: [
    {
      id: 'G1',
      text: 'تفرّق بين الفايدة البسيطة والمركبة',
      sceneIds: ['S01'],
      questionIds: ['Q1'],
    },
    { id: 'G2', text: 'تشوف أثر المعدل والوقت على الفرق', sceneIds: ['S02'], questionIds: ['Q2'] },
  ],
  glossary: [
    { term: 'الفايدة البسيطة', meaning: 'نفس المبلغ كل سنة، محسوب على الأصل بس.' },
    { term: 'الفايدة المركبة', meaning: 'فايدة على الأصل وعلى الفايدة اللي اتجمعت قبل كده.' },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'فايدة على الفايدة',
      clipId: 'S01-C',
      visual: chalk,
      steps: [
        {
          unitIds: ['a1'],
          text: 'حطينا ١٠٠٠ جنيه بفايدة ٧٪ في السنة.',
          board: { state: { rate: 7, years: 0 }, highlight: ['#graph'] },
        },
        {
          unitIds: ['a2'],
          text: 'الفايدة البسيطة بتزود ٧٠ جنيه كل سنة، فبتطلع خط مستقيم.',
          board: { state: { years: 10 }, highlight: ['#simple'] },
        },
        {
          unitIds: ['a3'],
          text: 'المركبة بتحسب فايدة على الفايدة كمان، فالخط بيتني لفوق.',
          board: { highlight: ['#compound'] },
        },
        {
          unitIds: ['a4'],
          text: 'بعد ٣٠ سنة، الفرق بينهم بقى أكبر من الفلوس اللي بدأنا بيها.',
          board: { state: { years: 30 }, highlight: ['#graph'] },
        },
      ],
      question: {
        id: 'Q1',
        english: 'Why does the compound line bend upward?',
        arabic: 'ليه خط الفايدة المركبة بيتني لفوق؟',
        attempt: 'choice',
        options: [
          'عشان المعدل بيزيد كل سنة',
          'عشان الفايدة بتتحسب على الفلوس اللي كبرت',
          'عشان البنك بيضيف مكافأة',
        ],
        answer: {
          english: 'Interest is earned on money that has already grown',
          arabic: 'عشان الفايدة بتتحسب على الفلوس اللي كبرت',
        },
        feedback: {
          clipId: 'Q1-F',
          visual: chalk,
          steps: [
            {
              unitIds: ['f1'],
              text: 'المعدل ثابت ٧٪، بس كل سنة بيتحسب على مبلغ أكبر من اللي قبلها.',
              board: { state: { rate: 7, years: 20 }, highlight: ['#compound'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'الوقت أقوى من المعدل',
      clipId: 'S02-C',
      visual: chalk,
      steps: [
        {
          unitIds: ['b1'],
          text: 'بمعدل ٣٪ بس، الفرق صغير في الأول.',
          board: { state: { rate: 3, years: 10 }, highlight: ['#graph'] },
        },
        {
          unitIds: ['b2'],
          text: 'بس سيبها ٣٠ سنة، والمنحنى يبعد عن الخط.',
          board: { state: { years: 30 }, highlight: ['#graph'] },
        },
        {
          unitIds: ['b3'],
          text: 'جرّب بنفسك: غيّر المعدل والمدة وشوف الفرق بيكبر إزاي.',
          board: { input: 'open', highlight: ['#rate-control', '#years-control'] },
        },
      ],
      question: {
        id: 'Q2',
        english: 'At 7%, set the number of years after which the money is about double.',
        arabic: 'بمعدل ٧٪، اضبط عدد السنين اللي بعدها الفلوس تقرب تتضاعف.',
        attempt: 'board',
        options: [],
        answer: { english: 'About 10 years', arabic: 'حوالي ١٠ سنين' },
        board: {
          state: { rate: 7, years: 0 },
          check: { variable: 'years', kind: 'number', target: 10, tolerance: 1 },
        },
        feedback: {
          clipId: 'Q2-F',
          visual: chalk,
          steps: [
            {
              unitIds: ['f2'],
              text: '١٠٠٠ × ١٫٠٧ أس ١٠ ≈ ١٩٦٧: يعني في حوالي ١٠ سنين الفلوس تقرب تتضاعف.',
              board: { state: { rate: 7, years: 10 }, highlight: ['#compound'] },
            },
          ],
        },
      },
    },
  ],
});
