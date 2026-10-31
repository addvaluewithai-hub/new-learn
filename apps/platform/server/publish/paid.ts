import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/connection';
import { publishedCourses } from '../db/publish';
import { courseAccess, courseReviews } from '../db/money';
import type { AuthUser, Env } from '../env';
import { HttpError } from '../http';
import { isStaff } from '../staff';
import { validPrice, type Currency } from '../../src/features/credits/pricing';

// Paid courses (docs/credits.md). A teacher prices a version when publishing it. A free
// version is public at once; a paid one goes to the platform's review and students keep the
// last approved version until the new one is approved. Studying a paid course needs access:
// a purchase (once payments connect), a gift, the owner, or staff.

export type Price = { priceCents: number; currency: Currency };
export const FREE: Price = { priceCents: 0, currency: 'USD' };

/** The price sent with a publish request; missing means free. */
export function parsePrice(input: Record<string, unknown>): Price {
  const priceCents = input.priceCents ?? 0;
  const currency = input.currency ?? 'USD';
  if (!validPrice(priceCents, currency)) throw new HttpError(400, 'publish.badPrice');
  return { priceCents, currency: currency as Currency };
}

/** After a version is written: make it public (free) or open its review (paid). */
export async function settleVersion(db: Db, courseId: string, version: number, price: Price) {
  if (price.priceCents === 0) {
    await db
      .update(publishedCourses)
      .set({ publicVersion: version, priceCents: 0, currency: price.currency })
      .where(eq(publishedCourses.id, courseId));
    return null;
  }
  // An older version still waiting is replaced by this one: reviewers look at the newest.
  await db
    .update(courseReviews)
    .set({ status: 'changes', notes: 'superseded', decidedAt: new Date() })
    .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.status, 'pending')));
  await db.insert(courseReviews).values({ courseId, version, ...price });
  return { status: 'pending' as const, version };
}

/** Whether this user may enrol in and study the course now. */
export async function canStudy(db: Db, env: Env, user: AuthUser, courseId: string) {
  const [row] = await db
    .select({ ownerId: publishedCourses.ownerId, priceCents: publishedCourses.priceCents })
    .from(publishedCourses)
    .where(eq(publishedCourses.id, courseId));
  if (!row) return false;
  if (row.priceCents === 0 || row.ownerId === user.id || isStaff(env, user)) return true;
  const [access] = await db
    .select({ source: courseAccess.source })
    .from(courseAccess)
    .where(and(eq(courseAccess.userId, user.id), eq(courseAccess.courseId, courseId)));
  return Boolean(access);
}

export async function requireStudy(db: Db, env: Env, user: AuthUser, courseId: string) {
  if (!(await canStudy(db, env, user, courseId))) throw new HttpError(402, 'publish.paidCourse');
}
