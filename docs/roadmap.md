# Roadmap: what comes next

Owner plan, 2026-10-21. New Learn becomes a platform where anyone builds interactive,
voice-tutored lessons with their own Claude or ChatGPT, in any language, at near-zero AI
cost to us. Items are ordered by importance: each depends on, or gains most from, the
ones above it. This is direction, not approval: the rules in AGENTS.md still apply.

| Rank  | Idea                               | Why it matters                                        | Needs first |
| ----- | ---------------------------------- | ----------------------------------------------------- | ----------- |
| 1     | Claude & ChatGPT connector         | Users' own AI writes lessons; our AI cost stays ~zero | —           |
| 2     | User-created curriculums           | Today curricula only arrive as reviewed imports       | 1           |
| 3     | Feedback notes + "fix all"         | Note in the app, fix everything in Claude             | 1, 2        |
| 4     | Modular lessons + sandboxed boards | Interactive lessons in many styles, safely            | 2           |
| 5     | Community marketplace              | Teachers publish free or paid courses                 | 2, 3        |
| 6     | Child mode                         | Parents build, kids play                              | 2, 4        |
| 7     | Exams and quizzes                  | Mastery per goal, not just a score                    | 2           |
| 8     | Growth features                    | Classrooms, share links, parent reports, schools      | 2, 5        |
| 9     | Learner features                   | Spaced review, explain-it-back, adaptive, offline     | 2           |
| 10    | Creator tools                      | Remix, translation, analytics, photo-to-lesson        | 2, 5        |
| Later | "Follow my source" mode            | Book-guided lessons from users' own material          | 2, 4        |

## 1. Claude & ChatGPT connector

One remote MCP server serves both Claude and ChatGPT. The user's AI writes; our server
only validates and stores.

- Host the MCP endpoint beside `/api` on Cloudflare Pages Functions; store in Neon via Drizzle.
- OAuth layer in front of Neon Auth so each user sees only their own curricula.
- First tools: `create_curriculum`, `add_lesson`, `get_scene`, `update_scene`, `list_my_curriculums`.
- Never call an AI model from our server for authoring; strict tool inputs keep content consistent.
- Database growth is the main scaling cost; free-tier limits are where a paid plan fits.
  Sell extra features on our own site, not inside the chat.

Claude directory (any paid plan, Pro is enough): test as a custom connector first; every
tool needs a `title` and `readOnlyHint` or `destructiveHint`; prepare privacy policy, docs
URL, support contact, icon and a populated reviewer test account; submit at
claude.ai/directory/manage. Listing is Community by default; Verified has no application.

ChatGPT directory (stricter): verified OpenAI Platform organization (Owner submits), a CSP
listing fetched domains, a `/.well-known/` domain token, 3+ screenshots, human review,
global data residency project.

## 2. User-created curriculums

Curricula now enter only as reviewed, immutable bundles via `content:import`
(docs/content-import.md). There is no user-owned curriculum yet.

1. A user-owned drafts table, separate from reviewed published editions.
2. Reading lessons (`delivery: 'reading'`) only at first: structured text the tools can
   validate. Recorded lessons need real audio and timings; book-guided is "Later".
3. Boards limited to renderers we already have, chosen from a fixed list.
4. A screen to see, play and study drafts; a version on every change.
5. Test schema changes on a separate Neon branch first; no renames of existing tables.

## 3. Feedback notes and "fix all"

- A feedback toggle on any scene saves a note with its `LessonContext` position:
  `sceneId`, `phase`, `step`.
- Tools: `list_feedback`, `get_scene`, `update_scene`, `resolve_feedback(id, summary)`.
- Every AI fix is a new revision (undo); statuses open / fixed / dismissed; note types
  text, board, question, translation.
- Later: learners flag "I didn't understand this" and the author's AI picks it up.

## 4. Modular lesson area and sandboxed boards

The board (`VisualSpec`: renderer + params) can run HTML, canvas, React or code-made
video. User code never runs in the app origin (AGENTS.md forbids unreviewed code there).
Research on OpenMAIC, MCP Apps, HyperFrames and Remotion: docs/research/openmaic.md.

- Board runs in an iframe on a separate domain, with no access to logins or user data.
- A small message bridge: step started, question answered, show feedback.
- No outside network calls; a fixed set of allowed libraries (canvas, React, Three.js, KaTeX).
- Board types: built-in renderers; sandboxed user boards; Remotion in the browser or a
  pre-rendered video; board templates (number line, graph, molecule, timeline) the AI fills.
- Avoid server-side rendering (e.g. Manim) because it brings costs back.

## 5. Community marketplace

- Publish flow: draft, self-check, then a free or paid immutable edition. Per-edition
  enrollments already protect existing students' progress.
- Discovery by grade, subject, language and rating; a free preview lesson.
- Revenue share (teacher keeps ~70–80%) through a provider that pays out in teachers' countries.
- Reports, ratings, review before anything appears in child mode; authors confirm rights.

## 6. Child mode

- A theme layer in apps/platform (docs/design-system.md): backgrounds, large rounded buttons.
- A roadmap view of the curriculum as a path, driven by saved progress.
- An original character in the lesson that reacts to the phase (teach, ask, attempt, feedback).
- Stricter Nova instructions for children; child-data and consent rules per country.
- Adults build with Claude or ChatGPT (18+); children only study in New Learn.

## 7. Exams and quizzes

Reading lessons already link goals to questions, so exams can pull questions per goal and
report mastery per skill. The user's AI generates exams through the connector. Nova quiz
score and state stay controlled by our code.

## 8. Growth features

Classroom mode (assign, track by scene), shareable links with the first scene playable
without an account, weekly parent summary, school licenses per class, certificates and streaks.

## 9. Learner features

Spaced review of missed questions, explain-it-back by voice, adaptive easier steps,
offline reading lessons, any learner language.

## 10. Creator tools

Remix with credit, one-click translation as a new edition, creator analytics on drop-off
and failed questions, photo of notes to reading lesson.

## Later: "follow my source" mode

Book-guided lessons (docs/book-guided-preview.md, docs/book-physics-release.md) need
scans, figure crops and verbatim excerpts, which users' AI cannot produce reliably and
which raise copyright questions. First user version: their own pasted notes as the source.

## Fundraising

Considering a YC application. Traction matters more than features: weekly active
students, learning results, some revenue, and a sharp edge ("any source becomes a guided
lesson", "parents build curricula with their own AI"). Global product, narrow start in
the Arabic-speaking world.
