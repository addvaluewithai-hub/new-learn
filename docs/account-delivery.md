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

## Deployed connection verified

Pages project: `new-learn`, origin `https://new-learn.pages.dev`.
Real deployed signup, session, DB catalog (one curriculum/nine lessons), pinned review lesson,
logout and signin all passed on 2026-10-09. The prior missing-secret assumption was incorrect.
The user dashboard screenshot also confirms encrypted DATABASE_URL and GEMINI_API_KEY bindings.
We did not read Cloudflare secret values or verify the deployed database role.
Public origin/Auth settings are in wrangler.jsonc; secrets remain server-only, outside Git.
The isolated branch and local restricted reader are documented in data-contract.md.
No old account/data migration or database reset was performed.

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

Implement durable progress/attempt/notes adapters against the pinned edition and the factory importer/release pipeline.
Nova host context, chat, Live and lesson practice are described in docs/nova.md.
The preview SDK and authoring repository need no authentication/database dependency.
