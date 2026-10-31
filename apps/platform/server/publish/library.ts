import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Db } from '../db/connection';
import {
  courseEnrollments,
  courseProgress,
  publishedCourses,
  publishedLessons,
} from '../db/publish';

// The published courses a learner is in, for the library: each with its lessons and where
// the learner is in them. Withdrawn courses stay out until the teacher publishes again.

export async function myCourses(db: Db, userId: string) {
  const rows = await db
    .select({
      enrollmentId: courseEnrollments.id,
      course: publishedCourses,
    })
    .from(courseEnrollments)
    .innerJoin(publishedCourses, eq(publishedCourses.id, courseEnrollments.courseId))
    .where(and(eq(courseEnrollments.userId, userId), isNull(publishedCourses.withdrawnAt)))
    .orderBy(asc(courseEnrollments.createdAt));
  const courses = [];
  for (const { enrollmentId, course } of rows) {
    const lessons = await db
      .select({
        id: publishedLessons.lessonId,
        title: publishedLessons.title,
        position: publishedLessons.position,
      })
      .from(publishedLessons)
      .where(
        and(
          eq(publishedLessons.courseId, course.id),
          // Students read the public version; the owner and staff may be on a pending one.
          eq(publishedLessons.version, course.publicVersion ?? course.version),
        ),
      )
      .orderBy(asc(publishedLessons.position));
    const progress = await db
      .select({
        lessonId: courseProgress.lessonId,
        completedAt: courseProgress.completedAt,
        updatedAt: courseProgress.updatedAt,
      })
      .from(courseProgress)
      .where(eq(courseProgress.enrollmentId, enrollmentId));
    courses.push({
      id: course.id,
      title: course.title,
      subject: course.subject,
      description: course.description,
      teacher: course.ownerName,
      lessons: lessons.map((l) => {
        const p = progress.find((x) => x.lessonId === l.id);
        return {
          ...l,
          status: p ? (p.completedAt ? 'completed' : 'started') : 'new',
          updatedAt: p?.updatedAt.toISOString() ?? null,
        };
      }),
    });
  }
  return { courses };
}
