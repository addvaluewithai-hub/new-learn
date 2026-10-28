import { board, course } from './make';

const ink = board('demo-grammar-ink');

export const grammarCourse = course({
  id: 'grammar',
  title: 'الفاعل والمفعول',
  englishTitle: 'Subject and object',
  goals: [
    { id: 'G1', text: 'تعرف الفاعل والمفعول به من الحركة', sceneIds: ['S01'], questionIds: ['Q1'] },
    {
      id: 'G2',
      text: 'تفهم إن الترتيب بيتغير والمعنى ثابت',
      sceneIds: ['S02'],
      questionIds: ['Q2'],
    },
  ],
  glossary: [
    { term: 'الفاعل', meaning: 'اللي عمل الفعل، وآخره مرفوع بالضمة.' },
    { term: 'المفعول به', meaning: 'اللي وقع عليه الفعل، وآخره منصوب بالفتحة.' },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'الحركة بتقول مين عمل إيه',
      clipId: 'S01-C',
      visual: ink,
      steps: [
        {
          unitIds: ['a1'],
          text: 'بص على الجملة دي: كَتَبَ الطالبُ الدرسَ.',
          board: { state: { doer: 'student', order: 'vso' }, highlight: ['#sentence'] },
        },
        {
          unitIds: ['a2'],
          text: 'الضمة على «الطالبُ» بتقول إنه الفاعل: هو اللي كتب.',
          board: { highlight: ['#key'] },
        },
        {
          unitIds: ['a3'],
          text: 'والفتحة على «الدرسَ» بتقول إنه المفعول به: هو اللي اتكتب.',
          board: { highlight: ['#picture'] },
        },
        {
          unitIds: ['a4'],
          text: 'لو بدّلنا الحركات: كَتَبَ الطالبَ الدرسُ، يبقى الدرس هو اللي كتب الطالب!',
          board: { state: { doer: 'lesson' }, highlight: ['#meaning', '#picture'] },
        },
      ],
      question: {
        id: 'Q1',
        english: 'Put the meaning right: make the student the one who wrote.',
        arabic: 'رجّع المعنى الصح: خلّي الطالب هو اللي كتب.',
        attempt: 'board',
        options: [],
        answer: { english: 'The student is the subject', arabic: 'الطالب هو الفاعل' },
        board: {
          state: { doer: 'lesson', order: 'vso' },
          check: { variable: 'doer', kind: 'choice', value: 'student' },
        },
        feedback: {
          clipId: 'Q1-F',
          visual: ink,
          steps: [
            {
              unitIds: ['f1'],
              text: 'الضمة رجعت على «الطالبُ»، فرجع هو الفاعل.',
              board: { state: { doer: 'student', order: 'vso' }, highlight: ['#sentence'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'الترتيب ممكن يتغير',
      clipId: 'S02-C',
      visual: ink,
      steps: [
        {
          unitIds: ['b1'],
          text: 'في العربي ممكن نقدّم المفعول: كَتَبَ الدرسَ الطالبُ.',
          board: { state: { doer: 'student', order: 'vos' }, highlight: ['#sentence'] },
        },
        {
          unitIds: ['b2'],
          text: 'المعنى ما اتغيرش، لأن الحركة هي اللي بتحدد الفاعل، مش مكان الكلمة.',
          board: { highlight: ['#meaning'] },
        },
        {
          unitIds: ['b3'],
          text: 'جرّب بنفسك: غيّر الحركات والترتيب، وشوف المعنى.',
          board: { input: 'open', highlight: ['#doer-choice', '#order-choice'] },
        },
      ],
      question: {
        id: 'Q2',
        english: 'In «كَتَبَ الدرسَ الطالبُ», who did the writing?',
        arabic: 'في «كَتَبَ الدرسَ الطالبُ»، مين اللي كتب؟',
        attempt: 'choice',
        options: ['الدرس', 'الطالب'],
        answer: { english: 'The student', arabic: 'الطالب' },
        feedback: {
          clipId: 'Q2-F',
          visual: ink,
          steps: [
            {
              unitIds: ['f2'],
              text: '«الطالبُ» عليها ضمة، فهو الفاعل حتى لو جه في الآخر.',
              board: { state: { doer: 'student', order: 'vos' }, highlight: ['#sentence'] },
            },
          ],
        },
      },
    },
  ],
});
