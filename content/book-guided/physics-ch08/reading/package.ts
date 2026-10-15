import type { ReadingPackage, ReadingScene } from '@learn/lesson-runtime/core';
import { bookMetadata, bookSections, type BookSection } from '../index';
import { lessonText, passages } from './text';
import { questionArabic } from './questions';

export const BOOK_RENDERER = 'physics-book-ch08-board';
const visual = (section: BookSection, rawSteps: string[]) => ({
  renderer: BOOK_RENDERER,
  params: { sectionId: section.id, page: section.page, rawSteps },
});
const steps = (raw: string[], prefix: string) =>
  raw.map((text, i) => ({
    unitIds: [`${prefix}-U${i + 1}`],
    text: lessonText(text),
    written: true,
  }));

function scene(section: BookSection): ReadingScene {
  const raw = section.question
    ? [
        section.blocks.find((b) => b.startsWith('English restatement:'))!,
        questionArabic[section.id],
      ]
    : passages(section.blocks);
  const value: ReadingScene = {
    id: section.id,
    title: `ص ${section.id === 'P122-C' ? '122–123' : section.page} · ${section.title.replace(/^وP123-A /, '')}`,
    clipId: `${section.id}-teach`,
    visual: visual(section, raw),
    steps: steps(raw, section.id),
  };
  if (section.question) {
    const feedback = passages(section.solution);
    const english = section.blocks.find((b) => b.startsWith('English restatement:'))!;
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
  contentRevision: `book-classroom-v1-${bookMetadata.contentRevision}`,
  title: 'شابتر 8 · شرح مع الكتاب',
  englishTitle: 'Solids and Elasticity — Chapter 8',
  curriculumTitle: 'فيزياء 1 · الميكانيكا والموجات',
  lessonOrder: 8,
  fps: 30,
  dimensions: { landscape: { width: 960, height: 540 }, portrait: { width: 540, height: 960 } },
  scenes: bookSections.flatMap((section) => {
    if (!section.question) return [scene(section)];
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
    intro.visual = visual(section, raw);
    return [intro, scene(section)];
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
      questionIds: ['P130-Q1', 'P131-Q2'],
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
