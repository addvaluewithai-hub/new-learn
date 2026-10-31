import { database } from '../db/connection';
import type { AuthUser, Env } from '../env';
import { body, HttpError, json } from '../http';
import { setFeedback } from '../authoring/feedback';
import { enrol, publicCourse, publishCourse, withdrawCourse } from './store';
import { courseLessonView } from './progress';
import { saveOutline, teacherCourse, teacherCourses } from './teach';
import { myCourses } from './library';
import { canStudy, parsePrice, requireStudy } from './paid';
import { requireProvider } from '../payments/provider';

// The app's side of published courses: the teacher's workspace (/api/teach) and the
// student's course page, enrolment and lessons (/api/courses). The user is the session's.

const UUID = '([0-9a-f-]{36})';

export async function publishRoute(
  request: Request,
  env: Env,
  user: AuthUser,
  path: string,
  locale: string,
) {
  const db = database(env);
  const method = request.method;
  let m: RegExpExecArray | null;
  if (path === '/api/teach/courses' && method === 'GET')
    return json({ courses: await teacherCourses(db, user.id) });
  if ((m = new RegExp(`^/api/teach/courses/${UUID}$`).exec(path))) {
    if (method === 'GET') return json(await teacherCourse(db, user.id, m[1], locale));
    if (method === 'POST')
      return json(await saveOutline(db, user.id, m[1], await body(request), locale));
  }
  if ((m = new RegExp(`^/api/teach/courses/${UUID}/publish$`).exec(path)) && method === 'POST')
    return json(await publishCourse(db, user, m[1], parsePrice(await body(request))), 201);
  if ((m = new RegExp(`^/api/teach/courses/${UUID}/withdraw$`).exec(path)) && method === 'POST') {
    await withdrawCourse(db, user.id, m[1]);
    return json({ ok: true });
  }
  if ((m = new RegExp(`^/api/teach/notes/${UUID}$`).exec(path)) && method === 'POST') {
    const input = await body(request);
    if (!['done', 'open', 'dismissed'].includes(String(input.status)))
      throw new HttpError(400, 'http.badStatus');
    return json(await setFeedback(db, user.id, m[1], { status: input.status as 'done' }));
  }
  if (path === '/api/courses' && method === 'GET') return json(await myCourses(db, user.id));
  if ((m = new RegExp(`^/api/courses/${UUID}$`).exec(path))) {
    const course = await publicCourse(db, m[1]);
    if (!course) throw new HttpError(404, 'publish.courseGone');
    // `access`: whether this person may study it now (free, bought, theirs, or staff).
    if (method === 'GET') return json({ ...course, access: await canStudy(db, env, user, m[1]) });
    if (method === 'POST') {
      await requireStudy(db, env, user, m[1]);
      await enrol(db, user.id, m[1]);
      return json({ ok: true }, 201);
    }
  }
  if ((m = new RegExp(`^/api/courses/${UUID}/lessons/${UUID}$`).exec(path)) && method === 'GET') {
    await requireStudy(db, env, user, m[1]);
    return json(await courseLessonView(db, m[1], m[2]));
  }
  // Buying goes through a payment gateway; until one is connected this says so.
  if ((m = new RegExp(`^/api/courses/${UUID}/buy$`).exec(path)) && method === 'POST') {
    const course = await publicCourse(db, m[1]);
    if (!course) throw new HttpError(404, 'publish.courseGone');
    const provider = requireProvider(env);
    return json(
      await provider.checkout(env, user, {
        kind: 'course',
        courseId: m[1],
        priceCents: course.priceCents,
        currency: course.currency,
      }),
    );
  }
  throw new HttpError(404, 'http.notFound');
}
