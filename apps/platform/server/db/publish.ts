import {
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  unique,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { BoardManifest, ReadingPackage } from '@learn/lesson-runtime/core';
import { appSchema } from './content';
import { authorCourses, type CoursePart } from './authoring';
import type { ProgressSnapshot } from './learners';

export type Listing = 'private' | 'requested' | 'listed';

// Teacher courses published to students (roadmap item 5, the publish step). A course keeps
// the draft's id; each publish is a new numbered version whose lessons are copied in full
// (package and board manifests), so later edits to the draft never change what students see.

/** The current state of a published course; the draft stays the place to edit. */
export const publishedCourses = appSchema.table(
  'published_courses',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => authorCourses.id),
    ownerId: text('owner_id').notNull(),
    ownerName: text('owner_name').notNull().default(''),
    title: text('title').notNull(),
    subject: text('subject').notNull().default(''),
    description: text('description').notNull().default(''),
    language: text('language').notNull().default('ar'),
    parts: jsonb('parts').$type<CoursePart[]>().notNull().default([]),
    version: integer('version').notNull().default(1),
    /**
     * The version students see. A free course shows each version as it is published; a paid
     * one shows the last version the platform approved (docs/credits.md), null until then.
     */
    publicVersion: integer('public_version'),
    /** The price of the public version in minor units (cents, piastres); 0 is free. */
    priceCents: integer('price_cents').notNull().default(0),
    currency: text('currency').notNull().default('USD'),
    /**
     * The marketplace (docs/marketplace.md): `private` (share link only), `requested` (waiting
     * for review, or for a paid version's approval) or `listed` (in the public catalog).
     */
    listing: text('listing').$type<Listing>().notNull().default('private'),
    /** The school grade it is for, from GRADES (empty: not said). */
    grade: text('grade').notNull().default(''),
    publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
  },
  (t) => [
    index('published_courses_owner').on(t.ownerId),
    check('published_course_version', sql`${t.version} >= 1`),
    check('published_course_price', sql`${t.priceCents} >= 0`),
    check('published_course_listing', sql`${t.listing} in ('private','requested','listed')`),
    index('published_courses_listed').on(t.listing, t.publishedAt),
  ],
);

export type PublishedBoards = Record<string, { hash: string; manifest: BoardManifest }>;

/** One lesson of one version: everything the student's page needs, frozen. */
export const publishedLessons = appSchema.table(
  'published_lessons',
  {
    courseId: uuid('course_id')
      .notNull()
      .references(() => publishedCourses.id),
    version: integer('version').notNull(),
    /** The draft lesson's id, the same across versions so progress follows the lesson. */
    lessonId: uuid('lesson_id').notNull(),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    revision: integer('revision').notNull(),
    package: jsonb('package').$type<ReadingPackage>().notNull(),
    boards: jsonb('boards').$type<PublishedBoards>().notNull().default({}),
  },
  (t) => [
    primaryKey({ columns: [t.courseId, t.version, t.lessonId] }),
    check('published_lesson_position', sql`${t.position} >= 1`),
  ],
);

export const courseEnrollments = appSchema.table(
  'course_enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => publishedCourses.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique('course_enrollment_user').on(t.userId, t.courseId)],
);

/** Where a student is in one lesson of a course; the same shape as lesson_progress. */
export const courseProgress = appSchema.table(
  'course_progress',
  {
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => courseEnrollments.id),
    lessonId: uuid('lesson_id').notNull(),
    state: jsonb('state').$type<ProgressSnapshot>().notNull(),
    revision: integer('revision').notNull().default(0),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.enrollmentId, t.lessonId] }),
    check('course_progress_revision', sql`${t.revision} >= 0`),
    check('course_progress_schema', sql`(${t.state}->>'schemaVersion' = '1') IS TRUE`),
  ],
);
