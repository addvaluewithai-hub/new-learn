import { board, course } from './make';

const plant = board('demo-plants-painted');

export const plantsCourse = course({
  id: 'plants',
  title: 'نسقي ولا نستنى؟',
  englishTitle: 'Water now, or wait?',
  goals: [
    { id: 'G1', text: 'تقرر تسقي ولا تستنى من فحص الخلطة', sceneIds: ['S01'], questionIds: ['Q1'] },
    { id: 'G2', text: 'تسقي صح وتسيب المية الزيادة تتصرف', sceneIds: ['S02'], questionIds: ['Q2'] },
  ],
  glossary: [
    { term: 'الخلطة', meaning: 'التربة اللي في الأصيص: بتمسك المية وبتسيب الهوا يوصل للجذور.' },
    { term: 'التصريف', meaning: 'خروج المية الزيادة من فتحات قاع الأصيص.' },
  ],
  scenes: [
    {
      id: 'S01',
      title: 'افحص قبل ما تسقي',
      clipId: 'S01-C',
      visual: plant,
      steps: [
        {
          unitIds: ['a1'],
          text: 'النبات مش محتاج مية كل يوم في نفس المعاد. هو محتاجها لما الخلطة تنشف.',
          board: { state: { soil: 'moist' }, highlight: ['#scene'] },
        },
        {
          unitIds: ['a2'],
          text: 'قبل ما تسقي، جسّ أول ٢ سم من الخلطة بصباعك.',
          board: { highlight: ['#probe'] },
        },
        {
          unitIds: ['a3'],
          text: 'لو لسه رطبة، استنى: المية الزيادة بتقلل الهوا حوالين الجذور.',
          board: { highlight: ['#verdict'] },
        },
        {
          unitIds: ['a4'],
          text: 'لو ناشفة على عمق ٢ سم، يبقى وقت الري. بص على الورق كمان: بيبدأ يدبل.',
          board: { state: { soil: 'dry' }, highlight: ['#probe'] },
        },
        {
          unitIds: ['a5'],
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
              unitIds: ['f1'],
              text: 'ناشفة على عمق ٢ سم: ده وقت الري.',
              board: { state: { soil: 'dry' }, highlight: ['#verdict'] },
            },
          ],
        },
      },
    },
    {
      id: 'S02',
      title: 'اسقِ صح',
      clipId: 'S02-C',
      visual: plant,
      steps: [
        {
          unitIds: ['b1'],
          text: 'اسقِ ببطء على الخلطة كلها، مش في نقطة واحدة.',
          board: { state: { soil: 'watered' }, highlight: ['#scene'] },
        },
        {
          unitIds: ['b2'],
          text: 'كمّل لحد ما المية تبدأ تنزل من الفتحات اللي تحت. كده الخلطة كلها شربت.',
          board: { highlight: ['#scene'] },
        },
        {
          unitIds: ['b3'],
          text: 'بعد ما المية تتصرف، فضّي الطبق. الجذور اللي قاعدة في مية بتعفّن.',
          board: { highlight: ['#verdict'] },
        },
        {
          unitIds: ['b4'],
          text: 'وبعدها نرجع للفحص: الخلطة هتفضل رطبة كام يوم حسب الشمس والحر.',
          board: { state: { soil: 'moist' }, highlight: ['#probe'] },
        },
      ],
      question: {
        id: 'Q2',
        english: 'You watered and water collected in the saucer. What next?',
        arabic: 'سقيت والمية الزيادة اتجمعت في الطبق. تعمل إيه بعدها؟',
        attempt: 'choice',
        options: [
          'أسيبها في الطبق عشان النبات يشرب',
          'أفضّي الطبق بعد ما المية تتصرف',
          'أسقي تاني عشان أتأكد',
        ],
        answer: {
          english: 'Empty the saucer once it has drained',
          arabic: 'أفضّي الطبق بعد ما المية تتصرف',
        },
        feedback: {
          clipId: 'Q2-F',
          visual: plant,
          steps: [
            {
              unitIds: ['f2'],
              text: 'صح: نفضّي الطبق، عشان الجذور تاخد هوا وما تعفّنش.',
              board: { state: { soil: 'watered' }, highlight: ['#scene'] },
            },
          ],
        },
      },
    },
  ],
});
