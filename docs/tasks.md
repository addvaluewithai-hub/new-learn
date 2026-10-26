# Tasks: who does what

Shared task list for the two of us: **Owner** (technical lead) and **Ess** (UI/UX designer,
works through Claude Code). docs/roadmap.md explains why; this file says who, in what order,
and where each task stands. Update the Status cell in the same PR that changes it.

Last full review: 2026-10-26.

## How to read it

- **Priority**
  - **P0:** before the YC application (2 November).
  - **P1:** before the first real teachers and students.
  - **P2:** before a public launch.
  - **P3:** later.
- **Status**
  - **Todo:** not started.
  - **Doing:** someone is working on it.
  - **Blocked:** waiting on the dependency or the decision named in the row.
  - **Done:** finished.
- **Needs:** the task IDs that must be done first.
- **Owner + Ess:** Ess designs and Owner wires the server side, or Owner decides and Ess builds.

## How Ess works with Claude Code

Ess's tasks are visual and content work: pages, layouts, copy, brand, the website and the
video. They don't need developer decisions. Start each session with:

> Read AGENTS.md and docs/tasks.md. I'm working on task E3. Work on a new branch, show me
> screenshots at 390px and 1280px, and open a PR when the checks pass.

- Look at every screenshot yourself. Passing tests do not prove the page looks right.
- **Stop and ask Owner** if Claude says the change needs any of these:
  - `apps/platform/server/`, `functions/`, `database/`, `packages/lesson-runtime/` or `boards/`;
  - login, the MCP connector, OAuth or the database;
  - Cloudflare, Neon or GitHub settings;
  - a new library.
- Never paste passwords, keys or database links into a chat.
- Owner reviews and merges PRs.
- Safe places for Ess's changes:
  - `apps/platform/src/features/**` (`.tsx` markup and `.css`);
  - `apps/platform/src/shared/`;
  - the new `site/` folder (W1);
  - `docs/`.

## A. Connector go-live (Owner)

| ID  | Task                                                                                        | Owner | Pri | Status | Needs  |
| --- | ------------------------------------------------------------------------------------------- | ----- | --- | ------ | ------ |
| A1  | Neon test branch; apply migration 0005 there (docs/connector.md step 1)                     | Owner | P0  | Todo   | —      |
| A2  | Create the `learn_board_reader` role on that branch                                         | Owner | P0  | Todo   | A1     |
| A3  | Cloudflare: Preview `DATABASE_URL` for `new-learn` and `new-learn-boards`                   | Owner | P0  | Todo   | A1, A2 |
| A4  | End-to-end test in Claude on a preview: connect, make a course with a board, note, fix      | Owner | P0  | Todo   | A3     |
| A5  | Production: migration, variables, connector at `https://new-learn.pages.dev/mcp`            | Owner | P0  | Todo   | A4     |
| A6  | GitHub secret `CONTENT_DATABASE_URL` so Content sync writes to the database                 | Owner | P1  | Todo   | —      |
| A7  | Test the same flow from ChatGPT (developer mode connector)                                  | Owner | P1  | Todo   | A5     |
| A8  | Rate limits: OAuth client registration, `/mcp` calls, Nova (shared quotas, not per isolate) | Owner | P1  | Todo   | A5     |
| A9  | "Connected apps" page: see and revoke Claude/ChatGPT access (Owner API, Ess design)         | Both  | P2  | Todo   | A5     |

## B. Brand and domain

| ID  | Task                                                                                            | Owner | Pri | Status  | Needs |
| --- | ----------------------------------------------------------------------------------------------- | ----- | --- | ------- | ----- |
| B1  | Brand name: shortlist, check domain and social handles, Owner and Ess choose                    | Both  | P0  | Todo    | —     |
| B2  | Visual identity: logo, colours, type, icon; written as tokens in `apps/platform/src/shared/`    | Ess   | P0  | Todo    | B1    |
| B3  | Apply the identity to account, library and teacher pages (classroom design stays, see note)     | Ess   | P1  | Todo    | B2    |
| B4  | Buy the domain                                                                                  | Owner | P1  | Todo    | B1    |
| B5  | Domain on Cloudflare: app, `boards.` subdomain, auth callbacks, `VITE_BOARD_ORIGIN`, frame list | Owner | P1  | Blocked | B4    |
| B6  | Support email on the domain                                                                     | Owner | P1  | Blocked | B4    |

