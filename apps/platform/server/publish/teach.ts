import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '../db/connection';
import { authorCourses, authorFeedback, authorLessons } from '../db/authoring';
import { courseEnrollments, courseProgress, publishedCourses } from '../db/publish';
import { listFeedback } from '../authoring/feedback';
import { course, courseLessons, listCourses, updateCourse } from '../authoring/store';
import { HttpError } from '../http';
import { selfCheck } from './store';

// What the teacher's workspace shows: every course with its draft, its published version,
// its students and its open notes; and the outline and notes of one course.

export async function teacherCourses(db: Db, owner: string) {
  const drafts = await listCourses(db, owner);
  const ids = drafts.map((c) => c.id);
  if (!ids.length) return [];
  const published = await db
    .select({
      id: publishedCourses.id,
      version: publishedCourses.version,
      publishedAt: publishedCourses.publishedAt,
      withdrawnAt: publishedCourses.withdrawnAt,
    })
    .from(publishedCourses)
    .where(inArray(publishedCourses.id, ids));
  const students = await db
    .select({ courseId: courseEnrollments.courseId, n: sql<number>`count(*)::int` })
    .from(courseEnrollments)
    .where(inArray(courseEnrollments.courseId, ids))
    .groupBy(courseEnrollments.courseId);
  const notes = await db
    .select({ courseId: authorLessons.courseId, n: sql<number>`count(*)::int` })
    .from(authorFeedback)
    .innerJoin(authorLessons, eq(authorLessons.id, authorFeedback.lessonId))
    .where(and(eq(authorFeedback.ownerId, owner), eq(authorFeedback.status, 'open')))
    .groupBy(authorLessons.courseId);
  const updated = await db
    .select({ id: authorCourses.id, updatedAt: authorCourses.updatedAt })
    .from(authorCourses)
    .where(inArray(authorCourses.id, ids));
  const lessonsUpdated = await db
    .select({
      courseId: authorLessons.courseId,
      at: sql<string>`max(${authorLessons.updatedAt})`.mapWith((v) => new Date(v)),
    })
    .from(authorLessons)
    .where(eq(authorLessons.ownerId, owner))
    .groupBy(authorLessons.courseId);
  return drafts.map((c) => {
    const pub = published.find((p) => p.id === c.id);
    const changed = [
      updated.find((u) => u.id === c.id)?.updatedAt,
      lessonsUpdated.find((u) => u.courseId === c.id)?.at,
    ]
      .filter((d): d is Date => d instanceof Date)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      ...c,
      openNotes: notes.find((n) => n.courseId === c.id)?.n ?? 0,
      published: pub
        ? {
            version: pub.version,
            publishedAt: pub.publishedAt.toISOString(),
            withdrawn: Boolean(pub.withdrawnAt),
            students: students.find((s) => s.courseId === c.id)?.n ?? 0,
            // Edits since the last publish: the draft is newer than its published version.
            stale: Boolean(changed && pub.publishedAt < changed),
          }
        : null,
    };
  });
}

/** One course's workspace: the outline, the self-check, its notes and its students' progress. */
export async function teacherCourse(db: Db, owner: string, courseId: string) {
  const [all, check] = await Promise.all([
    teacherCourses(db, owner),
    selfCheck(db, owner, courseId),
  ]);
  const row = all.find((c) => c.id === courseId);
  if (!row) throw new HttpError(404, 'الكورس ده مش موجود.');
  const lessonIds = check.lessons.map((l) => l.id);
  const notes = await listFeedback(db, owner, { lessonIds, status: [] });
  const progress = row.published
    ? await db
        .select({
          lessonId: courseProgress.lessonId,
          started: sql<number>`count(*)::int`,
          completed: sql<number>`count(${courseProgress.completedAt})::int`,
        })
        .from(courseProgress)
        .innerJoin(courseEnrollments, eq(courseEnrollments.id, courseProgress.enrollmentId))
        .where(eq(courseEnrollments.courseId, courseId))
        .groupBy(courseProgress.lessonId)
    : [];
  return {
    ...row,
    check: { ready: check.ready, checks: check.checks, warnings: check.warnings },
    notes,
    progress,
  };
}

/** Rename the course or regroup its lessons; parts must list every lesson once. */
export async function saveOutline(
  db: Db,
  owner: string,
  courseId: string,
  input: Record<string, unknown>,
) {
  await course(db, owner, courseId);
  const lessons = await courseLessons(db, owner, courseId);
  const known = new Set(lessons.map((l) => l.id));
  const parts = Array.isArray(input.parts)
    ? (input.parts as Array<{ title: string; lessonIds: string[] }>)
    : undefined;
  if (parts) {
    const listed = parts.flatMap((p) => p.lessonIds ?? []);
    if (listed.some((id) => !known.has(id)) || new Set(listed).size !== listed.length)
      throw new HttpError(400, 'الأجزاء لازم تحتوي كل درس مرة واحدة.');
    // Lessons the editor left out stay in a last part, so none is lost.
    const rest = lessons.filter((l) => !listed.includes(l.id)).map((l) => l.id);
    if (rest.length) parts.push({ title: 'دروس تانية', lessonIds: rest });
  }
  const str = (key: string) =>
    typeof input[key] === 'string' ? (input[key] as string).trim() : undefined;
  return updateCourse(db, owner, courseId, {
    title: str('title'),
    subject: str('subject'),
    description: str('description'),
    parts: parts?.filter((p) => p.lessonIds.length || p.title.trim()),
  });
}
