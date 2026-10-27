# Launch: connector, brand, website, YC, legal, operations

See README.md for priorities, statuses and how Ess works with Claude Code.

## A. Connector go-live (Owner)

| ID  | Task                                                                                        | Who   | Pri | Status | Needs  |
| --- | ------------------------------------------------------------------------------------------- | ----- | --- | ------ | ------ |
| A1  | Neon test branch; apply migration 0005 there (docs/connector.md step 1)                     | Owner | P0  | Todo   | —      |
| A2  | Create the `learn_board_reader` role on that branch                                         | Owner | P0  | Todo   | A1     |
| A3  | Cloudflare: Preview `DATABASE_URL` for `new-learn` and `new-learn-boards`                   | Owner | P0  | Todo   | A1, A2 |
| A4  | End-to-end test in Claude on a preview: connect, make a course with a board, note, fix      | Owner | P0  | Todo   | A3     |
| A5  | Production: migration, variables, connector at `https://new-learn.pages.dev/mcp`            | Owner | P0  | Todo   | A4     |
| A6  | GitHub secret `CONTENT_DATABASE_URL` so Content sync writes to the database                 | Owner | P1  | Todo   | —      |
| A7  | Test the same flow from ChatGPT (developer mode connector) and Claude Code CLI              | Owner | P1  | Todo   | A5     |
| A8  | Rate limits: OAuth client registration, `/mcp` calls, Nova (shared quotas, not per isolate) | Owner | P1  | Todo   | A5     |
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

| ID  | Task                                                                                    | Who  | Pri | Status | Needs  |
| --- | --------------------------------------------------------------------------------------- | ---- | --- | ------ | ------ |
| W1  | Landing page in a new `site/` folder (static); Owner makes its Cloudflare Pages project | Ess  | P0  | Todo   | B1     |
| W2  | Teacher page: "connect your Claude or ChatGPT", steps with screenshots                  | Ess  | P0  | Todo   | A4, W1 |
| W3  | Privacy policy, terms and support contact pages (texts from L1–L3)                      | Ess  | P1  | Todo   | W1, L1 |
| W4  | Sign-up button that opens the real sign-up; no fake "thanks" waitlist form              | Ess  | P0  | Todo   | W1     |
| W5  | Share image, favicon, page titles and descriptions                                      | Ess  | P1  | Todo   | B2, W1 |
| W6  | Arabic and English versions of the site                                                 | Ess  | P2  | Todo   | W1     |
| W7  | Pages for parents and for schools                                                       | Ess  | P2  | Idea   | W1     |
| W8  | Help centre: short guides and FAQ for students, teachers and parents                    | Ess  | P2  | Todo   | W1     |
| W9  | Site visit analytics without cookies (e.g. Cloudflare Web Analytics)                    | Both | P1  | Todo   | W1     |
| W10 | Blog or lesson showcase for search traffic                                              | Ess  | P3  | Idea   | W1     |

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

| ID  | Task                                                                        | Who   | Pri | Status | Needs |
| --- | --------------------------------------------------------------------------- | ----- | --- | ------ | ----- |
| L1  | Privacy policy: what we store, who sees it, AI providers (Gemini), deletion | Owner | P1  | Todo   | —     |
| L2  | Terms of use, including teachers confirming rights to what they upload      | Owner | P1  | Todo   | —     |
| L3  | Copyright complaints and takedown process                                   | Owner | P2  | Todo   | L2    |
| L4  | Children's data rules (consent, ages, countries)                            | Owner | P2  | Todo   | D8    |
| L5  | Label AI-made content and AI practice clearly in the app                    | Both  | P1  | Todo   | —     |
| L6  | Company and bank account for payments and payouts                           | Owner | P1  | Todo   | D6    |

## O. Operations (Owner)

| ID  | Task                                                                                  | Who   | Pri | Status | Needs |
| --- | ------------------------------------------------------------------------------------- | ----- | --- | ------ | ----- |
| O1  | Error reporting for the app, functions and `/mcp`                                     | Owner | P1  | Todo   | —     |
| O2  | Uptime checks: app, board site, `/mcp`, Nova                                          | Owner | P1  | Todo   | —     |
| O3  | Database backups: confirm Neon restore works on a branch                              | Owner | P1  | Todo   | —     |
| O4  | Fixed staging: one preview branch with its own Neon branch, used before every release | Owner | P1  | Todo   | A1    |
| O5  | Cost alerts: Neon, Cloudflare, Gemini                                                 | Owner | P1  | Todo   | —     |
| O6  | Security review before public launch: dependencies, headers, OAuth, limits            | Owner | P2  | Todo   | A8    |
