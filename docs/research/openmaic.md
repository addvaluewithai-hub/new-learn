# Research: OpenMAIC and options for interactive boards

Notes from 2026-10-26, gathered while planning roadmap item 4 (modular lessons and sandboxed
boards). This is research, not an approved design: the rules in AGENTS.md still apply.

## OpenMAIC at a glance

[OpenMAIC](https://github.com/THU-MAIC/OpenMAIC) (Tsinghua) is an open-source AI classroom:
slides, quizzes, HTML simulations, projects, a speaking AI teacher with spotlight, laser and a
whiteboard, PowerPoint import and HTML/video export. Read at commit `c09e0b7` (2026-10-26).

- License: MIT (relicensed 2026-06-28). `packages/mathml2omml` is LGPL-3.0-or-later.
- Stack: Next.js app with PostgreSQL, plus workspace packages published as `@openmaic/*`:
  `dsl` (0.12, types and validators, no runtime dependencies), `renderer`, `editor`,
  `generation`, `importer` (PPTX), `storage`, `geometry`.
- Interface locales include `ar-SA`.
- Opposite cost model to ours: lessons are generated on its server with server-side model
  keys. Our roadmap has the user's own Claude or ChatGPT write, and our server only validates.

## How its interactive scenes work

### A board is one complete HTML document

`InteractiveContent` (`packages/@openmaic/dsl/src/interactive.ts`) holds `html` (rendered via
iframe `srcDoc`), an optional `url` fallback, a `widgetType` and a `widgetConfig`.

Widget types: `simulation`, `diagram`, `code`, `game`, `visualization3d`, `procedural-skill`.
Each has its own generation prompt under `packages/@openmaic/generation/templates/`.

The page embeds its configuration as JSON, for example for a simulation:

```json
{
  "type": "simulation",
  "concept": "projectile_motion",
  "variables": [
    { "name": "angle", "label": "Launch Angle", "min": 0, "max": 90, "default": 45, "unit": "°" }
  ],
  "presets": [{ "name": "Hit the target", "variables": { "angle": 30, "velocity": 25 } }]
}
```

### Teacher to board: four widget actions

Lesson actions (`packages/@openmaic/dsl/src/action.ts`) include four that target the board.
The player sends them into the iframe with `postMessage`, and every generated page must
listen for them:

| Action              | Message             | Effect                                  |
| ------------------- | ------------------- | --------------------------------------- |
| `widget_setState`   | `SET_WIDGET_STATE`  | Set variables, e.g. move a slider to 60 |
| `widget_highlight`  | `HIGHLIGHT_ELEMENT` | Outline an element by selector or id    |
| `widget_annotation` | `ANNOTATE_ELEMENT`  | Float a note next to an element         |
| `widget_reveal`     | `REVEAL_ELEMENT`    | Show hidden content                     |

Each action may carry `content`, the speech that accompanies it.

### Board to teacher: observation

`packages/@openmaic/generation/snippets/interactive-observation.md` defines how a page
reports its current state so the AI teacher can see what the student did:

- The interactive area is wrapped in `id="experiment"` and holds one inert
  `<script type="application/json" data-maic-observation>` node.
- The JSON has `summary` (one sentence a student could read), `state` (lesson-level values,
  not raw JavaScript variables) and optional `rendered` (values the last run actually used).
- The page republishes after every meaningful change, including resets and timers.
- The host pulls it on demand (`lib/interactive/observation-bridge.ts`); at most 32 KB.

### Sandbox

`components/scene-renderers/InteractiveIframeHost.tsx` renders `srcDoc` with
`sandbox="allow-scripts allow-forms allow-popups"` and deliberately omits
`allow-same-origin`, so the page has an opaque origin and cannot reach the app's cookies or
storage. There is no separate domain and no network restriction: prompts let pages load
libraries from CDNs (Pyodide, Babel, CodeMirror or Monaco). Iframes are pooled per scene so
they survive scene switches and fullscreen.

### Playback

A scene has an ordered `actions[]` list: speech (TTS audio), spotlight, laser, whiteboard
drawing, discussion and the widget actions. A state machine (`lib/playback/engine.ts`:
idle, playing, paused, live) runs them in order and waits for speech to finish. Interactive
boards are driven by actions, not by a clock.

Ours differs: a Remotion frame clock with word-level timings and cues. Theirs is easier for
an AI to author; ours gives tighter sync between narration and visuals.

### Video export uses HyperFrames

`lib/video-export/emit-hyperframes/` turns a whole classroom into one HyperFrames
composition: one paused GSAP timeline on `window.__timelines`, `class="clip"` elements with
`data-start`/`data-duration`, GSAP bundled locally rather than from a CDN, and no
`Date.now`, `Math.random` or network use at render time.

### Teaching skills

`skills/agent-runtime/` holds course-design skills (deep-interactive, Feynman learning,
understanding by design, zone of proximal development, spiral curriculum, and others). The
deep-interactive skill plans courses where the learner manipulates something on most pages
and forbids two interactive scenes of the same widget type in a row.

## What we take, and what we don't

| Idea                                  | Decision                                                |
| ------------------------------------- | ------------------------------------------------------- |
| Board as one full HTML document       | Take                                                    |
| Embedded variables and presets JSON   | Take                                                    |
| Teacher actions (set, highlight, ...) | Take, so Nova can drive the board while speaking        |
| Observation (state plus summary)      | Take, so Nova can see and react to what the student did |
| Per-widget-type prompt templates      | Adapt into our authoring skill, with MIT attribution    |
| Opaque-origin `srcDoc` sandbox        | Not enough alone: add a separate origin and no network  |
| CDN libraries inside boards           | Don't: serve an allow-list of libraries ourselves       |
| Server-side lesson generation         | Don't: it brings back AI cost                           |
| Action-list playback replacing ours   | Don't: keep our clock; map widget actions onto steps    |
| Copying folders wholesale             | Don't (AGENTS.md); files there often exceed 300 lines   |

Answers stay graded by our code from the values a board reports; a board never decides a
score.

## Other options checked

- **MCP Apps** (`@modelcontextprotocol/ext-apps`, Apache 2.0, spec 2026-01-26, stable): the
  official standard for interactive HTML from a connector, rendered in Claude, ChatGPT,
  VS Code and others. It specifies a sandbox proxy on a separate origin, CSP built from
  declared domains (no network by default), and JSON-RPC over `postMessage`. `AppBridge`
  is the host side. Using it as the board transport means the same board can appear in our
  lesson and in the user's chat (roadmap item 1). Unverified: that `AppBridge` works with no
  MCP server behind it, fed HTML directly by our host.
- **HyperFrames** (HeyGen, Apache 2.0): HTML, CSS and GSAP with `data-start`/`data-duration`;
  its runtime seeks GSAP, CSS, Lottie, Three.js and Web Animations deterministically.
  `@hyperframes/player` plays in a sandboxed iframe with `play`, `pause` and `seek(seconds)`.
  Built for linear video, not interaction. Optional inside a board for animated parts.
- **Remotion**: our lesson player already uses it. Free for organisations of up to 3 people;
  above that, products built on `<Player>` fall under the Automators plan (from about
  $100/month). Its FAQ disallows letting users upload their own Remotion code for rendering,
  so it is not a fit for user-written boards.
- **Sandpack** (CodeSandbox): runs React code on a separate, self-hostable origin. Only needed
  if boards are written in React.
- **PhET**: simulations published before 2026-03-29 are CC BY 4.0 and can be shown with
  attribution; reading student events needs PhET-iO (paid).
- **Not a fit**: H5P (authored in its own editor, not code), Khan Academy Perseus (MIT but not
  accepting outside contributions), GeoGebra (commercial use needs an agreement).

## Proposed first experiment

On a separate branch: one reading lesson with one slider simulation board in a sandbox.

1. Nova sets and highlights board values while explaining.
2. The student moves the slider; Nova reads the board's observation and responds.
3. The student answers; our code checks the reported value.
4. Browser tests cover all three.

## Sources

- https://github.com/THU-MAIC/OpenMAIC (commit `c09e0b7`)
- https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/
- https://github.com/modelcontextprotocol/ext-apps
- https://hyperframes.heygen.com/introduction
- https://www.remotion.pro/license and https://www.remotion.dev/docs/license/faq
- https://phet.colorado.edu/en/licensing/html
