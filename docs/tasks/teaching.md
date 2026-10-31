# Teaching: studio, teacher pages, publishing, boards, marketplace, admin, marketing, schools

See README.md for priorities, statuses and how Ess works with Claude Code.

## S. Course studio

Today a teacher writes with Claude or ChatGPT in their own app, and previews drafts in ours.
The studio brings the same MCP tools into a page on our platform, with buttons and a live
preview. The writing runs on our builder worker (docs/voice-agent.md, Y6–Y7).

| ID  | Task                                                                                                                                                                         | Who   | Pri | Status | Needs    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ------ | -------- |
| S1  | Guide for Claude Code CLI and Claude Desktop (`claude mcp add --transport http …/mcp`), tested                                                                               | Owner | P1  | Todo   | A5       |
| S2  | Side chat beside the live draft: the teacher asks for changes in words and sees them land in place, in real time; shows what it is doing; charged per edit (`lesson.refine`) | Both  | P1  | Done   | Y7       |
| S3  | Course outline editor without AI: rename, reorder lessons and parts by dragging (up/down and move-to-part, no dragging yet)                                                  | Both  | P1  | Done   | A5       |
| S4  | Edit a step's text by hand in the preview (saved as a new revision)                                                                                                          | Both  | P2  | Todo   | A5       |
| S5  | Revision history: see versions, compare, restore                                                                                                                             | Both  | P2  | Todo   | A5       |
| S6  | Upload sources (PDF, notes, photos) for the AI to build from (files on the «اعمل كورس» page)                                                                                 | Owner | P2  | Done   | F7       |
| S7  | Course cover and art picker                                                                                                                                                  | Both  | P2  | Todo   | K2       |
| S8  | Notes inbox: every note in a course, filtered by status                                                                                                                      | Both  | P1  | Done   | A5       |
| S9  | Board check results shown to the teacher, with the screenshot                                                                                                                | Both  | P2  | Todo   | A5       |
| S10 | Starters: "a course from this syllabus", "one lesson on this topic"                                                                                                          | Both  | P2  | Todo   | S2       |
| S11 | Import PowerPoint or PDF slides, or a YouTube video, into a lesson                                                                                                           | Owner | P3  | Todo   | S6       |
| S12 | New scene kinds: whiteboard drawing, slides                                                                                                                                  | Owner | P3  | Idea   | —        |
| S13 | Narration language and voice per course: stock voices, recorded once per lesson (`voice.minute`)                                                                             | Both  | P2  | Todo   | Y14      |
| S14 | The teacher's own voice: upload or record samples, cloned once with written consent (`voice.clone`), used for narration                                                      | Owner | P3  | Todo   | S13, X6  |
| S15 | Mascot: pick or design a character that narrates and reacts as the teacher (Ess designs; grows from P4)                                                                      | Both  | P3  | Todo   | S13, P4  |
| S16 | Bring your own script: the teacher pastes the script, the AI builds the boards and questions around it and keeps the words                                                   | Owner | P2  | Todo   | S2       |
| S17 | Course dubbing: translate a course and its narration into other languages, in the teacher's voice or a stock voice                                                           | Owner | P3  | Todo   | S13, S14 |
| S18 | Co-authors: invite another teacher to edit a course                                                                                                                          | Both  | P3  | Todo   | T1       |

## T. Teacher pages

| ID  | Task                                                                                                              | Who  | Pri | Status | Needs   |
| --- | ----------------------------------------------------------------------------------------------------------------- | ---- | --- | ------ | ------- |
| T1  | Teacher dashboard: courses, drafts, published, students, open notes                                               | Both | P1  | Done   | A5      |
| T2  | Publish flow screens: self-check, then publish free or paid (a price per version; paid versions go to review, G5) | Both | P1  | Done   | F1      |
| T3  | Classes: invite students by link or code, assign lessons, progress by scene                                       | Both | P2  | Todo   | F1      |
| T4  | Where students struggle: failed questions and drop-off per lesson                                                 | Both | P2  | Todo   | T3, V7  |
| T5  | Teacher public profile page                                                                                       | Both | P3  | Todo   | M1      |
| T6  | In-app "connect your AI" card with a copy button for the `/mcp` link (teacher dashboard)                          | Ess  | P1  | Done   | A5      |
| T7  | Insights: what students ask Nova most, per lesson and step                                                        | Both | P2  | Todo   | V7      |
| T8  | Ask the teacher: a question inbox or office hours when Nova isn't enough                                          | Both | P3  | Todo   | T3      |
| T9  | Gift access to a paid course by e-mail (`course_access` source `gift`)                                            | Both | P2  | Todo   | M4      |
| T10 | Course funnel: page views, enrolments, purchases, completion                                                      | Both | P2  | Todo   | V7, MK8 |

