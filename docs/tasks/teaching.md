# Teaching: studio, teacher pages, publishing, boards, marketplace, admin

See README.md for priorities, statuses and how Ess works with Claude Code.

## S. Course studio

Today a teacher writes with Claude or ChatGPT in their own app, and previews drafts in ours.
The studio brings the same MCP tools into a page on our platform, with buttons and a live
preview. The writing runs on our builder worker (docs/voice-agent.md, Y6–Y7).

| ID  | Task                                                                                              | Who   | Pri | Status | Needs |
| --- | ------------------------------------------------------------------------------------------------- | ----- | --- | ------ | ----- |
| S1  | Guide for Claude Code CLI and Claude Desktop (`claude mcp add --transport http …/mcp`), tested    | Owner | P1  | Todo   | A5    |
| S2  | Studio page: chat with the AI beside the live draft; shows what it is doing ("writing lesson 2…") | Both  | P2  | Todo   | Y7    |
| S3  | Course outline editor without AI: rename, reorder lessons and parts by dragging                   | Both  | P1  | Todo   | A5    |
| S4  | Edit a step's text by hand in the preview (saved as a new revision)                               | Both  | P2  | Todo   | A5    |
| S5  | Revision history: see versions, compare, restore                                                  | Both  | P2  | Todo   | A5    |
| S6  | Upload sources (PDF, notes, photos) for the AI to build from                                      | Owner | P2  | Todo   | F7    |
| S7  | Course cover and art picker                                                                       | Both  | P2  | Todo   | K2    |
| S8  | Notes inbox: every note in a course, filtered by status                                           | Both  | P1  | Todo   | A5    |
| S9  | Board check results shown to the teacher, with the screenshot                                     | Both  | P2  | Todo   | A5    |
| S10 | Starters: "a course from this syllabus", "one lesson on this topic"                               | Both  | P2  | Todo   | S2    |
| S11 | Import PowerPoint or PDF slides into a lesson                                                     | Owner | P3  | Idea   | S6    |
| S12 | New scene kinds: whiteboard drawing, slides                                                       | Owner | P3  | Idea   | —     |

## T. Teacher pages

| ID  | Task                                                                        | Who  | Pri | Status | Needs  |
| --- | --------------------------------------------------------------------------- | ---- | --- | ------ | ------ |
| T1  | Teacher dashboard: courses, drafts, published, students, open notes         | Both | P1  | Todo   | A5     |
| T2  | Publish flow screens: self-check, then publish free or paid                 | Both | P1  | Todo   | F1     |
| T3  | Classes: invite students by link or code, assign lessons, progress by scene | Both | P2  | Todo   | F1     |
| T4  | Where students struggle: failed questions and drop-off per lesson           | Both | P2  | Todo   | T3, V7 |
| T5  | Teacher public profile page                                                 | Both | P3  | Todo   | M1     |
| T6  | In-app "connect your AI" card with a copy button for the `/mcp` link        | Ess  | P1  | Todo   | A5     |

## F. Publishing and accounts (Owner)

| ID  | Task                                                                                      | Who   | Pri | Status | Needs      |
| --- | ----------------------------------------------------------------------------------------- | ----- | --- | ------ | ---------- |
| F1  | Publish a draft course to students: immutable edition, enrolment, catalog card            | Owner | P1  | Todo   | A5         |
| F2  | Share a read-only preview link of a draft                                                 | Owner | P2  | Todo   | F1         |
| F3  | Real mailbox test of password reset                                                       | Owner | P1  | Todo   | B6         |
| F4  | Email verification, delete my account, download my data                                   | Owner | P2  | Todo   | L1         |
| F5  | Sign in with Google                                                                       | Owner | P2  | Idea   | B5         |
| F6  | Roles: student, teacher, parent, admin                                                    | Owner | P2  | Todo   | —          |
| F7  | Media storage outside the build (Cloudflare R2), kept before release                      | Owner | P2  | Todo   | —          |
| F8  | `content:import` support for board folders                                                | Owner | P2  | Todo   | —          |
| F9  | Claude directory submission (privacy, docs URL, support, icon, reviewer account)          | Owner | P2  | Todo   | A8, W3, V5 |
| F10 | ChatGPT directory: verified OpenAI org, domain token, CSP list, screenshots, human review | Owner | P2  | Todo   | B5, W3, V3 |
| F11 | Release admin: withdraw or roll back an edition                                           | Owner | P3  | Todo   | F1         |
| F12 | Classroom fidelity: scene dropdown and progress readout through runtime host APIs         | Owner | P3  | Todo   | —          |

