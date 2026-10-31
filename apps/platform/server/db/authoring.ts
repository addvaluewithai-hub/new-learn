import {
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { BoardManifest, ReadingPackage } from '@learn/lesson-runtime/core';
import { appSchema } from './content';

// Teacher-made drafts (roadmap item 2), kept apart from reviewed published content: no row
// here is a published edition, and owner_id always comes from the session or OAuth token.

export type CoursePart = { title: string; lessonIds: string[] };
/**
 * The course's own voice and character (docs/voice-agent.md): a Gemini voice name, a pace and
 * a persona line. Null means the learner's own Nova settings apply.
 */
export type CourseVoice = { voice: string; pace: string; persona: string };
export type AuthorCheckProblem = { check: string; element?: string; detail: string };
export type AuthorCheckReport = {
  checkedAt: string;
  layout: 'landscape' | 'portrait';
  width: number;
  problems: AuthorCheckProblem[];
};

export const authorCourses = appSchema.table(
  'author_courses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: text('owner_id').notNull(),
    title: text('title').notNull(),
    subject: text('subject').notNull().default(''),
    description: text('description').notNull().default(''),
    language: text('language').notNull().default('ar'),
    parts: jsonb('parts').$type<CoursePart[]>().notNull().default([]),
    voice: jsonb('voice').$type<CourseVoice>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('author_courses_owner').on(t.ownerId)],
);

export const authorLessons = appSchema.table(
  'author_lessons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => authorCourses.id),
    ownerId: text('owner_id').notNull(),
    title: text('title').notNull(),
    revision: integer('revision').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('author_lessons_owner').on(t.ownerId),
    check('author_lesson_revision', sql`${t.revision} >= 0`),
  ],
);

/** Every saved version of a lesson; never updated, so any revision can be restored. */
export const authorRevisions = appSchema.table(
  'author_lesson_revisions',
  {
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => authorLessons.id),
    revision: integer('revision').notNull(),
    source: jsonb('source').$type<unknown>().notNull(),
    package: jsonb('package').$type<ReadingPackage>().notNull(),
    note: text('note').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.lessonId, t.revision] }),
    check('author_revision_positive', sql`${t.revision} > 0`),
  ],
);

/** Teacher boards, content-addressed: a hash names exactly one set of files, forever. */
export const authorBoards = appSchema.table(
  'author_boards',
  {
    hash: text('hash').notNull(),
    ownerId: text('owner_id').notNull(),
    boardId: text('board_id').notNull(),
    manifest: jsonb('manifest').$type<BoardManifest>().notNull(),
    files: jsonb('files').$type<Record<string, string>>().notNull(),
    size: integer('size').notNull(),
    reports: jsonb('reports').$type<AuthorCheckReport[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    // Identical files uploaded by two teachers are two rows with one hash.
    primaryKey({ columns: [t.hash, t.ownerId] }),
    index('author_boards_owner_board').on(t.ownerId, t.boardId),
    check('author_board_hash', sql`${t.hash} ~ '^[a-f0-9]{64}$'`),
  ],
);

export type FeedbackStatus = 'open' | 'review' | 'done' | 'dismissed';
export type FeedbackKind = 'text' | 'board' | 'question' | 'translation';

/** A teacher's note on one step of a draft; the AI fixes it, the teacher confirms. */
export const authorFeedback = appSchema.table(
  'author_feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => authorLessons.id),
    ownerId: text('owner_id').notNull(),
    revision: integer('revision').notNull(),
    sceneId: text('scene_id').notNull(),
    phase: text('phase').notNull(),
    step: integer('step').notNull(),
    kind: text('kind').$type<FeedbackKind>().notNull().default('text'),
    note: text('note').notNull(),
    status: text('status').$type<FeedbackStatus>().notNull().default('open'),
    resolution: text('resolution').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('author_feedback_lesson').on(t.lessonId),
    check('author_feedback_status', sql`${t.status} in ('open','review','done','dismissed')`),
    check('author_feedback_kind', sql`${t.kind} in ('text','board','question','translation')`),
  ],
);
