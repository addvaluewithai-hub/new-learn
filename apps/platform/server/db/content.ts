import {
  pgSchema,
  text,
  integer,
  timestamp,
  primaryKey,
  foreignKey,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
export const appSchema = pgSchema('learn_app');
export const curricula = appSchema.table(
  'curricula',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    subject: text('subject').notNull(),
    visibility: text('visibility')
      .$type<'draft' | 'published' | 'archived'>()
      .notNull()
      .default('draft'),
  },
  (t) => [check('curriculum_visibility', sql`${t.visibility} in ('draft','published','archived')`)],
);
export const lessons = appSchema.table(
  'lessons',
  {
    id: text('id').primaryKey(),
    curriculumId: text('curriculum_id')
      .notNull()
      .references(() => curricula.id),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull().default(''),
  },
  (t) => [
    unique('lesson_position').on(t.curriculumId, t.position),
    check('positive_position', sql`${t.position}>0`),
  ],
);
export const editions = appSchema.table(
  'lesson_editions',
  {
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id),
    contentRevision: text('content_revision').notNull(),
    moduleId: text('module_id').notNull(),
    manifestHash: text('manifest_hash').notNull(),
    runtimeVersion: text('runtime_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.lessonId, t.contentRevision] }),
    check('edition_hash', sql`${t.manifestHash} ~ '^[a-f0-9]{64}$'`),
  ],
);
export const releases = appSchema.table(
  'lesson_releases',
  {
    lessonId: text('lesson_id')
      .primaryKey()
      .references(() => lessons.id),
    contentRevision: text('content_revision').notNull(),
    stage: text('stage').$type<'review' | 'published'>().notNull(),
    releasedAt: timestamp('released_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.lessonId, t.contentRevision],
      foreignColumns: [editions.lessonId, editions.contentRevision],
    }),
    check('release_stage', sql`${t.stage} in ('review','published')`),
  ],
);
