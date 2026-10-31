# Launch: connector, brand, website, YC, legal, operations

See README.md for priorities, statuses and how Ess works with Claude Code.

## A. Connector go-live (Owner)

| ID  | Task                                                                                        | Who   | Pri | Status | Needs  |
| --- | ------------------------------------------------------------------------------------------- | ----- | --- | ------ | ------ |
| A1  | Migrations apply on merge (Database migrate workflow, `CONTENT_DATABASE_URL`)               | Owner | P0  | Done   | —      |
| A2  | Board site's own read-only role `learn_board_reader` (hardening, docs/connector.md)         | Owner | P2  | Todo   | A1     |
| A3  | Cloudflare `new-learn-boards`: `DATABASE_URL` = the app's value (Production and Preview)    | Owner | P0  | Done   | —      |
| A4  | End-to-end test in Claude at `https://new-learn.pages.dev/mcp`: course, board, note, fix    | Owner | P0  | Todo   | A1, A3 |
| A5  | Live check: «مسوداتي» lists the course; its preview plays, board and notes included         | Owner | P0  | Todo   | A4     |
| A6  | GitHub secret `CONTENT_DATABASE_URL` so Content sync writes to the database                 | Owner | P1  | Done   | —      |
| A7  | Test the same flow from ChatGPT (developer mode connector) and Claude Code CLI              | Owner | P1  | Todo   | A5     |
| A8  | Rate limits: OAuth client registration, `/mcp` calls, Nova (shared quotas, not per isolate) | Owner | P1  | Done   | A5     |
| A9  | "Connected apps" page: see and revoke Claude/ChatGPT access (Owner API, Ess design)         | Both  | P2  | Todo   | A5     |

## B. Brand and domain

| ID  | Task                                                                                            | Who   | Pri | Status  | Needs |
| --- | ----------------------------------------------------------------------------------------------- | ----- | --- | ------- | ----- |
| B1  | Brand name: shortlist, check domain and social handles, choose (D1)                             | Both  | P0  | Todo    | —     |
| B2  | Visual identity: logo, colours, type, icon; written as tokens in `apps/platform/src/shared/`    | Ess   | P0  | Todo    | B1    |
| B3  | Apply the identity to account, library and teacher pages; the classroom only after D5           | Ess   | P1  | Todo    | B2    |
| B4  | Buy the domain                                                                                  | Owner | P1  | Todo    | B1    |
| B5  | Domain on Cloudflare: app, `boards.` subdomain, auth callbacks, `VITE_BOARD_ORIGIN`, frame list | Owner | P1  | Blocked | B4    |
| B6  | Support and sending email on the domain                                                         | Owner | P1  | Blocked | B4    |
| B7  | Social accounts with the brand name (X, Instagram, TikTok, YouTube, LinkedIn)                   | Ess   | P1  | Todo    | B1    |

## W. Public website (Ess)

| ID  | Task                                                                                                                                     | Who  | Pri | Status | Needs  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---- | --- | ------ | ------ |
| W1  | Landing page (in the app at `/`, not a separate `site/`): the hero replays a demo lesson live on its board, the page tinted by the look  | Ess  | P0  | Done   | B1     |
| W2  | Teacher page (`/teachers`): the studio in four steps with screenshots, and "connect your Claude or ChatGPT" with the connector address   | Ess  | P0  | Done   | A4, W1 |
| W3  | Privacy, terms and support pages (`/privacy`, `/terms`, `/support`); texts drafted from what the product does, the owner reviews (L1–L3) | Ess  | P1  | Draft  | W1, L1 |
| W4  | Sign-up button that opens the real sign-up; no fake "thanks" waitlist form                                                               | Ess  | P0  | Done   | W1     |
| W5  | Share image (`tools/site-og.mjs`), favicon, page titles and descriptions (`features/site/head.ts`)                                       | Ess  | P1  | Done   | B2, W1 |
| W6  | The site and the app in eight languages (ar, en, fr, es, pt, de, tr, zh): one file per language, docs/i18n.md                            | Ess  | P2  | Done   | W1     |
| W7  | Pages for parents and for schools                                                                                                        | Ess  | P2  | Idea   | W1     |
| W8  | Help centre: FAQ on `/support` and `/teachers` (done); short guides for students, teachers and parents                                   | Ess  | P2  | Part   | W1     |
| W9  | Site visit analytics without cookies (e.g. Cloudflare Web Analytics)                                                                     | Both | P1  | Todo   | W1     |
| W10 | Blog or lesson showcase for search traffic                                                                                               | Ess  | P3  | Idea   | W1     |

