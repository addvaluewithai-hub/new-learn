# Rounds: tasks grouped into working sessions

A round is one Claude Code session ending in one PR. It groups tasks that touch the same
pages or code and have the same dependencies, so they are built, tested and reviewed together.
Every task in launch.md, learning.md, teaching.md and voice.md is in exactly one round, or in the
manual list at the end.

- **OR:** Owner rounds, with technical decisions.
- **ER:** Ess rounds: pages, design, brand, website, video.

Start a round with:

> Read AGENTS.md and docs/tasks/. We're doing round ER1. Do every task in it, show
> screenshots at 390px and 1280px, and open one PR.

At the end of a round, mark its tasks Done in their files.

- A task the round can't finish stays Todo, and the PR says why.
- A round whose tasks are only Ideas waits until Owner agrees to them.
- In OR rounds, "Ess designs first" means Ess's screens (from ER7, or quick mock-ups) come
  before the round starts.
- Code can be built and tested before the connector is live (the tests use an in-memory
  database). Real teachers only need A5.

## Wave 0: before YC (2 November)

| Round | Name                  | Tasks                           | Needs       | Notes                                                                                    |
| ----- | --------------------- | ------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| OR1   | Connector live        | A1, A2, A3, A4, A5, A7, S1, O4  | —           | Mostly settings. Claude can run the migration and the tests if `DEV_DATABASE_URL` is set |
| ER1   | Student pages cleanup | E3, E4, E5, E6, E7, E8, E9, E10 | —           | Can start today; the ux-audit list                                                       |
| ER2   | Teacher pages polish  | E1, T6                          | —           | Also sketch the OR3 screens (dashboard, notes inbox, outline editor)                     |
| ER3   | Brand                 | B1, B2, B7, K2                  | D1          | Name, logo, colours, tokens, social handles, subject art                                 |
| ER4   | Website               | W1, W2, W4, W5, W9, W3          | ER3, L1, L2 | Owner makes the Cloudflare project; W2 needs OR1 for real screenshots                    |
| ER5   | Demo and video        | V1, V2, V3, V5, V8, V9          | OR1         | Ess is the first teacher; Owner makes the reviewer account (V5)                          |

## Wave 1: first real teachers and students

| Round | Name                    | Tasks                          | Needs             | Notes                                                                      |
| ----- | ----------------------- | ------------------------------ | ----------------- | -------------------------------------------------------------------------- |
| OR2   | Hardening and numbers   | A6, A8, O1, O2, O3, O5, O6, V7 | OR1               | Limits, errors, uptime, backups, costs, usage numbers                      |
| OR3   | Teacher workspace       | T1, S8, S3, S4, S5, S9, A9     | ER2               | Ess designs first. Dashboard, notes inbox, outline, edits, history         |
| OR4   | Publish to students     | F1, T2, F2, M7, F6, F11        | OR3               | Ess designs the publish flow first                                         |
| OR5   | Streaks and home        | R1, R2, R5, E2, R3, R4         | ER7, D3           | R3 and R4 are Ideas: only if D3 says yes                                   |
| OR8   | Accounts and settings   | E13, F4, F3, F5, L5, N4, E14   | L1                | F3 needs the domain email (B6); F5 is an Idea                              |
| OR16  | Domain and directories  | B5, B6, F9, F10                | B4, ER4, ER5, OR2 | Moves the app and boards to the domain, then submits to Claude and ChatGPT |
| ER6   | Apply the brand         | B3, E15, E11, N6, E20          | ER3, D5           | E20 (dark mode) is an Idea                                                 |
| ER7   | Designs for next rounds | R9, P2, P4                     | ER3               | Also screens for OR4, OR6, OR7 and OR13 before they start                  |
| ER9   | Phones and people       | E17, V6, V10                   | OR1               | Field work, not code: real phones, first users, interviews                 |
| OR19  | Nova in the lesson      | Y1, Y2, Y3                     | —                 | Skip, reveal, repeat, back; question style; long sessions                  |
| OR20  | Builder worker          | Y6, Y7, Y9, Y13                | A5, D11           | Port wp-slack-agent's Codex runner (docs/voice-agent.md)                   |
| OR21  | Start button            | Y4                             | OR19              | Nova home mode; Ess designs the home first                                 |
| OR22  | Paid plans              | Y10, Y11, Y12                  | D6, L6            | Paid from the start; Ess designs the pricing page                          |

## Wave 2: public launch

| Round | Name                   | Tasks                                  | Needs            | Notes                                                       |
| ----- | ---------------------- | -------------------------------------- | ---------------- | ----------------------------------------------------------- |
| OR6   | Question types         | Q1, Q2, Q3, Q4                         | ER7              | Runtime change: full browser checks                         |
| OR7   | Exams and certificates | Q5, Q6, Q7, Q8, Q9, Q11, Q12, Q13, R10 | OR6, D4          | Question bank, exams by goal, results, daily review         |
| OR9   | Nova and boards        | G1, N1, N2, G2, G3, F8                 | —                | N1 and G1 are one feature; N2 is an Idea                    |
| OR10  | Course studio          | S2, S10, S6, F7, S7, S11, K4           | OR3, OR20        | S11 and K4 are Ideas                                        |
| OR11  | Classes                | T3, T4, Q10, R8, M9                    | OR4, OR7         | R8 and M9 are Ideas                                         |
| OR12  | Reach                  | E18, R6, R7, E16                       | OR5, D7          | Installable app, reminders, weekly email, English interface |
| OR13  | Marketplace and admin  | M1, M2, E19, M3, X1, X2, X3, X4, T5    | OR4              | Public catalog, discovery, reviews, admin and reports       |
| OR17  | Recorded lessons       | K3, E12, F12                           | —                | Audio import, progress and resume                           |
| ER8   | Website growth         | W6, W7, W8, W10                        | ER4              | W7 and W10 are Ideas                                        |
| OR23  | Build by voice         | Y8, Y5                                 | OR20, OR21, OR10 | Nova starts build jobs; more questions on request           |

## Wave 3: later

| Round | Name                    | Tasks                  | Needs        | Notes                        |
| ----- | ----------------------- | ---------------------- | ------------ | ---------------------------- |
| OR14  | Payments                | M4, M5, M6, G5         | OR13, D6, L6 | M6 is an Idea; G5 needs D9   |
| OR15  | Children                | P1, P3, P5, P6, P7, L4 | ER7, D8      | Ess designs P2 and P4 in ER7 |
| OR18  | Creator tools and ideas | M8, S12, N3, N5, G4    | OR13         | Mostly Ideas                 |

## Not a Claude round

- **Owner by hand:**
  - V4: YC application and founder video.
  - B4: buy the domain.
  - L6: company and bank account.
  - the decisions D1–D10.
- **Drafted with Claude in one sitting, then Owner reviews:** L1 privacy, L2 terms,
  L3 takedown process.
- **Ongoing, one round per curriculum:** K1, launching curricula with
  docs/launch-curriculum.md.
