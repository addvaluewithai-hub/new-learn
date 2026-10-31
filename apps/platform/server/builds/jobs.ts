import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import type { Db } from '../db/connection';
import { buildFiles, buildJobs, type BuildRequest, type BuildResult } from '../db/builds';
import { authorBoards, authorCourses, authorLessons } from '../db/authoring';
import { HttpError } from '../http';
import type { AuthUser } from '../env';
import type { UploadedFile } from './request';
import { refund, spend } from '../credits/ledger';
import { countUsage } from '../ops/record';

// The queue between the "make a course" page and the builder worker. Jobs belong to the
// teacher who asked; the worker claims one at a time and reports steps and the result.

export const JOB_LIMITS = { perDay: 10, steps: 200, staleMinutes: 45, attempts: 2 };

const view = (row: typeof buildJobs.$inferSelect) => ({
  id: row.id,
  status: row.status,
  topic: row.request.topic,
  choices: row.request.choices,
  steps: row.steps,
  result: row.result,
  error: row.error,
  createdAt: row.createdAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
});

/** Queue a job: one at a time per teacher, and a few a day. */
export async function createJob(
  db: Db,
  user: AuthUser,
  input: { request: BuildRequest; files: UploadedFile[] },
) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await db
    .select({ status: buildJobs.status })
    .from(buildJobs)
    .where(and(eq(buildJobs.ownerId, user.id), gte(buildJobs.createdAt, since)));
  if (recent.some((j) => j.status === 'queued' || j.status === 'running'))
    throw new HttpError(409, 'builds.busy');
  if (recent.length >= JOB_LIMITS.perDay) throw new HttpError(429, 'builds.dailyLimit');
  // The job's id is made here so the charge can name it before the job exists: no credits,
  // no job; a job that fails gives them back (finishJob, claimJob).
  const id = crypto.randomUUID();
  await spend(db, user, 'course.build', id);
  try {
    const [job] = await db
      .insert(buildJobs)
      .values({ id, ownerId: user.id, ownerName: user.name, request: input.request })
      .returning();
    for (const f of input.files) await db.insert(buildFiles).values({ jobId: job.id, ...f });
    await countUsage(db, 'build.job');
    return view(job);
  } catch (error) {
    await refund(db, user.id, id);
    throw error;
  }
}

export async function listJobs(db: Db, ownerId: string) {
  const rows = await db
    .select()
    .from(buildJobs)
    .where(eq(buildJobs.ownerId, ownerId))
    .orderBy(desc(buildJobs.createdAt))
    .limit(10);
  return rows.map(view);
}

export async function getJob(db: Db, ownerId: string, id: string) {
  const [row] = await db
    .select()
    .from(buildJobs)
    .where(and(eq(buildJobs.id, id), eq(buildJobs.ownerId, ownerId)));
  if (!row) throw new HttpError(404, 'builds.jobMissing');
  return { ...view(row), boards: await jobBoards(db, row) };
}

/**
 * The boards the builder has made for this job so far, the newest version of each, in the
 * order they first appeared: the teacher's boards uploaded while the job ran.
 */
async function jobBoards(db: Db, job: typeof buildJobs.$inferSelect) {
  if (!job.startedAt) return [];
  const rows = await db
    .select({
      boardId: authorBoards.boardId,
      hash: authorBoards.hash,
      manifest: authorBoards.manifest,
    })
    .from(authorBoards)
    .where(
      and(
        eq(authorBoards.ownerId, job.ownerId),
        gte(authorBoards.createdAt, job.startedAt),
        ...(job.finishedAt ? [lte(authorBoards.createdAt, job.finishedAt)] : []),
      ),
    )
    .orderBy(asc(authorBoards.createdAt));
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) latest.set(row.boardId, row);
  return [...latest.values()].map((b) => ({ ...b, title: b.manifest.title }));
}

/**
 * The worker takes the oldest queued job. A job left running past its time (the worker
 * died) goes back to the queue once, then fails.
 */
