# Working on New Learn

Read README.md and docs/architecture.md before changing boundaries.
Read docs/roadmap.md for the ordered plan of what to build next, and docs/tasks/README.md for who
does each task, its status and its dependencies.
This repository owns the student application and the shared lesson runtime.
Curriculum authoring lives in addvaluewithai-hub/learn-curriculums.
The old addvaluewithai-hub/learn is a reference, not a workspace dependency.

## Boundaries

- apps/platform owns navigation, authentication, catalog and persistence adapters.
- packages/lesson-runtime owns frame-based playback, questions and composition interfaces.
- fixtures/runtime-probe and fixtures/board-probe contain synthetic development content only.
- boards/ is the board origin (helper, allowed libraries); it is a separate site from the app.
- Runtime source imports only itself, React/React DOM, Remotion and @remotion/player.
- Curriculum custom components and parameters belong to content packages, not engine switches.
- Add directories when used; do not pre-create a folder for every future feature.
- Aim for at most 300 lines per authored file (code, CSS, tests) after readable formatting.
  It is a guideline, not a hard limit: a file that reads better whole may run to 400 or more.
  Split when there is a natural seam (by responsibility); don't split just to hit a number.
  `npm run check` lists files over 300 as a note and fails only above 500 ("very big").
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
Authoring sources are not executable LessonPackage artifacts. Curricula arrive as reviewed platform bundles through `npm run content:import` (docs/content-import.md); lessons may be published text-first as reading lessons and gain audio later. Generated files under content/imported/ are never hand-edited. To launch a curriculum end to end, follow docs/launch-curriculum.md.
Do not execute unreviewed uploaded JSX or arbitrary module URLs in the student application.
Teacher-made board code (docs/boards.md) is the one exception, and only on the board origin:
sandboxed iframe without allow-same-origin, server CSP with no network, content-addressed
immutable files, allowed libraries only. It never runs on the app origin, and our code, not
the board, grades answers. Every board passes `npm run board:check` before it is used; board
and board-tool changes also need `npm run test:browser:board` and `npm run test:board-check`.
Production import must retain immutable files and bind review to the exact content/runtime edition.
No resets or schema renames merely to match new code folder names.
Migrations apply to the app's database by themselves when they reach main (Database migrate
workflow); there is no learner data yet, so no separate test branch is used.
Do not change the deployed old platform while implementing this foundation.
