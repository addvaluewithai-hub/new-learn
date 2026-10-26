import type { ReadingPackage, VisualSpec } from '@learn/lesson-runtime';

// Synthetic development content for live boards (docs/boards.md); not a course lesson.
const wire: VisualSpec = { renderer: 'html-board', params: { board: 'probe-wire' } };
const escape: VisualSpec = { renderer: 'html-board', params: { board: 'probe-escape' } };

export const boardProbeLesson: ReadingPackage = {
  schemaVersion: 1,
  delivery: 'reading',
  lessonId: 'board-probe',
  curriculumId: 'probe',
  contentRevision: 'board-probe-1',
  title: 'تجربة البورد التفاعلي',
  englishTitle: 'Live board probe',
  curriculumTitle: 'Probe',
  lessonOrder: 1,
  fps: 30,
  dimensions: { landscape: { width: 1280, height: 720 }, portrait: { width: 720, height: 1280 } },
  glossary: [],
  goals: [{ id: 'G1', text: 'تضبط الحمل اللي يمطّ السلك', sceneIds: ['S01'], questionIds: ['Q1'] }],
  scenes: [
    {
      id: 'S01',
      title: 'سلك بيتمط',
      clipId: 'S01-C',
      visual: wire,
      steps: [
        {
          unitIds: ['s1'],
          text: 'ده سلك حديد طوله 2 متر، متعلق من فوق ومن غير حمل.',
          board: { state: { load: 0, material: 'steel' }, highlight: ['#wire'] },
        },
        {
          unitIds: ['s2'],
          text: 'علّقنا عليه 200 نيوتن: بص على المسطرة، السلك نزل شوية.',
          board: {
            state: { load: 200 },
            highlight: ['#ruler'],
            notes: [{ target: '#stretch', text: 'الاستطالة = F × L ÷ (A × E)' }],
          },
        },
        {
          unitIds: ['s3'],
          text: 'جرّب بنفسك: حرّك الحمل وشوف الاستطالة بتتغير إزاي.',
          board: { input: 'open', highlight: ['#load-control'] },
        },
        {
          unitIds: ['s4'],
          text: 'نفس الحمل على سلك نحاس بيمطّه أكتر، لأن معامل يونج بتاعه أصغر.',
          board: { state: { load: 200, material: 'copper' }, highlight: ['#stretch'] },
        },
      ],
      question: {
        id: 'Q1',
        english: 'Set the load that stretches the steel wire by 3.00 mm.',
        arabic: 'اضبط الحمل اللي يخلّي السلك الحديد يتمط 3.00 مم.',
        attempt: 'board',
        options: [],
        answer: { english: '300 N', arabic: '300 نيوتن' },
        board: {
          state: { load: 0, material: 'steel' },
          check: { variable: 'load', kind: 'number', target: 300, tolerance: 0 },
        },
        feedback: {
          clipId: 'Q1-F',
          visual: wire,
          steps: [
            {
              unitIds: ['f1'],
              text: 'ΔL = F·L/(A·E)، يعني F = ΔL·A·E/L = 0.003 × 10⁻⁶ × 200×10⁹ / 2 = 300 نيوتن.',
            },
            {
              unitIds: ['f2'],
              text: 'دي الإجابة على البورد: 300 نيوتن بتمطّ السلك 3.00 مم بالظبط.',
              board: { state: { load: 300, material: 'steel' }, highlight: ['#stretch'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'فحص العزل',
      clipId: 'S02-C',
      visual: escape,
      steps: [{ unitIds: ['x1'], text: 'بورد تجريبي بيحاول يخرج برّه العزل، والمفروض كله يتمنع.' }],
    },
  ],
};