export async function claimJob(db: Db) {
  const stale = sql`now() - make_interval(mins => ${JOB_LIMITS.staleMinutes})`;
  const stuck = await db
    .update(buildJobs)
    .set({
      status: sql`case when ${buildJobs.attempts} >= ${JOB_LIMITS.attempts} then 'failed' else 'queued' end`,
      error: sql`case when ${buildJobs.attempts} >= ${JOB_LIMITS.attempts} then 'step:failed' else ${buildJobs.error} end`,
      finishedAt: sql`case when ${buildJobs.attempts} >= ${JOB_LIMITS.attempts} then now() else null end`,
    })
    .where(and(eq(buildJobs.status, 'running'), sql`${buildJobs.startedAt} < ${stale}`))
    .returning({ id: buildJobs.id, ownerId: buildJobs.ownerId, status: buildJobs.status });
  for (const gone of stuck.filter((j) => j.status === 'failed'))
    await refund(db, gone.ownerId, gone.id);
  const [job] = await db
    .update(buildJobs)
    .set({ status: 'running', startedAt: new Date(), attempts: sql`${buildJobs.attempts} + 1` })
    .where(
      sql`${buildJobs.id} = (select id from learn_app.build_jobs where status = 'queued' order by created_at limit 1 for update skip locked)`,
    )
    .returning();
  if (!job) return null;
  const files = await db
    .select({
      id: buildFiles.id,
      name: buildFiles.name,
      mime: buildFiles.mime,
      size: buildFiles.size,
    })
    .from(buildFiles)
    .where(eq(buildFiles.jobId, job.id))
    .orderBy(asc(buildFiles.name));
  return { job, files };
}

async function running(db: Db, id: string) {
  const [job] = await db.select().from(buildJobs).where(eq(buildJobs.id, id));
  if (!job) throw HttpError.plain(404, 'Unknown job.');
  if (job.status !== 'running') throw HttpError.plain(409, 'The job is not running.');
  return job;
}

export async function jobFile(db: Db, jobId: string, fileId: string) {
  await running(db, jobId);
  const [file] = await db
    .select()
    .from(buildFiles)
    .where(and(eq(buildFiles.id, fileId), eq(buildFiles.jobId, jobId)));
  if (!file) throw HttpError.plain(404, 'Unknown file.');
  return file;
}

/** One line of what the builder is doing now, for the teacher's progress screen. */
export async function addStep(db: Db, jobId: string, title: string) {
  const job = await running(db, jobId);
  const clean = title.replace(/\s+/g, ' ').trim().slice(0, 120);
  if (!clean || job.steps.length >= JOB_LIMITS.steps) return;
  await db
    .update(buildJobs)
    .set({ steps: [...job.steps, { at: new Date().toISOString(), title: clean }] })
    .where(eq(buildJobs.id, jobId));
}

/**
 * The worker is done: the course it made is the teacher's newest one since the job began.
 * The error is the worker's own words or a `step:<id>` line (build.steps), which the page
 * shows in the teacher's language, like the steps.
 */
export async function finishJob(db: Db, jobId: string, input: { ok: boolean; message: string }) {
  const job = await running(db, jobId);
  const [course] = await db
    .select({ id: authorCourses.id })
    .from(authorCourses)
    .where(
      and(eq(authorCourses.ownerId, job.ownerId), gte(authorCourses.createdAt, job.startedAt!)),
    )
    .orderBy(desc(authorCourses.createdAt))
    .limit(1);
  const lessons = course
    ? await db
        .select({ id: authorLessons.id })
        .from(authorLessons)
        .where(inArray(authorLessons.courseId, [course.id]))
        .orderBy(asc(authorLessons.createdAt))
        .limit(1)
    : [];
  // The page shows the message as plain text: a markdown link keeps only its words.
  const message = input.message
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim()
    .slice(0, 600);
  const made = Boolean(course && lessons.length);
  const result: BuildResult = { courseId: course?.id, lessonId: lessons[0]?.id, message };
  await db
    .update(buildJobs)
    .set({
      status: input.ok && made ? 'done' : 'failed',
      result,
      error: !input.ok ? message || 'step:failed' : made ? '' : 'step:noLesson',
      finishedAt: new Date(),
    })
    .where(eq(buildJobs.id, jobId));
  if (!(input.ok && made)) await refund(db, job.ownerId, jobId);
  return { status: input.ok && made ? 'done' : 'failed', ...result };
}