## F. Publishing and accounts (Owner)

| ID  | Task                                                                                                                                        | Who   | Pri | Status | Needs      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ------ | ---------- |
| F1  | Publish a draft course to students: immutable edition, enrolment, catalog card (`?teach`: self-check, numbered versions, enrolment by link) | Owner | P1  | Done   | A5         |
| F2  | Share a read-only preview link of a draft                                                                                                   | Owner | P2  | Todo   | F1         |
| F3  | Real mailbox test of password reset                                                                                                         | Owner | P1  | Todo   | B6         |
| F4  | Email verification, delete my account, download my data                                                                                     | Owner | P2  | Todo   | L1         |
| F5  | Sign in with Google                                                                                                                         | Owner | P2  | Idea   | B5         |
| F6  | Roles: student, teacher, parent, admin                                                                                                      | Owner | P2  | Todo   | —          |
| F7  | Media storage outside the build (Cloudflare R2), kept before release                                                                        | Owner | P2  | Todo   | —          |
| F8  | `content:import` support for board folders                                                                                                  | Owner | P2  | Todo   | —          |
| F9  | Claude directory submission (privacy, docs URL, support, icon, reviewer account)                                                            | Owner | P2  | Todo   | A8, W3, V5 |
| F10 | ChatGPT directory: verified OpenAI org, domain token, CSP list, screenshots, human review                                                   | Owner | P2  | Todo   | B5, W3, V3 |
| F11 | Release admin: withdraw or roll back an edition (withdraw and publish again; roll back later)                                               | Owner | P3  | Done   | F1         |
| F12 | Classroom fidelity: scene dropdown and progress readout through runtime host APIs                                                           | Owner | P3  | Todo   | —          |

## G. Boards (Owner)

| ID  | Task                                                                                                                                                            | Who   | Pri | Status | Needs |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ------ | ----- |
| G1  | Nova sets declared board values live while explaining (clamped to ranges)                                                                                       | Owner | P2  | Todo   | —     |
| G2  | Template gallery: number line, graph, molecule, timeline (Ess designs the look)                                                                                 | Both  | P2  | Todo   | —     |
| G3  | Hands-free board questions: a spoken answer sets the checked values                                                                                             | Owner | P3  | Todo   | G1    |
| G4  | Boards inside Claude/ChatGPT chat through MCP Apps, same files                                                                                                  | Owner | P3  | Todo   | A5    |
| G5  | Review of paid courses: staff queue, every lesson as text, AI first pass, approve or send back with notes (docs/credits.md)                                     | Owner | P3  | Done   | D9    |
| G6  | Visual skills: try the catalogue one at a time, two test scenes each (docs/visuals) (ten looks tried, one demo each: docs/visuals/demos.md)                     | Both  | P1  | Done   | —     |
| G7  | Lesson styles: STYLE.md, helper, example boards and preview for each kept skill                                                                                 | Owner | P1  | Done   | G6    |
| G8  | Style cards with real previews and a live board on the «اعمل كورس» page                                                                                         | Owner | P1  | Done   | —     |
| G9  | The builder screenshots its boards and fixes them against STYLE.md before finishing                                                                             | Owner | P1  | Todo   | Y6    |
| G10 | Serve three.js, D3, p5.js (+ p5.brush) and lottie-web from the board origin, pinned (three.js, p5.js, p5.brush and Amiri; D3 and lottie when a look needs them) | Owner | P1  | Done   | —     |
| G11 | A picture in every scene by default; text alone only when the teacher chooses                                                                                   | Owner | P1  | Todo   | G7    |
| G12 | Lesson clips: short videos made once (Remotion, Manim) and played in a step                                                                                     | Owner | P3  | Idea   | F7    |

## M. Marketplace and payments

