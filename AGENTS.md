# Working on New Learn

Read README.md and docs/architecture.md before changing boundaries.
This repository owns the student application and the shared lesson runtime.
Curriculum authoring lives in addvaluewithai-hub/learn-curriculums.
The old addvaluewithai-hub/learn is a reference, not a workspace dependency.

## Boundaries

- apps/platform owns navigation, authentication, catalog and persistence adapters.
- packages/lesson-runtime owns frame-based playback, questions and composition interfaces.
- fixtures/runtime-probe contains synthetic development content only.
- Runtime source imports only itself, React/React DOM, Remotion and @remotion/player.
- Curriculum custom components and parameters belong to content packages, not engine switches.
- Add directories when used; do not pre-create a folder for every future feature.
- Keep authored code, CSS and tests at most 300 lines after readable formatting.
- Split by responsibility, not part1/part2 or minification.
- Use explicit public exports between packages; no reaching into another package's src.

## Implementation and checks

Start from the smallest complete behavior. Do not create fake login or saving success.
Port useful old services with contract tests and only their necessary dependencies.
Do not copy the old Classroom, global stylesheet, curriculum registry or server router wholesale.
Every code change needs relevant type/build/tests; engine changes also require browser flow checks.
Use npm ci; npm run prepare:fixture; npm run format:check; npm run check; npm test; npm run build.
Browser check: npx playwright install chromium; npm run test:browser.
Never mark a blocked or unrun browser check as passed.

## Content, media and data

Preview is ephemeral and has no login, DB, localStorage or student-progress persistence.
The runtime-probe uses generated tones and synthetic anchors. Do not present it as speech or course review.
Structural runtime validation is not an editorial/audio/publication approval.
The contentAudit field preserves legacy shape; it is not trusted publication authorization.
Authoring sources are not executable LessonPackage artifacts. A reviewed adapter/build pipeline is pending.
Do not execute unreviewed uploaded JSX or arbitrary module URLs in the student application.
Production import must retain immutable files and bind review to the exact content/runtime edition.
No resets or schema renames merely to match new code folder names.
Test later DB changes on a separate branch before connecting the new app to production.
Do not change the deployed old platform while implementing this foundation.
