import test from 'node:test';
import assert from 'node:assert/strict';
import modules from '../content-modules.json';
import { supportedEdition } from '../server/moduleAvailability';
import { database } from '../server/db/connection';
test('availability binds compiled module, identity, manifest and runtime edition', () => {
  const edition = { ...modules['states-of-matter-review'], moduleId: 'states-of-matter-review' };
  assert.equal(supportedEdition(edition), true);
  assert.equal(supportedEdition(null), false);
  for (const key of Object.keys(edition))
    assert.equal(supportedEdition({ ...edition, [key]: 'unregistered' }), false, key);
});
test('missing DB binding is a service error instead of an invented catalog', () => {
  assert.throws(
    () =>
      database({
        APP_ORIGIN: 'https://new-learn.pages.dev',
        NEON_AUTH_BASE_URL: 'https://auth.test',
      }),
    { status: 503 },
  );
});
