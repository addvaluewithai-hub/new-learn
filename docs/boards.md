# Boards v1: teacher-made interactive boards

Status (2026-10-26): build steps 1 and 2 are done (runtime 0.4.0); see "Build order".
Research behind it: docs/research/openmaic.md. The owner approved the AGENTS.md rule for
teacher code on the board origin.

## Goal

A board is the lesson's visual area. Teachers (free or paid courses) build boards with their
own Claude or ChatGPT, in code, in any style: simulations, diagrams, games, 3D, step-by-step
derivations. The platform must:

1. run any teacher board without risk to students, accounts or data;
2. keep the board in step with the lesson, including going back;
3. let the student interact, let Nova see what the student did, and grade answers in our code;
4. keep every published edition frozen, so a later change never alters what students studied;
5. reject broken boards automatically before any student sees them.

The board contract is the target the connector tools (roadmap item 1) will write, so it is
versioned (`apiVersion: 1`) rather than frozen: v1 boards keep working when v2 adds features.

## Non-goals for v1

- Recorded (audio) lessons. v1 is for reading lessons, which already hold the board at the
  state after each step. Recorded lessons map time to steps through cues later.
- Server-side rendering or video export.
- Replacing today's React boards (`MathBoard`, `TextBoard`, ...). They stay as reviewed code
  in the renderer registry. HTML boards are a new renderer beside them.
- Nova changing the board freely during conversation (see "Later").
- Network access from boards, of any kind.

## What a board is

A folder with one HTML entry, a manifest and optional assets:

```text
board/<boardId>/
  board.json        manifest (below)
  index.html        the board; inline or relative scripts and styles only
  assets/...        images, fonts, data; relative paths only
```

`board.json`:

```json
{
  "apiVersion": 1,
  "id": "youngs-modulus-wire",
  "title": "Stretch a wire",
  "description": "A wire hangs from a support. A slider sets the load; the wire stretches.",
  "libraries": ["katex@0.16.22"],
  "variables": {
    "load": { "type": "number", "min": 0, "max": 500, "step": 10, "unit": "N", "default": 0 },
    "material": { "type": "choice", "options": ["steel", "copper"], "default": "steel" }
  },
  "targets": ["#wire", "#ruler", "#load-slider"],
  "aspect": "16:9"
}
```

- `variables` is the board's public state: the only values the lesson can set and the
  student's answer can be read from. Ranges are enforced by the host, not trusted to the board.
- `targets` are element ids the lesson may highlight, reveal or annotate.
- `libraries` must come from the allow-list below, with exact versions.
- Size limits: 2 MB per board including assets; 256 KB for `index.html`.

## Where it appears in a lesson

A reading scene uses the new renderer `html-board`:

```json
{ "visual": { "renderer": "html-board", "params": { "board": "youngs-modulus-wire" } } }
```

Each reading step may declare the board as it should look once that step is reached:

```json
{
  "text": "Hang 200 N on the wire and look at the ruler.",
  "board": {
    "state": { "load": 200 },
    "highlight": ["#ruler"],
    "reveal": [],
    "notes": [{ "target": "#wire", "text": "ΔL grows with the load" }],
    "input": "locked"
  }
}
```

**State is declared per step, not sent as commands.** The host computes the board for step N
by merging `state` from step 1 to N of the scene over the variable defaults. `highlight`,
`reveal`, `notes` and `input` belong to the step itself and are not carried forward. Going
back, reloading or resuming therefore gives the same board every time, with no replay logic.

`input` is `locked` (the board follows the lesson; default) or `open` (the student may change
variables). While input is open, values the student sets are kept until a later step sets
those keys again.

## Questions answered on the board

A reading question may take its answer from the board:

```json
{
  "attempt": "board",
  "board": {
    "state": { "load": 0 },
    "check": { "variable": "load", "kind": "number", "target": 300, "tolerance": 10 }
  }
}
```

- Check kinds in v1: `number` (target and tolerance), `choice` (one value), `set` (several
  variables, each with its own number or choice check).
