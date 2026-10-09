import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { authProxy, currentUser } from '../apps/platform/server/auth.ts';
const env = {
  APP_ORIGIN: 'https://new-learn.pages.dev',
  NEON_AUTH_BASE_URL:
    'https://ep-odd-mouse-ayu2hljt.neonauth.c-5.us-east-2.aws.neon.tech/learn/auth',
};
const email = `acceptance-${randomUUID()}@example.com`,
  password = `Test-${randomUUID()}`;
let cookie = '';
async function call(route, payload) {
  const request = new Request(`${env.APP_ORIGIN}/api/auth/${route}`, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: { origin: env.APP_ORIGIN, 'content-type': 'application/json', cookie },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const response = await authProxy(request, env, route);
  const cookies = response.headers.getSetCookie();
  if (cookies.length) cookie = cookies.map((value) => value.split(';')[0]).join('; ');
  return { response, value: await response.json() };
}
const signup = await call('sign-up/email', { name: 'Acceptance test', email, password });
assert.equal(signup.response.status, 200, `signup: ${signup.value.code ?? signup.value.message}`);
const user = await currentUser(
  new Request(`${env.APP_ORIGIN}/api/me`, { headers: { cookie } }),
  env,
);
assert.equal(user.email, email);
assert.equal((await call('sign-out', {})).response.status, 200);
assert.equal((await call('get-session')).value, null);
const wrong = await call('sign-in/email', { email, password: 'not-the-password' });
assert.equal(wrong.response.status, 401);
assert.equal((await call('sign-in/email', { email, password })).response.status, 200);
const session = await call('get-session');
assert.equal(session.value.user.id, user.id);
const invalidReset = await call('reset-password', {
  token: 'invalid-test-token',
  newPassword: `Next-${randomUUID()}`,
});
assert.ok(invalidReset.response.status >= 400);
// Unregistered address: verify transport/privacy without emailing a real person.
assert.equal(
  (await call('request-password-reset', { email: `missing-${randomUUID()}@example.com` })).response
    .status,
  200,
);
assert.equal((await call('sign-out', {})).response.status, 200);
console.log(
  'LIVE Neon Auth: signup, session restore, logout, wrong password, signin, invalid reset, reset request passed.',
);
