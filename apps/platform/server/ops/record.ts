import { desc, gte, sql } from 'drizzle-orm';
import type { Db } from '../db/connection';
import { errorLog, usageDaily } from '../db/ops';

// What the platform keeps about itself (docs/operations.md): errors, and a daily count of the
// things that cost us money. Recording never fails a request: a broken log must not break
// the page that tried to write it.

export type UsageKind =
  | 'nova.chat'
  | 'nova.live'
  | 'nova.quiz'
  | 'nova.wake'
  | 'mcp.call'
  | 'build.job'
  | 'build.refine'
  | 'review.ai'
  | 'auth.signup';

/** Rough cost to us per unit in US cents, for the staff page (not billing). */
export const USAGE_CENTS: Record<UsageKind, number> = {
  'nova.chat': 0.1,
  'nova.live': 15,
  'nova.quiz': 0.5,
  'nova.wake': 0.02,
  'mcp.call': 0,
  'build.job': 250,
  'build.refine': 20,
  'review.ai': 2,
  'auth.signup': 0,
};

const day = (now = new Date()) => now.toISOString().slice(0, 10);

/** Details kept short: each value as text of at most 4000 characters, at most 12 values. */
const trim = (detail: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(detail)
      .slice(0, 12)
      .map(([k, v]) => [
        k.slice(0, 60),
        (typeof v === 'string' ? v : (JSON.stringify(v) ?? '')).slice(0, 4000),
      ]),
  );

export async function countUsage(db: Db, kind: UsageKind, units = 1) {
  try {
    await db
      .insert(usageDaily)
      .values({ day: day(), kind, count: units })
      .onConflictDoUpdate({
        target: [usageDaily.day, usageDaily.kind],
        set: { count: sql`${usageDaily.count} + ${units}` },
      });
  } catch (error) {
    console.error('usage', error);
  }
}

export async function logError(
  db: Db,
  entry: {
    source: 'server' | 'browser';
    place: string;
    status?: number;
    message: string;
    detail?: Record<string, unknown>;
    userId?: string;
  },
) {
  try {
    await db.insert(errorLog).values({
      source: entry.source,
      place: entry.place.slice(0, 300),
      status: entry.status ?? 0,
      message: entry.message.slice(0, 1000),
      detail: trim(entry.detail ?? {}),
      userId: entry.userId ?? '',
    });
  } catch (error) {
    console.error('error log', error);
  }
}

/** The newest errors, for staff. */
export async function recentErrors(db: Db, limit = 100) {
  const rows = await db.select().from(errorLog).orderBy(desc(errorLog.at)).limit(limit);
  return rows.map((r) => ({ ...r, at: r.at.toISOString() }));
}

/** Counts per kind for the last `days` days, newest first, with the rough cost. */
export async function usageSince(db: Db, days = 14) {
  const from = day(new Date(Date.now() - (days - 1) * 86400000));
  const rows = await db
    .select()
    .from(usageDaily)
    .where(gte(usageDaily.day, from))
    .orderBy(desc(usageDaily.day));
  return rows.map((r) => ({
    day: String(r.day),
    kind: r.kind,
    count: r.count,
    cents: Math.round(r.count * (USAGE_CENTS[r.kind as UsageKind] ?? 0) * 100) / 100,
  }));
}
