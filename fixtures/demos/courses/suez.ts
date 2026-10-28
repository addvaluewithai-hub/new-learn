import { board, course } from './make';

const chart = board('demo-suez-map');

export const suezCourse = course({
  id: 'suez',
  title: 'قناة السويس ليه مهمة؟',
  englishTitle: 'Why does the Suez Canal matter?',
  goals: [
    {
      id: 'G1',
      text: 'تقارن طريق القناة بالطريق حوالين أفريقيا',
      sceneIds: ['S01'],
      questionIds: ['Q1'],
    },
    {
      id: 'G2',
      text: 'تشرح ليه القناة مهمة لتجارة العالم ولمصر',
      sceneIds: ['S02'],
      questionIds: ['Q2'],
    },
  ],
  glossary: [
    {
      term: 'العقدة',
      meaning: 'وحدة سرعة المراكب: ميل بحري في الساعة، يعني حوالي ١٫٨٥ كم في الساعة.',
    },
    {
      term: 'رأس الرجاء الصالح',
      meaning: 'الطرف الجنوبي لأفريقيا، اللي المراكب بتلف حواليه من غير القناة.',
    },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'الطريق القصير',
      clipId: 'S01-C',
      visual: chart,
      steps: [
        {
          unitIds: ['a1'],
          text: 'مركب طالع من سنغافورة رايح روتردام في هولندا، شايل بضاعة لأوروبا.',
          board: { state: { route: 'suez', speed: 14 }, highlight: ['#chart'] },
        },
        {
          unitIds: ['a2'],
          text: 'من قناة السويس، الرحلة حوالي ١٥ ألف كم: ٢٥ يوم في البحر.',
          board: { highlight: ['#trip'] },
        },
        {
          unitIds: ['a3'],
          text: 'من غير القناة، لازم يلف حوالين أفريقيا كلها، من عند رأس الرجاء الصالح.',
          board: { state: { route: 'cape' }, highlight: ['#chart'] },
        },
        {
          unitIds: ['a4'],
          text: 'الطريق ده أطول بحوالي ٦٤٠٠ كم: ١٠ أيام زيادة، يعني وقود وأجور وفلوس أكتر.',
          board: { highlight: ['#saving'] },
        },
      ],
      question: {
        id: 'Q1',
        english: 'Choose the route that delivers the goods sooner.',
        arabic: 'اختار الطريق اللي يوصّل البضاعة أسرع.',
        attempt: 'board',
        options: [],
        answer: { english: 'Through the Suez Canal', arabic: 'من قناة السويس' },
        board: {
          state: { route: 'cape', speed: 14 },
          check: { variable: 'route', kind: 'choice', value: 'suez' },
        },
        feedback: {
          clipId: 'Q1-F',
          visual: chart,
          steps: [
            {
              unitIds: ['f1'],
              text: 'من القناة: ٢٥ يوم بدل ٣٥، بنفس السرعة.',
              board: { state: { route: 'suez', speed: 14 }, highlight: ['#trip'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'لما القناة تقفل',
      clipId: 'S02-C',
      visual: chart,
      steps: [
        {
          unitIds: ['b1'],
          text: 'لو المرور في القناة وقف، المراكب مضطرة تلف حوالين أفريقيا.',
          board: { state: { route: 'cape', speed: 14 }, highlight: ['#chart'] },
        },
        {
          unitIds: ['b2'],
          text: 'المركب ممكن يسرّع عشان يعوّض الأيام، بس السرعة بتحرق وقود أكتر بكتير.',
          board: { state: { speed: 20 }, highlight: ['#speed-control', '#trip'] },
        },
        {
          unitIds: ['b3'],
          text: 'عشان كده جزء كبير من تجارة العالم بيعدّي من القناة، ورسوم المرور دخل مهم لمصر.',
          board: { state: { route: 'suez', speed: 14 }, highlight: ['#chart'] },
        },
        {
          unitIds: ['b4'],
          text: 'جرّب بنفسك: غيّر الطريق والسرعة وقارن عدد الأيام.',
          board: { input: 'open', highlight: ['#route-choice', '#speed-control'] },
        },
      ],
      question: {
        id: 'Q2',
        english: 'Why does the Suez Canal matter for trade?',
        arabic: 'ليه قناة السويس مهمة للتجارة؟',
        attempt: 'choice',
        options: [
          'بتختصر الطريق بين آسيا وأوروبا',
          'عشان المراكب ممنوع تلف حوالين أفريقيا',
          'عشان المية فيها أعمق من المحيط',
        ],
        answer: {
          english: 'It shortens the way between Asia and Europe',
          arabic: 'بتختصر الطريق بين آسيا وأوروبا',
        },
        feedback: {
          clipId: 'Q2-F',
          visual: chart,
          steps: [
            {
              unitIds: ['f2'],
              text: 'القناة بتوفّر حوالي ٦٤٠٠ كم و١٠ أيام في كل رحلة زي دي.',
              board: { state: { route: 'suez', speed: 14 }, highlight: ['#saving'] },
            },
          ],
        },
      },
    },
  ],
});
