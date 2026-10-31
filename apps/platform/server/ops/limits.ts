import { lt, sql } from 'drizzle-orm';
import type { Db } from '../db/connection';
import { rateHits } from '../db/ops';
import { HttpError } from '../http';

// Request limits shared by every server instance (docs/operations.md): one row per key and
// time window, counted in the database. A key over its limit gets 429 until the window ends.

export type Limit = { max: number; seconds: number };

/** The limits, in one place. Keys are `<what>:<user id or IP>`. */
export const LIMITS = {
  /** Nova, per learner. */
  'nova.chat': { max: 200, seconds: 3600 },
  'nova.live': { max: 30, seconds: 3600 },
  'nova.quiz': { max: 12, seconds: 3600 },
  'nova.wake': { max: 600, seconds: 3600 },
  /** The connector's MCP calls, per teacher. */
  mcp: { max: 1200, seconds: 3600 },
  /** New AI apps registering with OAuth, per IP. */
  'oauth.register': { max: 20, seconds: 3600 },
  /** Sign-up and sign-in attempts, per IP. */
  'auth.signup': { max: 10, seconds: 3600 },
  'auth.signin': { max: 30, seconds: 600 },
  /** Error reports from browsers, per IP. */
  'errors.report': { max: 30, seconds: 3600 },
} satisfies Record<string, Limit>;
export type LimitName = keyof typeof LIMITS;

/** The caller's IP as Cloudflare reports it ('' in tests and local runs). */
export const ipOf = (request: Request) =>
  request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? '';

/** Count one request for `who` against a limit; 429 when it is over. */
export async function rateLimit(db: Db, name: LimitName, who: string, now = Date.now()) {
  const { max, seconds } = LIMITS[name];
  const windowStart = new Date(Math.floor(now / (seconds * 1000)) * seconds * 1000);
  const [row] = await db
    .insert(rateHits)
    .values({ key: `${name}:${who}`, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateHits.key, rateHits.windowStart],
      set: { count: sql`${rateHits.count} + 1` },
    })
    .returning({ count: rateHits.count });
  // Old windows are no use: about one request in fifty clears those older than a day.
  if (Math.random() < 0.02)
    await db.delete(rateHits).where(lt(rateHits.windowStart, new Date(now - 86400000)));
  if (row.count > max) throw new HttpError(429, 'http.tooMany');
}
