# Delivery status and next steps

## Foundation implemented

Independent configuration/dependencies, workspace runtime, ephemeral preview host,
custom test renderer, synthetic assets, pure session tests, browser acceptance runner,
and CI enforcement of code boundaries/300 lines.

This is not completion of the new platform or a released authoring SDK.
The current fixture is original test content, not an imported approved lesson.
No auth, catalog API, database, persistence, content importer or assistant was created.
The old deployed platform and authoring repository were not changed by this batch.

## Distribution and authoring preview implemented

SDK 0.2.1 is a versioned ESM/types/CSS tarball with sha256/integrity manifest.
The platform consumes built public exports; an independent consumer installs and builds it.
learn-curriculums has an isolated preview, selected verified WAVs/corrected words,
bilingual full-clause anchors, lesson-owned renderer imports and SDK-bound review declarations.
The preview does not publish or grant approval; synthetic CI is technical evidence only.

## Next acceptance and platform delivery

1. Review a real factory-produced bilingual lesson and speech/word anchors in both ratios.
2. Check autoplay/recovery on a real mobile browser; Chromium emulation is limited.
3. Extract real account/session and DB-derived catalog services into the new app.
4. Add pinned editions, progress/resume and the reviewed artifact import/release pipeline.
5. Add the assistants after student playback/persistence contracts are stable.

Do not copy authoring folders into platform source as the student import mechanism.
Preserve exact source/media hashes; missing or guessed anchors are blockers.

## Platform services to extract later

| Capability            | Existing reference                                   | Acceptance needed                                                        |
| --------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Login/session         | server/app.ts auth routes                            | Real signup/login/logout/session; no invented auth backend               |
| Catalog               | server/contentCatalog.ts                             | DB-derived curricula, availability and enrollment on open                |
| Saved lesson host     | RecordedModuleHost, recordedProgress                 | Ownership, pinned edition, resume, CAS/lease conflict handling           |
| Artifact storage      | artifactRegistry, artifactRetention, artifactStorage | Immutable files, same-origin URLs, retain before release                 |
| Import/review/release | artifactImportPlan and publication tools             | Generic drafts, evidence, idempotency, withdrawal and rollback           |
| Completion/activity   | Existing evidence plus new DB constraints            | Durable completion independent from playhead; reviewed migration         |
| AI Chat/Live          | Existing useful live/audio modules                   | Current scene context; controlled pause/resume and separate assistant UI |

These services are references to examine, not promises that copying a file completes them.
Extract by capability and preserve tests; do not copy the entire old router/classroom.
DB structural gaps identified earlier require targeted changes, not reset/recreation.
Connect to a separate DB branch for acceptance before switching the student site.
No old registrations or released artifact URLs are deleted as part of the new skeleton.

## Verification honesty

Development tones have deterministic measured WAV durations and synthetic marker times.
They test the engine boundary, not narration quality, actual ASR or scientific teaching.
The shipped browser runner covers normal flow, pause/seek, both layouts and audio retry.
Browser checks must actually run; tests existing in Git alone do not constitute acceptance.

## Accounts/catalog batch, 2026-10-09

The earlier foundation status above is historical. Modular Auth, DB catalog, account/library UI
and authorized review-lesson routes are now implemented. Schema and three migrations were applied
on an isolated Neon branch. No old student rows were migrated.
Live provider and live platform API/DB checks passed. Production import and progress writes remain pending.
The deployed signup/session/catalog/lesson/logout journey passed; the earlier missing Cloudflare DB binding assumption was corrected. See docs/account-delivery.md and docs/data-contract.md.