## V. Demo, video and YC

| ID  | Task                                                                                    | Who   | Pri | Status | Needs  |
| --- | --------------------------------------------------------------------------------------- | ----- | --- | ------ | ------ |
| V1  | Demo course made through the connector, with Ess as the teacher (prompts, notes, fixes) | Ess   | P0  | Todo   | A5     |
| V2  | Product video (1–2 min): ask Claude, draft, board, note, fix, student studies with Nova | Ess   | P0  | Todo   | V1     |
| V3  | Screenshots, 3 or more (YC, website, ChatGPT directory)                                 | Ess   | P0  | Todo   | V1     |
| V4  | Founder video and the YC application text                                               | Owner | P0  | Todo   | —      |
| V5  | Demo/reviewer account holding the demo course (YC and the Claude directory need one)    | Owner | P0  | Todo   | V1     |
| V6  | First real users: teachers and students using it weekly; Ess collects their notes       | Both  | P0  | Todo   | A5     |
| V7  | Usage numbers: weekly active students, lessons finished (privacy-safe, server side)     | Owner | P1  | Todo   | A5     |
| V8  | Pitch deck and a one-page summary                                                       | Both  | P1  | Todo   | V2     |
| V9  | Short social clips cut from the product video                                           | Ess   | P1  | Todo   | V2, B7 |
| V10 | User interviews: 10 teachers and 10 parents, notes saved in `docs/research/`            | Both  | P1  | Todo   | —      |

## L. Legal and trust

| ID  | Task                                                                                                                       | Who   | Pri | Status | Needs |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ------ | ----- |
| L1  | Privacy policy: what we store, who sees it, AI providers (Gemini, Claude), deletion (drafted on `/privacy`; Owner reviews) | Owner | P1  | Draft  | —     |
| L2  | Terms of use, including teachers confirming rights to what they upload (drafted on `/terms`; Owner reviews)                | Owner | P1  | Draft  | —     |
| L3  | Copyright complaints and takedown process                                                                                  | Owner | P2  | Todo   | L2    |
| L4  | Children's data rules (consent, ages, countries)                                                                           | Owner | P2  | Todo   | D8    |
| L5  | Label AI-made content and AI practice clearly in the app                                                                   | Both  | P1  | Todo   | —     |
| L6  | Company and bank account for payments and payouts                                                                          | Owner | P1  | Todo   | D6    |

## O. Operations (Owner)

| ID  | Task                                                                                  | Who   | Pri | Status | Needs |
| --- | ------------------------------------------------------------------------------------- | ----- | --- | ------ | ----- |
| O1  | Error reporting for the app, functions and `/mcp`                                     | Owner | P1  | Done   | —     |
| O2  | Uptime checks: app, board site, `/mcp`, Nova                                          | Owner | P1  | Todo   | —     |
| O3  | Database backups: confirm Neon restore works on a branch                              | Owner | P1  | Todo   | —     |
| O4  | Fixed staging: one preview branch with its own Neon branch, used before every release | Owner | P1  | Todo   | A1    |
| O5  | Cost alerts: Neon, Cloudflare, Gemini (steps in docs/operations.md)                   | Owner | P1  | Todo   | —     |
| O6  | Security review before public launch: dependencies, headers, OAuth, limits            | Owner | P2  | Todo   | A8    |
