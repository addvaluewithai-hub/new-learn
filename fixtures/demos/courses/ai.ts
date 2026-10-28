import { board, course } from './make';

const crt = board('demo-ai-crt');

export const aiCourse = course({
  id: 'ai',
  title: 'إزاي الـAI بيكمّل جملتك؟',
  englishTitle: 'How AI finishes your sentence',
  goals: [
    {
      id: 'G1',
      text: 'تفهم إن الموديل بيخمّن الكلمة الجاية بس',
      sceneIds: ['S01'],
      questionIds: ['Q1'],
    },
    { id: 'G2', text: 'تعرف الحرارة بتغيّر اختياره إزاي', sceneIds: ['S02'], questionIds: ['Q2'] },
  ],
  glossary: [
    { term: 'الاحتمال', meaning: 'قد إيه كلمة معيّنة متوقعة تيجي بعد الكلام اللي قبلها.' },
    {
      term: 'الحرارة',
      meaning: 'إعداد بيخلّي الموديل يلتزم بالأكتر احتمالًا أو يغامر بكلمات تانية.',
    },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'كلمة ورا كلمة',
      clipId: 'S01-C',
      visual: crt,
      steps: [
        {
          unitIds: ['a1'],
          text: 'الموديل مش بيفكر في الجملة كلها مرة واحدة. بيخمّن الكلمة الجاية بس.',
          board: { state: { words: 0, temperature: 1 }, highlight: ['#sentence'] },
        },
        {
          unitIds: ['a2'],
          text: 'دي أعلى ٥ كلمات ممكن تيجي بعد «الجو النهارده»، وجنب كل كلمة احتمالها.',
          board: { highlight: ['#bars'] },
        },
        {
          unitIds: ['a3'],
          text: 'اختار «حر» لأنها الأعلى، وحطها في آخر الجملة.',
          board: { state: { words: 1 }, highlight: ['#sentence'] },
        },
        {
          unitIds: ['a4'],
          text: 'وبعدين يعيد نفس الحكاية على الجملة الجديدة: احتمالات جديدة لكلمة جديدة.',
          board: { state: { words: 2 }, highlight: ['#bars'] },
        },
        {
          unitIds: ['a5'],
          text: 'كلمة ورا كلمة لحد ما الجملة تخلص. ده كل اللي بيحصل، بس بسرعة جدًا.',
          board: { state: { words: 5 }, highlight: ['#sentence'] },
        },
      ],
      question: {
        id: 'Q1',
        english: 'How does the model write a sentence?',
        arabic: 'الموديل بيكتب الجملة إزاي؟',
        attempt: 'choice',
        options: [
          'بيكتبها كلها مرة واحدة من ذاكرته',
          'بيخمّن كلمة كلمة حسب اللي قبلها',
          'بيدوّر عليها جاهزة على النت',
        ],
        answer: {
          english: 'One word at a time, from what came before',
          arabic: 'بيخمّن كلمة كلمة حسب اللي قبلها',
        },
        feedback: {
          clipId: 'Q1-F',
          visual: crt,
          steps: [
            {
              unitIds: ['f1'],
              text: 'صح: كل كلمة بتتختار من احتمالات محسوبة على اللي اتكتب قبلها.',
              board: { state: { words: 3, temperature: 1 }, highlight: ['#bars'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'الحرارة: أمان ولا مغامرة؟',
      clipId: 'S02-C',
      visual: crt,
      steps: [
        {
          unitIds: ['b1'],
          text: 'فيه إعداد اسمه «الحرارة». لما تكون واطية، الموديل بيختار الأعلى تقريبًا كل مرة.',
          board: { state: { words: 0, temperature: 0.2 }, highlight: ['#bars'] },
        },
        {
          unitIds: ['b2'],
          text: 'لما تعلّيها، الاحتمالات بتقرب من بعض، وممكن يختار كلمة مش الأعلى.',
          board: { state: { temperature: 2 }, highlight: ['#pick'] },
        },
        {
          unitIds: ['b3'],
          text: 'النتيجة جملة مختلفة، وساعات أغرب. ده اللي بيخلّي الكتابة «مبدعة» أو «تايهة».',
          board: { state: { words: 5 }, highlight: ['#sentence'] },
        },
        {
          unitIds: ['b4'],
          text: 'جرّب بنفسك: غيّر الحرارة واضغط «الكلمة الجاية».',
          board: { state: { words: 0 }, input: 'open', highlight: ['#temp-control', '#next'] },
        },
      ],
      question: {
        id: 'Q2',
        english:
          'You want the model to stick to the likeliest word every time. Set the temperature.',
        arabic: 'عايز الموديل يلتزم بالكلمة الأعلى احتمالًا كل مرة. اضبط الحرارة.',
        attempt: 'board',
        options: [],
        answer: { english: 'Low, about 0.2', arabic: 'واطية، حوالي ٠٫٢' },
        board: {
          state: { words: 0, temperature: 1.5 },
          check: { variable: 'temperature', kind: 'number', target: 0.2, tolerance: 0.3 },
        },
        feedback: {
          clipId: 'Q2-F',
          visual: crt,
          steps: [
            {
              unitIds: ['f2'],
              text: 'حرارة واطية = أمان: الكلمة الأعلى بتكسب تقريبًا دايمًا. مفيدة في الإجابات الدقيقة.',
              board: { state: { words: 5, temperature: 0.2 }, highlight: ['#sentence'] },
            },
          ],
        },
      },
    },
  ],
});
