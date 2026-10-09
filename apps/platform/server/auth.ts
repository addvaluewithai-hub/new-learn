import type { AuthUser, Env } from './env';
import { body, HttpError } from './http';
const routes: Record<string, string> = {
  'get-session': 'GET',
  'sign-up/email': 'POST',
  'sign-in/email': 'POST',
  'sign-out': 'POST',
  'request-password-reset': 'POST',
  'reset-password': 'POST',
};
type Transport = typeof fetch;
export async function authProxy(
  request: Request,
  env: Env,
  route: string,
  send: Transport = fetch,
) {
  if (routes[route] !== request.method) throw new HttpError(404, 'الصفحة غير موجودة.');
  const headers = new Headers({ 'content-type': 'application/json', origin: env.APP_ORIGIN });
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  let payload: Record<string, unknown> | undefined;
  if (request.method === 'POST') {
    payload = await body(request);
    if (route === 'request-password-reset') payload.redirectTo = `${env.APP_ORIGIN}/?auth=reset`;
    if ('callbackURL' in payload) payload.callbackURL = env.APP_ORIGIN;
  }
  let upstream: Response;
  try {
    upstream = await send(
      `${env.NEON_AUTH_BASE_URL}/${route}${route === 'get-session' ? '?disableCookieCache=true' : ''}`,
      {
        method: request.method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
        redirect: 'manual',
        signal: AbortSignal.timeout(20000),
      },
    );
  } catch {
    throw new HttpError(503, 'خدمة الحسابات مش متاحة حاليًا. جرّب تاني.');
  }
  if (upstream.status >= 300 && upstream.status < 400)
    throw new HttpError(502, 'استجابة خدمة الحسابات غير متوقعة.');
  const output = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' });
  for (const cookieValue of upstream.headers.getSetCookie()) {
    output.append(
      'set-cookie',
      cookieValue.replace(/;\s*Domain=[^;]+/gi, '').replace(/;\s*Path=[^;]+/gi, '; Path=/'),
    );
  }
  return new Response(await upstream.text(), { status: upstream.status, headers: output });
}
export async function currentUser(
  request: Request,
  env: Env,
  send: Transport = fetch,
): Promise<AuthUser> {
  const cookie = request.headers.get('cookie');
  if (!cookie) throw new HttpError(401, 'سجّل دخولك للمتابعة.');
  let response: Response;
  try {
    response = await send(`${env.NEON_AUTH_BASE_URL}/get-session?disableCookieCache=true`, {
      headers: { cookie, origin: env.APP_ORIGIN },
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new HttpError(503, 'تعذر التحقق من جلسة الدخول.');
  }
  if (!response.ok)
    throw new HttpError(response.status >= 500 ? 503 : 401, 'تعذر التحقق من جلسة الدخول.');
  const data = (await response.json()) as {
    user?: AuthUser & { banned?: boolean };
    session?: { expiresAt?: string };
  } | null;
  const expiry = Date.parse(data?.session?.expiresAt ?? '');
  if (!data?.user?.id || data.user.banned || !Number.isFinite(expiry) || expiry <= Date.now())
    throw new HttpError(401, 'انتهت جلسة الدخول. سجّل دخولك من جديد.');
  return { id: data.user.id, name: data.user.name, email: data.user.email };
}
