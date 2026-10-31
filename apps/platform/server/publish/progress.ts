import { and, eq } from 'drizzle-orm';
import type { ReadingPackage } from '@learn/lesson-runtime/core';
import type { Db } from '../db/connection';
import { courseEnrollments, courseProgress, type PublishedBoards } from '../db/publish';
import type { ProgressSnapshot } from '../db/learners';
import { HttpError, json } from '../http';
import { serverText } from '../i18n';
import { SOURCE } from '../../src/i18n/core';
import { mergeSnapshots, readingOutline, validateSnapshot } from '../progress/snapshot';
import { enrol, lessonCourse, publishedLesson } from './store';

// A student's place in a published course's lesson: the same snapshot and optimistic
// revision as lesson_progress, keyed by the course enrolment and the lesson.

async function current(db: Db, enrollmentId: string, lessonId: string) {
  const [row] = await db
    .select()
    .from(courseProgress)
    .where(
      and(eq(courseProgress.enrollmentId, enrollmentId), eq(courseProgress.lessonId, lessonId)),
    );
  return row ?? null;
}

async function place(db: Db, userId: string, lessonId: string) {
  const courseId = await lessonCourse(db, lessonId);
  const lesson = await publishedLesson(db, courseId, lessonId);
  const [enrollment] = await db
    .select({ id: courseEnrollments.id })
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.courseId, courseId)));
  return { courseId, lesson, enrollmentId: enrollment?.id ?? null };
}

export async function readCourseProgress(db: Db, userId: string, lessonId: string) {
  const { lesson, enrollmentId } = await place(db, userId, lessonId);
  const row = enrollmentId ? await current(db, enrollmentId, lessonId) : null;
  return {
    contentRevision: (lesson.package as ReadingPackage).contentRevision,
    revision: row ? row.revision : null,
    state: row?.state ?? null,
    completed: Boolean(row?.completedAt),
  };
}

export async function saveCourseProgress(
  db: Db,
  userId: string,
  lessonId: string,
  input: Record<string, unknown>,
  locale = SOURCE,
) {
  const { courseId, lesson } = await place(db, userId, lessonId);
  const pkg = lesson.package as ReadingPackage;
  if (input.contentRevision !== pkg.contentRevision)
    throw new HttpError(409, 'progress.courseChanged');
  const outline = readingOutline(pkg);
  const incoming = validateSnapshot(outline, input.state);
  const complete = incoming.phase === 'complete' || input.complete === true;
  const expected = input.revision;
  if (expected !== null && !(Number.isInteger(expected) && (expected as number) >= 0))
    throw new HttpError(400, 'progress.invalid');
  // Opening a lesson from its link enrols the student; a saved step is proof they started.
  const enrollmentId = await enrol(db, userId, courseId);
  const now = new Date();
  const conflict = async () =>
    json(
      {
        error: serverText(locale, 'progress.savedElsewhere'),
        current: await readCourseProgress(db, userId, lessonId),
      },
      409,
    );
  if (expected === null) {
    const [created] = await db
      .insert(courseProgress)
      .values({
        enrollmentId,
        lessonId,
        state: incoming,
        revision: 0,
        completedAt: complete ? now : null,
      })
      .onConflictDoNothing()
      .returning({ revision: courseProgress.revision });
    if (!created) return conflict();
    return json({ revision: 0, state: incoming, completed: complete });
  }
  const row = await current(db, enrollmentId, lessonId);
  if (!row || row.revision !== expected) return conflict();
  const state: ProgressSnapshot = mergeSnapshots(outline, row.state, incoming);
  const [updated] = await db
    .update(courseProgress)
    .set({
      state,
      revision: (expected as number) + 1,
      completedAt: row.completedAt ?? (complete ? now : null),
      updatedAt: now,
    })
    .where(
      and(
        eq(courseProgress.enrollmentId, enrollmentId),
        eq(courseProgress.lessonId, lessonId),
        eq(courseProgress.revision, expected as number),
      ),
    )
    .returning({ revision: courseProgress.revision });
  if (!updated) return conflict();
  return json({
    revision: updated.revision,
    state,
    completed: Boolean(row.completedAt) || complete,
  });
}

/** The lesson as the student's page plays it. */
export async function courseLessonView(db: Db, courseId: string, lessonId: string) {
  const row = await publishedLesson(db, courseId, lessonId);
  return { lessonId, package: row.package, boards: row.boards as PublishedBoards };
}
