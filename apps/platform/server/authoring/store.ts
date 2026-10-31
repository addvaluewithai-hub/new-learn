import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { ReadingPackage } from '@learn/lesson-runtime/core';
import type { Db } from '../db/connection';
import { authorBoards, authorCourses, authorLessons, authorRevisions } from '../db/authoring';
import type { CoursePart } from '../db/authoring';
import { HttpError } from '../http';
import { buildPackage, type AuthorLesson, type BoardRef } from './format';

// Teacher drafts. The owner is always the signed-in user or the OAuth token's user; every
// query below is scoped to it, so one teacher can never read or change another's drafts.

export const LIMITS = { courses: 50, lessons: 300, boards: 300 };
const notFound = () => HttpError.plain(404, 'not found');
const FIELDS = { title: 120, subject: 80, description: 600, language: 10 } as const;

/** Course fields within their limits; parts list lessons under short titles. */
function courseInput(input: Record<string, unknown>) {
  for (const [key, max] of Object.entries(FIELDS)) {
    const v = input[key];
    if (v !== undefined && (typeof v !== 'string' || v.length > max))
      throw HttpError.plain(400, `${key}: text up to ${max} characters`);
  }
  const parts = input.parts as CoursePart[] | undefined;
  if (
    parts !== undefined &&
    (!Array.isArray(parts) ||
      parts.length > 50 ||
      !parts.every(
        (p) =>
          typeof p?.title === 'string' &&
          p.title.length <= 120 &&
          Array.isArray(p.lessonIds) &&
          p.lessonIds.every((id) => typeof id === 'string'),
      ))
  )
    throw HttpError.plain(400, 'parts: up to 50 of {title, lessonIds}');
}

export async function listCourses(db: Db, owner: string) {
  const courses = await db
    .select()
    .from(authorCourses)
    .where(eq(authorCourses.ownerId, owner))
    .orderBy(asc(authorCourses.createdAt));
  const lessons = await db
    .select({
      id: authorLessons.id,
      courseId: authorLessons.courseId,
      title: authorLessons.title,
      revision: authorLessons.revision,
    })
    .from(authorLessons)
    .where(eq(authorLessons.ownerId, owner))
    .orderBy(asc(authorLessons.createdAt));
  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    subject: c.subject,
    description: c.description,
    language: c.language,
    parts: c.parts,
    lessons: lessons.filter((l) => l.courseId === c.id),
  }));
}

export async function course(db: Db, owner: string, id: string) {
  const [row] = await db
    .select()
    .from(authorCourses)
    .where(and(eq(authorCourses.id, id), eq(authorCourses.ownerId, owner)));
  if (!row) throw notFound();
  return row;
}

async function count(db: Db, table: typeof authorCourses | typeof authorLessons, owner: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(table)
    .where(eq(table.ownerId, owner));
  return row.n;
}

export async function createCourse(
  db: Db,
  owner: string,
  input: { title: string; subject?: string; description?: string; language?: string },
) {
  courseInput(input);
  if ((await count(db, authorCourses, owner)) >= LIMITS.courses)
    throw HttpError.plain(429, `at most ${LIMITS.courses} courses`);
  const [row] = await db
    .insert(authorCourses)
    .values({
      ownerId: owner,
      title: input.title,
      subject: input.subject ?? '',
      description: input.description ?? '',
      language: input.language ?? 'ar',
    })
    .returning();
  return row;
}

/** Rename a course or regroup its lessons into parts; every lesson must appear exactly once. */
export async function updateCourse(
  db: Db,
  owner: string,
  id: string,
  input: { title?: string; subject?: string; description?: string; parts?: CoursePart[] },
) {
  courseInput(input);
  await course(db, owner, id);
  if (input.parts) {
    const ids = (await courseLessons(db, owner, id)).map((l) => l.id).sort();
    const listed = input.parts.flatMap((p) => p.lessonIds).sort();
    if (JSON.stringify(ids) !== JSON.stringify(listed))
      throw HttpError.plain(400, 'parts must list every lesson of the course exactly once');
  }
  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const [row] = await db
    .update(authorCourses)
    .set({ ...changes, updatedAt: new Date() })
    .where(and(eq(authorCourses.id, id), eq(authorCourses.ownerId, owner)))
    .returning();
  return row;
}

export function courseLessons(db: Db, owner: string, courseId: string) {
  return db
    .select({ id: authorLessons.id, title: authorLessons.title, revision: authorLessons.revision })
    .from(authorLessons)
    .where(and(eq(authorLessons.courseId, courseId), eq(authorLessons.ownerId, owner)))
    .orderBy(asc(authorLessons.createdAt));
}

