import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { ReadingPackage } from '@learn/lesson-runtime/core';
import type { Db } from '../db/connection';
import { authorBoards, authorFeedback, authorLessons, authorRevisions } from '../db/authoring';
import type { CoursePart } from '../db/authoring';
import {
  courseEnrollments,
  publishedCourses,
  publishedLessons,
  type PublishedBoards,
} from '../db/publish';
import { HttpError } from '../http';
import type { Vars } from '../../src/i18n/core';
import { course, courseLessons } from '../authoring/store';
import { FREE, settleVersion, type Price } from './paid';

// Publishing a teacher's draft course to students: the self-check, the copy that students
// read, enrolment, and what each side sees. Drafts stay the owner's; published rows are read
// by anyone with the course's link.

/** Ids inside a published package, so progress and Nova know which course version it is. */
export const publicIds = (courseId: string, lessonId: string, version: number) => ({
  lessonId: `pub:${lessonId}`,
  curriculumId: `pub-course:${courseId}`,
  contentRevision: `pub-${courseId}-v${version}`,
});
export const PUB = /^pub:([0-9a-f-]{36})$/;

/** One line of the self-check, as a key under `server` the reader's language fills in. */
export type Check = { ok: boolean; key: string; vars?: Vars };

/** The teacher-board keys («u:<hash>») a package draws with. */
export const boardKeys = (pkg: ReadingPackage) => [
  ...new Set(
    pkg.scenes
      .flatMap((s) => [s.visual, s.question?.feedback.visual])
      .map((v) => (v?.renderer === 'html-board' ? String(v.params.board ?? '') : ''))
      .filter((k) => k.startsWith('u:')),
  ),
];

/** What stands between a draft and its students: hard checks stop the publish, soft ones warn. */
export async function selfCheck(db: Db, owner: string, courseId: string) {
  const parent = await course(db, owner, courseId);
  const lessons = await courseLessons(db, owner, courseId);
  const checks: Check[] = [];
  const hard = (ok: boolean, key: string, vars?: Vars) => checks.push({ ok, key, vars });
  if (lessons.length) hard(true, 'publish.lessonsReady', { count: lessons.length });
  else hard(false, 'publish.noLessons');
  hard(parent.title.trim().length > 2, 'publish.hasTitle');
  const packages = lessons.length
    ? await db
        .select({ id: authorLessons.id, pkg: authorRevisions.package })
        .from(authorLessons)
        .innerJoin(
          authorRevisions,
          and(
            eq(authorRevisions.lessonId, authorLessons.id),
            eq(authorRevisions.revision, authorLessons.revision),
          ),
        )
        .where(
          and(
            eq(authorLessons.ownerId, owner),
            inArray(
              authorLessons.id,
              lessons.map((l) => l.id),
            ),
          ),
        )
    : [];
  const hashes = new Set(
    packages.flatMap((p) => boardKeys(p.pkg as ReadingPackage).map((k) => k.slice(2))),
  );
  const boards = hashes.size
    ? await db
        .select({
          hash: authorBoards.hash,
          manifest: authorBoards.manifest,
          reports: authorBoards.reports,
        })
        .from(authorBoards)
        .where(and(eq(authorBoards.ownerId, owner), inArray(authorBoards.hash, [...hashes])))
    : [];
  const found = new Set(boards.map((b) => b.hash));
  hard(
    [...hashes].every((h) => found.has(h)),
    'publish.boardsFound',
  );
  const drawing = boards.filter((b) => b.reports.some((r) => r.problems.length));
  const open = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(authorFeedback)
    .where(
      and(
        eq(authorFeedback.ownerId, owner),
        eq(authorFeedback.status, 'open'),
        lessons.length
          ? inArray(
              authorFeedback.lessonId,
              lessons.map((l) => l.id),
            )
          : sql`false`,
      ),
    );
  const warnings: Check[] = [
    {
      ok: drawing.length === 0,
      ...(drawing.length
        ? { key: 'publish.boardProblems', vars: { count: drawing.length } }
        : { key: 'publish.boardsDrawn' }),
    },
    {
      ok: open[0].n === 0,
      ...(open[0].n
        ? { key: 'publish.openNotes', vars: { count: open[0].n } }
        : { key: 'publish.noOpenNotes' }),
    },
  ];
  return {
    ready: checks.every((c) => c.ok),
    checks,
    warnings,
    lessons,
    packages,
    boards: Object.fromEntries(
      boards.map((b) => [`u:${b.hash}`, { hash: b.hash, manifest: b.manifest }]),
    ) as PublishedBoards,
  };
}

/**
 * Publish the draft as the next version: lessons in the order of the course's parts. A free
 * version is public at once; a paid one waits for the platform's review (paid.ts).
 */
