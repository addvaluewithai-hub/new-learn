import { and, desc, eq, ilike, isNotNull, isNull, or, sql } from 'drizzle-orm';
import type { Db } from '../db/connection';
import { publishedCourses, publishedLessons, type Listing } from '../db/publish';
import { publicCourse } from '../publish/store';
import { courseReviews } from '../db/money';
import { HttpError } from '../http';
import { isGrade } from '../../src/features/market/grades';
import type { ReadingPackage } from '@learn/lesson-runtime/core';

// The marketplace (docs/marketplace.md, M1): teachers ask to list a published course; staff
// review a free one first (with the AI's accuracy pass, X7), while a paid one lists with its
// approved version, since every paid version is reviewed before sale anyway. Anyone signed in
// browses the listed courses with filters.

async function owned(db: Db, owner: string, courseId: string) {
  const [row] = await db
    .select()
    .from(publishedCourses)
    .where(and(eq(publishedCourses.id, courseId), eq(publishedCourses.ownerId, owner)));
  if (!row || row.withdrawnAt) throw new HttpError(404, 'publish.notPublished');
  return row;
}

/** Reviews the teacher's own steps closed (a newer version, or unlisting), not staff. */
const CLOSED_BY_TEACHER = ['superseded', 'unlisted'];

/** A review is waiting for this version: the newest replaces an older one still waiting. */
export async function openListingReview(db: Db, courseId: string, version: number) {
  await db
    .update(courseReviews)
    .set({ status: 'changes', notes: 'superseded', decidedAt: new Date() })
    .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.status, 'pending')));
  await db
    .insert(courseReviews)
    .values({ courseId, version, priceCents: 0, currency: 'USD' })
    .onConflictDoNothing();
}

/** The teacher asks to list the course (with its grade), or takes it out of the catalog. */
export async function setListing(
  db: Db,
  owner: string,
  courseId: string,
  input: { list: boolean; grade?: unknown },
) {
  const row = await owned(db, owner, courseId);
  if (!input.list) {
    await db
      .update(publishedCourses)
      .set({ listing: 'private' })
      .where(eq(publishedCourses.id, courseId));
    // A free version waiting only to be listed leaves the queue.
    await db
      .update(courseReviews)
      .set({ status: 'changes', notes: 'unlisted', decidedAt: new Date() })
      .where(
        and(
          eq(courseReviews.courseId, courseId),
          eq(courseReviews.status, 'pending'),
          eq(courseReviews.priceCents, 0),
        ),
      );
    return { listing: 'private' as const };
  }
  if (input.grade !== undefined && input.grade !== '' && !isGrade(input.grade))
    throw new HttpError(400, 'market.badGrade');
  const grade = isGrade(input.grade) ? input.grade : row.grade;
  let listing: Listing = 'requested';
  if (row.priceCents > 0 && row.publicVersion !== null) {
    // Paid: its public version was reviewed before sale.
    listing = 'listed';
  } else {
    // Free (or a paid version still in review): the newest version's review decides.
    const [review] = await db
      .select({ status: courseReviews.status, notes: courseReviews.notes })
      .from(courseReviews)
      .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.version, row.version)));
    if (review?.status === 'approved') listing = 'listed';
    else if (review?.status === 'changes' && !CLOSED_BY_TEACHER.includes(review.notes))
      // Staff sent this version back: the teacher fixes it and publishes a new version.
      throw new HttpError(409, 'market.fixFirst');
    else if (!review) await openListingReview(db, courseId, row.version);
    else if (review.status === 'changes')
      await db
        .update(courseReviews)
        .set({ status: 'pending', notes: '', decidedAt: null, submittedAt: new Date() })
        .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.version, row.version)));
  }
  await db
    .update(publishedCourses)
    .set({ listing, grade })
    .where(eq(publishedCourses.id, courseId));
  return { listing };
}

