# Curriculum import: from learn-curriculums to students

Owner decision (2026-10-12): lessons are published **text-first**. A lesson can reach
students as a **reading lesson** (written explanation + its own board + questions) before
any audio exists. Audio is a later upgrade of the same lesson, imported the same way.

## Pipeline

1. **Authoring repo** (`learn-curriculums`): a lesson is exportable when
   `validate --stage reading` passes. Then
   `npm run export:platform -- --course <id>` writes `dist/platform/<course>/`:
   `bundle.json` (student-facing catalog block, ready lessons, not-yet-ready lessons with
   the reason) and per lesson `reading.json`, `board/*.tsx`, `assets/` and `lesson.json`
   with a SHA256 manifest.
2. **Import here:** `npm run content:import -- <path>/dist/platform/<course>`.
   It verifies every file hash and the manifest hash, validates the reading package with
   the runtime validator and the lesson's declared boards, then writes:
   - `content/imported/<course>/<lesson>/` (package, board code, assets, `index.ts`);
   - `content/imported/registry.json` (catalog: all lessons, ready ones with edition data);
   - `content/imported/modules.ts` (client allowlist) and `packages.ts` (server, JSON only);
   - `apps/platform/content-modules.json` pins with `delivery: "reading"`.
     Re-importing a course replaces that course only. Generated files are not hand-edited.
3. **Review and merge** the import as a normal PR. Board code is reviewed source compiled
   into the app; the student app still never evaluates uploaded code or remote modules.
4. **Deploy** (Cloudflare Pages builds `main`). `prepare:content` serves each lesson's
   assets after re-checking their hashes.
5. **Database sync:** `npm run content:sync` with an admin/direct `DATABASE_URL` upserts
   curricula (published), lessons (positions), immutable editions and release pointers
   (`published`). `npm run content:sync -- --print` shows the SQL without connecting.
   The `Content sync` workflow runs it on `main` when `CONTENT_DATABASE_URL` is set.

Until step 5 runs, a newly imported lesson stays "coming soon" (catalog requires both the
DB release and a matching build pin). After it runs, students see it as available.

## Reading delivery in the runtime (0.3.0)

`ReadingLesson` renders a `delivery: "reading"` package: one semantic unit per step, the
lesson's own board at the state after that unit, numbered progress (scene and step), a
question page that hides the model answer until an attempt, feedback steps and a
completion screen. `validateReadingPackage`, `readingPages` and `readingContext` are in
`@learn/lesson-runtime/core`. Reading context keeps the recorded-lesson shape with
`delivery: "reading"` and `step`; Nova resolves and checks that position server-side.

## Goals and parts

Each lesson objective becomes a goal (`studentText` wording, scenes that teach it, questions that
check it); a goal is met when its questions were attempted. Optional `catalog.parts` group lessons
on the study plan. Both travel in the bundle and land in `content/imported/registry.json`.

## What import does not do

It does not approve teaching quality or science: the authoring repo's reading-ready
checks and the owner's decision cover that. It does not write the database by itself and
saves progress only through the progress API (see data-contract.md).
