import { STATES_QUESTIONS, STATES_ENGLISH_QUESTIONS } from './questions';
import {
  STATES_SCENES,
  STATES_SCRIPT,
  STATES_DIMENSIONS,
  STATES_TEACHING_SCRIPT,
  type StatesManifest,
} from './statesLesson';
import { validateLessonPackage, type LessonPackage } from '@learn/lesson-runtime/core';
import { boardTiming } from './boardTiming';
export const STATES_MANIFEST_URL = '/recordings/chem-gas-states-v3/manifest.json';
const tips: Record<string, string> = {
  S01: 'ابدأ بسؤالين: هل الشكل ثابت؟ وهل الحجم ثابت؟ بعد المقارنة، هنستخدم الجسيمات عشان نفهم السبب.',
  S02: 'المكعب يحتفظ بشكله لما تغيّر الوعاء. الجسيمات تهتز حول مواضعها؛ وجود الحركة لا يعني إن المادة بتتدفق.',
  S03: 'نفس كمية المية في وعاء أوسع يكون سطحها أوطى. الشكل تغيّر، لكن الحجم تقريبًا هو هو.',
  S04: 'السائل والغاز شكلهم مش ثابت. الفرق إن السائل له حجم محدد تقريبًا، بينما الغاز يملأ الحيز المتاح.',
  S05: 'راقب النقط أثناء الضغط: عددها وحجمها ثابتان. المسافات بينها هي اللي بتقل.',
  S06: 'قارن حجمين متساويين: اللي فيه كتلة أكبر كثافته أعلى. هنا بنفهم المقارنة قبل ما نستخدم أي حسابات.',
  S07: 'مائع مش معناها سائل فقط. المية والهوا الاتنين يقدروا يتدفقوا، لكن خصائص الحجم والانضغاط مختلفة.',
  S08: 'التدفق حركة المادة ككل. الانتشار اختلاط الجسيمات بسبب الحركة العشوائية؛ مش كل النقط بتتحرك في اتجاه واحد.',
  S09: 'قارن الترتيب والمسافات والحركة. الفراغ الكبير بين جسيمات الغاز يفسّر قابليته للانضغاط.',
  S11: 'ثبّت كمية الغاز، ثم لاحظ الوعاء: تحت ضغط ثابت يزيد الحجم؛ داخل وعاء صلب ثابت الحجم يزيد الضغط.',
  S10: 'اشرح الشكل والحجم الأول، ثم فسّر انضغاط الغاز بالفراغ بين الجسيمات. استخدم كلماتك، مش حفظ صياغة الشرح.',
};
const glossary = [
  ['Solid', 'صلب'],
  ['Liquid', 'سائل'],
  ['Gas', 'غاز'],
  ['Shape', 'الشكل'],
  ['Volume', 'الحجم'],
  ['Compressibility', 'قابلية الانضغاط'],
  ['Density', 'الكثافة: كتلة لكل وحدة حجم'],
  ['Fluid', 'مائع: مادة تقدر تتدفق'],
  ['Diffusion', 'الانتشار بسبب حركة الجسيمات'],
  ['Particles', 'الجسيمات'],
  ['Thermal expansion', 'التمدد الحراري'],
  ['Identify', 'حدّد'],
  ['Explain why', 'فسّر السبب'],
];

export function createStatesPackage(manifest: StatesManifest): LessonPackage {
  manifest.beats.forEach(boardTiming);
  const pkg: LessonPackage = {
    schemaVersion: 1,
    delivery: 'recorded',
    lessonId: STATES_SCRIPT.lessonId,
    curriculumId: 'chemistry-gas-laws',
    contentRevision: STATES_SCRIPT.revision,
    recordingVersion: 'chem-gas-states-v3',
    title: 'حالات المادة',
    englishTitle: 'States of Matter',
    curriculumTitle: 'كيمياء الغازات',
    lessonOrder: 1,
    fps: 30,
    dimensions: STATES_DIMENSIONS,
    recordings: [...manifest.beats, ...manifest.feedback],
    scenes: STATES_SCENES.map((scene, i) => {
      const q = STATES_QUESTIONS[scene.id];
      return {
        id: scene.id,
        title: scene.title,
        takeaway: scene.takeaway,
        tip: tips[scene.id],
        script: STATES_TEACHING_SCRIPT[i].script,
        check: STATES_TEACHING_SCRIPT[i].check,
        recordingId: scene.id,
        visual: { renderer: 'states-board-v1', params: { scene } },
        question: q
          ? {
              ...q,
              id: `${STATES_SCRIPT.lessonId}/${scene.id}`,
              english: STATES_ENGLISH_QUESTIONS[scene.id],
              attempt: scene.kind === 'summary' ? 'choice-and-written' : 'choice',
              writtenLabel:
                scene.kind === 'summary'
                  ? 'اكتب تفسيرك بالإنجليزي: الحالة، وسبب سهولة الضغط، وهل السائل يملأ أي وعاء. العربي متاح كبداية.'
                  : undefined,
              writtenPlaceholder: 'It is ... because ...',
              readingVisual: { renderer: 'states-speech-v1', params: {} },
              feedbackVisual: { renderer: 'states-speech-v1', params: {} },
              contextVisual:
                scene.kind === 'summary'
                  ? { renderer: 'particle-question-v1', params: {} }
                  : undefined,
              image:
                scene.kind === 'liquid'
                  ? { file: '/lesson-assets/water-beaker.webp', alt: 'وعاء فيه مية' }
                  : undefined,
            }
          : undefined,
      };
    }),
    glossary: glossary.map(([term, meaning]) => ({ term, meaning })),
    sources: [
      {
        title: 'Equation State 1.pdf',
        locator: 'صفحات 9–10؛ النص منقّح في 6 أكتوبر 2026.',
        availability: 'نسخة الملف الأصلية غير متاحة في هذه المعاينة.',
      },
      {
        title: 'محتوى الدرس الموثق',
        locator: 'states-and-gases',
        availability: 'ملاحظات تأليف مراجَعة',
        url: 'https://github.com/addvaluewithai-hub/learn/blob/docs/chemistry-gas-laws-revised-2026-10-06/course-drafts/courses/chemistry-gas-laws/lessons/states-and-gases.md',
      },
      {
        title: 'مرجع إضافي: OpenStax',
        locator: 'Phases and classification of matter',
        availability: 'مرجع إضافي',
        url: 'https://openstax.org/books/chemistry-2e/pages/1-2-phases-and-classification-of-matter',
      },
    ],
    review: {
      heading: 'من المقارنة… للفهم',
      summary:
        'لو قدرت تشرح الشكل والحجم، وتربط انضغاط الغاز بالفراغ بين الجسيمات، فإنت بنيت الأساس للدرس الجاي.',
    },
    guide: { image: '/lesson-assets/nova.webp', name: 'Nova — نوفا' },
  };
  return validateLessonPackage(
    pkg,
    new Set(['states-board-v1', 'particle-question-v1', 'states-speech-v1']),
  );
}