- On the attempt page the input is open. **Submit** is the host's button, not the board's:
  the host reads the board's current variables and our code compares them with `check`.
- The board never reports correctness, and the expected answer is never sent to the board.
- Feedback steps can set the board to the model answer with ordinary step `state`.
- Scores flow through the existing progress path, unchanged.

## Sandbox

Board files are served from a **separate origin** (`new-learn-boards.pages.dev`, its own
Cloudflare Pages project), never from the app origin. Paths are content-addressed:
`/e/<boardHash>/index.html`, so a published board can never change under students.

The host embeds it as:

```html
<iframe src="https://boards.<domain>/e/<hash>/index.html" sandbox="allow-scripts" allow="" />
```

- `sandbox="allow-scripts"` without `allow-same-origin`: the board runs with an opaque origin,
  so it has no cookies or storage and cannot reach the app or other boards. No popups, forms,
  top navigation, downloads, camera, microphone or location.
- The board origin sends a strict CSP header on every response (below). The header comes from
  the server, so board code cannot remove it. To verify in the first build: `'self'` must
  still allow same-path assets for an opaque-origin document.

```text
default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self'; media-src 'self'; connect-src 'none';
frame-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors <app origins>
```

- Libraries are served by us from the board origin (`/lib/<name>@<version>/...`); no CDN.
- One live board iframe at a time, plus the next scene's preloaded, to protect cheap phones.

**AGENTS.md change needed (owner decision):** today it forbids executing unreviewed uploaded
code in the student application. The proposed rule: teacher board code may run only on the
board origin, under this sandbox, after the automatic check passes. It never runs on the app
origin.

## Messages (protocol v1)

`postMessage` only. Every message is `{ "nl": 1, "type": ..., ... }`. The host accepts
messages only when `event.source` is its iframe's window. The board accepts messages only
from `window.parent`. Unknown types are ignored, so later versions can add messages.

Host to board:

| type    | payload                                                                  |
| ------- | ------------------------------------------------------------------------ |
| `init`  | `apiVersion`, `lang` (`ar`/`en`), `dir`, `theme`, `reducedMotion`, size  |
| `state` | full `variables`, `highlight`, `reveal`, `notes`, `input`, `phase`, step |
| `theme` | `theme`, `reducedMotion` when they change                                |

Board to host:

| type          | payload                                                     |
| ------------- | ----------------------------------------------------------- |
| `ready`       | `apiVersion`; sent once after `init` is handled             |
| `variables`   | current values, sent whenever the student changes one       |
| `observation` | `summary` (one sentence a student could read) and `details` |
| `error`       | `message`; the host shows a calm fallback and logs it       |

- The board must draw purely from the latest `state` message. Same `state` in, same picture out.
- The host clamps and type-checks `variables` against `board.json`; anything else is dropped.
- `observation` is capped at 8 KB and is what Nova sees of the board. It is the board's own
  description, useful for tutoring but never used for grading.
- A board that does not send `ready` within 5 seconds is treated as failed for that session.

A small helper script (`/lib/newlearn-board@1/board.js`) handles the envelope, origin checks
and debouncing, so a board author writes only `onState(state)` and `setVariables(values)`.

## Nova and the board

`LessonContext` gains `board: { id, variables, observation }` for the current scene. Nova
requests carry the observation as `board`; the server quotes it in a separate
`BOARD REPORT` line marked as learner data, and the live tutor's silent position updates
include it. Nova can say "you set 300 N and the wire stretched 3 mm" without new tools.

## Allowed libraries (v1)

Pinned versions, served from the board origin, listed with their licence in
`boards/libraries.json`. Served now: KaTeX 0.16.25 (MIT). Approved candidates, added with
a pinned version the first time a board needs them: Three.js (MIT), D3 (ISC), Matter.js
(MIT), anime.js (MIT), lottie-web (MIT). Plain CSS and the Web Animations API need none.

**Not in v1: GSAP.** Its free licence forbids use in tools that let users build visual
animations without code in competition with Webflow, unless Webflow consents in writing.
Teachers creating boards through an AI may fall into that grey area. HyperFrames depends on
GSAP, so it is excluded too. Revisit only with written consent or legal advice.

