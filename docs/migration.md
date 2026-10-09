# Delivery status and next steps

## Foundation implemented

Independent configuration/dependencies, workspace runtime, ephemeral preview host,
custom test renderer, synthetic assets, pure session tests, browser acceptance runner,
and CI enforcement of code boundaries/300 lines.

This is not completion of the new platform or a released authoring SDK.
The current fixture is original test content, not an imported approved lesson.
No auth, catalog API, database, persistence, content importer or assistant was created.
The old deployed platform and authoring repository were not changed by this batch.

## Next delivery: distribution and factory adapter

1. Build runtime ESM/type declarations/CSS and a versioned installation artifact.
2. Validate/adapt factory learn-authoring scenes, selected receipts and reviewed cues.
3. Build custom React scene modules using the same declared public runtime interface.
4. Install in an independent minimal preview consumer without a ../learn checkout.
5. Verify a real reviewed recording/question, both ratios and mobile autoplay behavior.
6. Only then add preview integration to learn-curriculums and update its review instructions.

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
