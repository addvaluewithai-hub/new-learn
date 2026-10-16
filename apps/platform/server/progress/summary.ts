import { eq } from 'drizzle-orm';
import { registry } from '../../../../content/registry';
import { database } from '../db/connection';
import { enrollments, progress } from '../db/learners';
import type { AuthUser, Env } from '../env';
import { summarize, type ProgressSummary } from './snapshot';

type Goal = { id: string; text: string; sceneIds: string[]; questionIds: string[] };
const goals = new Map<string, Goal[]>(
  registry.curricula.flatMap((course) =>
    course.lessons.map((lesson) => [lesson.id, 'goals' in lesson ? (lesson.goals as Goal[]) : []]),
  ),
);

/** Per-lesson status for the signed-in learner. Missing progress never breaks the catalog. */
export async function learnerSummaries(env: Env, user: AuthUser) {
  const result = new Map<string, ProgressSummary>();
  let rows;
  try {
    rows = await database(env)
      .select({
        lessonId: enrollments.lessonId,
        state: progress.state,
        completedAt: progress.completedAt,
        updatedAt: progress.updatedAt,
      })
      .from(enrollments)
      .innerJoin(progress, eq(progress.enrollmentId, enrollments.id))
      .where(eq(enrollments.userId, user.id));
  } catch (error) {
    console.warn('Progress unavailable for catalog', error);
    return result;
  }
  const completed = new Set(rows.filter((r) => r.completedAt).map((r) => r.lessonId));
  for (const row of rows.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime()))
    result.set(
      row.lessonId,
      summarize(
        goals.get(row.lessonId) ?? [],
        row.state,
        completed.has(row.lessonId),
        row.updatedAt,
      ),
    );
  return result;
}

type Lesson = { id: string; availability: string; progress?: ProgressSummary };
/** The one obvious next step: the latest unfinished lesson, else the next one after it. */
export function resumeTarget(curricula: Array<{ id: string; lessons: Lesson[] }>) {
  const touched = curricula
    .flatMap((c) => c.lessons.map((l) => ({ curriculumId: c.id, lesson: l })))
    .filter((item) => item.lesson.progress)
    .sort((a, b) => b.lesson.progress!.updatedAt.localeCompare(a.lesson.progress!.updatedAt));
  const latest = touched[0];
  if (!latest) return null;
  if (latest.lesson.progress!.status === 'started')
    return { curriculumId: latest.curriculumId, lessonId: latest.lesson.id, kind: 'continue' };
  const course = curricula.find((c) => c.id === latest.curriculumId)!;
  const next = course.lessons.find(
    (l) => l.availability !== 'coming-soon' && l.progress?.status !== 'completed',
  );
  return next ? { curriculumId: course.id, lessonId: next.id, kind: 'next' } : null;
}
