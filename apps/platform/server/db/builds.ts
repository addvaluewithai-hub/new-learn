import { text, uuid, timestamp, integer, jsonb, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { appSchema } from './content';

// Course-building jobs (docs/voice-agent.md, Y6–Y7): a teacher asks on the "make a course"
// page, the builder worker on our server claims the job, runs Codex with our /mcp tools as
// that teacher, and reports progress and the course it made. Uploads stay with their job.

export type BuildStatus = 'queued' | 'running' | 'done' | 'failed';
export type BuildRequest = {
  topic: string;
  choices: Record<string, string>;
  webSearch: boolean;
};
export type BuildStep = { at: string; title: string };
export type BuildResult = { courseId?: string; lessonId?: string; message?: string };

export const buildJobs = appSchema.table(
  'build_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: text('owner_id').notNull(),
    ownerName: text('owner_name').notNull(),
    status: text('status').$type<BuildStatus>().notNull().default('queued'),
    request: jsonb('request').$type<BuildRequest>().notNull(),
    steps: jsonb('steps').$type<BuildStep[]>().notNull().default([]),
    result: jsonb('result').$type<BuildResult>().notNull().default({}),
    error: text('error').notNull().default(''),
    attempts: integer('attempts').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => [
    index('build_jobs_owner').on(t.ownerId),
    index('build_jobs_status').on(t.status, t.createdAt),
    check('build_job_status', sql`${t.status} in ('queued','running','done','failed')`),
  ],
);

export const buildFiles = appSchema.table(
  'build_files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => buildJobs.id),
    name: text('name').notNull(),
    mime: text('mime').notNull(),
    size: integer('size').notNull(),
    /** Base64 of the uploaded bytes (small uploads only; object storage comes with F7). */
    data: text('data').notNull(),
  },
  (t) => [index('build_files_job').on(t.jobId)],
);
