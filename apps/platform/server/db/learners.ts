import {
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
  unique,
  foreignKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { appSchema, editions } from './content';
export type ProgressSnapshot = {
  schemaVersion: 1;
  sceneId: string;
  phase: 'narration' | 'attempt' | 'feedback' | 'complete';
  frame: number;
  reachedSceneIds: string[];
  attempts: { id: string; sceneId: string; questionId: string; choice?: number; written: string }[];
};
export const enrollments = appSchema.table(
  'lesson_enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    contentRevision: text('content_revision').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('user_lesson').on(t.userId, t.lessonId),
    foreignKey({
      columns: [t.lessonId, t.contentRevision],
      foreignColumns: [editions.lessonId, editions.contentRevision],
    }),
  ],
);
export const progress = appSchema.table(
  'lesson_progress',
  {
    enrollmentId: uuid('enrollment_id')
      .primaryKey()
      .references(() => enrollments.id),
    state: jsonb('state').$type<ProgressSnapshot>().notNull(),
    revision: integer('revision').notNull().default(0),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check('progress_revision', sql`${t.revision} >= 0`),
    check('progress_schema', sql`(${t.state}->>'schemaVersion' = '1') IS TRUE`),
  ],
);
