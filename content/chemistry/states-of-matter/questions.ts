export const STATES_QUESTIONS: Record<
  string,
  {
    title: string;
    options: string[];
    englishOptions: string[];
    correct: number;
    explanation: string;
    englishAnswer: string;
    feedbackId: string;
    hint: string;
  }
> = {
  S03: {
    title: 'نقلنا 100 mL مية لوعاء أكبر، بدون فقد أو تغير الحرارة. إيه اللي ممكن يتغيّر؟',
    options: ['الشكل', 'الحجم', 'الشكل والحجم معًا'],
    englishOptions: ['Shape', 'Volume', 'Both shape and volume'],
    correct: 0,
    explanation: 'قد يتغير شكل الماء، لكن حجمه يبقى تقريبًا 100 mL في الشروط المذكورة.',
    englishAnswer: 'Its shape may change, but its volume remains approximately 100 mL.',
    feedbackId: 'F01',
    hint: 'قارن نفس كمية المية في الوعاءين. الوعاء أوسع، لكن هل فقدنا مية أو غيّرنا حرارتها؟',
  },
  S05: {
    title: 'عند ضغط الغاز، هل الجسيمات نفسها بتصغر ولا المسافات بينها بتقل؟',
    options: ['الجسيمات نفسها بتصغر', 'المسافات بين الجسيمات بتقل', 'عدد الجسيمات بيقل'],
    englishOptions: [
      'The particles become smaller',
      'The spaces between particles decrease',
      'The number of particles decreases',
    ],
    correct: 1,
    explanation: 'المسافات بين الجسيمات بتقل؛ الجسيمات نفسها ما بتصغرش في النموذج ده.',
    englishAnswer:
      'The spaces between the particles decrease. The particles themselves do not become smaller in this model.',
    feedbackId: 'F02',
    hint: 'راجع نفس عدد النقط ونفس حجمها، مع تحرك المكبس. حدّد إيه اللي اتغير.',
  },
  S07: {
    title: 'أي حالات المادة تُعد موائع؟',
    options: ['الصلب فقط', 'السائل فقط', 'السائل والغاز معًا'],
    englishOptions: ['Solids only', 'Liquids only', 'Both liquids and gases'],
    correct: 2,
    explanation: 'السوائل والغازات الاتنين موائع؛ كلاهما يقدر يتدفق.',
    englishAnswer: 'Both liquids and gases are fluids.',
    feedbackId: 'F03',
    hint: 'افتكر المية والهوا وهما بيتحركوا في الأنبوبتين. مين فيهم بيجري؟',
  },
  S10: {
    title:
      'جسيمات متباعدة بتتحرك عشوائيًا في الوعاء. حدّد الحالة، وفسّر سهولة ضغطها. هل السائل لازم يملا وعاء أكبر كله؟',
    options: [
      'صلب؛ لأن جسيماته تختفي',
      'غاز؛ لأن المسافات بين جسيماته ممكن تقل',
      'سائل؛ لأنه يملأ أي وعاء كله',
    ],
    englishOptions: [
      'A solid; its particles disappear',
      'A gas; the spaces between its particles can decrease',
      'A liquid; it fills every container completely',
    ],
    correct: 1,
    explanation:
      'الحالة غاز؛ المسافات الكبيرة بين جسيماته يمكن أن تقل بالضغط. السائل له حجم محدد ولا يملأ بالضرورة وعاء أكبر.',
    englishAnswer:
      'It is a gas. Its particles are far apart, so the spaces between them can decrease during compression. A liquid has a definite volume and does not necessarily fill a larger container completely.',
    feedbackId: 'F04',
    hint: 'ابدأ بالمسافات والحركة، ثم قارن حجم السائل بحجم الوعاء. اكتب تفسيرك قبل فتح النموذج.',
  },
};
export const STATES_ENGLISH_QUESTIONS: Record<string, string> = {
  S03: 'A 100 mL sample of water is poured into a larger container without any loss or temperature change. Which property may change: its shape or its volume?',
  S05: 'When a gas is compressed, do the particles become smaller, or do the spaces between them decrease?',
  S07: 'Which states of matter are fluids?',
  S10: 'Identify the state of matter. Explain why its volume can be reduced easily by compression. Would a fixed amount of liquid necessarily fill a larger container completely?',
};
