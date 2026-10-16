// Post-deployment acceptance: only a newly created test account is touched.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const origin = 'https://new-learn.pages.dev';
const policy = JSON.parse(await readFile('content/availability.json', 'utf8'));
if (policy.curricula !== null && !policy.curricula.includes('physics-1-mechanics-waves'))
  process.exit(0);
const registry = JSON.parse(await readFile('content/imported/registry.json', 'utf8'));
const course = registry.curricula.find((c) => c.id === 'physics-1-mechanics-waves');
if (!course) process.exit(0);
assert.equal(course.lessons.length, 4);
if (!course.lessons.find((l) => l.id === 'phys1-young-axial-stiffness')?.moduleId) process.exit(0);
let cookie = '';
async function call(path, payload, method) {
  const response = await fetch(origin + '/api' + path, {
    method: method ?? (payload === undefined ? 'GET' : 'POST'),
    headers: { origin, cookie, 'content-type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    redirect: 'manual',
    signal: AbortSignal.timeout(20000),
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) cookie = cookies.map((v) => v.split(';')[0]).join('; ');
  const value = await response.json();
  return { response, value };
}
const result = { origin, date: new Date().toISOString(), lessons: [], result: 'pending' };
assert.equal((await call('/catalog')).response.status, 401);
const signup = await call('/auth/sign-up/email', {
  name: 'Physics 802 release acceptance',
  email: `release-${randomUUID()}@example.com`,
  password: `Test-${randomUUID()}`,
});
assert.equal(signup.response.status, 200, 'test-account signup');
try {
  assert.equal((await call('/me')).response.status, 200);
  const catalog = await call('/catalog');
  assert.equal(catalog.response.status, 200);
  const live = catalog.value.curricula.find((c) => c.id === course.id);
  assert.ok(live, 'curriculum visible');
  assert.deepEqual(
    live.lessons.map((l) => l.id),
    course.lessons.map((l) => l.id),
  );
  assert.equal(
    live.lessons.find((l) => l.id === 'phys1-young-axial-stiffness').availability,
    'published',
  );
  // Lessons without an imported edition stay "coming soon"; later releases add their own.
  for (const lesson of course.lessons.filter((l) => !l.moduleId))
    assert.equal(live.lessons.find((l) => l.id === lesson.id).availability, 'coming-soon');
  for (const expected of course.lessons.filter((l) => l.id === 'phys1-young-axial-stiffness')) {
    const edition = await call('/lessons/' + expected.id);
    assert.equal(edition.response.status, 200, expected.id + ' opens');
    for (const key of ['contentRevision', 'manifestHash', 'runtimeVersion', 'moduleId'])
      assert.equal(edition.value[key], expected[key], expected.id + ' ' + key);
    assert.equal(edition.value.stage, 'published');
    const directory = `content/imported/${course.id}/${expected.id}/`;
    const meta = JSON.parse(await readFile(directory + 'lesson.json', 'utf8'));
    const pkg = JSON.parse(await readFile(directory + 'reading.json', 'utf8'));
    const font = meta.files.find((f) => f.path.endsWith('arabic-400-normal.woff2'));
    assert.ok(font, 'Arabic font exported');
    const asset = await fetch(origin + meta.assetBase + '/' + font.path, {
      signal: AbortSignal.timeout(20000),
    });
    assert.equal(asset.status, 200, 'font available');
    assert.equal(
      createHash('sha256')
        .update(Buffer.from(await asset.arrayBuffer()))
        .digest('hex'),
      font.sha256,
      'live asset hash',
    );
    const path = '/lessons/' + expected.id + '/progress';
    const initial = await call(path);
    assert.equal(initial.response.status, 200);
    assert.equal(initial.value.state, null);
    const first = pkg.scenes[0];
    const state = {
      schemaVersion: 1,
      sceneId: first.id,
      phase: 'narration',
      frame: 0,
      step: first.steps.length > 1 ? 1 : 0,
      reachedSceneIds: [first.id],
      attempts: [],
    };
    const saved = await call(
      path,
      {
        contentRevision: expected.contentRevision,
        revision: initial.value.revision,
        complete: false,
        state,
      },
      'PUT',
    );
    assert.equal(saved.response.status, 200, expected.id + ' saves');
    const resumed = await call(path);
    assert.equal(resumed.response.status, 200);
    assert.equal(resumed.value.state.sceneId, state.sceneId);
    assert.equal(resumed.value.state.step, state.step);
    const questionIndex = pkg.scenes.findIndex((s) => s.question);
    assert.ok(questionIndex >= 0);
    const question = pkg.scenes[questionIndex];
    const attempt = {
      id: question.question.id,
      sceneId: question.id,
      questionId: question.question.id,
      written: 'Release acceptance: persistence check',
    };
    const feedback = {
      ...state,
      sceneId: question.id,
      phase: 'feedback',
      step: 0,
      reachedSceneIds: pkg.scenes.slice(0, questionIndex + 1).map((s) => s.id),
      attempts: [attempt],
    };
    const answered = await call(
      path,
      {
        contentRevision: expected.contentRevision,
        revision: resumed.value.revision,
        complete: false,
        state: feedback,
      },
      'PUT',
    );
    assert.equal(answered.response.status, 200, expected.id + ' attempt saves');
    const readback = await call(path);
    assert.equal(readback.response.status, 200);
    assert.equal(readback.value.state.phase, 'feedback');
    assert.equal(readback.value.state.attempts[0].written, attempt.written);
    assert.equal(readback.value.completed, false);
    result.lessons.push({
      id: expected.id,
      contentRevision: expected.contentRevision,
      manifestHash: expected.manifestHash,
      runtimeVersion: expected.runtimeVersion,
      published: true,
      assetHashPassed: true,
      savedAndResumed: true,
      attemptPersisted: true,
    });
    console.log(expected.id + ': published, asset hash, save/resume and attempt passed.');
  }
  const after = await call('/catalog');
  const progressed = after.value.curricula.find((c) => c.id === course.id);
  assert.equal(
    progressed.lessons.find((l) => l.id === 'phys1-young-axial-stiffness').progress?.status,
    'started',
  );
  result.result = 'passed';
} finally {
  assert.equal((await call('/auth/sign-out', {})).response.status, 200);
  assert.equal((await call('/me')).response.status, 401);
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/physics-802-live.json', JSON.stringify(result, null, 2) + '\n');
}
console.log('LIVE Physics 802: published lesson, font hash, save/resume and attempt passed.');
