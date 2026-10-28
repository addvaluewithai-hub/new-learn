import type { ReadingPackage, VisualSpec } from '@learn/lesson-runtime';

// Visual trials (docs/visuals): one scene per style tried, to judge on a real phone at
// `?preview=visuals`. Synthetic development content, not a course lesson.
const plant: VisualSpec = { renderer: 'html-board', params: { board: 'trial-plant-painted' } };
const interest: VisualSpec = { renderer: 'html-board', params: { board: 'trial-interest-chalk' } };

export const visualTrialsLesson: ReadingPackage = {
  schemaVersion: 1,
  delivery: 'reading',
  lessonId: 'visual-trials',
  curriculumId: 'probe',
  contentRevision: 'visual-trials-1',
  title: 'تجارب الاستايلات',
  englishTitle: 'Visual trials',
  curriculumTitle: 'Probe',
  lessonOrder: 1,
  fps: 30,
  dimensions: { landscape: { width: 1280, height: 720 }, portrait: { width: 720, height: 1280 } },
  glossary: [],
  goals: [
    { id: 'G1', text: 'تقرر تسقي ولا تستنى من فحص الخلطة', sceneIds: ['S01'], questionIds: ['Q1'] },
    { id: 'G2', text: 'تشوف الفايدة المركبة بتكبر إزاي', sceneIds: ['S02'], questionIds: ['Q2'] },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'نسقي ولا نستنى؟ (رسم مائي)',
      clipId: 'S01-C',
      visual: plant,
      steps: [
        {
          unitIds: ['p1'],
          text: 'قبل ما تسقي، جسّ أول ٢ سم من الخلطة بصباعك.',
          board: { state: { soil: 'moist' }, highlight: ['#probe'] },
        },
        {
          unitIds: ['p2'],
          text: 'لو لسه رطبة، استنى: المية الزيادة بتقلل الهوا حوالين الجذور.',
          board: { highlight: ['#verdict'] },
        },
        {
          unitIds: ['p3'],
          text: 'لو ناشفة على عمق ٢ سم، يبقى وقت الري. بص على الورق كمان.',
          board: { state: { soil: 'dry' }, highlight: ['#probe'] },
        },
        {
          unitIds: ['p4'],
          text: 'اسقِ ببطء لحد ما المية تنزل من الفتحات، وبعدين فضّي الطبق.',
          board: { state: { soil: 'watered' }, highlight: ['#scene'] },
        },
        {
          unitIds: ['p5'],
          text: 'جرّب بنفسك: اختار حالة الخلطة وشوف القرار.',
          board: { input: 'open', highlight: ['#choices'] },
        },
      ],
      question: {
        id: 'Q1',
        english: 'You felt the mix and the top 2 cm are dry. Show it on the board.',
        arabic: 'جسّيت الخلطة ولقيت أول ٢ سم ناشفين. ورّيني ده على البورد.',
        attempt: 'board',
        options: [],
        answer: { english: 'Dry', arabic: 'ناشفة' },
        board: {
          state: { soil: 'moist' },
          check: { variable: 'soil', kind: 'choice', value: 'dry' },
        },
        feedback: {
          clipId: 'Q1-F',
          visual: plant,
          steps: [
            {
              unitIds: ['q1'],
              text: 'ناشفة على عمق ٢ سم: نسقي ببطء لحد ما المية تتصرف.',
              board: { state: { soil: 'dry' }, highlight: ['#verdict'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'الفايدة المركبة (طباشير)',
      clipId: 'S02-C',
      visual: interest,
      steps: [
        {
          unitIds: ['i1'],
          text: 'حطينا ١٠٠٠ جنيه بفايدة ٧٪ في السنة.',
          board: { state: { rate: 7, years: 0 }, highlight: ['#graph'] },
        },
        {
          unitIds: ['i2'],
          text: 'الفايدة البسيطة بتزيد نفس المبلغ كل سنة، فبتطلع خط مستقيم.',
          board: { state: { years: 10 }, highlight: ['#simple'] },
        },
        {
          unitIds: ['i3'],
          text: 'المركبة بتحسب فايدة على الفايدة كمان، فالخط بيتني لفوق.',
          board: { highlight: ['#compound'] },
        },
        {
          unitIds: ['i4'],
          text: 'بعد ٣٠ سنة، الفرق بينهم بقى أكبر من الفلوس اللي بدأنا بيها.',
          board: { state: { years: 30 }, highlight: ['#graph'] },
        },
        {
          unitIds: ['i5'],
          text: 'جرّب: غيّر المعدل والمدة وشوف الفرق بيكبر إزاي.',
          board: { input: 'open', highlight: ['#rate-control'] },
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
          visual: interest,
          steps: [
            {
              unitIds: ['q2'],
              text: '١٠٠٠ × ١٫٠٧ أس ١٠ ≈ ١٩٦٧: يعني حوالي ١٠ سنين والفلوس تقرب تتضاعف.',
              board: { state: { rate: 7, years: 10 }, highlight: ['#compound'] },
            },
          ],
        },
      },
    },
  ],
};
