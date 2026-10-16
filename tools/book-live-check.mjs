// Verify the released platform with one fresh acceptance account, never an existing learner.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { bookReadingPackages } from '../content/book-guided/packages.ts';
const release = JSON.parse(await readFile('content/book-guided/release.json', 'utf8'));
const policy = JSON.parse(await readFile('content/availability.json', 'utf8'));
const course = release.curricula[0];
if (policy.curricula !== null && !policy.curricula.includes(course.id)) process.exit(0);
const imported = JSON.parse(await readFile('content/imported/registry.json', 'utf8'));
const origin = 'https://new-learn.pages.dev';
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
  if (cookies.length) cookie = cookies.map((c) => c.split(';')[0]).join('; ');
  return { response, value: await response.json() };
}
const report = { origin, date: new Date().toISOString(), lessons: [], result: 'pending' };
assert.equal((await call('/catalog')).response.status, 401);
const signup = await call('/auth/sign-up/email', {
  name: 'Book physics release acceptance',
  email: `release-${randomUUID()}@example.com`,
  password: `Test-${randomUUID()}`,
});
assert.equal(signup.response.status, 200, 'fresh acceptance-account signup');
try {
  const catalog = await call('/catalog');
  assert.equal(catalog.response.status, 200);
  if (policy.curricula !== null)
    assert.deepEqual(
      catalog.value.curricula.map((c) => c.id).sort(),
      [...policy.curricula].sort(),
      'only enabled courses are visible',
    );
  const live = catalog.value.curricula.find((c) => c.id === course.id);
  assert.deepEqual(
    live.lessons.map((l) => l.id),
    course.lessons.map((l) => l.id),
  );
  assert.ok(live.lessons.every((l) => l.availability === 'published'));
  for (const old of imported.curricula.filter(
    (c) => policy.curricula !== null && !policy.curricula.includes(c.id),
  )) {
    const id = old.lessons[0].id;
    assert.equal((await call(`/lessons/${id}`)).response.status, 404, 'paused direct lesson ' + id);
    assert.equal(
      (await call(`/lessons/${id}/progress`)).response.status,
      404,
      'paused progress ' + id,
    );
  }
  for (const expected of course.lessons) {
    const edition = await call('/lessons/' + expected.id);
    assert.equal(edition.response.status, 200);
    for (const key of ['contentRevision', 'manifestHash', 'runtimeVersion', 'moduleId'])
      assert.equal(edition.value[key], expected[key]);
    assert.equal(edition.value.stage, 'published');
    const pkg = (await bookReadingPackages[expected.moduleId]()).default;
    const chapter = expected.order === 1 ? '08' : '09';
    const receipt = JSON.parse(
      await readFile(
        `content/book-guided/physics-ch${chapter}/reference/${expected.order === 1 ? 'early' : 134}.json`,
        'utf8',
      ),
    );
    const firstReceipt = Object.values(receipt)[0];
    const asset = await fetch(`${origin}/book-ch${chapter}/reference/${firstReceipt.file}`, {
      signal: AbortSignal.timeout(20000),
    });
    assert.equal(asset.status, 200);
    assert.equal(
      createHash('sha256')
        .update(Buffer.from(await asset.arrayBuffer()))
        .digest('hex'),
      firstReceipt.sha256,
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
      step: 1,
      reachedSceneIds: [first.id],
      attempts: [],
    };
    const saved = await call(
      path,
      {
        contentRevision: expected.contentRevision,
        revision: initial.value.revision,
        state,
        complete: false,
      },
      'PUT',
    );
    assert.equal(saved.response.status, 200, expected.id + ' saves');
    const resumed = await call(path);
    assert.equal(resumed.value.state.sceneId, first.id);
    assert.equal(resumed.value.state.step, 1);
    const index = pkg.scenes.findIndex((s) => s.question),
      question = pkg.scenes[index];
    const attempt = {
      id: question.question.id,
      sceneId: question.id,
      questionId: question.question.id,
      written: question.question.options[0] ?? 'Acceptance attempt',
    };
    const feedback = {
      ...state,
      sceneId: question.id,
      phase: 'feedback',
      step: 0,
      reachedSceneIds: pkg.scenes.slice(0, index + 1).map((s) => s.id),
      attempts: [attempt],
    };
    const answered = await call(
      path,
      {
        contentRevision: expected.contentRevision,
        revision: resumed.value.revision,
        state: feedback,
        complete: false,
      },
      'PUT',
    );
    assert.equal(answered.response.status, 200, expected.id + ' attempt saves');
    const readback = await call(path);
    assert.equal(readback.value.state.phase, 'feedback');
    assert.deepEqual(readback.value.state.attempts, [attempt]);
    const stale = await call(
      path,
      {
        contentRevision: expected.contentRevision,
        revision: resumed.value.revision,
        state,
        complete: false,
      },
      'PUT',
    );
    assert.equal(stale.response.status, 409, 'stale tab cannot overwrite the saved attempt');
    assert.equal((await call(path)).value.state.attempts.length, 1);
    report.lessons.push({
      id: expected.id,
      revision: expected.contentRevision,
      published: true,
      assetHash: true,
      savedAndResumed: true,
      attemptPersisted: true,
      conflictProtected: true,
    });
    console.log(
      `${expected.id}: published, source asset, save/resume, attempt and conflict protection passed.`,
    );
  }
  const after = await call('/catalog');
  assert.ok(
    after.value.curricula
      .find((c) => c.id === course.id)
      .lessons.every((l) => l.progress?.status === 'started'),
  );
  assert.equal(after.value.resume.lessonId, course.lessons[1].id);
  report.result = 'passed';
} finally {
  assert.equal((await call('/auth/sign-out', {})).response.status, 200);
  assert.equal((await call('/me')).response.status, 401);
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/book-physics-live.json', JSON.stringify(report, null, 2) + '\n');
}
console.log(
  'LIVE book physics: only the new course is available; both chapters, real assets and durable progress passed.',
);
