import { database } from '../db/connection';
import type { AuthUser, Env } from '../env';
import { body, HttpError, json } from '../http';
import { requireStaff } from '../staff';
import { ipOf, rateLimit } from './limits';
import { logError, recentErrors, usageSince } from './record';

// Operations (docs/operations.md): browsers report their errors here (signed in or not), and
// staff read the error log and the daily usage.

/** POST /api/errors from a browser: limited per IP, never answers with an error. */
export async function reportError(request: Request, env: Env, user: AuthUser | null) {
  const db = database(env);
  await rateLimit(db, 'errors.report', ipOf(request) || 'unknown');
  const input = await body(request, 16384);
  await logError(db, {
    source: 'browser',
    place: String(input.url ?? '').slice(0, 300),
    message: String(input.message ?? 'unknown error'),
    detail: { stack: input.stack, agent: request.headers.get('user-agent') ?? '' },
    userId: user?.id,
  });
  return json({ ok: true }, 202);
}

export async function opsRoute(request: Request, env: Env, user: AuthUser, path: string) {
  requireStaff(env, user);
  const db = database(env);
  if (path === '/api/ops/errors' && request.method === 'GET')
    return json({ errors: await recentErrors(db) });
  if (path === '/api/ops/usage' && request.method === 'GET')
    return json({ usage: await usageSince(db) });
  throw new HttpError(404, 'http.notFound');
}