| ID  | Task                                                                                                                                                         | Who   | Pri | Status | Needs   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | --- | ------ | ------- |
| M1  | The marketplace: a public catalog of courses, each reviewed before listing (docs/marketplace.md)                                                             | Both  | P2  | Done   | F1, X2  |
| M2  | Discovery: grade, subject, language, rating; a page per course that search engines find; a free preview lesson (public pages, sitemap done; preview remains) | Both  | P2  | Part   | M1      |
| M3  | Ratings and reviews                                                                                                                                          | Both  | P3  | Todo   | M1      |
| M4  | Paid courses: price per version, access rule and buy endpoint built; checkout waits for the gateway (docs/credits.md)                                        | Owner | P3  | Part   | D6, L6  |
| M5  | Teacher payouts (teacher keeps about 70–80%)                                                                                                                 | Owner | P3  | Todo   | M4      |
| M6  | Credits: ledger, price list, starter credits, build charge and refund, packs waiting for payments (docs/credits.md)                                          | Owner | P3  | Part   | M1      |
| M7  | Share links: the first scene playable without an account (the link works for signed-in learners; the first scene without an account later)                   | Both  | P2  | Doing  | F1      |
| M8  | Creator tools: remix with credit, one-click translation, creator analytics, photo-to-lesson                                                                  | Owner | P3  | Todo   | M1, V7  |
| M9  | School licences per class (see SC)                                                                                                                           | Owner | P3  | Idea   | T3      |
| M10 | Payment gateways: Paymob and Fawry for Egypt, Stripe abroad; the webhook writes credits or course access (docs/credits.md)                                   | Owner | P1  | Todo   | D6, L6  |
| M11 | Invoices, VAT, refunds and chargebacks                                                                                                                       | Owner | P2  | Todo   | M10     |
| M12 | Coupons, bundles and a free first lesson on paid courses                                                                                                     | Both  | P2  | Todo   | M10     |
| M13 | Revenue share by source: a higher share for sales from the teacher's own link than from the marketplace                                                      | Owner | P2  | Todo   | M5, MK9 |
| M14 | Teacher verification before the first paid course: identity and payout details                                                                               | Owner | P2  | Todo   | M10     |
| M15 | Fraud: credit farming, refund abuse, fake reviews and fake enrolments                                                                                        | Owner | P2  | Todo   | M10     |

## X. Admin and safety (Owner)

| ID  | Task                                                                                                                  | Who   | Pri | Status | Needs |
| --- | --------------------------------------------------------------------------------------------------------------------- | ----- | --- | ------ | ----- |
| X1  | Admin page: users, courses, reports                                                                                   | Owner | P2  | Todo   | F6    |
| X2  | Review queue for public, paid and child-mode courses (paid versions and marketplace listing done; child mode remains) | Both  | P2  | Doing  | X1    |
| X3  | Reports from users, takedown, account suspension                                                                      | Owner | P2  | Todo   | X1    |
| X4  | Log of admin actions                                                                                                  | Owner | P3  | Todo   | X1    |
| X5  | Review what changed: show a reviewer only the differences from the last approved version                              | Owner | P2  | Todo   | G5    |
| X6  | Consent records for cloned voices and mascots, and rights to uploaded material                                        | Owner | P2  | Todo   | L2    |
| X7  | AI accuracy pass on free courses before they are listed (the paid review's first pass)                                | Owner | P2  | Done   | M1    |

## MK. Marketing assets

What a teacher needs to sell a course: chosen on one page, each with its credit price
(docs/credits.md), made in the course's look.

| ID  | Task                                                                                                                                      | Who   | Pri | Status | Needs    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ------ | -------- |
| MK1 | Marketing page in the teacher workspace: pick the assets to make, each with its credit price                                              | Both  | P2  | Todo   | M6       |
| MK2 | Course landing page on a subdomain or the teacher's own domain, with share image and search-friendly text (`marketing.landing`)           | Both  | P2  | Todo   | MK1, B5  |
| MK3 | Short vertical videos from a lesson for Reels, TikTok and Shorts: rendered with Remotion, captions, the course's look (`marketing.short`) | Owner | P2  | Todo   | MK1      |
| MK4 | Social posts: a set of five with images, in the course's language (`marketing.posts`)                                                     | Both  | P2  | Todo   | MK1      |
| MK5 | Teacher brand kit: logo, colours and fonts used in every asset                                                                            | Both  | P3  | Todo   | MK1      |
| MK6 | Licensed music for shorts                                                                                                                 | Owner | P3  | Todo   | MK3      |
| MK7 | Schedule and post to the teacher's social accounts                                                                                        | Owner | P3  | Todo   | MK3, MK4 |
| MK8 | Tracked links (UTM) and sales counted per asset                                                                                           | Owner | P2  | Todo   | MK2      |
| MK9 | Teacher referral links: sales from the teacher's own audience, credited to them (M13)                                                     | Owner | P2  | Todo   | M10      |

## SC. Schools

| ID  | Task                                                                      | Who   | Pri | Status | Needs    |
| --- | ------------------------------------------------------------------------- | ----- | --- | ------ | -------- |
| SC1 | School accounts: admin, teachers, classes and seats                       | Both  | P3  | Todo   | T3, F6   |
| SC2 | Single sign-on with Google Workspace and Microsoft                        | Owner | P3  | Todo   | F5       |
| SC3 | Roster import (CSV) and a Google Classroom link                           | Owner | P3  | Todo   | SC1      |
| SC4 | Seat-based billing and school invoices                                    | Owner | P3  | Todo   | M10, SC1 |
| SC5 | The school's look: logo and colours on the design tokens, a custom domain | Both  | P3  | Todo   | SC1, B5  |
| SC6 | School data terms: processing agreement, regional rules, children         | Owner | P3  | Todo   | L4       |
