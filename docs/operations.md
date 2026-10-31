# Operations: limits, errors, usage and cost alerts

Status (2026-10-31): limits, the error log and the usage page are built and tested (migration
`0009_ops.sql`). The cost alerts are steps for the owner in each provider's dashboard.

## Request limits

Every server instance shares the same counts: they live in the database (`rate_hits`), one row
per caller and time window. A caller over a limit gets `429` with the message
`server.http.tooMany` in their language until the window ends; the connector answers
`{"error":"rate_limited"}` with `retry-after`. The limits are in one place,
`apps/platform/server/ops/limits.ts`:

| Limit            | Who counts | Allowed          | Where                                  |
| ---------------- | ---------- | ---------------- | -------------------------------------- |
| `nova.chat`      | learner    | 200 an hour      | Nova chat                              |
| `nova.live`      | learner    | 30 an hour       | starting a live voice session          |
| `nova.quiz`      | learner    | 12 an hour       | practice quizzes                       |
| `nova.wake`      | learner    | 600 an hour      | hands-free wake word checks            |
| `mcp`            | teacher    | 1200 an hour     | connector calls from Claude or ChatGPT |
| `oauth.register` | IP         | 20 an hour       | AI apps registering with OAuth         |
| `auth.signup`    | IP         | 10 an hour       | creating accounts                      |
| `auth.signin`    | IP         | 30 in 10 minutes | signing in                             |
| `errors.report`  | IP         | 30 an hour       | browsers reporting errors              |

Nova still has its quick per-instance limit (`server/nova/limits.ts`) in front; course builds
keep their own (one at a time, 10 a day, and the credits they cost). Old windows are cleared
now and then by the requests themselves.

## Error log

Kept in `error_log`, newest first on the staff page **`?ops`**:

- **Server**: any failure that is not an expected `HttpError` (those are answers, not bugs),
  from the app's API and from the connector (`/mcp`, OAuth), with the route and the stack.
- **Browser**: errors nothing caught in the page (`shared/reportError.ts`), sent to
  `POST /api/errors`, signed in or not. At most five per page load, each once; failed requests
  the page already shows are not sent again.

Messages are cut to 1000 characters and each detail to 4000. Writing to the log never fails
the request that tried it. An outside service (Sentry or similar) can be added later; this log
needs no account.

## Usage

`usage_daily` counts, per day, the things that cost money: Nova chats, voice sessions, quizzes
and wake checks, connector calls, course builds, AI reviews and new accounts. The `?ops` page
shows the last 14 days with a rough cost (`USAGE_CENTS` in `server/ops/record.ts`), for us to
watch, not a bill. Update those numbers when the providers' prices change.

Staff are the emails in `STAFF_EMAILS` (docs/credits.md); the page and its link show only for
them.

## Cost alerts (owner steps)

These live in each provider's dashboard; the platform cannot set them. Choose amounts that
would surprise you, so an alert means something is wrong.

1. **Gemini (Google Cloud billing).** Billing → Budgets & alerts → Create budget. Scope it to
   the project the Gemini key belongs to, set a monthly amount, keep the 50%, 90% and 100%
   thresholds, and add your email. A budget warns; it does not stop spending, so the request
   limits above are what stop a runaway.
2. **Neon.** In the project's settings, keep compute autoscaling to a small maximum and
   scale-to-zero on. On the billing page, check usage each week and turn on any spending or
   usage notification your plan offers.
3. **Cloudflare.** Notifications → Add → the usage or billing alert for Workers and Pages, sent
   to your email. On the free plan requests stop at the daily cap instead of costing more.

Check `?ops` once a day during the first weeks: a jump in one row is the earliest sign.
