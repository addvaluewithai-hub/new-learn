# Visual skills: lessons that look like something

The first course built on our server (28 October) was correct but plain: seven scenes of
text and one "interactive board" that was two buttons and a sentence. The builder had the
means (boards can draw anything with Canvas, SVG or a library) but no art direction, no
examples and no way to look at its own work.

Outside, there is a whole world of open skills that make coding agents draw, animate and
film in code (search "opus 5.5 video code skill"): hand-painted cartoons with p5.brush,
whiteboard explainers drawn stroke by stroke, Manim maths, three.js scenes, style guides
like Lemo-Opuscar's. We collect them here and try them one at a time. Each one that works
becomes a **lesson style** a teacher picks by its look on the «اعمل كورس» page.

The catalogue (373 repos from
[awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills),
filtered to what can serve a lesson):

- [explainers.md](explainers.md): explainers, tutorials and narrated lessons (66).
- [motion-and-stories.md](motion-and-stories.md): motion graphics, animation and stories (45).
- [frameworks.md](frameworks.md): renderers and all-round toolkits (65).

Left out: promos and ads (72), shorts and social (44), editing existing footage (48),
avatars (8) and music videos (15). They are not lesson pictures; see the source list.

## Two ways a skill can serve a lesson

1. **Live board** (now): the picture is drawn in the learner's browser, inside the board
   sandbox, and changes with the step or the learner's input. Fits skills built on Canvas,
   SVG, three.js, p5.js or Lottie. Their libraries must be on our allow-list (docs/boards.md).
2. **Lesson clip** (later, needs F7 storage): a short video made once and played in a step.
   Fits Remotion, Manim and Blender skills. A separate round after live boards.

## Rules for taking one in

- **Code only.** No paid image, video or voice model in the path that makes a lesson.
- **Licence:** MIT, Apache-2.0 or CC BY, with credit. AGPL, "none" or unclear (marked ⚠ in
  the catalogue): read for ideas only, copy nothing.
- **No GSAP** (its licence, docs/boards.md), so skills built on HyperFrames give ideas only.
- **Libraries** reach boards only through the allow-list: pinned version, licence, size.
- **Read before running.** The list's security grade is a model reading the README, not an
  audit. Run new skills in a throwaway folder, never on the builder server first.
- **Take the method, not the art:** style guides, drawing engines, review loops. Never their
  characters, films or pictures.
- **Both models.** Many skills are tuned for Claude Opus; our builder runs Codex. Try each
  with both, and note the difference.

## How we try one

1. Read it and write three lines below: what it teaches, its engine, its licence.
2. Make one test scene with it as a board: **watering a plant** (science: soil, water, a
   moist or dry choice) or **compound interest** (maths: a growing curve, a rate the learner
   sets), whichever suits the style. The owner's call: one scene per style is enough.
3. Both pass `npm run board:check`; save a landscape and a portrait screenshot.
4. Owner and Ess judge: does it look good, does it explain better, how long did it take,
   does Codex manage it too.
5. **Keep:** it becomes a style: `STYLE.md` (look, colour, type, motion, what to avoid),
   helper code if any, the two example boards and a preview picture for the studio page.
   **Drop:** one line here saying why.

## First wave, in order

