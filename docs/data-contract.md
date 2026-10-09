# Database and identity contract v1

Neon project `autumn-silence-88547693` is retained. No legacy student rows are migrated.
New Learn acceptance branch: `new-learn-accounts-20261009` (`br-fancy-silence-ay0a8y2f`).
It was created from `production`, then its own managed Better Auth was provisioned.
New application tables live in `learn_app`; migration ledger in `learn_migrations`.
Inherited `public.learn_*` tables are unused and are not platform dependencies.
The old deployed Learn still uses `dev-first-journey`; it was not modified.

## Ownership

| Table                 | Meaning                                | Identity and invariants                                                         |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| managed `neon_auth.*` | Account, credentials and login session | Neon owns its schema; app never stores passwords                                |
| curricula             | Catalog metadata                       | Stable text ID; draft/published/archived                                        |
| lessons               | Ordered lessons inside a curriculum    | Stable ID; unique positive position within curriculum                           |
| lesson_editions       | A pinned compiled content edition      | Lesson + content revision; immutable manifest SHA256, module ID and SDK version |
| lesson_releases       | Current availability pointer           | FK to an edition; review/published; only pointer changes for a later release    |
| lesson_enrollments    | A student's pinned lesson edition      | Unique user + lesson; identity and edition cannot change in place               |
| lesson_progress       | Durable state for that enrollment      | Versioned JSON snapshot + revision + durable completed_at                       |

`visibility=published` makes curriculum metadata visible; it does not approve or release its lessons.
The review seed exposes one review edition and eight coming-soon lessons.
`ALLOW_CONTENT_REVIEW=true` is an acceptance-environment setting, not editorial approval.
The compiled module descriptor must match lesson ID, content revision, manifest hash and SDK version.
The build registry is an allowlist; the student app never evaluates uploaded code or arbitrary module URLs.

## Content and storage

Code/custom scenes and media remain content artifacts, separate from these DB metadata tables.
`apps/platform/content-modules.json` pins the bundled review module. The renderer lives in `content/`.
Production factory import, immutable artifact retention, review receipts and release administration are pending.
Those steps must bind the exact source/audio/renderers/runtime; a DB stage flag alone is not review evidence.
The reviewed legacy package remains a technical review fixture, not newly approved course content.

## Progress boundary

Snapshot v1: schemaVersion, sceneId, phase, frame, reachedSceneIds and attempts.
Attempts carry stable IDs, scene/question IDs, optional choice index and written answer.
Phase matches the SDK narration/attempt/feedback/complete states, without persisting Player objects,
React components, buffering state, cookies or remount epochs.
Enrollment pins the edition; releasing a new edition cannot reinterpret existing progress.
Completion is separate from the cursor and must survive rewinding/replay.
An update must increment revision by one; the future writer must compare expected revision in its WHERE.
Future handlers derive user_id from currentUser, never from caller JSON, validate against the pinned lesson,
merge durable reached ends/attempt history, and return 409 for conflicts. Trigger checks alone are not that API.
No enrollment/progress/notes write endpoint exists in this batch. UI does not claim progress is saved.

## Security and migrations

Server-only `DATABASE_URL` uses SQL-created `learn_app_reader`, with SELECT on four catalog tables.
Verified: no BYPASSRLS, no auth table read, no progress read and no edition UPDATE privilege.
API-created `learn_platform_app` inherited elevated Neon privileges and is unused by the application.
Credentials stay outside Git/client bundles; managed auth validates cookies server-side.
Catalog and lesson endpoints require a current, unexpired, non-banned user.
Mutations require same-origin requests. Reset callbacks are set by the server.

Drizzle schema is under `apps/platform/server/db`; generated migrations are under `database/migrations`.
Generate with `npm run db:generate`; apply with an admin/direct DATABASE_URL via `npm run db:migrate`.
The restricted runtime reader cannot migrate or publish.
This environment could not use Drizzle's WebSocket migration transport, so generated migration statements
were applied atomically through Neon MCP on the isolated branch, preserving exact file hashes/timestamps
in the configured Drizzle ledger. Three migrations are applied. No production schema was changed.
`database/contracts.sql` verifies immutable editions, pinned enrollment, completion and revision guards;
temporary test enrollment/progress rows roll back inside subtransactions.

## Live audit, 2026-10-09

Existing app branch had 7 accounts, 168 enrollment rows, 7 curricula, 47 lessons and 1 release.
Its schema had no RLS and the legacy enrollment table was named learn_courses.
Those observations are not a diagnosis that Neon is broken; the clean app avoids the legacy state contracts.
After clarification that legacy rows were disposable, no data/account migration was performed.
New schema has 1 curriculum, 9 lessons, 1 review edition and zero enrollment/progress rows.
Live Auth and live platform API + real DB catalog passed. Existing accounts do not log into this new branch.
