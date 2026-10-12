import registry from '../../../../../content/imported/registry.json';
import type { CatalogLesson, Curriculum, Resume } from './types';

type Goal = { id: string; text: string };
type Part = { title: string; summary: string; lessons: CatalogLesson[] };
const imported = new Map(registry.curricula.map((c) => [c.id, c]));

export const lessonHref = (curriculumId: string, lessonId: string) =>
  `/?lesson=${encodeURIComponent(lessonId)}&curriculum=${encodeURIComponent(curriculumId)}`;
export const open = (lesson: CatalogLesson) => lesson.availability !== 'coming-soon';

/** Goal wording for a lesson, from the imported curriculum (empty for older content). */
export function goalsOf(curriculumId: string, lessonId: string): Goal[] {
  const lesson = imported.get(curriculumId)?.lessons.find((l) => l.id === lessonId);
  return lesson && 'goals' in lesson ? (lesson.goals as Goal[]) : [];
}

/** Lessons grouped into the curriculum's parts; everything else in one part. */
export function partsOf(curriculum: Curriculum): Part[] {
  const parts = imported.get(curriculum.id)?.parts ?? [];
  const placed = new Set(parts.flatMap((p) => p.lessons));
  const grouped = parts
    .map((p) => ({
      title: p.title,
      summary: p.summary,
      lessons: curriculum.lessons.filter((l) => p.lessons.includes(l.id)),
    }))
    .filter((p) => p.lessons.length);
  const rest = curriculum.lessons.filter((l) => !placed.has(l.id));
  return rest.length ? [...grouped, { title: 'الدروس', summary: '', lessons: rest }] : grouped;
}

/** The lesson the learner should open next inside one curriculum. */
export function nextLesson(curriculum: Curriculum, resume?: Resume | null) {
  if (resume?.curriculumId === curriculum.id)
    return curriculum.lessons.find((l) => l.id === resume.lessonId);
  return curriculum.lessons.find((l) => open(l) && l.progress?.status !== 'completed');
}

export function stats(curriculum: Curriculum) {
  const lessons = curriculum.lessons;
  return {
    lessons: lessons.length,
    available: lessons.filter(open).length,
    completed: lessons.filter((l) => l.progress?.status === 'completed').length,
    goalsDone: lessons.reduce((n, l) => n + (l.progress?.goalsDone ?? 0), 0),
    goalsTotal: lessons.reduce(
      (n, l) => n + (l.progress?.goalsTotal || goalsOf(curriculum.id, l.id).length),
      0,
    ),
  };
}
