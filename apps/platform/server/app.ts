import type { Env } from './env';
import { authProxy, currentUser } from './auth';
import { catalog, lessonEdition } from './content';
import { checkOrigin, HttpError, json } from './http';
export async function handleRequest(request: Request, env: Env): Promise<Response> {
  try {
    checkOrigin(request);
    if (!env.NEON_AUTH_BASE_URL || !env.APP_ORIGIN)
      throw new HttpError(503, 'خدمة الحسابات مش متاحة حاليًا.');
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/auth/'))
      return await authProxy(request, env, path.slice('/api/auth/'.length));
    const user = await currentUser(request, env);
    if (request.method === 'GET' && path === '/api/me') return json({ user });
    if (request.method === 'GET' && path === '/api/catalog') return json(await catalog(env));
    if (request.method === 'GET' && path.startsWith('/api/lessons/'))
      return json(await lessonEdition(env, decodeURIComponent(path.slice('/api/lessons/'.length))));
    throw new HttpError(404, 'الصفحة غير موجودة.');
  } catch (error) {
    return json(
      { error: error instanceof HttpError ? error.message : 'تعذر تنفيذ الطلب. جرّب تاني.' },
      error instanceof HttpError ? error.status : 500,
    );
  }
}
