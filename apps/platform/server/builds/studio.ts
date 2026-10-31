import { database } from '../db/connection';
import type { AuthUser, Env } from '../env';
import { body, HttpError, json } from '../http';
import { createJob, getJob, listJobs } from './jobs';
import { buildInput, MAX_BODY } from './request';
import { createRefine, refineHistory, refineInstruction } from './refine';
import { localeOf } from '../i18n';

// The "make a course" page's API: the signed-in teacher queues a job and watches it.

export async function studioRoute(request: Request, env: Env, user: AuthUser, path: string) {
  const db = database(env);
  if (path === '/api/studio/jobs' && request.method === 'POST')
    return json(await createJob(db, user, buildInput(await body(request, MAX_BODY))), 201);
  if (path === '/api/studio/jobs' && request.method === 'GET')
    return json({ jobs: await listJobs(db, user.id) });
  // The side chat beside a draft: ask for an edit of this lesson, or read the past ones.
  const edit = /^\/api\/studio\/lessons\/([0-9a-f-]{36})\/edits$/.exec(path);
  if (edit && request.method === 'POST')
    return json(
      await createRefine(
        db,
        user,
        edit[1],
        refineInstruction(await body(request, 16384)),
        localeOf(request),
      ),
      201,
    );
  if (edit && request.method === 'GET')
    return json({ edits: await refineHistory(db, user, edit[1]) });
  const m = /^\/api\/studio\/jobs\/([0-9a-f-]{36})$/.exec(path);
  if (m && request.method === 'GET') return json(await getJob(db, user.id, m[1]));
  throw new HttpError(404, 'http.notFound');
}
