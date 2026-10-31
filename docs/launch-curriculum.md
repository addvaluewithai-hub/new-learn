# Launching a curriculum (runbook for any agent)

From reading-ready lessons in `learn-curriculums` to students on the platform. Every
subject follows the same steps; nothing is built per curriculum. You need push access to
both repositories. Never hand-edit generated files, never reuse a revision, never reset data.

## 1. Ready in learn-curriculums

- Each lesson to publish passes `npm run validate -- --course <c> --lesson <l> --stage reading`,
  its frames were checked in both layouts, and STATUS records it (instructions/reading-release.md).
- `course.json` has a `catalog` block (title, description, subject) whose `parts` list
  **every** lesson in teaching order. Lessons that are not ready still need their
  `lessons/<id>/lesson.json`; they export as skipped and show as «قريبًا».
- Boards: one module per renderer directly in the lesson's `scenes/`, importing only
  `remotion` and `@learn/lesson-runtime`, about 300 lines a file at most. They receive the shared
  board contract (docs/content-import.md, "The contract every curriculum meets"): the clip's
  lines in `reading.steps`, the question in `question.readingParts`, the answer in
  `answer.parts`. No text needs to be injected into params.
- Your branch includes `main` (the export names each revision after exactly what ships).
- Merge the curriculum PR to `main` once the owner agrees, then on `main`:
  `npm run export:platform -- --course <c>` → `dist/platform/<c>/` (not committed).

## 2. Import into new-learn

```bash
git checkout -b <branch> origin/main && npm ci
npm run content:import -- ../learn-curriculums/dist/platform/<c>
```

The import verifies hashes and the reading package, compiles nothing yet, and writes
`content/imported/**` plus `apps/platform/content-modules.json`. It refuses a revision that was
already released with other files: re-export instead (the export gives a new revision).

## 3. Prove it before the PR

```bash
npm run format:check && npm run check && npm test && npm run build
npm run functions:check && npm run test:browser:reading
```

`check` notes imported board files over 300 lines and fails above 800; `build` compiles them with strict
TypeScript. Then look at the lessons yourself: with `npm run preview` and a mocked `/api`
(copy the route handler in `tests/reading-browser.mjs`), open
`/?lesson=<lessonId>&curriculum=<c>` at 390 and 1280 px, step through a teaching scene, a
question and its feedback, and check the board shows the question and the answer. Attach the
screenshots to the PR.

## 4. Merge, then the database

Open the PR against `main`, wait for CI, merge. Cloudflare Pages deploys `main`.
The **Content sync** workflow then writes curricula, lessons, editions and releases to the
database. It needs the repository secret `CONTENT_DATABASE_URL`; open the run and confirm it
did not print "CONTENT_DATABASE_URL is not set". Without the secret, someone with database
access runs `DATABASE_URL=… npm run content:sync` (`-- --print` shows the SQL first).
Deploy-then-sync is the safe order: until the sync, new lessons stay hidden or «قريبًا».

## 5. Check on the live site

The curriculum appears in «مناهجي», its published lessons open and save progress, the rest
show «قريبًا». Record the release (date, revisions, PRs) in the curriculum's STATUS.
