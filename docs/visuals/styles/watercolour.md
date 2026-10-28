# Hand-painted watercolour (`watercolour`)

Warm, calm and handmade, like a picture-book page: nature, plants, food, home, health, daily life.

## Reference board

`demo-plants-painted` in `fixtures/demos/boards/plants-painted/` (`index.html`, `paint.js`,
`scene.js`; libraries `p5@2.3.3` and `p5.brush@2.2.3`). A window, a pot of basil on a table and a
magnified circle of the top 2 cm of soil. One choice variable, `soil`: `moist`, `dry` (pale soil,
cracks, drooping leaves), `watered` (can, stream, drops, water in the saucer). Targets: `#scene`,
`#probe`, `#choices`, `#verdict`. `get_style` returns these files: start new boards from this
structure (`paint.js` as is, a new `scene.js`, the same p5 setup and `onState`).

## Palette

| Role                                         | Hex                                        |
| -------------------------------------------- | ------------------------------------------ |
| Paper: body, `--nl-backdrop`, `p.background` | `#f3ebdc`                                  |
| Ink outlines, panel text                     | `#2b2233`                                  |
| Hint text                                    | `#5b4b44`                                  |
| Cards (verdict, idle buttons)                | `#fff7ea`                                  |
| Terracotta: selected button, pot, border     | `#d97757`, `#c8663f`, `#a85a42`            |
| Leaf greens; stem                            | `#5e9a4e`, `#67a957`, `#a9b276`; `#3f6b37` |
| Water and sky                                | `#8ec3e6`, `#6fb2da`, `#3a9c98`, `#d7e8ef` |
| Earth and wood                               | `#4a3426`, `#b9946a`, `#c99a63`            |
| Grain vignette (multiplied)                  | `rgba(120,95,70,.28)`                      |

## Type

NL Sans, all in HTML: title 46/600 (line-height 1.2), hint and verdict inherit the body's 32,
choice buttons 28/600 (32 in portrait), the label under the magnifier 26/600 (34 in portrait).
The painting carries no text.

## Drawing technique

p5 in instance mode with p5.brush on a **WEBGL** canvas, 760×720, `pixelDensity(1)`, `noLoop()`:
the scene is painted once per state with `p.redraw()`. `draw()` sets the paper background and
translates by `(-BOX.w / 2, -BOX.h / 2)` so design coordinates start top left. Every element is
one `shape(points, opts)`: a flat `wash`, a watercolour `fill` (bleed 0.1, texture 0.4/0.35) and a
tapered outline with the custom `ink` brush; `line()` is an ink spline. Points come from `ell()`,
`rect()` and `leaf()`, jittered a little. Shapes are drawn round their own centre (`centred()`),
because p5.brush loses strokes far from the origin. Before each element, `key('name')` reseeds:

```js
const key = (k) => {
  let h = 2166136261 ^ seed;
  for (const c of String(k)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  p.randomSeed(h >>> 0);
  p.noiseSeed(h >>> 0);
};
key('pot');
shape(potPoints, { wash: '#D97757', fill: '#C8663F', fillOp: 120, sw: 1.1 });
key('soil');
shape(ell(380, 378, 120, 17, 28, 1.5), { wash: s.soil, sw: 0.7 });
```

Options: `washOp` (255), `fillOp` (170), `ink: null` for no outline, `sw` stroke weight, `curv`
for curved vertices. Setup: `brush.scaleBrushes(3.2)` and `brush.add('ink', { weight: 5,
scatter: 0.25, sharpness: 0.8, grain: 40, opacity: 235, pressure: [1.15, 0.75], … })`. Each state
is a table of colours (`SOIL[soil]`: soil, top, leaf, droop) plus `if (soil === …)` extras.

Over the painting, a second 2D canvas `#grain` with `mix-blend-mode: multiply`: seeded LCG
paper speckle plus a radial vignette, made once. Labels and hit areas are HTML on top: `#probe`
is a round div placed over the painted magnifier from `PROBE {x, y, r}`, so it can be
highlighted. Before p5 loads, the board drops `devicemotion`/`deviceorientation` listeners,
which the sandbox forbids (copy that `<script>` as is).

## Layout

- **Landscape 1280×720:** `#scene` 760×720 at the left; `.panel` 520×720 at the right, padding
  56/48, column gap 22: title, hint, choice buttons, verdict.
- **Portrait 720×1280:** the same 760×720 painting, `transform: translate(0, 19px)
scale(0.9474)` so it is 720 wide; `.panel` at top 720, 720×560, padding 24/48/40.
- Keep **one painting size** for both layouts: p5.brush keeps its buffers at the first size.

## Controls and states

- Choice buttons rebuilt in `onState`: flex, `min-height: 96px`, `min-width: 120px`, 3px
  `#a85a42` border, uneven radius `22px 14px 24px 12px` (hand-cut), `#fff7ea` background; the
  chosen one `aria-pressed="true"`, `#d97757` with white text.
- `#verdict` is a `#fff7ea` card, radius 16, with an 8px `border-inline-start` whose colour
  follows `html[data-soil]`: green `#5e9a4e`, terracotta `#d97757`, teal `#3a9c98`.
- Highlight and notes are the helper's (4px `#e0a526` outline, `#fff8e1` notes); give a painted
  part an HTML overlay like `#probe` so it can be a target.

## Motion

None. A new state repaints the whole scene at once, whether the lesson or the learner changed
it, so reduced motion shows the same picture. A repaint takes about 3 s on software WebGL.

## Do and don't

- Do call `key('unique-name')` before every element; same key, same brushwork.
- Do paint once per state (`noLoop` + `redraw`): no animation loop, no "boiling" lines.
- Do keep labels, numbers and sentences in HTML; the painting has no text.
- Do use soft, warm colours from the table; no pure black (ink is `#2b2233`). White appears
  only as a translucent cloud wash and on the selected button's text.
- Do keep the multiplied grain canvas and the vignette; they make it read as paper.
- Don't use `Math.random`; jitter only through `p.random()` after `key()`.
- Don't change the canvas size between layouts; scale `#scene` with CSS.
- Don't draw strokes far from a shape's centre; go through `shape()` and `line()`.

## Before put_board

- `npm run board:check -- <folder>` passes: both layouts, Arabic and English, every option.
- HTML text ≥24 landscape and ≥32 portrait; buttons 96 high; 8px from the edges.
- Same state, same picture: a `key()` per element, grain from a fixed seed.
- `libraries: ["p5@2.3.3", "p5.brush@2.2.3"]`, loaded from `/lib/p5@2.3.3/lib/p5.min.js` and
  `/lib/p5.brush@2.2.3/dist/p5.brush.js` as classic scripts after the device-motion guard.
- `NewLearnBoard.start` runs from p5's `setup()`, after the canvas exists.
