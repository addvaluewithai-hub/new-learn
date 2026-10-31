import type { Env } from './env';
import { novaRoute } from './nova/routes';
import { authProxy, currentUser } from './auth';
import { catalog, lessonEdition } from './content';
import { body, checkOrigin, errorText, HttpError, json } from './http';
import { localeOf, serverText } from './i18n';
import { readProgress, saveProgress } from './progress/store';
import { authoringRoute } from './authoring/routes';
import { studioRoute } from './builds/studio';
import { publishRoute } from './publish/routes';
import { readCourseProgress, saveCourseProgress } from './publish/progress';
import { database } from './db/connection';
import { PUB } from './publish/store';
export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const locale = localeOf(request);
  try {
    checkOrigin(request);
    if (!env.NEON_AUTH_BASE_URL || !env.APP_ORIGIN) throw new HttpError(503, 'auth.unavailable');
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/auth/'))
      return await authProxy(request, env, path.slice('/api/auth/'.length));
    const user = await currentUser(request, env);
    if (path.startsWith('/api/nova/'))
      return await novaRoute(request, env, user, path.slice('/api/nova/'.length), locale);
    if (request.method === 'GET' && path === '/api/me') return json({ user });
    if (path.startsWith('/api/authoring/') || path.startsWith('/api/oauth/'))
      return await authoringRoute(request, env, user, path);
    if (path.startsWith('/api/studio/')) return await studioRoute(request, env, user, path);
    if (path.startsWith('/api/teach/') || path.startsWith('/api/courses'))
      return await publishRoute(request, env, user, path, locale);
    if (request.method === 'GET' && path === '/api/catalog') return json(await catalog(env, user));
    const progressPath = /^\/api\/lessons\/([^/]+)\/progress$/.exec(path);
    if (progressPath) {
      const lessonId = decodeURIComponent(progressPath[1]);
      // A published teacher course's lesson («pub:<id>») keeps its progress by course.
      const pub = PUB.exec(lessonId);
      if (pub && request.method === 'GET')
        return json(await readCourseProgress(database(env), user.id, pub[1]));
      if (pub && request.method === 'PUT')
        return await saveCourseProgress(
          database(env),
          user.id,
          pub[1],
          await body(request),
          locale,
        );
      if (request.method === 'GET') return json(await readProgress(env, user, lessonId));
      if (request.method === 'PUT')
        return await saveProgress(env, user, lessonId, await body(request), locale);
      throw new HttpError(405, 'http.notAllowed');
    }
    if (request.method === 'GET' && path.startsWith('/api/lessons/'))
      return json(await lessonEdition(env, decodeURIComponent(path.slice('/api/lessons/'.length))));
    throw new HttpError(404, 'http.notFound');
  } catch (error) {
    return json(
      {
        error:
          error instanceof HttpError ? errorText(error, locale) : serverText(locale, 'http.failed'),
      },
      error instanceof HttpError ? error.status : 500,
    );
  }
}
