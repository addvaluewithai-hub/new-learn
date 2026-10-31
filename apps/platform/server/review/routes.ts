import { database } from '../db/connection';
import type { AuthUser, Env } from '../env';
import { body, HttpError, json } from '../http';
import { requireStaff } from '../staff';
import { aiReview } from './ai';
import { countUsage } from '../ops/record';
import { decide, reviewDetail, reviewQueue, saveAiReport } from './store';

// Staff's review of paid courses (docs/credits.md): the queue, one version in full, the AI's
// first pass, and the decision.

export async function reviewRoute(
  request: Request,
  env: Env,
  user: AuthUser,
  path: string,
  locale: string,
) {
  requireStaff(env, user);
  const db = database(env);
  if (path === '/api/review/queue' && request.method === 'GET')
    return json({ reviews: await reviewQueue(db) });
  const m = /^\/api\/review\/courses\/([0-9a-f-]{36})\/(\d{1,6})(\/ai)?$/.exec(path);
  if (!m) throw new HttpError(404, 'http.notFound');
  const [, courseId, v, ai] = m;
  const version = Number(v);
  if (!ai && request.method === 'GET') return json(await reviewDetail(db, courseId, version));
  if (ai && request.method === 'POST') {
    const detail = await reviewDetail(db, courseId, version);
    const report = await aiReview(env, detail.lessons, locale);
    await countUsage(db, 'review.ai');
    await saveAiReport(db, courseId, version, report);
    return json(report);
  }
  if (!ai && request.method === 'POST') {
    const input = await body(request, 32768);
    if (input.status !== 'approved' && input.status !== 'changes')
      throw new HttpError(400, 'http.badStatus');
    return json(
      await decide(db, user, courseId, version, {
        status: input.status,
        notes: String(input.notes ?? ''),
      }),
    );
  }
  throw new HttpError(405, 'http.notAllowed');
}
