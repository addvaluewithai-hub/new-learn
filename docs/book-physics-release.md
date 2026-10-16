# Textbook physics release

Owner request, 2026-10-16: merge Chapters 8 and 9 into the normal platform and
pause the other published curricula temporarily.

The normal catalog offers `physics-1-book-guided`, with `phys1-textbook-ch08`
then `phys1-textbook-ch09`. These are normal pinned reading editions with
account progress, attempts, resume, goals, Nova and the optional scan reference.
The original `?preview=book-ch08` / `book-ch09` routes remain separate sessions.

## Reversible availability

`content/availability.json` is the server allowlist. It applies to both catalog
queries and direct lesson edition lookup, so paused lessons also cannot read or
write progress or open a normal Nova context. Existing curriculum metadata,
editions, release pointers and learner progress remain intact.

Set `curricula` to `null` to restore the previous published catalog alongside
book physics; use an explicit list to enable a subset. Existing chemistry
withholding still applies when its content is synced.

Content sync writes only enabled curricula. It does not delete the old
curricula, releases, enrollments or progress. The reviewed book editions have
separate IDs from the earlier physics lessons, avoiding reinterpretation of
students' existing progress.

## Immutable publication

`npm run book:release` pins 181 source/media files plus the runtime version to
the reviewed package identities. `npm run book:check` runs before each build
and rejects stale pins. Generated imported content is never edited.

The Content sync workflow waits for the exact main commit to deploy, then
upserts the new course, two lessons, immutable editions and release pointers.
Its live acceptance creates a fresh test account, checks that only the new
course is visible and paused lesson/progress URLs return 404, verifies source
asset hashes, and saves/resumes both chapters and an attempted question. It
also checks conflicting saves cannot erase attempts.

Database publication SQL was tested on a temporary child of the application
branch before applying to the deployed application. The legacy application
and its database branch are unchanged.

## Checks

`npm test`, `npm run build`, `npm run functions:check`,
`npm run test:browser:book-release`, and `npm run test:browser:book` cover the
release contract, pause policy, source integrity, published UI, native question
feedback, saved positions and the Chapter 8 → 9 completion link.

Artifact upload is optional when Actions storage is full; test failures still
fail CI. Live acceptance results are also printed in workflow logs.
