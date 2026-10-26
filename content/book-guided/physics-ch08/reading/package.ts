import type { ReadingPackage, ReadingScene } from '@learn/lesson-runtime/core';
import { bookMetadata, bookSections, type BookSection } from '../index';
import { lessonText, passages, plainMath } from './text';
import { questionArabic } from './questions';
import { bookSource } from '../board/source';
import { checkpoints, checkpointScene } from './checkpoints';
import { spokenSection } from './script';
import { youngsLab } from './lab';

export const BOOK_RENDERER = 'physics-book-ch08-board';
const visual = (section: BookSection, rawSteps: string[]) => ({
  renderer: BOOK_RENDERER,
  params: { sectionId: section.id.replace(/-intro$/, ''), page: section.page, rawSteps },
});
const steps = (raw: string[], prefix: string) =>
  raw.map((text, i) => ({
    unitIds: [`${prefix}-U${i + 1}`],
    text: lessonText(text),
    written: true,
  }));

function scene(section: BookSection): ReadingScene {
  let raw = section.question
    ? [bookSource[section.id].quotes.join(' '), questionArabic[section.id]]
    : passages(section.blocks);
  const sourceId = section.id.replace(/-intro$/, '');
  const source = bookSource[sourceId];
  const quotes = !section.question ? source?.quotes : undefined;
  const readings = quotes
    ? [...quotes, ...(source.formula ? [plainMath(source.formula)] : [])]
    : [];
  const sourceStepCount = readings.length;
  const sourceIndices = quotes
    ? [
        ...readings.map((_, i) => Math.min(i, quotes.length - 1)),
        ...raw.map((_, i) =>
          Math.min(quotes.length - 1, Math.floor((i * quotes.length) / raw.length)),
        ),
      ]
    : [];
  // Read the whole short book portion before explaining any of it.
  if (quotes) raw = [...readings, ...raw];
  const value: ReadingScene = {
    id: section.id,
    title: `ص ${section.id === 'P122-C' ? '122–123' : section.page} · ${section.title.replace(/^وP123-A /, '')}`,
    clipId: `${section.id}-teach`,
    visual: {
      ...visual(section, raw),
      params: { ...visual(section, raw).params, sourceIndices, sourceStepCount },
    },
    steps: steps(raw, section.id),
  };
  if (section.question) {
    const feedback = passages(
      section.solution.filter((b) => !b.startsWith('English model answer:')),
    );
    const english = bookSource[section.id].quotes.join(' ');
    const englishAnswer = section.solution.find((b) => b.startsWith('English model answer:'))!;
    value.question = {
      id: section.id,
      english: lessonText(english),
      arabic: lessonText(questionArabic[section.id]),
      attempt: 'written',
      options: [],
      answer: {
        english: lessonText(englishAnswer),
        arabic: section.solution
          .filter((b) => b !== englishAnswer)
          .map(lessonText)
          .join('\n\n'),
      },
      feedback: {
        clipId: `${section.id}-solution`,
        steps: steps(feedback, `${section.id}-solution`),
        visual: visual(section, feedback),
      },
    };
  }
  return value;
}

/** One book chapter, in book order, in the existing ReadingLesson/Nova contract. */
export const readingLesson: ReadingPackage = {
  schemaVersion: 1,
  delivery: 'reading',
  lessonId: 'phys1-book-guided-ch08',
  curriculumId: 'physics-1-mechanics-waves',
  contentRevision: `book-classroom-v4-${bookMetadata.contentRevision}`,
  title: 'شابتر 8 · شرح مع الكتاب',
  englishTitle: 'Solids and Elasticity — Chapter 8',
  curriculumTitle: 'فيزياء 1 · الميكانيكا والموجات',
  lessonOrder: 8,
  fps: 30,
  dimensions: { landscape: { width: 960, height: 540 }, portrait: { width: 540, height: 960 } },
  scenes: bookSections.map(spokenSection).flatMap((section) => {
    const check = checkpoints.find((c) => c.after === section.id);
    const checks = check ? [checkpointScene(check, BOOK_RENDERER, section.page)] : [];
    // The live board right after the book derives ΔL = F·L₀/(A·Y).
    if (section.id === 'P127-C') return [scene(section), youngsLab, ...checks];
    if (!section.question) return [scene(section), ...checks];
    const raw = passages(
      section.blocks.filter(
        (b) => !b.startsWith('English restatement:') && !b.startsWith('**محاولة قبل الحل:'),
      ),
    );
    const intro = scene({
      ...section,
      id: `${section.id}-intro`,
      title: `قبل ${section.title}`,
      question: false,
      blocks: raw,
    });
    return [intro, scene(section), ...checks];
  }),
  glossary: [
    { term: 'Stress', meaning: 'الإجهاد: القوة على مساحة المقطع المناسبة.' },
    { term: 'Strain', meaning: 'الانفعال: تشوّه نسبي بلا وحدة.' },
    {
      term: 'Young’s modulus',
      meaning: 'معامل يونج: الإجهاد المحوري على الانفعال الطولي في المدى الخطي.',
    },
    { term: 'Shear modulus', meaning: 'معامل القص: إجهاد القص على انفعال القص في النموذج الخطي.' },
    {
      term: 'Bulk modulus',
      meaning: 'معامل الحجم: سالب زيادة الضغط على التغير النسبي الموقّع للحجم.',
    },
  ],
  goals: [
    {
      id: 'axial',
      text: 'تختار قانون التشوّه المحوري وتحدد البيانات الناقصة.',
      sceneIds: bookSections.filter((s) => s.page <= 127).map((s) => s.id),
      questionIds: [youngsLab.id, 'P130-Q1', 'P131-Q2'],
    },
    {
      id: 'shear',
      text: 'تحسب معامل القص من القوة ومساحة الوجه والإزاحة.',
      sceneIds: ['P128-A', 'P128-B'],
      questionIds: ['P132-Q3'],
    },
    {
      id: 'bulk',
      text: 'تحسب تغيّر الحجم وتفسّر إشارته تحت ضغط من كل الجهات.',
      sceneIds: ['P128-C', 'P129-A', 'P129-B'],
      questionIds: ['P133-Q4'],
    },
  ],
};
