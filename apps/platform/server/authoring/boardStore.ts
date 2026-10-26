import { and, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/connection';
import { authorBoards, type AuthorCheckReport } from '../db/authoring';
import { HttpError } from '../http';
import { checkBoardFiles } from './boardFiles';
import { LessonProblems } from './format';
import { LIMITS, lessonsUsingBoard, updateLesson } from './store';

/**
 * Upload a board. A changed board gets a new hash; every lesson of this owner that uses the
 * board id is saved again as a new revision pointing at it (old revisions keep the old one).
 */
export async function putBoard(db: Db, owner: string, files: unknown) {
  const board = await checkBoardFiles(files);
  const [{ n }] = await db
    .select({ n: sql<number>`count(distinct ${authorBoards.boardId})::int` })
    .from(authorBoards)
    .where(eq(authorBoards.ownerId, owner));
  if (n >= LIMITS.boards) throw new HttpError(429, `at most ${LIMITS.boards} boards`);
  await db
    .insert(authorBoards)
    .values({
      hash: board.hash,
      ownerId: owner,
      boardId: board.manifest.id,
      manifest: board.manifest,
      files: board.files,
      size: board.size,
    })
    .onConflictDoNothing();
  const updated: Array<{ lessonId: string; revision?: number; problems?: string[] }> = [];
  for (const lesson of await lessonsUsingBoard(db, owner, board.manifest.id))
    try {
      const saved = await updateLesson(
        db,
        owner,
        lesson.id,
        lesson.source,
        `board ${board.manifest.id} updated`,
      );
      updated.push({ lessonId: saved.lessonId, revision: saved.revision });
    } catch (error) {
      if (!(error instanceof LessonProblems)) throw error;
      updated.push({ lessonId: lesson.id, problems: error.problems });
    }
  return { boardId: board.manifest.id, hash: board.hash, size: board.size, lessons: updated };
}

/** The newest upload of a board: files to edit, manifest, and preview check reports. */
export async function getBoard(db: Db, owner: string, boardId: string) {
  const [row] = await db
    .select()
    .from(authorBoards)
    .where(and(eq(authorBoards.ownerId, owner), eq(authorBoards.boardId, boardId)))
    .orderBy(desc(authorBoards.createdAt))
    .limit(1);
  if (!row) throw new HttpError(404, 'not found');
  return row;
}

const PROBLEM_KEYS = ['check', 'element', 'detail'] as const;

/** A check the teacher's preview ran on this board; the newest per layout is kept. */
export async function addBoardReport(db: Db, owner: string, hash: string, input: unknown) {
  const r = input as Partial<AuthorCheckReport> | null;
  if (
    !r ||
    (r.layout !== 'landscape' && r.layout !== 'portrait') ||
    !Number.isFinite(r.width) ||
    !Array.isArray(r.problems)
  )
    throw new HttpError(400, 'bad report');
  const report: AuthorCheckReport = {
    checkedAt: new Date().toISOString(),
    layout: r.layout,
    width: Math.round(r.width!),
    problems: r.problems
      .slice(0, 50)
      .map((p) =>
        Object.fromEntries(
          PROBLEM_KEYS.filter((k) => typeof p?.[k] === 'string').map((k) => [
            k,
            String(p[k]).slice(0, 300),
          ]),
        ),
      ) as AuthorCheckReport['problems'],
  };
  const [row] = await db
    .select({ reports: authorBoards.reports })
    .from(authorBoards)
    .where(and(eq(authorBoards.hash, hash), eq(authorBoards.ownerId, owner)));
  if (!row) throw new HttpError(404, 'not found');
  const reports = [report, ...row.reports.filter((x) => x.layout !== report.layout)];
  await db
    .update(authorBoards)
    .set({ reports })
    .where(and(eq(authorBoards.hash, hash), eq(authorBoards.ownerId, owner)));
  return report;
}

/** Files of a board by content hash, for the board origin; any owner's copy is the same. */
export async function boardFilesByHash(db: Db, hash: string) {
  if (!/^[a-f0-9]{64}$/.test(hash)) return null;
  const [row] = await db
    .select({ files: authorBoards.files })
    .from(authorBoards)
    .where(eq(authorBoards.hash, hash))
    .limit(1);
  return row?.files ?? null;
}
