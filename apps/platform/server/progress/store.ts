import { and, desc, eq } from 'drizzle-orm';
import type { ReadingPackage } from '@learn/lesson-runtime/core';
import manifest from '../../../../content/chemistry/states-of-matter/data/manifest.json';
import { createStatesPackage } from '../../../../content/chemistry/states-of-matter/statesPackage';
import { readingPackages } from '../../../../content/packages';
import { lessonEdition } from '../content';
import { database } from '../db/connection';
import { enrollments, progress, type ProgressSnapshot } from '../db/learners';
import type { AuthUser, Env } from '../env';
import { HttpError, json } from '../http';
import { serverText } from '../i18n';
import { SOURCE } from '../../src/i18n/core';
import {
  carryOver,
  mergeSnapshots,
  readingOutline,
  recordedOutline,
  validateSnapshot,
  type Outline,
} from './snapshot';

async function outlineFor(moduleId: string): Promise<Outline> {
  const reading = readingPackages[moduleId as keyof typeof readingPackages];
  if (reading) return readingOutline((await reading()).default as unknown as ReadingPackage);
  if (moduleId === 'states-of-matter-review') return recordedOutline(createStatesPackage(manifest));
  throw new HttpError(404, 'progress.unavailable');
}

// The user always comes from the session; lesson and edition from the current release.
async function rows(env: Env, user: AuthUser, lessonId: string) {
  return database(env)
    .select({
      enrollmentId: enrollments.id,
      contentRevision: enrollments.contentRevision,
      revision: progress.revision,
      state: progress.state,
      completedAt: progress.completedAt,
    })
    .from(enrollments)
    .leftJoin(progress, eq(progress.enrollmentId, enrollments.id))
    .where(and(eq(enrollments.userId, user.id), eq(enrollments.lessonId, lessonId)))
    .orderBy(desc(enrollments.createdAt));
}

export async function readProgress(env: Env, user: AuthUser, lessonId: string) {
  const edition = await lessonEdition(env, lessonId);
  const all = await rows(env, user, lessonId);
  const current = all.find((row) => row.contentRevision === edition.contentRevision);
  // A newer edition starts from what still fits of the latest older save (saved fresh on
  // the next write), so a content update never sends the learner back to the start.
  const older = current?.state ? null : all.find((row) => row.state);
  const carried = older?.state ? carryOver(await outlineFor(edition.moduleId), older.state) : null;
  return {
    contentRevision: edition.contentRevision,
    revision: current?.state ? current.revision : null,
    state: current?.state ?? carried,
    // Completion survives a newer edition of the lesson.
    completed: all.some((row) => row.completedAt),
  };
}

export async function saveProgress(
  env: Env,
  user: AuthUser,
  lessonId: string,
  input: Record<string, unknown>,
  locale = SOURCE,
) {
  const edition = await lessonEdition(env, lessonId);
  if (input.contentRevision !== edition.contentRevision)
    throw new HttpError(409, 'content.lessonChanged');
  const outline = await outlineFor(edition.moduleId);
  const incoming = validateSnapshot(outline, input.state);
  const complete = incoming.phase === 'complete' || input.complete === true;
  const expected = input.revision;
  if (expected !== null && !(Number.isInteger(expected) && (expected as number) >= 0))
    throw new HttpError(400, 'progress.invalid');
  const db = database(env);
  const conflict = async () =>
    json(
      {
        error: serverText(locale, 'progress.savedElsewhere'),
        current: await readProgress(env, user, lessonId),
      },
      409,
    );
  const now = new Date();
  if (expected === null) {
    await db
      .insert(enrollments)
      .values({ userId: user.id, lessonId, contentRevision: edition.contentRevision })
      .onConflictDoNothing();
    const [enrollment] = (await rows(env, user, lessonId)).filter(
      (row) => row.contentRevision === edition.contentRevision,
    );
    const [created] = await db
      .insert(progress)
      .values({
        enrollmentId: enrollment.enrollmentId,
        state: incoming,
        revision: 0,
        completedAt: complete ? now : null,
      })
      .onConflictDoNothing()
      .returning({ revision: progress.revision });
    if (!created) return conflict();
    return json({ revision: 0, state: incoming, completed: complete });
  }
  const current = (await rows(env, user, lessonId)).find(
    (row) => row.contentRevision === edition.contentRevision,
  );
  if (!current?.state || current.revision !== expected) return conflict();
  const state: ProgressSnapshot = mergeSnapshots(outline, current.state, incoming);
  const [updated] = await db
    .update(progress)
    .set({
      state,
      revision: (expected as number) + 1,
      completedAt: current.completedAt ?? (complete ? now : null),
      updatedAt: now,
    })
    .where(
      and(
        eq(progress.enrollmentId, current.enrollmentId),
        eq(progress.revision, expected as number),
      ),
    )
    .returning({ revision: progress.revision });
  if (!updated) return conflict();
  return json({
    revision: updated.revision,
    state,
    completed: Boolean(current.completedAt) || complete,
  });
}