/** After a staff decision: an approved version lists the course, a refused free one unlists. */
export async function afterDecision(
  db: Db,
  courseId: string,
  review: { priceCents: number },
  status: 'approved' | 'changes',
) {
  const [row] = await db
    .select({ listing: publishedCourses.listing })
    .from(publishedCourses)
    .where(eq(publishedCourses.id, courseId));
  if (row?.listing !== 'requested') return;
  if (status === 'approved')
    await db
      .update(publishedCourses)
      .set({ listing: 'listed' })
      .where(eq(publishedCourses.id, courseId));
  else if (review.priceCents === 0)
    await db
      .update(publishedCourses)
      .set({ listing: 'private' })
      .where(eq(publishedCourses.id, courseId));
}

export type MarketFilters = { q?: string; subject?: string; language?: string; grade?: string };

/** The listed courses, newest first, filtered; each with its lesson count. */
export async function marketCourses(db: Db, filters: MarketFilters, limit = 60) {
  const q = filters.q?.trim().slice(0, 80);
  const lessons = sql<number>`(select count(*)::int from ${publishedLessons} where ${publishedLessons.courseId} = ${publishedCourses.id} and ${publishedLessons.version} = ${publishedCourses.publicVersion})`;
  const rows = await db
    .select({
      id: publishedCourses.id,
      title: publishedCourses.title,
      subject: publishedCourses.subject,
      description: publishedCourses.description,
      language: publishedCourses.language,
      grade: publishedCourses.grade,
      teacher: publishedCourses.ownerName,
      priceCents: publishedCourses.priceCents,
      currency: publishedCourses.currency,
      publishedAt: publishedCourses.publishedAt,
      lessons,
    })
    .from(publishedCourses)
    .where(
      and(
        eq(publishedCourses.listing, 'listed'),
        isNull(publishedCourses.withdrawnAt),
        isNotNull(publishedCourses.publicVersion),
        filters.subject ? eq(publishedCourses.subject, filters.subject) : undefined,
        filters.language ? eq(publishedCourses.language, filters.language) : undefined,
        filters.grade ? eq(publishedCourses.grade, filters.grade) : undefined,
        q
          ? or(
              ilike(publishedCourses.title, `%${q}%`),
              ilike(publishedCourses.description, `%${q}%`),
              ilike(publishedCourses.subject, `%${q}%`),
              ilike(publishedCourses.ownerName, `%${q}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(publishedCourses.publishedAt))
    .limit(limit);
  return rows.map((r) => ({
    ...r,
    description: r.description.slice(0, 280),
    publishedAt: r.publishedAt.toISOString(),
  }));
}

/** The values the filters offer: what the listed courses actually use. */
export async function marketFacets(db: Db) {
  const rows = await db
    .selectDistinct({
      subject: publishedCourses.subject,
      language: publishedCourses.language,
      grade: publishedCourses.grade,
    })
    .from(publishedCourses)
    .where(and(eq(publishedCourses.listing, 'listed'), isNull(publishedCourses.withdrawnAt)));
  const values = (key: 'subject' | 'language' | 'grade') =>
    [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort();
  return { subjects: values('subject'), languages: values('language'), grades: values('grade') };
}

/** One listed course for its public page, with its lessons and their goals; null otherwise. */
export async function marketCourse(db: Db, courseId: string) {
  const [row] = await db
    .select({ listing: publishedCourses.listing, grade: publishedCourses.grade })
    .from(publishedCourses)
    .where(eq(publishedCourses.id, courseId));
  if (row?.listing !== 'listed') return null;
  const course = await publicCourse(db, courseId);
  if (!course) return null;
  const lessons = await db
    .select({ title: publishedLessons.title, package: publishedLessons.package })
    .from(publishedLessons)
    .where(
      and(eq(publishedLessons.courseId, courseId), eq(publishedLessons.version, course.version)),
    )
    .orderBy(publishedLessons.position);
  return {
    course: {
      id: course.id,
      title: course.title,
      subject: course.subject,
      description: course.description,
      language: course.language,
      grade: row.grade,
      teacher: course.teacher,
      priceCents: course.priceCents,
      currency: course.currency,
      publishedAt: course.publishedAt,
      lessons: lessons.length,
    },
    lessons: lessons.map((l) => ({
      title: l.title,
      goals: (l.package as ReadingPackage).goals ?? [],
    })),
  };
}
