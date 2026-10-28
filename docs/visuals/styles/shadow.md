# Shadow puppets (`demo-pyramid-shadow`)

Flat dark silhouettes on cut-paper layers against a sunset sky; for history, crafts, work and
forces, stories of people doing things, any scene that reads well in profile.

## Reference board

`demo-pyramid-shadow`, folder `fixtures/demos/boards/pyramid-shadow/`: a 2.5-tonne block hauled
up a ramp on a sledge. Variables: `slope` (number 4–20°, step 1) and `sand` (choice
`dry`/`wet`). Targets: `#scene`, `#slope-control`, `#sand-choice`, `#ramp`, `#workers` (the last
two are the panel's figure lines, not SVG shapes). `get_style` returns its files (`board.json`,
`index.html`, `scene.js`, `physics.js`); start a new board from that structure: a model file
that returns numbers, a scene file that returns SVG markup, and `index.html`.

## Palette

| Role                                                | Value                                |
| --------------------------------------------------- | ------------------------------------ |
| Silhouettes, ramp, text, backdrop (`--nl-backdrop`) | `#2b1b10`                            |
| Panel paper (body)                                  | `#f6e3c4`                            |
| Sky gradient top / middle / bottom                  | `#ffcf8a` / `#f4945a` / `#d9603f`    |
| Sun (opacity 0.92) / dune layer                     | `#ffe7b3` / `#eaa45c`                |
| Pyramid shaded / lit face / courses (opacity 0.6)   | `#b8622e` / `#cf8247` / `#8f4a20`    |
| Ground layer, slider accent / ramp struts           | `#9a5226` / `#5b3a22`                |
| Paper drop shadow                                   | `#4a1e08` at 0.45                    |
| Water drops (wet state only)                        | `#7fb7d8`                            |
| Figures box: background / text / numbers            | `#2b1b10` / `#ffe7b3` / `#ffb366`    |
| Choice button / pressed                             | `#fff3df` / `#2b1b10` with `#ffe7b3` |

## Type

NL Sans only (helper default `32px/1.4`; buttons inherit 32px). Landscape: title 40px 600,
figures 30px, note 28px (line-height 1.45), slider label 28px. Portrait: figures, note and label
32px. The scene has no text, so the SVG's scaling never shrinks words.

## Drawing technique

Inline SVG (`<svg id="scene" viewBox="0 0 860 720">`), no library. `sceneSvg(state)` returns the
whole scene as a string and `onState` sets `innerHTML`: each state is a full redraw. Back to
front: sky gradient, sun, dune, pyramid (two faces plus course lines), ground, ramp with struts,
block on its sledge with rope and crew, water if wet, then a paper grain over everything, all
clipped to the frame. Each paper layer gets the same soft drop shadow, which makes it cut paper:

<!-- prettier-ignore -->
```html
<filter id="lift" x="-10%" y="-10%" width="120%" height="130%">
  <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#4a1e08" flood-opacity="0.45"/>
</filter>
<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/>
  <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.15  0 0 0 0 0.05  0 0 0 0.09 0"/></filter>
<!-- last child of the scene: -->
<rect width="860" height="720" filter="url(#paper)" opacity="1"/>
```

The grain is brown noise at alpha 0.09; the fixed `seed="4"` keeps it identical every draw.
Figures are flat `#2b1b10` paths (inherited `fill`) with no outline, placed and tilted by
`transform`; small per-index variation keeps a crowd from looking stamped, without randomness:

<!-- prettier-ignore -->
```js
const worker = (x, y, a, i) =>
  `<g transform="translate(${x} ${y}) rotate(${a}) scale(${i % 3 === 1 ? 0.95 : 1})">
     <circle cx="${i % 2 ? 1 : -1}" cy="-34" r="6"/>
     <path d="M2,-28 L-7,-8 L-12,10 L-7,10 L-2,-3 L3,10 L8,10 L4,-8 L5,-26 Z"/>
     <path d="M3,-22 L-14,-14 L-13,-11 L3,-17 Z"/>
   </g>`;
```

Geometry comes from the variables: the ramp foot is `TOP.x - (GROUND - TOP.y) / tan(slope)`,
`along(t)` gives a point on the ramp, workers are spaced along it and rotated by `-slope`. The
crew drawn is capped at 14 and the block kept on screen at gentle slopes; the panel shows the
true count.

## Layout

Landscape: scene 860×720 at left; panel 420×720 at right, padding 36px 34px, gap 14px: title,
figures box, note, slider, choice. Portrait: scene 720×603 on top (the same viewBox scaled by
720/860, so one drawing serves both), panel 720×677 below, padding 20px 44px 32px, gap 12px.
Only CSS changes, on `[data-layout='portrait']`.

## Controls and states

Choice: two `flex: 1` buttons, `min-height: 96px`, `3px solid #2b1b10`, radius 14px, paper
`#fff3df`; pressed (`aria-pressed="true"`) turns silhouette-dark `#2b1b10` with `#ffe7b3` text.
Slider: native range, 96px tall, `direction: ltr`, `accent-color: #9a5226`, value in the label.
Results: a dark box (radius 14px) like a lit puppet screen, numbers in `#ffb366`. Highlight and
notes are the helper's defaults (outline `4px #e0a526`, note `#fff8e1`); the lessons use
`highlight` only.

## Motion

None in the reference: every state, from the lesson or the learner, is an instant full redraw,
so reduced motion shows the same picture. Rebuilding with `innerHTML` makes new elements, so CSS
transitions would not run. If motion is added, use CSS animations (the helper's
`[data-reduced-motion] * { animation: none !important }` stops them) and make the resting frame
the state's true picture.

## Do and don't

- Do keep figures as flat `#2b1b10` silhouettes in profile: no outlines, no inner detail.
- Do stack paper layers, each with `filter="url(#lift)"`, warm colours darkening downward.
- Do finish with the `#paper` grain rect over the whole scene, `seed` fixed.
- Do derive every position from the variables with plain geometry.
- Do cap crowds to what fits and print the real number in the panel.
- Don't use `Math.random()`, cold colours (beyond a small water accent) or strokes on figures.
- Don't put text inside the SVG; keep words in the panel.
- Don't give SVG shapes the target ids `#ramp`/`#workers`: they belong to the panel lines.

## Before put_board

- `npm run board:check -- <folder>` passes (landscape, portrait, Arabic, English).
- Text ≥ 24px landscape, ≥ 32px portrait, ≥ 8px from the edge; controls 96px.
- Same state, same picture: fixed `seed`, no clocks or randomness in `sceneSvg`.
- `libraries: []` as in the reference; classic `<script src>` files after the helper, no modules.
- Every id in `targets` exists and is unique across SVG and panel; `observe` on every state.