Adding a library is a reviewed change to the allow-list with its licence and size.

## Automatic board check

`npm run board:check -- <board folder>` runs before import, and later on every connector
upload. A board that fails is not published. In headless Chromium it verifies:

1. `board.json` matches the schema, libraries are allowed, sizes are within limits.
2. The board sends `ready` within 5 seconds, with no uncaught errors or console errors.
3. Every step state used by the lesson renders: a screenshot per step at 1280×720 and
   360×640, with no content outside the frame and no horizontal scroll.
4. Arabic (`dir="rtl"`) and English both render; `reducedMotion` stops continuous animation.
5. No network attempt of any kind (CSP violation reports count as failures).
6. `variables` and `observation` messages are well formed and within limits; the same state
   twice gives the same screenshot.
7. A simple interaction smoke test: with input open, keyboard focus reaches a control.

The report (hash of the board, checker version, results, screenshots) is stored with the
edition. Passing the check is structural, not an editorial or teaching approval.

## Editions and versions

- Board files and their libraries are listed with SHA256 in the lesson manifest, like assets
  today. The content-addressed URL is that hash.
- `apiVersion` is per board. The host supports every released version; v2 adds messages
  without changing v1 meanings.
- Upgrading a library is a new board edition, never an in-place change.

## Accessibility

- `description` in `board.json` and each `observation.summary` are exposed to screen readers
  by the host in a polite live region, outside the iframe.
- Boards must be usable by keyboard when input is open; the check enforces focus reachability.
- Every step's text already explains what the board shows, so a student who cannot see the
  board can still follow the lesson.

## Where the code goes

- `packages/lesson-runtime/src/board/`: contract types, `board.json` validation, clamping,
  per-step state, grading and message parsing. `src/reading/board.ts` and `useBoard.ts`
  join it to reading lessons. No iframe code; still React and Remotion only.
- `apps/platform/src/features/boards/`: the `html-board` renderer (iframe host, message
  bridge, live region) and the board origin setting. `?preview=board` opens the probe.
- `boards/`: the helper (`lib/newlearn-board@1/board.js`) and `libraries.json`.
- `tools/build-boards.mjs` (`npm run prepare:boards`): validates and hashes every board into
  `dist-boards/` with `_headers`, and writes the app's editions map.
  `tools/serve-boards.mjs` serves it locally on port 5174 with the same headers.
- `fixtures/board-probe/`: the synthetic wire board, a hostile sandbox probe and a lesson.
- Next: `tools/check-board.mjs`, and `content:import` support for `board/<id>/` folders.

Deploying the board origin: a second Cloudflare Pages project named `new-learn-boards` on
this repository, build command `npm run prepare:boards`, output directory `dist-boards`,
Node 24. A custom domain later only needs `VITE_BOARD_ORIGIN` on the app's build and the
new app origin in `FRAME_ANCESTORS` (tools/build-boards.mjs).

## Build order

1. Done: protocol and host with a sample board (`fixtures/board-probe`), board questions
   graded by our code, and Nova context.
2. Done: board origin with CSP, served locally and in CI; `test:browser:board` shows every
   escape attempt blocked (cookies, storage, parent, top navigation, popups, network,
   same-origin fetch, external images) at 1280px and 390px.
3. `board:check`.
4. Physics chapter 8, Young's modulus: one real `html-board` with a board question.
5. Connector tools that write boards (roadmap item 1), validated by the same check.

## Later

- Nova sets declared variables live during conversation, clamped to their ranges.
- Hands-free (audio) mode: board questions still need the screen; a spoken answer could set
  the checked variables once Nova can set them.
- Recorded lessons: map cues to steps.
- A board template gallery (number line, graph, molecule, timeline) teachers' AIs fill in.
- Boards in Claude or ChatGPT chat through MCP Apps, reusing the same files.

## Open questions for the owner

1. Whether paid courses need extra review before boards go live, beyond the automatic check.
