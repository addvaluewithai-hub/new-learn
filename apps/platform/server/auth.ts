import type { AuthUser, Env } from './env';
import { body, HttpError } from './http';
const routes: Record<string, string> = {
  'get-session': 'GET',
  'sign-up/email': 'POST',
  'sign-in/email': 'POST',
  'sign-out': 'POST',
  'request-password-reset': 'POST',
  'reset-password': 'POST',
  'update-user': 'POST',
  'change-password': 'POST',
};
/** What the settings page may change, and nothing else the auth service would accept. */
function only(route: string, payload: Record<string, unknown>) {
  if (route === 'update-user') {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (name.length < 2 || name.length > 80) throw new HttpError(400, 'auth.nameLength');
    return { name };
  }
  const { currentPassword, newPassword } = payload;
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string')
    throw new HttpError(400, 'auth.passwordsNeeded');
  if (newPassword.length < 8 || newPassword.length > 128)
    throw new HttpError(400, 'auth.passwordLength');
  return { currentPassword, newPassword, revokeOtherSessions: true };
}
type Transport = typeof fetch;
export async function authProxy(
  request: Request,
  env: Env,
  route: string,
  send: Transport = fetch,
) {
  if (routes[route] !== request.method) throw new HttpError(404, 'http.notFound');
  const headers = new Headers({ 'content-type': 'application/json', origin: env.APP_ORIGIN });
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  let payload: Record<string, unknown> | undefined;
  if (request.method === 'POST') {
    payload = await body(request);
    if (route === 'request-password-reset') payload.redirectTo = `${env.APP_ORIGIN}/?auth=reset`;
    if ('callbackURL' in payload) payload.callbackURL = env.APP_ORIGIN;
    if (route === 'update-user' || route === 'change-password') payload = only(route, payload);
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
    throw new HttpError(503, 'auth.unavailableRetry');
  }
  if (upstream.status >= 300 && upstream.status < 400) throw new HttpError(502, 'auth.unexpected');
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
  if (!cookie) throw new HttpError(401, 'auth.signIn');
  let response: Response;
  try {
    response = await send(`${env.NEON_AUTH_BASE_URL}/get-session?disableCookieCache=true`, {
      headers: { cookie, origin: env.APP_ORIGIN },
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new HttpError(503, 'auth.checkFailed');
  }
  if (!response.ok) throw new HttpError(response.status >= 500 ? 503 : 401, 'auth.checkFailed');
  const data = (await response.json()) as {
    user?: AuthUser & { banned?: boolean };
    session?: { expiresAt?: string };
  } | null;
  const expiry = Date.parse(data?.session?.expiresAt ?? '');
  if (!data?.user?.id || data.user.banned || !Number.isFinite(expiry) || expiry <= Date.now())
    throw new HttpError(401, 'auth.expired');
  return { id: data.user.id, name: data.user.name, email: data.user.email };
}