/** The newest upload of each named board of this owner. */
export async function boardRefs(db: Db, owner: string, ids: string[]) {
  const refs: Record<string, BoardRef & { hash: string }> = {};
  if (!ids.length) return refs;
  const rows = await db
    .select({
      hash: authorBoards.hash,
      boardId: authorBoards.boardId,
      manifest: authorBoards.manifest,
    })
    .from(authorBoards)
    .where(and(eq(authorBoards.ownerId, owner), inArray(authorBoards.boardId, ids)))
    .orderBy(desc(authorBoards.createdAt));
  for (const row of rows)
    refs[row.boardId] ??= { key: `u:${row.hash}`, hash: row.hash, manifest: row.manifest };
  return refs;
}

const boardIds = (lesson: AuthorLesson) => [
  ...new Set((lesson.scenes ?? []).map((s) => s.board).filter((b): b is string => !!b)),
];

/** Position of a lesson in its course (1-based), for the package's lesson order. */
async function order(db: Db, owner: string, courseId: string, lessonId: string) {
  const all = await courseLessons(db, owner, courseId);
  const at = all.findIndex((l) => l.id === lessonId);
  return at < 0 ? all.length + 1 : at + 1;
}

async function save(
  db: Db,
  owner: string,
  lesson: { id: string; courseId: string; revision: number },
  source: AuthorLesson,
  note: string,
) {
  const parent = await course(db, owner, lesson.courseId);
  const revision = lesson.revision + 1;
  const pkg = buildPackage(
    source,
    {
      lessonId: lesson.id,
      courseId: parent.id,
      courseTitle: parent.title,
      order: await order(db, owner, parent.id, lesson.id),
      revision,
    },
    await boardRefs(db, owner, boardIds(source)),
  );
  // The revision row is insert-only; a concurrent save of the same number fails here.
  await db
    .insert(authorRevisions)
    .values({ lessonId: lesson.id, revision, source, package: pkg, note });
  await db
    .update(authorLessons)
    .set({ revision, title: pkg.title, updatedAt: new Date() })
    .where(and(eq(authorLessons.id, lesson.id), eq(authorLessons.revision, lesson.revision)));
  return { lessonId: lesson.id, revision };
}

export async function addLesson(db: Db, owner: string, courseId: string, source: AuthorLesson) {
  await course(db, owner, courseId);
  if ((await count(db, authorLessons, owner)) >= LIMITS.lessons)
    throw HttpError.plain(429, `at most ${LIMITS.lessons} lessons`);
  const id = crypto.randomUUID();
  // Validate before any row exists, so a rejected lesson leaves nothing behind.
  buildPackage(
    source,
    { lessonId: id, courseId, courseTitle: '-', order: 1, revision: 1 },
    await boardRefs(db, owner, boardIds(source)),
  );
  await db.insert(authorLessons).values({ id, courseId, ownerId: owner, title: source.title });
  return save(db, owner, { id, courseId, revision: 0 }, source, 'created');
}

export async function lessonRow(db: Db, owner: string, id: string) {
  const [row] = await db
    .select()
    .from(authorLessons)
    .where(and(eq(authorLessons.id, id), eq(authorLessons.ownerId, owner)));
  if (!row) throw notFound();
  return row;
}

export async function updateLesson(
  db: Db,
  owner: string,
  id: string,
  source: AuthorLesson,
  note = '',
) {
  return save(db, owner, await lessonRow(db, owner, id), source, note);
}

/** A lesson at its newest revision (or a given one): the AI's source and the built package. */
export async function getLesson(db: Db, owner: string, id: string, revision?: number) {
  const lesson = await lessonRow(db, owner, id);
  const [row] = await db
    .select()
    .from(authorRevisions)
    .where(
      and(
        eq(authorRevisions.lessonId, id),
        eq(authorRevisions.revision, revision ?? lesson.revision),
      ),
    );
  if (!row) throw notFound();
  return {
    lesson,
    revision: row.revision,
    source: row.source as AuthorLesson,
    package: row.package as ReadingPackage,
    note: row.note,
  };
}

/** Lessons of this owner whose newest source uses the named board. */
export async function lessonsUsingBoard(db: Db, owner: string, boardId: string) {
  const rows = await db
    .select({ id: authorLessons.id, source: authorRevisions.source })
    .from(authorLessons)
    .innerJoin(
      authorRevisions,
      and(
        eq(authorRevisions.lessonId, authorLessons.id),
        eq(authorRevisions.revision, authorLessons.revision),
      ),
    )
    .where(eq(authorLessons.ownerId, owner));
  return rows
    .filter((r) => boardIds(r.source as AuthorLesson).includes(boardId))
    .map((r) => ({ id: r.id, source: r.source as AuthorLesson }));
}
