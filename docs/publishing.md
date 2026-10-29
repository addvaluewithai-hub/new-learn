# Publishing: a teacher's draft reaches students

A draft (docs/connector.md) stays the place to edit. Publishing copies it, as a numbered
version, into tables students read. Later edits never change what students see until the
teacher publishes again.

## Tables (migration `0007_publish.sql`)

- `published_courses`: one row per course, with the draft's id. Holds the title, subject,
  description, parts, the teacher's name, the current `version`, `published_at` and
  `withdrawn_at`.
- `published_lessons`: one row per lesson per version, keyed by (course, version, lesson id).
  It freezes the lesson's `package` and the manifests of the boards it draws with. The board
  files themselves are content-addressed in `author_boards` and served by hash from the board
  origin, so a published lesson keeps drawing with exactly the board it was published with.
- `course_enrollments` (user, course) and `course_progress` (enrolment, lesson): the same
  snapshot and optimistic revision as `lesson_progress`, by course instead of edition.

A published package gets its own ids: `lessonId` is `pub:<lesson uuid>`, `curriculumId` is
`pub-course:<course uuid>`, `contentRevision` is `pub-<course>-v<n>`. The progress route and
Nova's context recognise `pub:` and read the course version instead of a compiled edition.

## The teacher's side: `?teach` (`/api/teach/*`)

- The dashboard lists every course: draft or published (version, stale when the draft moved
  on), students, open notes.
- One course's workspace has three tabs:
  - **النشر:** the self-check (lessons exist, the course has a title, every board is
    uploaded; drawing problems and open notes warn but do not stop), publish or update, the
    share link, and how many students started and finished each lesson. Withdrawing hides the
    course from students; their progress stays until the next publish.
  - **الترتيب:** rename the course, regroup lessons into parts with up, down and move-to-part;
    lessons left out of every part land in «دروس تانية», so none is lost. The order of parts
    is the order students get.
  - **الملاحظات:** every note on the course by status, with the step's current text; confirm a
    fix, open it again, or dismiss.

## The student's side: `?course=<id>` (`/api/courses/*`)

The share link opens the course page (title, teacher, parts and lessons, goals); a visitor
signs in first. «ابدأ الكورس» enrols and opens the next unfinished lesson; opening a lesson
link also enrols. Lessons play in the reading classroom with saved progress and Nova. The
library shows enrolled courses under «كورسات مسجّل فيها» with the next lesson.

## Checks

`apps/platform/tests/publish.test.ts` runs the store on PGlite: the self-check, versions,
frozen packages and boards, enrolment, progress with conflicts, withdrawal, the outline and
the notes count. `npm run test:browser:teach` drives the workspace and a student's course
against a mocked API at 1280px and 390px.

## Not yet

Paid courses, a read-only preview link of a draft, the first scene without an account, roll
back to an older version, and dragging in the outline.
