# Chalk on a blackboard (`chalk`)

A teacher's pen writing on a dark slate, stroke by stroke: maths, graphs, equations, rates.

## Reference board

`demo-interest-chalk` in `fixtures/demos/boards/interest-chalk/` (`index.html`, `chalk.js`,
`graph.js`; no libraries). Compound interest on 1000: `rate` (1–15 %) and `years` (0–30) set a
straight simple-interest line and a compound curve; a marker at `years` shows the gap. Targets:
`#graph`, `#simple`, `#compound`, `#rate-control`, `#years-control`. `get_style` returns these
files: start new boards from this structure (`chalk.js` as is, a new drawing file in the shape
of `graph.js`, the same `onState`).

## Palette

| Role                                   | Hex                   |
| -------------------------------------- | --------------------- |
| Slate: body, `--nl-backdrop`, canvas   | `#1f2b27`             |
| Chalk: axes, arrows, panel text        | `#f4f1e8`             |
| First data line and its panel value    | `#cfe8ff`             |
| Second data line, slider accent        | `#ffe066`             |
| The key fact (the gap and its value)   | `#f48fb1`             |
| Dim chalk: ticks, units, formula       | `#93a39c`             |
| Faint full-range lines (blue / yellow) | `#5d6f68` / `#6f6a45` |
| Smudges, radial, alpha 0.025–0.06      | `rgba(220,230,225,…)` |

## Type

NL Sans only. Panel: title 44/600, values 34/600, formula 26, slider labels 28; portrait raises
labels and formula to 32. On the slate (canvas `fillText`): ticks 24–26, axis words 26, gap value
30 bold, the same in portrait. `board:check` measures only HTML text: draw canvas text at 32+
in portrait.

## Drawing technique

Canvas 2D, no library. One `<canvas id="graph">` plus two offscreen canvases of the same size: a
**chalk layer** and a **noise mask**. Per picture: `ch.board()` fills the slate and 26 smudges
from `lcg(3)`; every stroke and word goes on the layer; `ch.flush()` punches the noise out of the
layer and lays it on the slate. Each stroke is two passes, soft and wide under bright and narrow:

```js
for (const [width, alpha] of [
  [(o.width || 5) * 2.2, 0.18],
  [o.width || 5, 0.92],
]) {
  lg.strokeStyle = o.color || '#f4f1e8';
  lg.globalAlpha = alpha;
  lg.lineWidth = width;
  lg.lineCap = lg.lineJoin = 'round';
  // moveTo(pts[0]); lineTo the first ceil(pts.length * p) points; stroke()
}
```

No `Math.random`. Wobble is `sin()`: `curve(a, b, ctrl)` is a quadratic Bézier plus
`amp * Math.sin(u * 9)` (`amp = min(2, length / 80)`); data paths add `1.5 * Math.sin(i * 0.7)`
to x and `1.5 * Math.sin(i * 1.3)` to y. Texture is a seeded LCG, built once per size:

```js
const lcg = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
d[i + 3] = rnd() < 0.22 ? 150 + rnd() * 105 : 0; // noise mask from lcg(7), in resize()
// flush():
lg.globalCompositeOperation = 'destination-out';
lg.drawImage(noise, 0, 0);
lg.globalCompositeOperation = 'source-over';
g.drawImage(layer, 0, 0);
lg.clearRect(0, 0, W, H);
```

Also `arrow()` (heads ±2.6 rad, 20px), `write(str, x, y, p, o)` (uncovers text through a clip
rect in writing order, right to left for Arabic) and `dot()`. Widths: axes 4, ticks 3, faint
lines 2, data 6. The picture is redrawn from scratch on every state; the marker is drawn only at
`p === 1`, followed by a second `flush()`.

## Layout

- **Landscape 1280×720:** the canvas fills the board; graph at x 130–800, y 120–610; `.panel`
  absolute at the right, 400×720, padding 44/36, column gap 14.
- **Portrait 720×1280:** on a layout change `ch.resize(720, 1280)` and the canvas CSS size are
  set; graph at x 120–660, y 150–640; `.panel` at top 740, 720×540, values side by side. The
  layout comes from `env.layout` in `onState`; CSS switches on `[data-layout='portrait']`.

## Controls and states

- `<input type="range">` in a `<label>` grid (text above), width 100%, height 96,
  `accent-color: #ffe066`, `direction: ltr` even in Arabic, to run the way the x-axis does.
- Panel values take their line's colour, so highlighting `#simple` points at the blue line too.
  Numbers through `Intl.NumberFormat('ar-EG' | 'en')`.
- Highlight and notes are the helper's: 4px `#e0a526` outline, `#fff8e1` note boxes. The
  reference uses no `data-reveal`; to reveal a part, make it an HTML element with that attribute.

## Motion

- **Lesson moves on, input locked, state key changed** (`rate|years|layout|lang`): the pen draws
  the data lines over 1100 ms, eased `k * k * (3 - 2 * k)`, via `requestAnimationFrame`; axes and
  faint lines are there at once; the marker appears at the end.
- **Learner changes a slider (input open)** and **reduced motion:** instant `draw(1)`, the end
  picture. Always `cancelAnimationFrame(frame)` first.

## Do and don't

- Do draw every line twice, flush through the noise mask; wobble from `sin()`, texture from LCG.
- Do show context faint and the answer bright; one pink for the single key fact.
- Do keep sentences, numbers and controls in the HTML panel; the slate gets ticks and labels.
- Don't use `Math.random` or rebuild the noise per frame.
- Don't use pure black or white: slate `#1f2b27`, chalk `#f4f1e8`.
- Don't animate the learner's own changes or replay the pen when the key is unchanged.

## Before put_board

- `npm run board:check -- <folder>` passes: both layouts, Arabic and English.
- Text ≥24 landscape and ≥32 portrait (canvas text included), 8px from the edges.
- Sliders and buttons 96 high; the canvas is resized on layout change.
- Same state, same picture: no randomness; reduced motion and open input draw `p = 1`.
- `libraries: []`, classic `<script src>` files, `NewLearnBoard.observe` on every state.
