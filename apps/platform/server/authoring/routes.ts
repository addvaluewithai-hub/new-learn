import { and, eq, inArray } from 'drizzle-orm';
import { database } from '../db/connection';
import { authorBoards } from '../db/authoring';
import type { AuthUser, Env } from '../env';
import { body, HttpError, json } from '../http';
import { approve, consentInfo, deny } from '../oauth/consent';
import { addBoardReport } from './boardStore';
import { addFeedback, listFeedback, setFeedback } from './feedback';
import { getLesson, listCourses } from './store';

// The app's side of authoring: the teacher's preview of a draft, notes on its steps, board
// check reports, and the connector's consent screen. The user always comes from the session.

/** A draft as the preview plays it: the package, its boards' manifests, and its notes. */
async function draft(env: Env, user: AuthUser, lessonId: string) {
  const db = database(env);
  const got = await getLesson(db, user.id, lessonId);
  const hashes = got.package.scenes
    .flatMap((s) => [s.visual, s.question?.feedback.visual])
    .map((v) => (v?.renderer === 'html-board' ? String(v.params.board ?? '') : ''))
    .filter((key) => key.startsWith('u:'))
    .map((key) => key.slice(2));
  const boards = hashes.length
    ? await db
        .select({ hash: authorBoards.hash, manifest: authorBoards.manifest })
        .from(authorBoards)
        .where(and(eq(authorBoards.ownerId, user.id), inArray(authorBoards.hash, hashes)))
    : [];
  return {
    lessonId,
    courseId: got.lesson.courseId,
    revision: got.revision,
    package: got.package,
    boards: Object.fromEntries(
      boards.map((b) => [`u:${b.hash}`, { hash: b.hash, manifest: b.manifest }]),
    ),
    feedback: await listFeedback(db, user.id, { lessonId }),
  };
}

const UUID = '([0-9a-f-]{36})';

export async function authoringRoute(request: Request, env: Env, user: AuthUser, path: string) {
  const db = () => database(env);
  const method = request.method;
  if (path === '/api/authoring/courses' && method === 'GET')
    return json(await listCourses(db(), user.id));
  let m = new RegExp(`^/api/authoring/lessons/${UUID}$`).exec(path);
  if (m && method === 'GET') return json(await draft(env, user, m[1]));
  m = new RegExp(`^/api/authoring/lessons/${UUID}/feedback$`).exec(path);
  if (m && method === 'POST')
    return json(await addFeedback(db(), user.id, m[1], (await body(request)) as never), 201);
  m = new RegExp(`^/api/authoring/feedback/${UUID}$`).exec(path);
  if (m && method === 'POST') {
    const input = await body(request);
    // The teacher confirms a fix or opens the note again; the AI sets "review".
    if (input.status !== 'done' && input.status !== 'open')
      throw new HttpError(400, 'الحالة غير صحيحة.');
    return json(await setFeedback(db(), user.id, m[1], { status: input.status }));
  }
  m = /^\/api\/authoring\/boards\/([a-f0-9]{64})\/report$/.exec(path);
  if (m && method === 'POST')
    return json(await addBoardReport(db(), user.id, m[1], await body(request)));
  if (path === '/api/oauth/consent' && method === 'POST')
    return json(await consentInfo(db(), await body(request)));
  if (path === '/api/oauth/approve' && method === 'POST')
    return json(await approve(db(), user, await body(request), new URL(request.url).origin));
  if (path === '/api/oauth/deny' && method === 'POST')
    return json(await deny(db(), await body(request)));
  throw new HttpError(404, 'الصفحة غير موجودة.');
}