export async function publishCourse(
  db: Db,
  owner: { id: string; name: string },
  courseId: string,
  price: Price = FREE,
) {
  const check = await selfCheck(db, owner.id, courseId);
  const failed = check.checks.find((c) => !c.ok);
  if (failed) throw new HttpError(400, failed.key, failed.vars);
  const parent = await course(db, owner.id, courseId);
  const [current] = await db
    .select({ version: publishedCourses.version })
    .from(publishedCourses)
    .where(eq(publishedCourses.id, courseId));
  const version = (current?.version ?? 0) + 1;
  const ordered = orderLessons(
    check.lessons.map((l) => l.id),
    parent.parts,
  );
  const fields = {
    ownerId: owner.id,
    ownerName: owner.name,
    title: parent.title,
    subject: parent.subject,
    description: parent.description,
    language: parent.language,
    parts: parent.parts,
    voice: parent.voice,
    version,
    publishedAt: new Date(),
    withdrawnAt: null,
  };
  await db
    .insert(publishedCourses)
    .values({ id: courseId, ...fields })
    .onConflictDoUpdate({ target: publishedCourses.id, set: fields });
  await db.insert(publishedLessons).values(
    ordered.map((lessonId, i) => {
      const pkg = check.packages.find((p) => p.id === lessonId)!.pkg as ReadingPackage;
      const used = Object.fromEntries(boardKeys(pkg).map((key) => [key, check.boards[key]]));
      return {
        courseId,
        version,
        lessonId,
        position: i + 1,
        title: pkg.title,
        revision: check.lessons.find((l) => l.id === lessonId)!.revision,
        package: { ...pkg, ...publicIds(courseId, lessonId, version), lessonOrder: i + 1 },
        boards: used,
      };
    }),
  );
  const review = await settleVersion(db, courseId, version, price);
  return { courseId, version, lessons: ordered.length, review };
}

/** Lessons in part order; lessons in no part come last in creation order. */
export function orderLessons(ids: string[], parts: CoursePart[]) {
  const placed = parts.flatMap((p) => p.lessonIds).filter((id) => ids.includes(id));
  return [...new Set([...placed, ...ids])];
}

export async function withdrawCourse(db: Db, owner: string, courseId: string) {
  const [row] = await db
    .update(publishedCourses)
    .set({ withdrawnAt: new Date() })
    .where(and(eq(publishedCourses.id, courseId), eq(publishedCourses.ownerId, owner)))
    .returning({ id: publishedCourses.id });
  if (!row) throw new HttpError(404, 'publish.notPublished');
}

/** A published course as anyone with its link sees it; null when withdrawn or unknown. */
export async function publicCourse(db: Db, courseId: string) {
  const [row] = await db
    .select()
    .from(publishedCourses)
    .where(and(eq(publishedCourses.id, courseId), isNull(publishedCourses.withdrawnAt)));
  // A paid course is public from its first approved version.
  if (!row || row.publicVersion === null) return null;
  const lessons = await db
    .select({
      id: publishedLessons.lessonId,
      title: publishedLessons.title,
      position: publishedLessons.position,
      package: publishedLessons.package,
    })
    .from(publishedLessons)
    .where(
      and(eq(publishedLessons.courseId, courseId), eq(publishedLessons.version, row.publicVersion)),
    )
    .orderBy(asc(publishedLessons.position));
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    description: row.description,
    language: row.language,
    teacher: row.ownerName,
    version: row.publicVersion,
    priceCents: row.priceCents,
    currency: row.currency,
    publishedAt: row.publishedAt.toISOString(),
    parts: row.parts,
    lessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      position: l.position,
      goals: (l.package as ReadingPackage).goals,
      scenes: (l.package as ReadingPackage).scenes.length,
    })),
  };
}

/** One lesson of the current version, with the boards it uses. */
export async function publishedLesson(db: Db, courseId: string, lessonId: string) {
  const [row] = await db
    .select({
      package: publishedLessons.package,
      boards: publishedLessons.boards,
      title: publishedLessons.title,
      voice: publishedCourses.voice,
    })
    .from(publishedLessons)
    .innerJoin(publishedCourses, eq(publishedCourses.id, publishedLessons.courseId))
    .where(
      and(
        eq(publishedLessons.courseId, courseId),
        eq(publishedLessons.lessonId, lessonId),
        eq(publishedLessons.version, publishedCourses.publicVersion),
        isNull(publishedCourses.withdrawnAt),
      ),
    );
  if (!row) throw new HttpError(404, 'publish.lessonGone');
  return row;
}

/** The course a published lesson belongs to, from its public lesson id. */
export async function lessonCourse(db: Db, lessonId: string) {
  const [row] = await db
    .select({ courseId: publishedLessons.courseId })
    .from(publishedLessons)
    .innerJoin(publishedCourses, eq(publishedCourses.id, publishedLessons.courseId))
    .where(
      and(
        eq(publishedLessons.lessonId, lessonId),
        eq(publishedLessons.version, publishedCourses.publicVersion),
        isNull(publishedCourses.withdrawnAt),
      ),
    )
    .orderBy(desc(publishedLessons.version));
  if (!row) throw new HttpError(404, 'publish.lessonMissing');
  return row.courseId;
}

export async function enrol(db: Db, userId: string, courseId: string) {
  if (!(await publicCourse(db, courseId))) throw new HttpError(404, 'publish.courseMissing');
  await db.insert(courseEnrollments).values({ userId, courseId }).onConflictDoNothing();
  const [row] = await db
    .select({ id: courseEnrollments.id })
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.courseId, courseId)));
  return row.id;
}