Note on B3: docs/design-system.md keeps the old classroom look. Changing the classroom itself
is an Owner decision first.

## W. Public website (Ess)

| ID  | Task                                                                                     | Owner | Pri | Status | Needs  |
| --- | ---------------------------------------------------------------------------------------- | ----- | --- | ------ | ------ |
| W1  | Landing page in a new `site/` folder (static), its own Cloudflare Pages project by Owner | Ess   | P0  | Todo   | B1     |
| W2  | Teacher page: "connect your Claude or ChatGPT", steps with screenshots                   | Ess   | P0  | Todo   | A4, W1 |
| W3  | Privacy policy, terms and support contact (draft with Claude; Owner reviews)             | Ess   | P1  | Todo   | W1     |
| W4  | Waitlist or sign-up button: links to the real sign-up, no fake "thanks" form             | Ess   | P0  | Todo   | W1     |
| W5  | Share image, favicon, page titles and descriptions                                       | Ess   | P1  | Todo   | B2, W1 |
| W6  | Arabic and English versions of the site                                                  | Ess   | P2  | Todo   | W1     |

## V. Video, demo and YC

| ID  | Task                                                                                    | Owner | Pri | Status | Needs |
| --- | --------------------------------------------------------------------------------------- | ----- | --- | ------ | ----- |
| V1  | Demo course made through the connector (Ess as the teacher: prompts, notes, fixes)      | Ess   | P0  | Todo   | A5    |
| V2  | Product video (1–2 min): ask Claude, draft, board, note, fix, student studies with Nova | Ess   | P0  | Todo   | V1    |
| V3  | Screenshot set, 3 or more (YC, website, ChatGPT directory)                              | Ess   | P0  | Todo   | V1    |
| V4  | Founder video and the YC application text                                               | Owner | P0  | Todo   | —     |
| V5  | Demo/reviewer account with the demo course (YC and the Claude directory need it)        | Owner | P0  | Todo   | V1    |
| V6  | First real users: teachers and students using it weekly; Ess collects their notes       | Both  | P0  | Todo   | A5    |
| V7  | Usage numbers: weekly active students, lessons finished (privacy-safe, server side)     | Owner | P1  | Todo   | A5    |

## E. Student and teacher pages (Ess unless noted)

From docs/ux-audit.md ("Still open"), plus the new teacher pages.

| ID  | Task                                                                                         | Owner | Pri | Status | Needs |
| --- | -------------------------------------------------------------------------------------------- | ----- | --- | ------ | ----- |
| E1  | Teacher pages polish: «مسوداتي», draft preview, notes panel, consent screen                  | Ess   | P0  | Todo   | —     |
| E2  | In-app "connect your AI" card for teachers with a copy button for the `/mcp` link            | Ess   | P1  | Todo   | A5    |
| E3  | Library cards: art per subject, remove filler label, real counts                             | Ess   | P1  | Todo   | —     |
| E4  | Curriculum page: hero repeats first item, long card list, double «قريبًا»                    | Ess   | P1  | Todo   | —     |
| E5  | Classroom header: misleading «الدروس»/«المكتبة» labels, dead «مساحة الدرس» pill              | Ess   | P1  | Todo   | —     |
| E6  | One digit system across the app (Western suggested, suits maths)                             | Ess   | P1  | Todo   | —     |
| E7  | Review wording students should not see («نسخة للمراجعة»)                                     | Ess   | P1  | Todo   | —     |
| E8  | Profile/settings page: name, password, language, Nova wake word (Owner adds missing API)     | Both  | P1  | Todo   | —     |
| E9  | Empty, loading and error states on every page, at 390px and 1280px                           | Ess   | P2  | Todo   | —     |
| E10 | Accessibility pass: contrast, focus rings, keyboard, screen reader labels                    | Ess   | P2  | Todo   | —     |
| E11 | Recorded-lesson start state (blank board, small Play)                                        | Ess   | P2  | Todo   | —     |
| E12 | Recorded-lesson progress: Ess designs steps/numbers, Owner builds (runtime)                  | Both  | P2  | Todo   | F5    |
| E13 | Offer Nova practice from the completion screen                                               | Ess   | P2  | Todo   | —     |
| E14 | Real-phone tests: iPhone Safari and Android, Nova voice, hands-free mode; report with videos | Ess   | P1  | Todo   | —     |

