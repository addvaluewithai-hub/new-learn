import { text, uuid, timestamp, integer, jsonb, index, check, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { appSchema } from './content';
import { publishedCourses } from './publish';

// Credits, paid-course review and course access (docs/credits.md). Credits are an insert-only
// ledger: the balance is the sum, every grant, charge and refund is a row with its reason.

export type CreditKind = 'starter' | 'grant' | 'purchase' | 'spend' | 'refund';

export const creditEntries = appSchema.table(
  'credit_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    /** The account's e-mail when the row was written, so staff can find someone to grant to. */
    userEmail: text('user_email').notNull().default(''),
    /** Positive adds credits, negative spends them. */
    amount: integer('amount').notNull(),
    kind: text('kind').$type<CreditKind>().notNull(),
    /** What it was for: a priced action (`course.build`), a pack, or a staff note. */
    action: text('action').notNull().default(''),
    /** The thing charged or refunded (a build job id, a payment id); one charge per ref. */
    ref: text('ref').notNull().default(''),
    note: text('note').notNull().default(''),
    createdBy: text('created_by').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('credit_entries_user').on(t.userId, t.createdAt),
    index('credit_entries_email').on(t.userEmail),
    check('credit_entry_kind', sql`${t.kind} in ('starter','grant','purchase','spend','refund')`),
    check('credit_entry_sign', sql`(${t.kind} = 'spend') = (${t.amount} < 0)`),
    // A job is charged once and refunded once; every account gets its starter credits once.
    unique('credit_entry_once').on(t.userId, t.kind, t.ref),
  ],
);

export type ReviewStatus = 'pending' | 'approved' | 'changes';
export type AiFinding = {
  severity: 'high' | 'medium' | 'low';
  kind: 'accuracy' | 'clarity' | 'safety' | 'rights' | 'quality';
  lesson: string;
  where: string;
  note: string;
};
export type AiReport = { summary: string; findings: AiFinding[]; at: string };

/** One paid version of a course waiting for, or having had, the platform's review. */
export const courseReviews = appSchema.table(
  'course_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => publishedCourses.id),
    version: integer('version').notNull(),
    priceCents: integer('price_cents').notNull(),
    currency: text('currency').notNull(),
    status: text('status').$type<ReviewStatus>().notNull().default('pending'),
    notes: text('notes').notNull().default(''),
    aiReport: jsonb('ai_report').$type<AiReport>(),
    reviewerId: text('reviewer_id').notNull().default(''),
    reviewerName: text('reviewer_name').notNull().default(''),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
  },
  (t) => [
    unique('course_review_version').on(t.courseId, t.version),
    index('course_reviews_status').on(t.status, t.submittedAt),
    check('course_review_status', sql`${t.status} in ('pending','approved','changes')`),
    check('course_review_price', sql`${t.priceCents} > 0`),
  ],
);

/** Who may study a paid course: a purchase (once payments connect), a gift, or staff. */
export const courseAccess = appSchema.table(
  'course_access',
  {
    userId: text('user_id').notNull(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => publishedCourses.id),
    source: text('source').notNull(),
    /** The payment or the person who gave it. */
    ref: text('ref').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('course_access_user').on(t.userId, t.courseId),
    check('course_access_source', sql`${t.source} in ('purchase','gift','staff')`),
  ],
);
