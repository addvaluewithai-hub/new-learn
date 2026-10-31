import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { ReadingPackage } from '@learn/lesson-runtime/core';
import type { Db } from '../db/connection';
import { publishedCourses, publishedLessons } from '../db/publish';
import { courseReviews, type AiReport } from '../db/money';
import type { AuthUser } from '../env';
import { HttpError } from '../http';

// The platform's review of paid courses (docs/credits.md): staff see the versions waiting,
// read every lesson as students would, can ask the AI for a first pass, and approve or send
// back with notes. Approving makes that version public at its price.

export async function reviewQueue(db: Db) {
  const rows = await db
    .select({
      courseId: courseReviews.courseId,
      version: courseReviews.version,
      priceCents: courseReviews.priceCents,
      currency: courseReviews.currency,
      submittedAt: courseReviews.submittedAt,
      hasAi: courseReviews.aiReport,
      title: publishedCourses.title,
      teacher: publishedCourses.ownerName,
    })
    .from(courseReviews)
    .innerJoin(publishedCourses, eq(publishedCourses.id, courseReviews.courseId))
    .where(eq(courseReviews.status, 'pending'))
    .orderBy(asc(courseReviews.submittedAt));
  return rows.map(({ hasAi, submittedAt, ...r }) => ({
    ...r,
    submittedAt: submittedAt.toISOString(),
    aiDone: Boolean(hasAi),
  }));
}

async function reviewRow(db: Db, courseId: string, version: number) {
  const [row] = await db
    .select()
    .from(courseReviews)
    .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.version, version)));
  if (!row) throw new HttpError(404, 'review.notFound');
  return row;
}

/** One version under review: the course, every lesson in full, the AI pass and the decision. */
export async function reviewDetail(db: Db, courseId: string, version: number) {
  const review = await reviewRow(db, courseId, version);
  const [course] = await db
    .select()
    .from(publishedCourses)
    .where(eq(publishedCourses.id, courseId));
  const lessons = await db
    .select({
      id: publishedLessons.lessonId,
      title: publishedLessons.title,
      position: publishedLessons.position,
      package: publishedLessons.package,
    })
    .from(publishedLessons)
    .where(and(eq(publishedLessons.courseId, courseId), eq(publishedLessons.version, version)))
    .orderBy(asc(publishedLessons.position));
  return {
    courseId,
    version,
    title: course.title,
    subject: course.subject,
    description: course.description,
    teacher: course.ownerName,
    language: course.language,
    priceCents: review.priceCents,
    currency: review.currency,
    status: review.status,
    notes: review.notes,
    aiReport: review.aiReport,
    reviewer: review.reviewerName,
    submittedAt: review.submittedAt.toISOString(),
    decidedAt: review.decidedAt?.toISOString() ?? null,
    lessons: lessons.map((l) => ({ ...l, package: l.package as ReadingPackage })),
  };
}

export async function saveAiReport(db: Db, courseId: string, version: number, report: AiReport) {
  await reviewRow(db, courseId, version);
  await db
    .update(courseReviews)
    .set({ aiReport: report })
    .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.version, version)));
}

/** Approve (the version becomes public at its price) or send back with notes. */
export async function decide(
  db: Db,
  staff: AuthUser,
  courseId: string,
  version: number,
  input: { status: 'approved' | 'changes'; notes: string },
) {
  const review = await reviewRow(db, courseId, version);
  if (review.status !== 'pending') throw new HttpError(409, 'review.decided');
  if (input.status === 'changes' && !input.notes.trim())
    throw new HttpError(400, 'review.needNotes');
  await db
    .update(courseReviews)
    .set({
      status: input.status,
      notes: input.notes.trim().slice(0, 4000),
      reviewerId: staff.id,
      reviewerName: staff.name,
      decidedAt: new Date(),
    })
    .where(eq(courseReviews.id, review.id));
  if (input.status === 'approved')
    await db
      .update(publishedCourses)
      .set({
        publicVersion: version,
        priceCents: review.priceCents,
        currency: review.currency,
      })
      .where(eq(publishedCourses.id, courseId));
  return { status: input.status };
}

/** The newest review of each of these courses, for the teacher's workspace. */
export async function latestReviews(db: Db, courseIds: string[]) {
  if (!courseIds.length) return [];
  const rows = await db
    .select()
    .from(courseReviews)
    .where(inArray(courseReviews.courseId, courseIds))
    .orderBy(desc(courseReviews.version));
  const seen = new Set<string>();
  return rows
    .filter((r) => !seen.has(r.courseId) && seen.add(r.courseId))
    .map((r) => ({
      courseId: r.courseId,
      version: r.version,
      status: r.status,
      notes: r.notes,
      priceCents: r.priceCents,
      currency: r.currency,
      decidedAt: r.decidedAt?.toISOString() ?? null,
    }));
}
