# Sea chart (`demo-suez-map`)

An old nautical chart in brown ink on stained parchment, a pen drawing the route; for geography,
trade, history, journeys and anything that happens on a map.

## Reference board

`demo-suez-map`, folder `fixtures/demos/boards/suez-map/`: a ship from Singapore to Rotterdam
through Suez or round the Cape. Variables: `route` (choice `suez`/`cape`) and `speed` (number
10–22 knots, step 1). Targets: `#chart`, `#route-choice`, `#speed-control`, `#trip`, `#saving`.
`get_style` returns its files (`board.json`, `index.html`, `chart.js`, `coasts.js`); start a new
board from that structure: data file (shapes as `[lon, lat]`), drawing file, then `index.html`.

## Palette

| Role                                 | Value                                         |
| ------------------------------------ | --------------------------------------------- |
| Parchment / panel / `--nl-backdrop`  | `#e9d8b0` / `#efe1bf` / `#d9c59a`             |
| Text ink / line ink (`INK`)          | `#3b2614` / `#5a3b22`                         |
| Land / inland seas                   | `#dcc595` / `#e4d3aa`                         |
| Coast water lines (3 strokes)        | `rgba(70,95,110,a)`, a = 0.05 / 0.07 / 0.10   |
| Paper stains                         | `rgba(150,105,55,a)`, a = 0.04–0.10           |
| Edge vignette                        | `rgba(110,70,30,a)`, a = 0 → 0.32             |
| Graticule / faint other route        | `rgba(90,59,34,0.18)` / `rgba(90,59,34,0.45)` |
| Accent: chosen route, ports, pressed | `#8e2a1a`, pressed text `#fff6e6`             |
| Compass points / ship hull / sail    | `#c9a46b` / `#7a2a18` / `#f4ead2`             |
| Button paper / place-label chip      | `#f6ecd2` / `rgb(240 226 192 / 85%)`          |
| Good-news line (`#saving`)           | `#2f5a3a`                                     |

## Type

NL Sans only (helper default `32px/1.4`; buttons inherit 32px). Landscape: title 38px 600,
labels and figures 28px, `.cartouche` 26px, place names 24px 600. Portrait raises labels,
figures, places and cartouche to 32px. No text is drawn on the `<canvas>`: every word is an HTML
element over it, so board:check can measure it and both languages render.

## Drawing technique

Canvas 2D (`#chart`), no library. `drawChart()` repaints everything each frame: parchment,
graticule, coasts (clipped to the map box), frame (`strokeRect` 3px `INK`), compass rose (16
alternating `INK`/`#c9a46b` points), faint other route, chosen route up to `p`, port dots, ship
at the pen tip. Paper stains use a seeded Park–Miller generator, so the same state gives the
same paper; the engraved water lining is each coast path stroked three times, wide and faint to
narrow and darker, before the land fill (`#dcc595`) and its 1.6px `INK` outline:

<!-- prettier-ignore -->
```js
let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 30; i++) { // stains; a radial vignette goes over them
  const x = rnd() * w, y = rnd() * h, r = 60 + rnd() * 220;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(150,105,55,${0.04 + rnd() * 0.06})`);
  gr.addColorStop(1, 'rgba(150,105,55,0)');
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
}
for (const [width, alpha] of [[22, 0.05], [14, 0.07], [7, 0.1]]) {
  g.strokeStyle = `rgba(70,95,110,${alpha})`; g.lineWidth = width; g.lineJoin = 'round';
  lands.forEach((pts) => (pathOf(g, pts), g.stroke()));
}
```

Routes are dashed (`setLineDash`): chosen `#8e2a1a` 4.5px `[14, 8]` round caps, other 2.5px
`[4, 8]`. `routeLine(g, pts, upTo, style)` walks the polyline to a length and returns the tip,
where `ship()` is drawn. `project(box)` maps lon/lat linearly into the map box, and the box keeps
the data's aspect (145° × 100°) so the land never stretches.

## Layout

Landscape: chart `#chart-wrap` 860×720 at left; panel 420×720 at right, padding 36px 34px, gap
14px, a `3px double #5a3b22` rule on its chart side (`border-inline-end`; the page stays
`dir="rtl"` in both languages). Portrait: chart 720×560 on top, panel 720×720 below, padding
24px 44px 36px, the double rule on top. CSS switches on `[data-layout='portrait']`; JS reads
`env.layout` and sets `canvas.width/height` (860×720 or 720×560) and the map box
(`{x:24,y:76,w:812,h:560}` or `{x:16,y:64,w:688,h:474}`). Place labels are spans at `P(lon,lat)`
plus a fixed offset, centred by `translate(-50%, 0)`, clamped 90px from the chart's sides.

## Controls and states

Choice: two `flex: 1` buttons, `min-height: 96px`, `3px solid #5a3b22`, radius 12px, paper
`#f6ecd2`; the chosen one (`aria-pressed="true"`) fills `#8e2a1a` with `#fff6e6` text. Slider:
native range, 96px tall, `direction: ltr`, `accent-color: #8e2a1a`, its value in the label.
Results sit in `#trip`, a `2px solid #5a3b22` box with radius 10px, numbers in `<b>`. Highlight
and notes are the helper's defaults (outline `4px #e0a526`, note `#fff8e1`); the lessons use
`highlight` only.

## Motion

When the lesson brings a new route (or layout or language), the pen draws it over 1.6 s with
smoothstep easing and the ship rides the tip (`requestAnimationFrame`). A speed change, open
input or reduced motion draws `p = 1` at once. End picture: full route, ship at the destination.

```js
const key = `${route}|${layout}|${lang}`;
const animate = env?.reducedMotion !== true && view.input !== 'open' && key !== last;
last = key;
cancelAnimationFrame(frame);
if (!animate) return draw(1);
```

## Do and don't

- Do keep line work in `INK` `#5a3b22` and one red accent `#8e2a1a` for what the learner chose.
- Do keep randomness seeded and repaint the whole canvas every frame.
- Do put words in HTML labels over the canvas, on a parchment chip.
- Do show the alternative faint and dashed so the comparison stays visible.
- Don't use `Math.random()`, bright colours, gradients on land, or drop shadows.
- Don't animate slider changes or open input; only a new lesson choice animates.
- Don't draw text with `fillText`; it escapes the size, font and edge checks.

## Before put_board

- `npm run board:check -- <folder>` passes (it covers landscape, portrait, Arabic, English).
- Text ≥ 24px landscape, ≥ 32px portrait, place labels ≥ 8px from the edge; controls 96px.
- Same state, same picture: seeded paper; reduced motion draws `p = 1`.
- `libraries: []` as in the reference; classic `<script src>` files after the helper, no modules.
- Every id in `targets` exists in both layouts; `observe` is called on every state.
