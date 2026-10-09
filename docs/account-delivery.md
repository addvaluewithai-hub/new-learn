# Accounts and catalog delivery

## Implemented

Managed Neon Auth through modular same-origin Pages API handlers:
signup, signin, signout, session restoration, password reset request/reset.
Host-only secure cookie forwarding preserves HttpOnly/SameSite flags.
Callback origins are selected server-side; unknown auth routes, cross-origin mutations and invalid sessions fail.
Login is independent of DB availability; catalog and lesson metadata require the DB binding.

The student UI opens at `/`: account entrance, DB-derived curriculum cards/detail and an authorized lesson route.
Old IBM Plex Sans Arabic account/library typography, green/lime palette, brand, story illustration,
cards, lesson path and responsive sidebar are separated into scoped feature styles and components.
Classroom keeps its existing font and 16:9/9:16 board; account CSS does not replace it.
Reward counters/saved-progress claims wait for real persistence.

## Deployment connection still needed

Pages project: `new-learn`, origin `https://new-learn.pages.dev`.
Wrangler commits only public APP*ORIGIN, NEON_AUTH_BASE_URL and ALLOW_CONTENT_REVIEW.
Auth trusted origins already include that site; email/password and shared reset email are enabled.
Cloudflare management credentials are unavailable in this session, so DATABASE_URL is not installed remotely.
Use the restricted reader connection prepared locally, never a VITE* variable or committed connection string.
With an authenticated Wrangler CLI in this workspace:

```bash
npx wrangler pages secret bulk .dev.vars --project-name new-learn
```

Redeploy the site afterward. If using the dashboard, add the same DATABASE_URL as an encrypted
runtime secret for the target environment, then redeploy. Do not use the old branch's connection.
No database reset, merge or data migration is necessary.
Without this binding, login can work but catalog correctly reports a service error.

## Local development and verification

`npm run dev` starts Vite and the modular Node API; optional .dev.vars supplies DATABASE_URL.
`?preview=chemistry` remains an ephemeral no-auth/no-save review; `?preview=probe` runs engine acceptance.
`npm run dev:full` runs the built app under Pages/Wrangler.

- `npm test`: runtime, cookie/session/origin/input boundaries and module edition checks.
- `npm run build` / `npm run functions:check`: UI/types and real Pages Function bundle.
- `npm run test:browser:platform`: controlled API fixtures for UI flows, error/retry and responsive checks.
- `node --import tsx tests/auth-live.mjs`: actual isolated Neon Auth; creates disposable acceptance accounts.
- Run the API, then `node tests/platform-live.mjs`: actual signup/session/DB catalog/edition/logout/signin.
- `database/contracts.sql`: real PostgreSQL constraints, with no retained test progress.

Successful reset-email request is verified; inbox delivery and a valid emailed token require a real
mailbox test. Controlled browser reset tests are not proof of email delivery.
Chromium emulation does not replace real Safari/mobile audio acceptance.

## Next

Install Cloudflare DB secret and verify the deployed end-to-end journey.
Then implement SDK host state/event APIs and durable progress/attempt/notes adapters against the pinned edition,
followed by the factory importer/release pipeline and contextual Chat/Live assistants.
The preview SDK and authoring repository need no authentication/database dependency.
