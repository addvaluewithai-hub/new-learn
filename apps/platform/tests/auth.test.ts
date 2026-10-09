import test from 'node:test';
import assert from 'node:assert/strict';
import { authProxy, currentUser } from '../server/auth';
import { handleRequest } from '../server/app';
import { HttpError } from '../server/http';
const env = {
  APP_ORIGIN: 'https://new-learn.pages.dev',
  NEON_AUTH_BASE_URL: 'https://auth.test/learn/auth',
};
const request = (path: string, method = 'GET', payload?: unknown) =>
  new Request(`${env.APP_ORIGIN}/api${path}`, {
    method,
    headers:
      method === 'POST'
        ? { origin: env.APP_ORIGIN, 'content-type': 'application/json' }
        : undefined,
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
test('proxy only permits known methods and routes', async () => {
  for (const [path, method] of [
    ['admin', 'POST'],
    ['sign-up/email', 'GET'],
    ['get-session', 'POST'],
  ])
    await assert.rejects(
      () =>
        authProxy(request(`/auth/${path}`, method, method === 'POST' ? {} : undefined), env, path),
      { status: 404 },
    );
});
test('reset callbacks are server selected and cookies are local, private, unchanged in security flags', async () => {
  const response = await authProxy(
    request('/auth/request-password-reset', 'POST', {
      email: 'test@example.com',
      redirectTo: 'https://evil.test',
      callbackURL: 'https://evil.test',
    }),
    env,
    'request-password-reset',
    async (url, init) => {
      assert.equal(String(url), 'https://auth.test/learn/auth/request-password-reset');
      assert.equal(new Headers(init?.headers).get('origin'), env.APP_ORIGIN);
      assert.equal(init?.redirect, 'manual');
      assert.deepEqual(JSON.parse(String(init?.body)), {
        email: 'test@example.com',
        redirectTo: `${env.APP_ORIGIN}/?auth=reset`,
        callbackURL: env.APP_ORIGIN,
      });
      const headers = new Headers();
      headers.append(
        'set-cookie',
        'session=one; Domain=auth.test; Path=/learn/auth; Secure; HttpOnly; SameSite=Lax',
      );
      headers.append('set-cookie', 'other=two; Path=/');
      return new Response('{}', { headers });
    },
  );
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.match(response.headers.getSetCookie()[0], /Path=\/; Secure; HttpOnly; SameSite=Lax/);
  assert.doesNotMatch(response.headers.getSetCookie()[0], /Domain=/);
});
test('session restoration rejects absent, expired, malformed, and banned users', async () => {
  await assert.rejects(() => currentUser(request('/me'), env), { status: 401 });
  const req = new Request(`${env.APP_ORIGIN}/api/me`, { headers: { cookie: 'session=test' } });
  for (const data of [
    null,
    {},
    { user: { id: 'one' }, session: { expiresAt: 'yesterday' } },
    { user: { id: 'one' }, session: { expiresAt: '2000-01-01' } },
    { user: { id: 'one', banned: true }, session: { expiresAt: '2099-01-01' } },
  ])
    await assert.rejects(() => currentUser(req, env, async () => Response.json(data)), {
      status: 401,
    });
  const user = await currentUser(req, env, async (_url, init) => {
    assert.equal(new Headers(init?.headers).get('cookie'), 'session=test');
    return Response.json({
      user: { id: 'one', name: 'Test', email: 'test@example.com', secret: 'hidden' },
      session: { expiresAt: '2099-01-01' },
    });
  });
  assert.deepEqual(user, { id: 'one', name: 'Test', email: 'test@example.com' });
});
test('cross origin mutations and anonymous catalog are denied before touching DB', async () => {
  const response = await handleRequest(
    new Request(`${env.APP_ORIGIN}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { origin: 'https://evil.test', 'content-type': 'application/json' },
      body: '{}',
    }),
    env,
  );
  assert.equal(response.status, 403);
  assert.equal((await handleRequest(request('/catalog'), env)).status, 401);
});
test('upstream outage and redirect cannot become a successful login', async () => {
  await assert.rejects(
    () =>
      authProxy(request('/auth/sign-in/email', 'POST', {}), env, 'sign-in/email', async () => {
        throw new Error('network');
      }),
    { status: 503 },
  );
  await assert.rejects(
    () =>
      authProxy(
        request('/auth/sign-in/email', 'POST', {}),
        env,
        'sign-in/email',
        async () => new Response(null, { status: 302, headers: { location: 'https://evil.test' } }),
      ),
    { status: 502 },
  );
});
test('JSON input is bounded and an object is required', async () => {
  for (const value of [null, [], 'text'])
    await assert.rejects(
      () => authProxy(request('/auth/sign-in/email', 'POST', value), env, 'sign-in/email'),
      (error: unknown) => error instanceof HttpError && error.status === 400,
    );
  await assert.rejects(
    () =>
      authProxy(
        request('/auth/sign-in/email', 'POST', { data: 'x'.repeat(17000) }),
        env,
        'sign-in/email',
      ),
    { status: 413 },
  );
});
