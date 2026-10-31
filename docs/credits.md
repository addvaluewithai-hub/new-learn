# Credits, paid courses and review

Status (2026-10-31): the structure is built and tested; no payment gateway is connected yet.
Prices and packs show on the pages; buying says payments are coming.

## Credits

Things the platform does with AI or voice cost credits. The price list is
`apps/platform/src/features/credits/pricing.ts`: the server charges from it and the pages show
it, so a number changes in one place.

| Action              | Credits      | Charged today |
| ------------------- | ------------ | ------------- |
| Build a course      | 30 each      | yes           |
| Side-chat edit      | 3 each       | soon          |
| Recorded narration  | 2 per minute | soon          |
| Clone your voice    | 20 once      | soon          |
| Course landing page | 15 each      | soon          |
| Short video         | 10 each      | soon          |
| Social posts (5)    | 5 per set    | soon          |
| Nova live voice     | 1 per minute | soon          |

Writing a course with the teacher's own Claude or ChatGPT (the connector) costs nothing. Each
action also records our own rough cost (`costCents`, never shown) to keep margins visible. One
credit sells for about US$0.10; packs (100, 300, 1000) cost less per credit. Every account
starts with 60 credits, once.

**Ledger.** `credit_entries` (migration `0008_credits_and_review.sql`) is insert-only: the
balance is the sum. Kinds: `starter`, `grant` (staff), `purchase` (a gateway), `spend`,
`refund`. A row names what it was for (`action`) and the thing charged (`ref`, a build job's
id); the table allows one row per account, kind and ref, so a retried request never charges or
refunds twice. Code: `server/credits/ledger.ts` (`spend`, `refund`, `grant`, `account`).

**Builds.** `createJob` charges `course.build` before queuing; a job that fails, cannot be
saved, or goes stale is refunded (`finishJob`, `claimJob`). The studio shows the cost and the
balance and holds the start button with a top-up link when short.

## Payments (to connect)

`server/payments/provider.ts` is the slot: a gateway implements `PaymentProvider` (`ready`,
`checkout`) and is added to `providers`. Until one is, `POST /api/credits/checkout` and
`POST /api/courses/<id>/buy` answer 503 «payments are coming». A gateway's webhook (to add with
it) writes a `purchase` credit row for a pack, or a `course_access` row (source `purchase`)
for a course, with the payment id as `ref`.

## Paid courses

A teacher prices a version in the publish card: free, or an amount in USD or EGP within
`COURSE_PRICES`. The card says the teacher's share (`TEACHER_SHARE`, 80% for now, before
payment fees).

- `published_courses.public_version` is the version students see, with its `price_cents` and
  `currency`. A free version is public at once.
- A paid version opens a `course_reviews` row (pending) and students keep the last approved
  version. A paid course with no approved version yet is not public at all.
- Studying a paid course needs access: the owner, staff, or a `course_access` row (purchase or
  gift). `GET /api/courses/<id>` says `access`; enrolling and lessons answer 402 without it.

## Review

Staff are the accounts whose e-mail is in `STAFF_EMAILS` (Cloudflare project variable, comma
separated). They see «المراجعة» in the sidebar (`?review`):

1. The queue of paid versions waiting, oldest first.
2. One version: every lesson as text (steps, questions with the marked answer, feedback).
3. «شغّل مراجعة الـAI»: Gemini reads the course as a subject teacher and lists findings
   (severity, kind, lesson, where, note) in the reviewer's language. It advises; it never
   decides (`server/review/ai.ts`).
4. Approve (the version becomes public at its price) or request changes with notes; the
   teacher sees the status and notes in the publish card and on the dashboard.

A newer paid version replaces one still waiting. Every paid version is reviewed, so updates
to an approved course are checked too.

Staff also grant credits by e-mail on the credits page (the account must have opened the app
once).

## Owner steps

1. Approve migration `0008` (it applies by itself when merged): three new tables, three
   columns on `published_courses`, and every course already published stays public and free.
2. In Cloudflare (project `new-learn`, Settings → Variables): `STAFF_EMAILS` = the reviewers'
   e-mails, comma separated. Redeploy.
3. When a gateway account exists: add its provider and webhook (see Payments above).
