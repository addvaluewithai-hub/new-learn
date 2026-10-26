import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { testDb } from './db';
import { handleConnector } from '../server/connector';
import { approve } from '../server/oauth/consent';
import { pkceChallenge } from '../server/oauth/tokens';
import { addFeedback } from '../server/authoring/feedback';
import type { Env } from '../server/env';

const origin = 'https://learn.example';
const env = { APP_ORIGIN: origin, NEON_AUTH_BASE_URL: 'https://auth.example' } as Env;
const redirect = 'https://claude.ai/api/mcp/auth_callback';
const teacher = { id: 'teacher-a', name: 'أستاذة منى', email: 'm@example.com' };
const verifier = 'v'.repeat(43) + 'erifier-0123456789';

async function connected() {
  const db = await testDb();
  const call = (path: string, init: RequestInit = {}) =>
    handleConnector(new Request(`${origin}${path}`, init), env, { db });
  const reg = await call('/oauth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_name: 'Claude', redirect_uris: [redirect] }),
  });
  assert.equal(reg.status, 201);
  const { client_id } = (await reg.json()) as { client_id: string };
  const code = async (challenge?: string) => {
    const params = {
      client_id,
      redirect_uri: redirect,
      code_challenge: challenge ?? (await pkceChallenge(verifier)),
      state: 'xyz',
    };
    const auth = await call(
      `/oauth/authorize?response_type=code&code_challenge_method=S256&${new URLSearchParams(params)}`,
    );
    assert.equal(auth.status, 302);
    assert.match(auth.headers.get('location')!, /\/\?oauth=consent&/);
    const back = new URL((await approve(db, teacher, params, origin)).redirect);
    assert.equal(back.searchParams.get('state'), 'xyz');
    return back.searchParams.get('code')!;
  };
  const exchange = (form: Record<string, string>) =>
    call('/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id, ...form }),
    });
  return { db, call, client_id, code, exchange };
}

test('discovery, registration and the authorization redirect follow the MCP auth spec', async () => {
  const { call } = await connected();
  const resource = await (await call('/.well-known/oauth-protected-resource')).json();
  assert.deepEqual(resource.authorization_servers, [origin]);
  const meta = await (await call('/.well-known/oauth-authorization-server')).json();
  assert.equal(meta.registration_endpoint, `${origin}/oauth/register`);
  assert.deepEqual(meta.code_challenge_methods_supported, ['S256']);
  const denied = await call('/mcp', { method: 'POST', body: '{}' });
  assert.equal(denied.status, 401);
  assert.match(denied.headers.get('www-authenticate')!, /resource_metadata=/);
  const bad = await call('/oauth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ redirect_uris: ['http://evil.example/cb'] }),
  });
  assert.equal(bad.status, 400);
  const unknown = await call(
    `/oauth/authorize?client_id=${'0'.repeat(32)}&redirect_uri=${redirect}`,
  );
  assert.equal(unknown.status, 400, 'never redirects to an unregistered URI');
});

test('codes are single-use and bound to PKCE; refresh tokens rotate', async () => {
  const { code, exchange } = await connected();
  const wrong = await exchange({
    grant_type: 'authorization_code',
    code: await code(),
    redirect_uri: redirect,
    code_verifier: 'x'.repeat(43),
  });
  assert.equal((await wrong.json()).error, 'invalid_grant');
  const once = await code();
  const ok = await exchange({
    grant_type: 'authorization_code',
    code: once,
    redirect_uri: redirect,
    code_verifier: verifier,
  });
  const tokens = await ok.json();
  assert.equal(tokens.token_type, 'Bearer');
  const again = await exchange({
    grant_type: 'authorization_code',
    code: once,
    redirect_uri: redirect,
    code_verifier: verifier,
  });
  assert.equal((await again.json()).error, 'invalid_grant', 'a code works once');
  const rotated = await (
    await exchange({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token })
  ).json();
  assert.ok(rotated.access_token);
  const stale = await exchange({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
  });
  assert.equal((await stale.json()).error, 'invalid_grant', 'the old refresh token stops working');
});

test('a connected AI creates a course, a board and a lesson, then handles a teacher note', async () => {
  const { db, call, code, exchange } = await connected();
  const tokens = await (
    await exchange({
      grant_type: 'authorization_code',
      code: await code(),
      redirect_uri: redirect,
      code_verifier: verifier,
    })
  ).json();
  let id = 0;
  const rpc = async (method: string, params?: unknown) => {
    const response = await call('/mcp', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${tokens.access_token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
    });
    return (await response.json()) as { result: any; error?: unknown };
  };
  const tool = async (name: string, args: unknown = {}) =>
    (await rpc('tools/call', { name, arguments: args })).result;
  const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {} });
  assert.equal(init.result.protocolVersion, '2025-06-18');
  const ack = await call('/mcp', {
    method: 'POST',
    headers: { authorization: `Bearer ${tokens.access_token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  });
  assert.equal(ack.status, 202);
  const huge = await call('/mcp', {
    method: 'POST',
    headers: { authorization: `Bearer ${tokens.access_token}`, 'content-type': 'application/json' },
    body: 'x'.repeat(3 * 1024 * 1024 + 1),
  });
  assert.equal(huge.status, 413);
  const { tools } = (await rpc('tools/list')).result;
  assert.equal(tools.length, 11);
  for (const t of tools)
    assert.ok(t.annotations.title && typeof t.annotations.readOnlyHint === 'boolean', t.name);
  assert.match((await tool('get_authoring_guide')).content[0].text, /NewLearnBoard\.start/);
  const { courseId } = (await tool('create_course', { title: 'فيزيا' })).structuredContent;
  const wire = new URL('../../../fixtures/board-probe/boards/wire/', import.meta.url);
  const files = {
    'board.json': await readFile(new URL('board.json', wire), 'utf8'),
    'index.html': await readFile(new URL('index.html', wire), 'utf8'),
  };
  assert.match((await tool('put_board', { files })).structuredContent.hash, /^[a-f0-9]{64}$/);
  const rejected = await tool('add_lesson', { courseId, lesson: { title: 'x', scenes: [] } });
  assert.equal(rejected.isError, true);
  assert.match(rejected.content[0].text, /scenes/);
  const lesson = {
    title: 'سلك',
    scenes: [
      {
        id: 'wire',
        title: 'سلك',
        board: 'probe-wire',
        steps: [{ text: 'حمل 200 نيوتن.', board: { state: { load: 200 } } }],
      },
    ],
  };
  const added = (await tool('add_lesson', { courseId, lesson })).structuredContent;
  assert.equal(added.previewUrl, `${origin}/?draft=${added.lessonId}`);
  await addFeedback(db, teacher.id, added.lessonId, {
    sceneId: 'wire',
    phase: 'narration',
    step: 0,
    note: 'خليها 300',
  });
  const { notes } = (await tool('get_feedback')).structuredContent;
  assert.equal(notes[0].currentText, 'حمل 200 نيوتن.');
  const resolved = await tool('resolve_feedback', {
    feedbackId: notes[0].id,
    status: 'review',
    summary: 'غيرتها لـ300',
  });
  assert.equal(resolved.structuredContent.status, 'review');
  const courses = (await tool('list_my_courses')).structuredContent;
  assert.equal(courses[0].lessons[0].previewUrl, added.previewUrl);
});
