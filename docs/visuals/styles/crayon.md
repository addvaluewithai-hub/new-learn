# Crayon picture book (`crayon`)

Bright crayon on cream paper, wobbly and friendly: for children and first concepts (counting,
fractions, shapes, simple science), with big shapes and a few big words.

## Reference board

`demo-fractions-crayon` in `fixtures/demos/boards/fractions-crayon/` (`board.json`,
`index.html`, `pizza.js`). A pizza cut into `slices` (2–12) with `taken` (0–12) slices shaded
and slid out, beside a half pizza; a big `<`, `=` or `>` compares them. Targets: `#pizza`,
`#half`, `#fraction`, `#compare`, `#slices-control`, `#taken-control`. `libraries` is `[]`.
`get_style` returns these files: start a new board from their structure (an SVG string
builder in its own classic script, HTML text and controls in `index.html`) and change the topic.

## Palette

| Role                                     | Hex                   |
| ---------------------------------------- | --------------------- |
| Paper (body, SVG background)             | `#fff8e6`             |
| Panel, `--nl-backdrop`                   | `#fff1d0`             |
| Ink text, fraction bar                   | `#3a2a1a`             |
| Outline crayon, title, tags              | `#c0392b`             |
| Red crayon: fraction, dots, hatch, range | `#e0533d`             |
| Shaded (taken) fill / plain fill         | `#ffb347` / `#ffe08a` |
| Crust fill / crust outline               | `#e9a84a` / `#a0522d` |
| Yellow: star doodle, dashed panel border | `#f4c430`             |
| Blue: sign, compare line, second hatch   | `#3d7be0`             |
| Doodles: mint, light blue                | `#7fc8a9`, `#9fb8ff`  |

Paper grain is not a hex: an `feColorMatrix` tints noise brown (0.55, 0.4, 0.2) at alpha 0.16.

## Type

NL Sans only (the helper's default, 32px/1.4); weight 600 for everything that matters.
Landscape: title 42, the fraction 64 (line-height 1), the sign 96, tags 28, compare 30,
slider labels 28. Portrait: tags 38, compare and labels 32; title, fraction and sign unchanged.
Numbers use `Intl.NumberFormat('ar-EG' | 'en')` (Arabic-Indic digits in Arabic). The fraction
is HTML, not SVG text: numerator, a 110×7px rounded bar, denominator in a grid.

## Drawing technique

One inline SVG (`viewBox 0 0 860 720`) rebuilt as a string on every state. Three signatures:

1. **Wobble**: every shape group sits under `filter="url(#crayon)"`, turbulence displacing the
   edges. Strokes are thick (5px), `stroke-linejoin`/`linecap: round`, red outline on yellow.
2. **Hatching**: shaded parts get a second path filled with a rotated line `<pattern>`
   (35° red, −35° blue), ids suffixed per shape (`hatch-a`, `hatch-b`).
3. **Grain**: a last full-size `<rect filter="url(#grain)">` lays fine noise over all.

```svg
<filter id="crayon"><feTurbulence type="fractalNoise" baseFrequency="0.035"
    numOctaves="2" seed="5" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="7"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="2"/>
  <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.4  0 0 0 0 0.2  0 0 0 0.16 0"/></filter>
<pattern id="hatch-a" width="14" height="14" patternUnits="userSpaceOnUse"
    patternTransform="rotate(35)">
  <line x1="0" y1="0" x2="0" y2="14" stroke="#e0533d" stroke-width="4" opacity="0.55"/></pattern>
```

Randomness is fixed: turbulence has a `seed`, there is no `Math.random`. Decorations come
from the values (dots at fixed fractions of the radius on each slice's middle angle; a shaded
slice slides out `r * 0.09` on that angle). Doodles are fixed corner paths. Targets are empty
`<div>`s over the shapes with `border-radius: 50%`, so the helper's outline hugs the circle.

```js
const out = i < taken ? r * 0.09 : 0;
const [dx, dy] = [Math.cos(mid) * out, Math.sin(mid) * out];
parts.push(`<path d="${slicePath(cx + dx, cy + dy, r, a0, a1)}"
  fill="${i < taken ? '#ffb347' : '#ffe08a'}" stroke="#c0392b" stroke-width="5"/>`);
```

## Layout

Landscape 1280×720: the art (`#art`, 860×720) on the left; a 420px panel on the right
(`#fff1d0`, padding 34, column with 12px gaps) with a 6px dashed `#f4c430` divider
(`border-inline-end`, which lands on the left because the page is `dir="rtl"`).
Portrait 720×1280: `#art` is scaled by `0.8372` from the top-left (860 → 720 wide, 603 tall);
the panel moves to `top: 603px`, 720×677, with the dashed border on top. Switching is pure CSS
on `[data-layout='portrait']`; the SVG is the same in both.

## Controls and states

Native `<input type="range">` at `height: 96px`, full panel width, `accent-color: #e0533d`,
`direction: ltr` in both languages; each inside a `<label>` whose text states the value
("Taken: 3 slices"). `onState` writes the values back and caps `taken.max` at `slices`.
Highlight, reveal and notes come from the helper unchanged: a 4px `#e0a526` outline, hidden
`[data-reveal]` until revealed, and a `#fff8e1` note bubble at 32px. The reference uses no
`data-reveal`; add it to an element whose id is in `targets` if a step must reveal it.

## Motion

The reference has none: each state replaces the SVG `innerHTML` at once, so a drag is instant
and reduced motion already shows the end picture ("sliding out" is a static offset). To animate
a lesson step (`view.step` changed), use CSS only, which the helper turns off under
`[data-reduced-motion]`, and end on exactly the state's picture.

## Do and don't

- Do use one or two big objects that fill the art (the pizza has radius 220 in 860×720).
- Do use short, spoken words ("Taken: 3 slices", "Exactly a half!"), one idea per line.
- Do show the number beside the picture, large (64–96px) and in the learner's digits.
- Do keep thick round-capped strokes, flat fills, hatching for "this part".
- Do suffix every repeated pattern id per shape, and keep the turbulence seeds fixed.
- Don't put text inside the SVG; labels, tags and the sign are HTML over it.
- Don't use thin lines, gradients, shadows or more than a few doodles: they compete.
- Don't use `Math.random`, time or animation-frame state to draw.

## Before put_board

- `npm run board:check -- <folder>` passes: landscape and portrait, Arabic and English.
- Text ≥ 24px landscape, ≥ 32px portrait **after** the `0.8372` scale of `#art`: the check
  reads the CSS size, so size text inside `#art` at 40px or more in portrait (38 is borderline).
- Every control ≥ 88px on its short side (use 96); sliders stay `direction: ltr`.
- Same state ⇒ same SVG string: seeds fixed, no random, values clamped and rounded first.
- `libraries: []`, classic `<script src>` files (no modules), and `NewLearnBoard.observe` called.
