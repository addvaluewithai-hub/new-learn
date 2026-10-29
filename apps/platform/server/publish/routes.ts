import { database } from '../db/connection';
import type { AuthUser, Env } from '../env';
import { body, HttpError, json } from '../http';
import { setFeedback } from '../authoring/feedback';
import { enrol, publicCourse, publishCourse, withdrawCourse } from './store';
import { courseLessonView } from './progress';
import { saveOutline, teacherCourse, teacherCourses } from './teach';
import { myCourses } from './library';

// The app's side of published courses: the teacher's workspace (/api/teach) and the
// student's course page, enrolment and lessons (/api/courses). The user is the session's.

const UUID = '([0-9a-f-]{36})';

export async function publishRoute(request: Request, env: Env, user: AuthUser, path: string) {
  const db = database(env);
  const method = request.method;
  let m: RegExpExecArray | null;
  if (path === '/api/teach/courses' && method === 'GET')
    return json({ courses: await teacherCourses(db, user.id) });
  if ((m = new RegExp(`^/api/teach/courses/${UUID}$`).exec(path))) {
    if (method === 'GET') return json(await teacherCourse(db, user.id, m[1]));
    if (method === 'POST') return json(await saveOutline(db, user.id, m[1], await body(request)));
  }
  if ((m = new RegExp(`^/api/teach/courses/${UUID}/publish$`).exec(path)) && method === 'POST')
    return json(await publishCourse(db, user, m[1]), 201);
  if ((m = new RegExp(`^/api/teach/courses/${UUID}/withdraw$`).exec(path)) && method === 'POST') {
    await withdrawCourse(db, user.id, m[1]);
    return json({ ok: true });
  }
  if ((m = new RegExp(`^/api/teach/notes/${UUID}$`).exec(path)) && method === 'POST') {
    const input = await body(request);
    if (!['done', 'open', 'dismissed'].includes(String(input.status)))
      throw new HttpError(400, 'الحالة غير صحيحة.');
    return json(await setFeedback(db, user.id, m[1], { status: input.status as 'done' }));
  }
  if (path === '/api/courses' && method === 'GET') return json(await myCourses(db, user.id));
  if ((m = new RegExp(`^/api/courses/${UUID}$`).exec(path))) {
    const course = await publicCourse(db, m[1]);
    if (!course) throw new HttpError(404, 'الكورس ده مش موجود أو اتسحب.');
    if (method === 'GET') return json(course);
    if (method === 'POST') {
      await enrol(db, user.id, m[1]);
      return json({ ok: true }, 201);
    }
  }
  if ((m = new RegExp(`^/api/courses/${UUID}/lessons/${UUID}$`).exec(path)) && method === 'GET')
    return json(await courseLessonView(db, m[1], m[2]));
  throw new HttpError(404, 'الصفحة غير موجودة.');
}
