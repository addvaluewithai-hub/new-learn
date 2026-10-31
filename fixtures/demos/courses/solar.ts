import { board, course } from './make';

// The solar system in 3D (docs/visuals/demos.md): the course that shows the voice experience
// end to end: a tone per line for the reading voice, scenes Nova can jump to, and a board the
// learner flies through.
const space = board('demo-solar-system');

export const solarCourse = course({
  id: 'solar',
  title: 'رحلة في المجموعة الشمسية',
  englishTitle: 'A trip through the solar system',
  goals: [
    { id: 'G1', text: 'تعرف إن الشمس نجم في نص المجموعة', sceneIds: ['S01'], questionIds: ['Q1'] },
    {
      id: 'G2',
      text: 'تفهم ليه الكوكب القريب سنته أقصر',
      sceneIds: ['S02'],
      questionIds: ['Q2'],
    },
    { id: 'G3', text: 'تعرف إن القمر بيلف حوالين الأرض', sceneIds: ['S03'], questionIds: ['Q3'] },
  ],
  glossary: [
    { term: 'المدار', meaning: 'الطريق اللي الكوكب بيلف فيه حوالين الشمس.' },
    { term: 'السنة', meaning: 'الوقت اللي الكوكب بياخده عشان يلف لفة كاملة حوالين الشمس.' },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'نجم في النص',
      clipId: 'S01-C',
      visual: space,
      steps: [
        {
          unitIds: ['a1'],
          text: 'خد نفس… وبص فوق. ده بيتنا الكبير: المجموعة الشمسية.',
          tone: 'slowly, with wonder, a pause after the first words',
          board: { state: { focus: 'all', speed: 2 }, highlight: ['#space'] },
        },
        {
          unitIds: ['a2'],
          text: 'في النص فيه نجم واحد بس: الشمس. نار من غاز، أكبر من كل الكواكب مع بعض.',
          tone: 'deep and dramatic on the word nar',
          board: { state: { focus: 'sun' }, highlight: ['#fact'] },
        },
        {
          unitIds: ['a3'],
          text: 'وحواليها تمن كواكب، كل واحد ماشي في طريقه، اللي بنسميه المدار.',
          board: { state: { focus: 'all' }, highlight: ['#space'] },
        },
        {
          unitIds: ['a4'],
          text: 'الصورة دي مش بالمقاس الحقيقي. لو كانت، نبتون كان هيبقى بره الشاشة بكتير.',
          tone: 'a quick aside, smiling',
          board: { highlight: ['#info'] },
        },
      ],
      question: {
        id: 'Q1',
        english: 'What sits at the centre of the solar system?',
        arabic: 'إيه اللي في نص المجموعة الشمسية؟',
        attempt: 'choice',
        options: ['الأرض', 'الشمس', 'المشتري'],
        answer: { english: 'The Sun', arabic: 'الشمس' },
        feedback: {
          clipId: 'Q1-F',
          visual: space,
          steps: [
            {
              unitIds: ['f1'],
              text: 'الشمس. هي النجم اللي كل حاجة بتلف حواليه، وإحنا معاها.',
              tone: 'warm, confirming',
              board: { state: { focus: 'sun' }, highlight: ['#fact'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'سباق الكواكب',
      clipId: 'S02-C',
      visual: space,
      steps: [
        {
          unitIds: ['b1'],
          text: 'تعالى نسرّع الزمن شوية، ونشوف مين بيلف أسرع.',
          tone: 'playful, like starting a race',
          board: { state: { focus: 'all', speed: 8 }, highlight: ['#speed-control'] },
        },
        {
          unitIds: ['b2'],
          text: 'عطارد، أقرب كوكب للشمس، بيخلّص لفة كاملة في 88 يوم بس. سنته أقصر من فصل عندنا.',
          tone: 'fast and light, like the planet itself',
          board: { state: { focus: 'mercury' }, highlight: ['#info'] },
        },
        {
          unitIds: ['b3'],
          text: 'الأرض بتاخد 365 يوم. دي السنة اللي بنعدّها.',
          board: { state: { focus: 'earth' }, highlight: ['#info'] },
        },
        {
          unitIds: ['b4'],
          text: 'ونبتون، أبعد واحد، بياخد 165 سنة من سنينّا عشان يلف لفة واحدة.',
          tone: 'slow and far away, stretching the number',
          board: { state: { focus: 'neptune' }, highlight: ['#info'] },
        },
        {
          unitIds: ['b5'],
          text: 'يعني كل ما الكوكب يبعد عن الشمس، مداره يطول، وسنته تطول.',
          tone: 'serious: this is the key point',
          board: { state: { focus: 'all' }, highlight: ['#space'] },
        },
      ],
      question: {
        id: 'Q2',
        english: 'Look at the planet with the shortest year.',
        arabic: 'خلّي البصّ على الكوكب اللي سنته أقصر.',
        attempt: 'board',
        options: [],
        answer: { english: 'Mercury', arabic: 'عطارد' },
        board: {
          state: { focus: 'all', speed: 4 },
          check: { variable: 'focus', kind: 'choice', value: 'mercury' },
        },
        feedback: {
          clipId: 'Q2-F',
          visual: space,
          steps: [
            {
              unitIds: ['f2'],
              text: 'عطارد: أقرب للشمس، فمداره أصغر، فبيخلّص لفته أسرع من الكل.',
              board: { state: { focus: 'mercury', speed: 6 }, highlight: ['#fact'] },
            },
          ],
        },
      },
    },
    {
      id: 'S03',
      title: 'الأرض والقمر',
      clipId: 'S03-C',
      visual: space,
      steps: [
        {
          unitIds: ['c1'],
          text: 'نرجع بيتنا. الأرض، وجنبها حاجة صغيرة بتلف حواليها.',
          tone: 'warm, like coming home',
          board: { state: { focus: 'earth', speed: 3 }, highlight: ['#space'] },
        },
        {
          unitIds: ['c2'],
          text: 'ده القمر. مش بيلف حوالين الشمس لوحده: بيلف حوالين الأرض، والأرض بتاخده معاها.',
          board: { highlight: ['#fact'] },
        },
        {
          unitIds: ['c3'],
          text: 'لفة القمر حوالين الأرض بتاخد حوالي 27 يوم. عشان كده شكله بيتغير كل ليلة.',
          tone: 'gentle, a little mysterious',
          board: { highlight: ['#info'] },
        },
        {
          unitIds: ['c4'],
          text: 'جرّب بنفسك: اختار كوكب، وسرّع الزمن أو وقّفه، وشوف مين بيسبق مين.',
          tone: 'inviting, handing over',
          board: {
            state: { focus: 'all', speed: 5 },
            input: 'open',
            highlight: ['#focus-control', '#speed-control'],
          },
        },
      ],
      question: {
        id: 'Q3',
        english: 'What does the Moon go round?',
        arabic: 'القمر بيلف حوالين إيه؟',
        attempt: 'choice',
        options: ['الشمس لوحدها', 'الأرض', 'المريخ'],
        answer: { english: 'The Earth', arabic: 'الأرض' },
        feedback: {
          clipId: 'Q3-F',
          visual: space,
          steps: [
            {
              unitIds: ['f3'],
              text: 'الأرض. القمر تابع للأرض، والاتنين مع بعض بيلفوا حوالين الشمس.',
              board: { state: { focus: 'earth', speed: 4 }, highlight: ['#fact'] },
            },
          ],
        },
      },
    },
  ],
});
