# The connector: teachers' own AI writes New Learn lessons

Status (2026-10-26): built and tested (PGlite and browser tests). Production needs the
database steps below. Roadmap items 1-3: connector, user-created curricula, feedback notes.

A teacher connects Claude or ChatGPT to New Learn and asks for a lesson. Their AI calls our
tools; our server only validates and stores, and never calls a model to write content. The
lesson appears as a draft in the teacher's account; the teacher previews it with Nova,
writes notes on any step, and asks their AI to fix the notes.

## What runs where

| Path                                      | What                                                       |
| ----------------------------------------- | ---------------------------------------------------------- |
| `/mcp`                                    | MCP over Streamable HTTP, stateless JSON-RPC               |
| `/.well-known/oauth-protected-resource`   | RFC 9728 metadata pointing at our authorization server     |
| `/.well-known/oauth-authorization-server` | RFC 8414 metadata                                          |
| `/oauth/register`, `/authorize`, `/token` | dynamic registration, authorization redirect, tokens       |
| `/?oauth=consent&...`                     | the teacher signs in and allows or refuses the app         |
| `/?draft=<lessonId>`                      | the teacher's preview: lesson, notes, board self-checks    |
| `/api/authoring/...`                      | the preview's API (session user only)                      |
| board origin `/u/<hash>/...`              | uploaded boards, from the database, same CSP as all boards |

Code: `apps/platform/server/mcp` (protocol, tools, guide), `server/oauth`, `server/authoring`
(format, store, boards, notes, routes), `server/connector.ts`, `functions/mcp.ts`,
`functions/oauth`, `functions/.well-known`, `boards/functions/u`, and the app's
`src/features/authoring` and `src/features/boards/{sources,TextBoard}`.

## Tools

`get_authoring_guide` (the rules the AI reads first), `list_my_courses`, `create_course`,
`update_course` (rename, regroup lessons into parts), `add_lesson`, `get_lesson`,
`update_lesson`, `put_board`, `get_board`, `get_feedback`, `resolve_feedback`. Every tool has
a title and read-only or destructive hints. The user always comes from the OAuth token.

- Lessons use a plain format (scenes, steps, questions); `server/authoring/format.ts` turns it
  into a reading package and the runtime validator checks it. Problems come back as a list the
  AI can fix; nothing is saved until the lesson is valid.
- Every save is a new insert-only revision; older revisions stay readable.
- Boards are text files, checked statically (manifest, files, sizes, network APIs, the helper).
  Their drawing is checked in the teacher's preview: the helper runs the same inspection as
  `board:check` inside the board, and reports reach `get_feedback` as `boardChecks`.
- Uploading a changed board saves every lesson using it as a new revision pointing at the new
  content hash.
- Notes: open -> review (the AI says fixed) -> done (the teacher agrees) or open again.

## OAuth

OAuth 2.1, public clients, PKCE S256 required, dynamic client registration. Redirect URIs
must be https (or localhost) and match exactly. Codes live 10 minutes and work once; access
tokens one hour; refresh tokens 30 days and rotate. Only SHA-256 hashes are stored. The
consent screen states that the app can create drafts and read notes, and cannot publish or
see students. The app may not be framed (`_headers`), so the consent screen cannot be
clickjacked. Revoking: delete the user's rows in `learn_app.oauth_tokens`. Registration is
open and not yet rate limited; add a limit before wide release.

## Data

Migration `0005_authoring_and_oauth.sql` adds `author_courses`, `author_lessons`,
`author_lesson_revisions`, `author_boards`, `author_feedback`, `oauth_clients`,
`oauth_codes` and `oauth_tokens`. Nothing existing is renamed or changed. Limits per teacher:
50 courses, 300 lessons, 300 boards, 2000 notes; a lesson is at most 200 KB, a board 2 MB.

## Turning it on (owner)

Once, for everyone: after this, any teacher's Claude or ChatGPT (and our own builder) just
connects to `https://new-learn.pages.dev/mcp`.

1. Merge to main. The **Database migrate** workflow applies new migrations to the app's
   database by itself (secret `CONTENT_DATABASE_URL`, the one Content sync already uses).
2. Cloudflare, project `new-learn-boards`, Settings → Variables: `DATABASE_URL` = the same
   value as the `new-learn` project's `DATABASE_URL` (Production and Preview), then redeploy
   it. The board site only reads `author_boards`.
3. In Claude: Settings → Connectors → Add custom connector, URL
   `https://new-learn.pages.dev/mcp`. Sign in, allow, then ask Claude to make a lesson and open
   its preview link.

Later hardening (task A2): give the board site its own role that can read boards and nothing
else, then use its URL in step 2:

```sql
CREATE ROLE learn_board_reader WITH LOGIN PASSWORD '<a new strong password>';
GRANT USAGE ON SCHEMA learn_app TO learn_board_reader;
GRANT SELECT (hash, files) ON learn_app.author_boards TO learn_board_reader;
```

## Checks

`apps/platform/tests/authoring.test.ts` and `connector.test.ts` run every migration on
PGlite and drive the store, OAuth (discovery, registration, consent, PKCE, single-use codes,
refresh rotation) and every MCP tool. `npm run test:browser:draft` plays a draft with a text
board and an uploaded board, writes a note, checks the board's self-report, answers a board
question, and walks the consent screen, at 1280px and 390px.

## Later

Publishing a draft course to students, sharing preview links, ChatGPT directory submission
(domain token, screenshots, CSP listing), and Claude directory listing.
