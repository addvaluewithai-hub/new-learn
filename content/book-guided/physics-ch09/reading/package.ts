import type { ReadingPackage, ReadingScene } from '@learn/lesson-runtime/core';
import { bookParts, type BookPart } from '../index';
import metadata from '../metadata.json';
import waveChecks from './wave-checks.json';
import soundChecks from './sound-checks.json';
import effectsChecks from './effects-checks.json';
import { checkpointScene } from '../../physics-ch08/reading/checkpoints';
import { plainMath } from '../../physics-ch08/reading/text';
export const BOOK_RENDERER = 'physics-book-ch09-board';
export const checkpoints = [...waveChecks, ...soundChecks, ...effectsChecks];
// These scripts already use English scientific names; do not run a translation dictionary.
export const spoken = (text: string) =>
  text.replace(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g, (_, a, b) => `$${plainMath(a ?? b)}$`);
const steps = (raw: string[], id: string) =>
  raw.map((text, i) => ({ unitIds: [`${id}-U${i + 1}`], text: spoken(text), written: true }));
const visual = (part: BookPart, rawSteps: string[], sourceStepCount = 0) => ({
  renderer: BOOK_RENDERER,
  params: {
    sectionId: part.id,
    page: part.page,
    rawSteps,
    sourceStepCount,
    sourceIndices: rawSteps.map((_, i) =>
      Math.min(
        part.quotes.length - 1,
        i < sourceStepCount
          ? i
          : Math.floor(
              ((i - sourceStepCount) * part.quotes.length) /
                Math.max(1, rawSteps.length - sourceStepCount),
            ),
      ),
    ),
  },
});
function scene(part: BookPart): ReadingScene {
  const source = [...part.quotes, ...(part.formula ? [plainMath(part.formula)] : [])];
  const raw = [...source, ...(part.question ? [part.question.arabic] : part.explanation)];
  const value: ReadingScene = {
    id: part.id,
    title: `ص ${part.page} · ${part.title}`,
    clipId: `${part.id}-teach`,
    visual: visual(part, raw, source.length),
    steps: steps(raw, part.id),
  };
  if (part.question) {
    value.question = {
      id: part.id,
      english: part.quotes.join(' '),
      arabic: part.question.arabic,
      attempt: 'written',
      options: [],
      answer: {
        english: part.question.answer,
        arabic: part.question.solution.map(spoken).join('\n\n'),
      },
      feedback: {
        clipId: `${part.id}-solution`,
        visual: visual(part, part.question.solution),
        steps: steps(part.question.solution, `${part.id}-solution`),
      },
    };
  }
  return value;
}
/** Source-first, teacher-led reading using the existing board, questions and live agent. */
export const readingLesson: ReadingPackage = {
  schemaVersion: 1,
  delivery: 'reading',
  lessonId: 'phys1-book-guided-ch09',
  curriculumId: 'physics-1-mechanics-waves',
  contentRevision: metadata.contentRevision,
  title: 'شابتر 9 · شرح مع الكتاب',
  englishTitle: 'Sound Waves — Chapter 9',
  curriculumTitle: 'فيزياء 1 · الميكانيكا والموجات',
  lessonOrder: 9,
  fps: 30,
  dimensions: { landscape: { width: 960, height: 540 }, portrait: { width: 540, height: 960 } },
  scenes: bookParts.flatMap((part) => {
    const check = checkpoints.find((c) => c.after === part.id);
    return [scene(part), ...(check ? [checkpointScene(check, BOOK_RENDERER, part.page)] : [])];
  }),
  glossary: [
    {
      term: 'Amplitude',
      meaning: 'أقصى إزاحة عن موضع الاتزان؛ وPressure amplitude أقصى تغير في الضغط.',
    },
    { term: 'Wavelength', meaning: 'المسافة بين أقرب نقطتين متساويتين في الطور.' },
    { term: 'Frequency', meaning: 'عدد الدورات في الثانية، بوحدة Hertz.' },
    {
      term: 'Intensity',
      meaning: 'متوسط الطاقة العابرة في وحدة الزمن لكل مساحة عمودية على الانتشار.',
    },
    { term: 'Sound level', meaning: 'مقياس لوغاريتمي بوحدة dB نسبةً إلى I₀ = 10⁻¹² W/m².' },
    { term: 'Infrasound', meaning: 'أقل من نحو 20 Hz؛ مدى 20–200 Hz المطبوع خطأ.' },
    { term: 'Ultrasound', meaning: 'أعلى من نحو 20 kHz؛ 100 kHz ليس حدًا أعلى عامًا.' },
    {
      term: 'Doppler effect',
      meaning: 'تغير التردد المستقبَل بسبب حركة المصدر أو المستمع بالنسبة للوسط.',
    },
  ],
  goals: [
    {
      id: 'waves',
      text: 'تربط خواص الموجة بحركة الجسيمات والضغط وIntensity.',
      sceneIds: bookParts.filter((p) => p.page <= 137).map((p) => p.id),
      questionIds: ['P137-B-check', 'P145-Q5'],
    },
    {
      id: 'sound-level',
      text: 'تحسب Intensity وSound level وتجمع المصادر وتفسّر أثر المسافة.',
      sceneIds: bookParts.filter((p) => p.page >= 138 && p.page <= 141).map((p) => p.id),
      questionIds: ['P139-Q1', 'P140-Q2', 'P140-Q3', 'P141-Q4'],
    },
    {
      id: 'wave-properties',
      text: 'تميّز Reflection وRefraction وInterference وDiffraction.',
      sceneIds: bookParts.filter((p) => p.page >= 142 && p.page <= 144).map((p) => p.id),
      questionIds: ['P142-B-check', 'P143-B-check', 'P143-C-check', 'P144-C-check'],
    },
    {
      id: 'doppler',
      text: 'تختار إشارات Doppler وتحسب تأثير الجسم العاكس على مرحلتين.',
      sceneIds: bookParts.filter((p) => p.page >= 146).map((p) => p.id),
      questionIds: ['P148-Q6', 'P149-Q7'],
    },
  ],
};
