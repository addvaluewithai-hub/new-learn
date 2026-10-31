import { Fragment, createContext, createElement, useContext, useMemo, type ReactNode } from 'react';

/**
 * Every interface text the lesson player shows, in Arabic (the defaults). The app fills the
 * learner's language through `RuntimeTextProvider`; its `runtime` group in
 * apps/platform/src/i18n/locales/ar.json holds these same keys and values.
 * `{name}` is a placeholder. Lesson content (scenes, steps, questions) is never here.
 */
export const RUNTIME_TEXT = {
  // Recorded lessons (LessonPreview and its parts)
  lessonScenes: 'مشاهد الدرس',
  audioFailed: 'تعذّر تشغيل الصوت. جرّب تاني.',
  sceneFailed: 'تعذّر تشغيل المشهد.',
  sceneRenderFailed: 'تعذّر عرض المشهد. جرّب إعادة تشغيله.',
  scenePlaybackStopped: 'تعذّر تشغيل المشهد؛ هنقف هنا لحد ما الصوت يشتغل.',
  reloadPreview: 'أعد تحميل المعاينة',
  tryAgain: 'حاول تاني',
  startOver: 'ابدأ من الأول',
  pause: 'إيقاف مؤقت',
  resumeExplaining: 'كمّل الشرح',
  startExplaining: 'ابدأ الشرح',
  playbackPosition: 'موضع التشغيل',
  replayScene: 'أعد المشهد',
  loadingAudio: 'بنحمّل الصوت…',
  yourTurn: 'دورك دلوقتي',
  chooseAnswer: 'اختار إجابتك',
  hearFeedback: 'اسمع التعقيب ونكمل',
  boardQuestion: 'خلّينا نجرب',
  boardFeedback: 'نراجع الفكرة ونكمل',
  // Reading lessons: top bar, caption and question
  sceneTrack: 'المشهد {scene} من {scenes}. اعرض المشاهد',
  goalsChip: 'أهداف الدرس: {met} من {goals}',
  lessonGoals: 'أهداف الدرس',
  goalsNote: 'بيتعلّم على الهدف لما تجاوب السؤال اللي بيقيسه.',
  conversation: 'المحادثة',
  yourAnswer: 'إجابتك: {answer}',
  dontKnow: 'معرفتش',
  correct: '✓ مظبوطة',
  notCorrect: '✗ لسه مش مظبوطة',
  question: 'سؤال',
  modelAnswer: 'الإجابة النموذجية',
  tryYourself: 'جرّب بنفسك',
  hint: 'تلميح',
  hintRequest: 'محتاج تلميح للسؤال ده',
  showSolution: 'معرفتش، وريني الحل',
  skip: 'فوّت',
  choices: 'الاختيارات',
  /** One character per choice key, in order (another language may use "ABCDEFGH"). */
  choiceLetters: 'أبجدهوزح',
  boardAsk: 'غيّر البورد لحد ما توصل لإجابتك، وبعدين اضغط «ابعت».',
  /** Between the values of a board answer: "Load = 300 N، Material = steel". */
  listSeparator: '، ',
  // Reading lessons: dock
  lessonNavigation: 'التنقل في الدرس',
  previousStep: 'الخطوة اللي فاتت',
  next: 'التالي',
  finishLesson: 'خلّص الدرس',
  autoTurnResume: 'كمّل لوحده',
  autoTurnPause: 'وقّف التقليب',
  hideText: 'إخفاء النص',
  showText: 'إظهار النص',
  answerDock: 'جاوب',
  sendMyAnswer: 'ابعت إجابتي',
  answerField: 'إجابتك',
  answerPlaceholder: 'اكتب حلّك هنا…',
  send: 'ابعت',
  pickAbove: 'اختار إجابة من فوق',
  // Reading lessons: conversation and sheets
  lessonConversation: 'محادثة الدرس',
  minimizeConversation: 'صغّر المحادثة',
  close: 'اقفل',
  quickQuestions: 'أسئلة سريعة',
  suggestSimpler: 'اشرحها بطريقة أبسط',
  suggestExample: 'إديني مثال تاني',
  suggestWhy: 'ليه كده؟',
  typing: 'بيكتب',
  sceneNumber: 'مشهد {number}',
  byVoice: 'بالصوت',
  // Reading lessons: the end
  lessonDone: 'خلّصت الدرس',
  answeredOne: 'جاوبت {answered} من {questions} سؤال',
  answeredMany: 'جاوبت {answered} من {questions} أسئلة',
  goalsMet: 'الأهداف {met} من {goals}',
  nextLesson: 'الدرس الجاي: {title}',
  reviewLesson: 'راجع الدرس من الأول',
};

export type RuntimeText = { [K in keyof typeof RUNTIME_TEXT]: string };

const RuntimeTextContext = createContext<RuntimeText>(RUNTIME_TEXT);

/** The lesson player's texts in the learner's language; missing keys keep the Arabic. */
export function RuntimeTextProvider({
  value,
  children,
}: {
  value?: Partial<RuntimeText>;
  children?: ReactNode;
}) {
  const merged = useMemo(() => {
    const out: RuntimeText = { ...RUNTIME_TEXT };
    for (const [key, text] of Object.entries(value ?? {}))
      if (key in out && typeof text === 'string' && text) out[key as keyof RuntimeText] = text;
    return out;
  }, [value]);
  return createElement(RuntimeTextContext.Provider, { value: merged }, children);
}

export const useRuntimeText = () => useContext(RuntimeTextContext);

type Vars = Record<string, string | number>;
const PLACEHOLDER = /\{(\w+)\}/g;

/** `fill('مشهد {number}', { number: 2 })` → "مشهد 2". An unknown placeholder stays as written. */
export const fill = (text: string, vars: Vars) =>
  text.replace(PLACEHOLDER, (whole, name: string) => (name in vars ? String(vars[name]) : whole));

/** Like `fill`, but a placeholder may be an element (e.g. a `<bdi>` around the learner's words). */
export function fillParts(text: string, parts: Record<string, ReactNode>): ReactNode[] {
  return text
    .split(PLACEHOLDER)
    .map((piece, i) =>
      i % 2 === 0
        ? piece
        : piece in parts
          ? createElement(Fragment, { key: i }, parts[piece])
          : `{${piece}}`,
    );
}
