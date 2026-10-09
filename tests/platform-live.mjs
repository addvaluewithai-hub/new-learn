import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const url = process.env.PLATFORM_TEST_URL ?? 'http://127.0.0.1:8787';
for (let i = 0; i < 100; i++) {
  try {
    await fetch(`${url}/api/me`);
    break;
  } catch (error) {
    if (i === 99) throw error;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
let cookie = '';
async function call(path, payload) {
  const response = await fetch(`${url}/api${path}`, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: { origin: new URL(url).origin, 'content-type': 'application/json', cookie },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    redirect: 'manual',
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) cookie = cookies.map((value) => value.split(';')[0]).join('; ');
  return { response, value: await response.json() };
}
assert.equal((await call('/catalog')).response.status, 401);
const email = `platform-${randomUUID()}@example.com`,
  password = `Test-${randomUUID()}`;
assert.equal(
  (await call('/auth/sign-up/email', { name: 'Platform acceptance', email, password })).response
    .status,
  200,
);
assert.equal((await call('/me')).value.user.email, email);
const catalog = await call('/catalog');
assert.equal(catalog.response.status, 200);
assert.equal(catalog.value.curricula.length, 1);
const lessons = catalog.value.curricula[0].lessons;
assert.equal(lessons.length, 9);
assert.equal(lessons[0].availability, 'review');
assert.equal(lessons[1].availability, 'coming-soon');
const lesson = await call(`/lessons/${lessons[0].id}`);
assert.equal(lesson.response.status, 200);
assert.equal(lesson.value.stage, 'review');
assert.equal((await call(`/lessons/${lessons[1].id}`)).response.status, 404);
assert.equal((await call('/auth/sign-out', {})).response.status, 200);
assert.equal((await call('/me')).response.status, 401);
assert.equal((await call('/auth/sign-in/email', { email, password })).response.status, 200);
assert.equal((await call('/catalog')).response.status, 200);
assert.equal((await call('/auth/sign-out', {})).response.status, 200);
console.log(
  'LIVE platform API + Neon: anonymous denial, signup, session, DB catalog, pinned review lesson, missing lesson, logout, signin passed.',
);