## G. Boards (Owner)

| ID  | Task                                                                                | Who   | Pri | Status  | Needs |
| --- | ----------------------------------------------------------------------------------- | ----- | --- | ------- | ----- |
| G1  | Nova sets declared board values live while explaining (clamped to ranges)           | Owner | P2  | Todo    | —     |
| G2  | Template gallery: number line, graph, molecule, timeline (Ess designs the look)     | Both  | P2  | Todo    | —     |
| G3  | Hands-free board questions: a spoken answer sets the checked values                 | Owner | P3  | Todo    | G1    |
| G4  | Boards inside Claude/ChatGPT chat through MCP Apps, same files                      | Owner | P3  | Todo    | A5    |
| G5  | Human review of boards in paid courses, if D9 says so                               | Owner | P3  | Blocked | D9    |
| G6  | Visual skills: try the catalogue one at a time, two test scenes each (docs/visuals) | Both  | P1  | Doing   | —     |
| G7  | Lesson styles: STYLE.md, helper, example boards and preview for each kept skill     | Owner | P1  | Done    | G6    |
| G8  | Style cards with real previews and a live board on the «اعمل كورس» page             | Owner | P1  | Done    | —     |
| G9  | The builder screenshots its boards and fixes them against STYLE.md before finishing | Owner | P1  | Todo    | Y6    |
| G10 | Serve three.js, D3, p5.js (+ p5.brush) and lottie-web from the board origin, pinned | Owner | P1  | Todo    | —     |
| G11 | A picture in every scene by default; text alone only when the teacher chooses       | Owner | P1  | Todo    | G7    |
| G12 | Lesson clips: short videos made once (Remotion, Manim) and played in a step         | Owner | P3  | Idea    | F7    |

## M. Marketplace and payments

| ID  | Task                                                                                        | Who   | Pri | Status | Needs  |
| --- | ------------------------------------------------------------------------------------------- | ----- | --- | ------ | ------ |
| M1  | Public catalog of free courses, with review before listing                                  | Both  | P2  | Todo   | F1, X2 |
| M2  | Discovery: grade, subject, language, rating; a free preview lesson                          | Both  | P2  | Todo   | M1     |
| M3  | Ratings and reviews                                                                         | Both  | P3  | Todo   | M1     |
| M4  | Paid courses: checkout and access                                                           | Owner | P3  | Todo   | D6, L6 |
| M5  | Teacher payouts (teacher keeps about 70–80%)                                                | Owner | P3  | Todo   | M4     |
| M6  | Plans for teachers above free limits (database growth is our main cost)                     | Owner | P3  | Idea   | M1     |
| M7  | Share links: the first scene playable without an account                                    | Both  | P2  | Todo   | F1     |
| M8  | Creator tools: remix with credit, one-click translation, creator analytics, photo-to-lesson | Owner | P3  | Todo   | M1, V7 |
| M9  | School licences per class                                                                   | Owner | P3  | Idea   | T3     |

## X. Admin and safety (Owner)

| ID  | Task                                                 | Who   | Pri | Status | Needs |
| --- | ---------------------------------------------------- | ----- | --- | ------ | ----- |
| X1  | Admin page: users, courses, reports                  | Owner | P2  | Todo   | F6    |
| X2  | Review queue for public, paid and child-mode courses | Both  | P2  | Todo   | X1    |
| X3  | Reports from users, takedown, account suspension     | Owner | P2  | Todo   | X1    |
| X4  | Log of admin actions                                 | Owner | P3  | Todo   | X1    |
