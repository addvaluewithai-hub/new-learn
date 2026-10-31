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
import { creditsRoute } from './credits/routes';
import { reviewRoute } from './review/routes';
import { isStaff } from './staff';
import { opsRoute, reportError } from './ops/routes';
import { logError } from './ops/record';
import { ipOf, rateLimit } from './ops/limits';
export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const locale = localeOf(request);
  try {
    checkOrigin(request);
    if (!env.NEON_AUTH_BASE_URL || !env.APP_ORIGIN) throw new HttpError(503, 'auth.unavailable');
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/auth/')) {
      const route = path.slice('/api/auth/'.length);
      // Sign-up and sign-in are limited per IP, before the account service sees them.
      if (env.DATABASE_URL && (route === 'sign-up/email' || route === 'sign-in/email'))
        await rateLimit(
          database(env),
          route === 'sign-up/email' ? 'auth.signup' : 'auth.signin',
          ipOf(request) || 'unknown',
        );
      return await authProxy(request, env, route);
    }
    // Browsers report their errors, signed in or not.
    if (path === '/api/errors' && request.method === 'POST')
      return await reportError(request, env, await currentUser(request, env).catch(() => null));
    const user = await currentUser(request, env);
    if (path.startsWith('/api/nova/'))
      return await novaRoute(request, env, user, path.slice('/api/nova/'.length), locale);
    if (request.method === 'GET' && path === '/api/me')
      return json({ user: { ...user, staff: isStaff(env, user) } });
    if (path.startsWith('/api/credits')) return await creditsRoute(request, env, user, path);
    if (path.startsWith('/api/ops/')) return await opsRoute(request, env, user, path);
    if (path.startsWith('/api/review/')) return await reviewRoute(request, env, user, path, locale);
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
    // Anything that is not an expected HttpError is a bug: keep it for staff (docs/operations.md).
    if (!(error instanceof HttpError) && env.DATABASE_URL)
      await logError(database(env), {
        source: 'server',
        place: `${request.method} ${new URL(request.url).pathname}`,
        status: 500,
        message: error instanceof Error ? error.message : String(error),
        detail: { stack: error instanceof Error ? error.stack : '' },
      });
    return json(
      {
        error:
          error instanceof HttpError ? errorText(error, locale) : serverText(locale, 'http.failed'),
      },
      error instanceof HttpError ? error.status : 500,
    );
  }
}
