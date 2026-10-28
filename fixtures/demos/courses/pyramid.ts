import { board, course } from './make';

const scene = board('demo-pyramid-shadow');

export const pyramidCourse = course({
  id: 'pyramid',
  title: 'الهرم اتبنى إزاي؟',
  englishTitle: 'How was the pyramid built?',
  goals: [
    {
      id: 'G1',
      text: 'تشرح المقايضة بين ميل الرامب وعدد العمال',
      sceneIds: ['S01'],
      questionIds: ['Q1'],
    },
    {
      id: 'G2',
      text: 'تعرف ليه المصريين كانوا بيبلّوا الرمل',
      sceneIds: ['S02'],
      questionIds: ['Q2'],
    },
  ],
  glossary: [
    { term: 'الرامب', meaning: 'طريق مايل من الطوب والطين، كانوا بيسحبوا عليه الحجارة لفوق.' },
    { term: 'الاحتكاك', meaning: 'المقاومة اللي بتحصل لما حاجة تتسحب على حاجة تانية.' },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'رامب طويل ولا حاد؟',
      clipId: 'S01-C',
      visual: scene,
      steps: [
        {
          unitIds: ['a1'],
          text: 'الهرم الأكبر ارتفاعه حوالي ١٤٦ متر، ومبني من أكتر من مليونين حجر.',
          board: { state: { slope: 8, sand: 'dry' }, highlight: ['#scene'] },
        },
        {
          unitIds: ['a2'],
          text: 'نظرية مشهورة: كانوا بيسحبوا كل حجر على زحّافة خشب، فوق رامب مايل.',
          board: { highlight: ['#ramp'] },
        },
        {
          unitIds: ['a3'],
          text: 'رامب واطي محتاج عمال أقل لكل حجر، بس لازم يبقى طويل جدًا: أكتر من ٢ كم.',
          board: { state: { slope: 4 }, highlight: ['#ramp', '#workers'] },
        },
        {
          unitIds: ['a4'],
          text: 'رامب حاد قصير ويتبني بسرعة، بس كل حجر محتاج عمال أكتر بكتير.',
          board: { state: { slope: 18 }, highlight: ['#workers'] },
        },
      ],
      question: {
        id: 'Q1',
        english: 'Set a slope that makes the ramp shorter than half a kilometre.',
        arabic: 'اضبط ميل يخلّي الرامب أقصر من نص كيلو.',
        attempt: 'board',
        options: [],
        answer: { english: '17° or more', arabic: '١٧° أو أكتر' },
        board: {
          state: { slope: 4, sand: 'dry' },
          check: { variable: 'slope', kind: 'number', target: 18.5, tolerance: 1.5 },
        },
        feedback: {
          clipId: 'Q1-F',
          visual: scene,
          steps: [
            {
              unitIds: ['f1'],
              text: 'عند ١٨° الرامب حوالي نص كيلو إلا شوية، بس الحجر بقى محتاج حوالي ٨٢ عامل.',
              board: { state: { slope: 18, sand: 'dry' }, highlight: ['#ramp', '#workers'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'سر الرمل المبلول',
      clipId: 'S02-C',
      visual: scene,
      steps: [
        {
          unitIds: ['b1'],
          text: 'في رسومات مصرية قديمة، فيه واحد ماشي قدام الزحّافة بيصب مية على الرمل.',
          board: { state: { slope: 8, sand: 'dry' }, highlight: ['#scene'] },
        },
        {
          unitIds: ['b2'],
          text: 'الرمل المبلول بيبقى أصلب، والزحّافة ما بتغرزش فيه، فالاحتكاك بيقل للنص تقريبًا.',
          board: { state: { sand: 'wet' }, highlight: ['#sand-choice'] },
        },
        {
          unitIds: ['b3'],
          text: 'النتيجة: نفس الحجر على نفس الرامب محتاج عمال أقل بكتير.',
          board: { highlight: ['#workers'] },
        },
        {
          unitIds: ['b4'],
          text: 'جرّب بنفسك: غيّر الميل والرمل، ودوّر على أحسن توازن.',
          board: { input: 'open', highlight: ['#slope-control', '#sand-choice'] },
        },
      ],
      question: {
        id: 'Q2',
        english: 'Why did they pour water in front of the sledge?',
        arabic: 'ليه كانوا بيصبّوا مية قدام الزحّافة؟',
        attempt: 'choice',
        options: ['عشان يبرّدوا الحجر', 'عشان يقللوا الاحتكاك', 'عشان العمال يشربوا'],
        answer: { english: 'To reduce the friction', arabic: 'عشان يقللوا الاحتكاك' },
        feedback: {
          clipId: 'Q2-F',
          visual: scene,
          steps: [
            {
              unitIds: ['f2'],
              text: 'المية بتقلل الاحتكاك، فعند ٨° الحجر بيحتاج حوالي ٤٣ عامل بدل ٦٨.',
              board: { state: { slope: 8, sand: 'wet' }, highlight: ['#workers'] },
            },
          ],
        },
      },
    },
  ],
});