| #   | Repo                                                                                            | Why first                                                     | Way  | Status |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---- | ------ |
| 1   | [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase)             | Hand-painted look with p5.js + p5.brush, which run live       | Live | Tried  |
| 2   | [hacimertgokhan/geomotion](https://github.com/hacimertgokhan/geomotion)                         | Zero-dependency line-morphing engine, small enough for boards | Live | Todo   |
| 3   | [haiderfarooq3/khan-explainer](https://github.com/haiderfarooq3/khan-explainer)                 | A pen draws while a voice explains: Nova reading a board      | Live | Tried  |
| 4   | [alexgreensh/anidoodle](https://github.com/alexgreensh/anidoodle)                               | Illustration and interactive web art written as code          | Live | Todo   |
| 5   | [diffusionstudio/lottie](https://github.com/diffusionstudio/lottie)                             | Lottie animations; lottie-web is already an approved library  | Live | Todo   |
| 6   | [lazypay/Archscribe](https://github.com/lazypay/Archscribe)                                     | Hand-drawn process diagrams                                   | Live | Todo   |
| 7   | [ythx-101/live-panel-skill](https://github.com/ythx-101/live-panel-skill)                       | Animated diagrams from one JSON file                          | Live | Todo   |
| 8   | [iart-ai/map-animation-skills](https://github.com/iart-ai/map-animation-skills)                 | Animated maps, for geography and history                      | Live | Todo   |
| 9   | [SunandBean/paper2video](https://github.com/SunandBean/paper2video)                             | three.js science scenes                                       | Live | Todo   |
| 10  | [iart-ai/motion-skills](https://github.com/iart-ai/motion-skills)                               | 50 skills; look for data stories and kinetic type             | Both | Todo   |
| 11  | [sudadom/arabic-motion-graphics-skill](https://github.com/sudadom/arabic-motion-graphics-skill) | Arabic right-to-left motion graphics                          | Clip | Todo   |
| 12  | [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar)                             | The style-guide format and the review loop (method)           | Both | Todo   |
| 13  | [JuneYaooo/cheap-claude-video](https://github.com/JuneYaooo/cheap-claude-video)                 | Turns an Opus result into a recipe other models follow: Codex | Both | Todo   |
| 14  | [vincentsch/explainroo](https://github.com/vincentsch/explainroo)                               | Fastest narrated explainer in the list's own test             | Clip | Todo   |
| 15  | [adithya-s-k/manim_skill](https://github.com/adithya-s-k/manim_skill)                           | 3Blue1Brown-style maths                                       | Clip | Todo   |
| 16  | [remotion-dev/skills](https://github.com/remotion-dev/skills)                                   | Remotion's own rules; the lesson player already uses Remotion | Clip | Todo   |

## Trials so far

Both became demo courses (docs/visuals/demos.md): **`?preview=demos`**, no account needed.
Boards: `fixtures/demos/boards/`.

**1. Hand-painted watercolour** (p5.js + p5.brush; the method of ClaudeAnimationBase), on the
plant scene: a window, a pot of basil, a magnified slice of the top 2 cm of soil, in three
states (moist, dry with drooping leaves, watered and draining).

- Passes `board:check`: 6 states, both layouts, Arabic and English.
- Cost: p5 and p5.brush are about 310 KB gzipped, from the board origin. A repaint takes about
  3 s on a server with no GPU (software WebGL); phones have GPUs, but measure on a cheap Android
  before adopting it.
- Learned: paint once per state (no "boiling" lines), so the same state gives the same picture;
  keep one canvas size for both layouts (p5.brush keeps its buffers at the first size); skip
  p5's device-motion listeners, which the sandbox forbids; labels stay in HTML, the picture
  carries no text.

**2. Blackboard chalk, drawn stroke by stroke** (Canvas 2D, no library; the method of
khan-explainer), on compound interest: simple interest as a straight line, compound as a curve,
the gap at the chosen year, rate and years sliders.

- Passes `board:check`: 7 states, both layouts, Arabic and English.
- Cost: no library, draws at once. The pen animates when the lesson moves on; the learner's own
  changes are instant, and reduced motion draws the end picture straight away.
- Learned: wobble from `sin()`, never random, keeps pictures stable; the chalk texture is a fixed
  noise mask on a separate layer; sliders stay left to right in Arabic to match the graph.

Next: Owner and Ess judge both on a phone. A kept style gets its `STYLE.md` (G7), then the real
test: can Codex make a new scene in that style from the guide alone?

## What changes in New Learn as styles arrive

Tasks G6–G12 (docs/tasks/teaching.md), round OR25:

- the builder looks at screenshots of its boards and fixes them before it finishes;
- every scene gets a picture by default, and text alone only when the teacher asks;
- the studio page shows each style as a card with a real preview;
- three.js, D3, p5.js and lottie-web are served from the board origin, pinned.
