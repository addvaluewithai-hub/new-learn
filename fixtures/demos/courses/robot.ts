import { board, course } from './make';

const maze = board('demo-robot-pixel');
const empty = { c1: 'none', c2: 'none', c3: 'none', c4: 'none', c5: 'none', c6: 'none', repeat: 1 };
const stairs = { c1: 'right', c2: 'up', c3: 'right', c4: 'up', c5: 'right', c6: 'up', repeat: 1 };
const exact = (values: Record<string, string | number>) => ({
  kind: 'set' as const,
  checks: Object.entries(values).map(([variable, v]) =>
    typeof v === 'number'
      ? { variable, kind: 'number' as const, target: v, tolerance: 0 }
      : { variable, kind: 'choice' as const, value: v },
  ),
});

export const robotCourse = course({
  id: 'robot',
  title: 'حرّك الروبوت',
  englishTitle: 'Move the robot',
  goals: [
    { id: 'G1', text: 'تكتب برنامج كأوامر بالترتيب', sceneIds: ['S01'], questionIds: ['Q1'] },
    { id: 'G2', text: 'تختصر البرنامج بالتكرار', sceneIds: ['S02'], questionIds: ['Q2'] },
  ],
  glossary: [
    { term: 'البرنامج', meaning: 'أوامر بالترتيب، الكمبيوتر بينفذها بالظبط زي ما هي.' },
    { term: 'التكرار (loop)', meaning: 'إنك تقول للكمبيوتر يعيد نفس الأوامر كذا مرة.' },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'أوامر بالترتيب',
      clipId: 'S01-C',
      visual: maze,
      steps: [
        {
          unitIds: ['a1'],
          text: 'الروبوت ده بيمشي بالأوامر بس: فوق، تحت، يمين، شمال. عايزينه يوصل للبطارية.',
          board: { state: empty, highlight: ['#maze'] },
        },
        {
          unitIds: ['a2'],
          text: 'لو أول أمر «فوق»، هيخبط في الحيطة ويقف. الكمبيوتر بينفذ اللي تقوله بالظبط.',
          board: { state: { c1: 'up' }, highlight: ['#status'] },
        },
        {
          unitIds: ['a3'],
          text: 'نبدأ «يمين» وبعدين «فوق»: أول درجة في السلم.',
          board: { state: { c1: 'right', c2: 'up' }, highlight: ['#program'] },
        },
        {
          unitIds: ['a4'],
          text: 'يمين، فوق، ٣ مرات ورا بعض: ٦ أوامر، والروبوت وصل!',
          board: { state: stairs, highlight: ['#maze', '#status'] },
        },
      ],
      question: {
        id: 'Q1',
        english: 'Write the six-move program that takes the robot to the battery, without repeat.',
        arabic: 'اكتب برنامج الـ٦ أوامر اللي يوصّل الروبوت للبطارية، من غير تكرار.',
        attempt: 'board',
        options: [],
        answer: {
          english: 'Right, up, right, up, right, up',
          arabic: 'يمين، فوق، يمين، فوق، يمين، فوق',
        },
        board: { state: empty, check: exact(stairs) },
        feedback: {
          clipId: 'Q1-F',
          visual: maze,
          steps: [
            {
              unitIds: ['f1'],
              text: 'يمين، فوق، ٣ مرات: كل مرة درجة لفوق لحد البطارية.',
              board: { state: stairs, highlight: ['#program'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'التكرار',
      clipId: 'S02-C',
      visual: maze,
      steps: [
        {
          unitIds: ['b1'],
          text: 'لاحظ إن «يمين، فوق» بتتكرر ٣ مرات في البرنامج.',
          board: { state: { ...empty, c1: 'right', c2: 'up' }, highlight: ['#program'] },
        },
        {
          unitIds: ['b2'],
          text: 'بدل ما نكتبها ٣ مرات، نكتبها مرة ونقول: كرر ×٣.',
          board: { state: { repeat: 3 }, highlight: ['#repeat-choice', '#status'] },
        },
        {
          unitIds: ['b3'],
          text: 'ده اسمه «تكرار» أو loop: البرنامج أقصر، وأسهل تعدّله.',
          board: { highlight: ['#maze'] },
        },
        {
          unitIds: ['b4'],
          text: 'جرّب بنفسك: اكتب برنامجك وشوف الروبوت يمشي.',
          board: { input: 'open', highlight: ['#program', '#repeat-choice'] },
        },
      ],
      question: {
        id: 'Q2',
        english: 'Get the robot to the battery with only two moves and a repeat.',
        arabic: 'وصّل الروبوت للبطارية بأمرين بس وتكرار.',
        attempt: 'board',
        options: [],
        answer: { english: 'Right, up, repeat ×3', arabic: 'يمين، فوق، كرر ×٣' },
        board: { state: empty, check: exact({ ...empty, c1: 'right', c2: 'up', repeat: 3 }) },
        feedback: {
          clipId: 'Q2-F',
          visual: maze,
          steps: [
            {
              unitIds: ['f2'],
              text: 'أمرين بس، يتكرروا ٣ مرات: نفس المشوار، بربع الكتابة.',
              board: {
                state: { ...empty, c1: 'right', c2: 'up', repeat: 3 },
                highlight: ['#status'],
              },
            },
          ],
        },
      },
    },
  ],
});
