import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { ReadingPackage } from '@learn/lesson-runtime/core';
import type { Db } from '../db/connection';
import { authorBoards, authorFeedback, authorLessons, authorRevisions } from '../db/authoring';
import type { FeedbackKind, FeedbackStatus } from '../db/authoring';
import { HttpError } from '../http';
import { getLesson, lessonRow } from './store';

// Teacher notes on one step of a draft (roadmap item 3). The teacher writes them in the
// preview; the AI reads them through the connector, fixes the lesson, and marks them for
// review; the teacher marks them done or opens them again.

const KINDS: FeedbackKind[] = ['text', 'board', 'question', 'translation'];
const STATUSES: FeedbackStatus[] = ['open', 'review', 'done', 'dismissed'];
const PHASES = ['narration', 'attempt', 'feedback'] as const;
const MAX_NOTES = 2000;

export type FeedbackInput = {
  sceneId: string;
  phase: (typeof PHASES)[number];
  step: number;
  kind?: FeedbackKind;
  note: string;
};

/** The text at a position of a package, so a note can be read without opening the lesson. */
export function textAt(pkg: ReadingPackage, sceneId: string, phase: string, step: number) {
  const scene = pkg.scenes.find((s) => s.id === sceneId);
  if (!scene) return null;
  if (phase === 'attempt')
    return scene.question ? scene.question.arabic || scene.question.english : null;
  const steps = phase === 'feedback' ? scene.question?.feedback.steps : scene.steps;
  return steps?.[step]?.text ?? null;
}

export async function addFeedback(db: Db, owner: string, lessonId: string, input: FeedbackInput) {
  const { package: pkg, revision } = await getLesson(db, owner, lessonId);
  const note = typeof input?.note === 'string' ? input.note.trim() : '';
  if (!note || note.length > 2000) throw HttpError.plain(400, 'note: 1-2000 characters');
  if (!PHASES.includes(input.phase) || !Number.isInteger(input.step) || input.step < 0)
    throw HttpError.plain(400, 'bad position');
  if (textAt(pkg, input.sceneId, input.phase, input.step) === null)
    throw HttpError.plain(400, 'that step is not in the lesson');
  const kind = input.kind ?? 'text';
  if (!KINDS.includes(kind)) throw HttpError.plain(400, 'bad kind');
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(authorFeedback)
    .where(eq(authorFeedback.ownerId, owner));
  if (n >= MAX_NOTES) throw HttpError.plain(429, `at most ${MAX_NOTES} notes`);
  const [row] = await db
    .insert(authorFeedback)
    .values({
      lessonId,
      ownerId: owner,
      revision,
      sceneId: input.sceneId,
      phase: input.phase,
      step: input.step,
      kind,
      note,
    })
    .returning();
  return row;
}

/** Notes with the current text at their step, plus the boards' preview check problems. */
export async function listFeedback(
  db: Db,
  owner: string,
  filter: { lessonId?: string; lessonIds?: string[]; status?: FeedbackStatus[] } = {},
) {
  if (filter.lessonId) await lessonRow(db, owner, filter.lessonId);
  const conditions = [eq(authorFeedback.ownerId, owner)];
  if (filter.lessonId) conditions.push(eq(authorFeedback.lessonId, filter.lessonId));
  if (filter.lessonIds)
    conditions.push(
      filter.lessonIds.length ? inArray(authorFeedback.lessonId, filter.lessonIds) : sql`false`,
    );
  if (filter.status?.length) conditions.push(inArray(authorFeedback.status, filter.status));
  const notes = await db
    .select()
    .from(authorFeedback)
    .where(and(...conditions))
    .orderBy(asc(authorFeedback.createdAt))
    .limit(200);
  const lessonIds = [...new Set(notes.map((n) => n.lessonId))];
  const packages = new Map<string, ReadingPackage>();
  if (lessonIds.length) {
    const rows = await db
      .select({ id: authorLessons.id, pkg: authorRevisions.package })
      .from(authorLessons)
      .innerJoin(
        authorRevisions,
        and(
          eq(authorRevisions.lessonId, authorLessons.id),
          eq(authorRevisions.revision, authorLessons.revision),
        ),
      )
      .where(inArray(authorLessons.id, lessonIds));
    for (const r of rows) packages.set(r.id, r.pkg as ReadingPackage);
  }
  return notes.map((n) => ({
    id: n.id,
    lessonId: n.lessonId,
    noteRevision: n.revision,
    position: { sceneId: n.sceneId, phase: n.phase, step: n.step },
    currentText: packages.has(n.lessonId)
      ? textAt(packages.get(n.lessonId)!, n.sceneId, n.phase, n.step)
      : null,
    kind: n.kind,
    note: n.note,
    status: n.status,
    resolution: n.resolution,
    createdAt: n.createdAt,
  }));
}

/** Problems the teacher's preview found on this owner's boards, newest first. */
export async function boardReports(db: Db, owner: string) {
  const rows = await db
    .select({
      boardId: authorBoards.boardId,
      hash: authorBoards.hash,
      reports: authorBoards.reports,
    })
    .from(authorBoards)
    .where(eq(authorBoards.ownerId, owner));
  return rows
    .filter((r) => r.reports.some((x) => x.problems.length))
    .map((r) => ({ boardId: r.boardId, hash: r.hash, reports: r.reports }));
}

export async function setFeedback(
  db: Db,
  owner: string,
  id: string,
  input: { status: FeedbackStatus; resolution?: string },
) {
  if (!STATUSES.includes(input?.status)) throw HttpError.plain(400, 'bad status');
  const [row] = await db
    .update(authorFeedback)
    .set({
      status: input.status,
      ...(input.resolution !== undefined
        ? { resolution: String(input.resolution).slice(0, 2000) }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(authorFeedback.id, id), eq(authorFeedback.ownerId, owner)))
    .returning();
  if (!row) throw HttpError.plain(404, 'not found');
  return row;
}
