import type { ReadingPackage } from '@learn/lesson-runtime/core';
import release from './release.json';
export const bookCourse = release.curricula[0];
export const bookPins = Object.fromEntries(
  bookCourse.lessons.map((l) => [
    l.moduleId,
    {
      lessonId: l.id,
      contentRevision: l.contentRevision,
      manifestHash: l.manifestHash,
      runtimeVersion: l.runtimeVersion,
      delivery: 'reading' as const,
    },
  ]),
);
/** Distinct published identities keep preview sessions separate from durable enrollments. */
export function publishedLesson(source: ReadingPackage): ReadingPackage {
  const edition = bookCourse.lessons.find((l) => l.previewLessonId === source.lessonId);
  if (!edition || edition.previewRevision !== source.contentRevision)
    throw new Error('Book source revision mismatch');
  return {
    ...source,
    lessonId: edition.id,
    curriculumId: bookCourse.id,
    contentRevision: edition.contentRevision,
    lessonOrder: edition.order,
  };
}