## F. Platform (Owner)

| ID  | Task                                                                                      | Owner | Pri | Status | Needs      |
| --- | ----------------------------------------------------------------------------------------- | ----- | --- | ------ | ---------- |
| F1  | Publish a draft course to students: immutable edition, enrolment, catalog card            | Owner | P1  | Todo   | A5         |
| F2  | Share a preview link of a draft with someone else (read-only)                             | Owner | P2  | Todo   | F1         |
| F3  | Real mailbox test of password reset email                                                 | Owner | P1  | Todo   | B6         |
| F4  | Claude directory submission (privacy, docs URL, support, icon, reviewer account)          | Owner | P2  | Todo   | A8, W3, V5 |
| F5  | Recorded (audio) lessons: import audio, progress and resume, cues mapped to steps         | Owner | P2  | Todo   | —          |
| F6  | `content:import` support for board folders                                                | Owner | P2  | Todo   | —          |
| F7  | Media storage outside the build (Cloudflare R2), retained before release                  | Owner | P2  | Todo   | —          |
| F8  | ChatGPT directory: verified OpenAI org, domain token, CSP list, screenshots, human review | Owner | P2  | Todo   | B5, W3, V3 |
| F9  | Release admin screen (withdraw, roll back an edition)                                     | Owner | P3  | Todo   | F1         |
| F10 | Classroom fidelity: scene dropdown and progress readout through runtime host APIs         | Owner | P3  | Todo   | —          |

## G. Boards (Owner)

| ID  | Task                                                                                  | Owner | Pri | Status  | Needs |
| --- | ------------------------------------------------------------------------------------- | ----- | --- | ------- | ----- |
| G1  | Nova sets declared board variables live while explaining (clamped to ranges)          | Owner | P2  | Todo    | —     |
| G2  | Board template gallery: number line, graph, molecule, timeline (Ess designs the look) | Both  | P2  | Todo    | —     |
| G3  | Hands-free board questions: a spoken answer sets the checked variables                | Owner | P3  | Todo    | G1    |
| G4  | Boards inside Claude/ChatGPT chat through MCP Apps, same files                        | Owner | P3  | Todo    | A5    |
| G5  | Decide whether paid courses need human review of boards beyond `board:check`          | Owner | P3  | Blocked | M1    |

## M. Later roadmap (docs/roadmap.md items 5–10)

| ID  | Task                                                                                         | Owner | Pri | Status | Needs  |
| --- | -------------------------------------------------------------------------------------------- | ----- | --- | ------ | ------ |
| M1  | Marketplace: free/paid editions, discovery, ratings, reports, payouts (Ess: pages)           | Both  | P3  | Todo   | F1     |
| M2  | Child mode: theme, path view, original character (Ess designs), stricter Nova, consent rules | Both  | P3  | Todo   | F1     |
| M3  | Exams and quizzes with mastery per goal, made by the teacher's AI                            | Owner | P3  | Todo   | F1     |
| M4  | Learner flags "I didn't understand this"; it reaches the author's AI as a note               | Owner | P3  | Todo   | F1     |
| M5  | Growth: classroom mode, first scene playable without an account, parent summary, schools     | Both  | P3  | Todo   | F1     |
| M6  | Learner: spaced review, explain-it-back, adaptive steps, offline, any learner language       | Owner | P3  | Todo   | F1     |
| M7  | Creator tools: remix with credit, one-click translation, creator analytics, photo-to-lesson  | Owner | P3  | Todo   | F1, V7 |
| M8  | "Follow my source" mode: lessons from the user's own pasted notes                            | Owner | P3  | Todo   | F1     |

## Done (for context)

- Accounts, library, curriculum pages and reading lessons with saved progress.
- Imported curricula.
- Nova chat, voice, practice and hands-free mode.
- Board contract v1:
  - sandboxed board origin, fixed canvases and `board:check`;
  - the chapter 8 Young's modulus board.
- Connector (PR #25):
  - MCP tools and OAuth;
  - teacher drafts, notes and board self-checks.
