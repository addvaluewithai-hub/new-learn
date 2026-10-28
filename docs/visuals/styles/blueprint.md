# Blueprint (`demo-circuit-blueprint`)

White technical lines on a gridded blue sheet with one warm yellow for what flows; for circuits,
machines, mechanics, engineering, plans and any labelled schematic.

## Reference board

`demo-circuit-blueprint`, folder `fixtures/demos/boards/circuit-blueprint/`: battery, switch,
resistor and a 6 Ω bulb in series. Variables: `switch` (choice `open`/`closed`), `volts` (number
1.5–9 V, step 1.5) and `resistor` (number 0–24 Ω, step 2). Targets: `#drawing`, `#bulb`,
`#meters`, `#switch-control`, `#volts-control`, `#resistor-control`. `get_style` returns its files
(`board.json`, `index.html`, `drawing.js`); start a new board from that structure: a drawing
file with the model and an SVG-string function, and `index.html` with styles and text.

## Palette

| Role                                     | Value                                              |
| ---------------------------------------- | -------------------------------------------------- |
| Body and panel / `--nl-backdrop`         | `#0e2d55` / `#0b2546`                              |
| Drawing sheet                            | `#123a6b`                                          |
| Lines, symbols, SVG labels / panel text  | `#f2f7ff` / `#e8f1ff`                              |
| Grid every 20 / every 100                | `rgb(255 255 255 / 7%)` / `rgb(255 255 255 / 15%)` |
| Accent: current, numbers, switch, slider | `#ffe066`                                          |
| Bulb halo centre / edge                  | `#fff4b8` / `#ffd23f`                              |
| Lit bulb fill                            | `rgba(255,236,150, 0.25 + 0.6·glow)`               |
| Formula line (`.law`)                    | `#a9c4ea`                                          |

## Type

NL Sans only (helper default `32px/1.4`; the switch button inherits 32px). Panel: title 40px
600; meters, formula and slider labels 28px landscape, 32px portrait. SVG labels `.t` 28px and
title block `.t.b` 26px in landscape; portrait raises them to 40px and 34px because the SVG is
scaled by 720/860 there, and board:check measures SVG text by its rendered height. The formula
`I = V ÷ R` is `direction: ltr` with `text-align: right`.

## Drawing technique

Inline SVG (`<svg id="drawing" viewBox="0 0 860 720">`), no library. `drawingSvg(state)` returns
the whole sheet as a string, set with `innerHTML` on every state. Styles live in CSS classes in
`index.html`, not in the markup: `.g`/`.G` grid, `.w` white line (4px, round caps, no fill),
`.w.thick` 9px, `.frame` 3px, `.dot` terminals, `.t` labels, `.flow` current. Order: sheet rect,
grid, frame inset 30px, wires, flow, symbols, halo, bulb, labels, title block.

```js
for (let x = 0; x <= 860; x += 20)
  grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="720" class="${x % 100 ? 'g' : 'G'}"/>`);
for (let y = 0; y <= 720; y += 20)
  grid.push(`<line x1="0" y1="${y}" x2="860" y2="${y}" class="${y % 100 ? 'g' : 'G'}"/>`);
```

Parts are textbook schematic symbols built from the state: a long thin and a short thick line
per 1.5 V cell, a zigzag `polyline` resistor (a straight wire at 0 Ω), a switch arm level when
closed and tilted when open, a crossed circle for the bulb, a title block bottom right (`rect`
290×80, "Sheet 7 · Ohm's law"). Current is a dotted yellow path over the wires, its dashes slid
by CSS, faster as the bulb glows brighter:

<!-- prettier-ignore -->
```css
#drawing .flow { fill: none; stroke: #ffe066; stroke-width: 5; stroke-linecap: round;
  stroke-dasharray: 2 26; animation: flow linear infinite; }
@keyframes flow { to { stroke-dashoffset: -28; } }
/* per state, on the path: */
style="animation-duration:${(2.4 / Math.max(0.15, glow + 0.15)).toFixed(2)}s"
```

Brightness `glow = min(1, sqrt(I²·6 / 13.5))` sets the halo radius (`70 + 50·glow`), its stop
opacity and the bulb fill. No randomness anywhere.

## Layout

Landscape: drawing 860×720 at left; panel 420×720 at right (no own background), padding 32px
34px, gap 12px: title, `#meters`, formula, switch, two sliders. Portrait: drawing 720×603 on top
(same viewBox, scaled), panel 720×677 below, padding 16px 44px 28px, gap 10px. `#bulb` is an
empty round HTML div laid over the bulb symbol so the lesson can highlight it: 120×120 at
(670, 270) landscape, 100×100 at (561, 226) portrait (the symbol's centre × 720/860).

## Controls and states

The switch is one toggle button, not two choices: `min-height: 96px`, transparent, `3px solid
#ffe066`, radius 12px, yellow text naming the action ("Close the circuit" / "Open the
circuit"). Sliders: native range, 96px tall, `direction: ltr`, `accent-color: #ffe066`, value in
the label. `#meters` is a square-cornered `2px solid #f2f7ff` box, numbers in yellow `<b>`.
Highlight and notes are the helper's defaults (outline `4px #e0a526`, note `#fff8e1`); the
lessons use `highlight` only.

## Motion

Lesson steps and learner changes are both instant redraws (switch arm, cells, zigzag, glow).
The only motion is the looping current while the circuit is closed. Under reduced motion the
helper's `[data-reduced-motion] * { animation: none !important }` stops it at offset 0: the end
picture is the lit circuit with still dots on the wires.

## Do and don't

- Do draw everything in `#f2f7ff` lines on `#123a6b`, with the 20/100 grid and a 30px frame.
- Do keep yellow `#ffe066` for the one thing that flows or matters, and its numbers.
- Do use standard schematic symbols with short labels, plus a title block.
- Do keep line styles in CSS classes and `drawingSvg` pure (state in, string out).
- Do add an HTML overlay div for any SVG part the lesson must highlight, placed per layout.
- Do raise SVG font sizes in portrait so their scaled height stays ≥ 32px.
- Don't use fills, gradients or shadows on parts; only the bulb halo glows.
- Don't drive the current with JS timers; a CSS animation stops under reduced motion.

## Before put_board

- `npm run board:check -- <folder>` passes (landscape, portrait, Arabic, English).
- Text ≥ 24px landscape, ≥ 32px portrait (SVG labels after scaling); controls 96px.
- Same state, same picture: no randomness, motion only in CSS animations.
- `libraries: []` as in the reference; classic `<script src>` files after the helper, no modules.
- Every id in `targets` exists in both layouts and overlays line up; `observe` on every state.
