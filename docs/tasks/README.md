# Tasks: who does what

The shared task list for **Owner** (technical lead) and **Ess** (UI/UX designer, works through
Claude Code). docs/roadmap.md says why; these files say who does each task, in what order, and
where it stands. Update the Status cell in the same PR that changes it.

Last full review: 2026-10-27.

| File                       | Areas                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| [launch.md](launch.md)     | Connector go-live, brand and domain, website, YC and demo, legal, operations                            |
| [learning.md](learning.md) | Student pages and states, questions and exams, streaks and rewards, Nova, content, parents and children |
| [teaching.md](teaching.md) | Course studio, teacher pages, publishing and accounts, boards, marketplace and payments, admin          |
| [voice.md](voice.md)       | Nova everywhere (lesson tools, Start button), the builder worker, paid plans                            |
| [rounds.md](rounds.md)     | The same tasks grouped into working sessions (one PR each), in waves                                    |

## How to read the tables

- **Priority**
  - **P0:** before the YC application (2 November).
  - **P1:** before the first real teachers and students.
  - **P2:** before a public launch.
  - **P3:** later.
- **Status**
  - **Idea:** written down, not agreed yet. Owner confirms before anyone starts.
  - **Todo:** agreed, not started.
  - **Doing:** someone is working on it.
  - **Blocked:** waiting on the row or decision in Needs.
  - **Done:** finished.
- **Who**
  - **Owner** or **Ess**: that person does it.
  - **Both:** usually Ess designs the screens and Owner builds the server side.
- **Needs:** the task IDs or decisions (D…) that must come first.

## How Ess works with Claude Code

Ess's tasks are visual and content work: pages, layouts, states, copy, brand, the website and
the video. They don't need developer decisions. Start each session with:

> Read AGENTS.md and docs/tasks/README.md. I'm working on task E5. Work on a new branch, show
> me screenshots at 390px and 1280px, and open a PR when the checks pass.

- Look at every screenshot yourself. Passing tests do not prove the page looks right.
- For a "Both" task, Ess designs the screen. Claude Code can build it with placeholder data
  only when the data really exists or Owner has added it. Never fake saving or progress.
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

## Decisions waiting

| ID  | Question                                                                                                                            | Decides | Blocks     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------- |
| D1  | Brand name                                                                                                                          | Both    | B, W, V    |
| D2  | Decided 2026-10-27: in-app writing runs on our builder (Codex CLI or Claude Code, API keys), paid by plans; see docs/voice-agent.md | Owner   | —          |
| D3  | Rewards: which of streaks, points, badges and leaderboards, and which ones children see                                             | Both    | R3, R4, R8 |
| D4  | Written answers: show a model answer and let the student check themselves, or grade with AI (a cost per answer)                     | Owner   | Q9         |
| D5  | Classroom look: keep the old Learn classroom, or move it to the new brand                                                           | Both    | B3         |
| D6  | Payments provider that works in Egypt, the Gulf and abroad, with teacher payouts (needed early: paid from the start)                | Owner   | Y11, M4    |
| D7  | Mobile: installable web app first, or a native app                                                                                  | Owner   | E18        |
| D8  | Children: minimum ages, parent consent and data rules per country                                                                   | Owner   | P1, L4     |
| D9  | Paid courses: human review of boards beyond `board:check`?                                                                          | Owner   | G5         |
| D10 | Remotion licence: free up to 3 people; the lesson player needs a paid plan when the company reaches 4                               | Owner   | —          |
| D11 | Decided 2026-10-28: the builder runs on wp-slack-agent's VPS, as its own user and folder (docs/builder-server.md)                   | Owner   | —          |

## P0: before YC (2 November)

A1–A5 connector live; D1/B1 brand name; B2 identity; W1, W2 and W4 website; V1–V6 demo
course, video, screenshots, application and first users; E1 teacher pages polish.

## Done (for context)

- Accounts, library, curriculum pages, and reading lessons with saved progress and goals.
- Curricula imported through `content:import`.
- Nova: chat, voice, end-of-lesson practice, and hands-free mode.
- Boards v1:
  - sandboxed board origin, fixed canvases and `board:check`;
  - the chapter 8 Young's modulus board.
- Connector (PR #25):
  - MCP tools and OAuth;
  - teacher drafts, notes per step and board self-checks.
