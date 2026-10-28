# Green-phosphor terminal (`crt`)

An old computer screen glowing green in a dark bezel: technology, AI, data, code, numbers.

## Reference board

`demo-ai-crt` in `fixtures/demos/boards/ai-crt/` (`index.html`, `model.js`; no libraries). A toy
language model writes a sentence word by word: `words` (0–5) is how many are written,
`temperature` (0.2–2) reshapes the five candidates' chances (`p^(1/T)`); a fixed lottery number
per step picks the word. Targets: `#sentence`, `#bars`, `#temp-control`, `#next`, `#pick`.
`get_style` returns these files: start new boards from this structure (bezel, screen, two
columns, a pure `model.js` that turns state into data, one `onState` that rebuilds the DOM).

## Palette

| Role                                         | Hex / value                       |
| -------------------------------------------- | --------------------------------- |
| Room: body, `--nl-backdrop`                  | `#11120f`                         |
| Bezel gradient (160deg), top edge highlight  | `#2b2a24` → `#171713`, `#3a3930`  |
| Screen (radial, centre → edge)               | `#0f2a18` → `#07150c` → `#040b06` |
| Phosphor `--ph`: text, bars, borders, slider | `#8dffa6`                         |
| Dim phosphor `--dim`: prompt line, bar frame | `#3f8f55`                         |
| Secondary text: percentages, pick sentence   | `#c9ffd5`                         |
| The answer: newest word, picked row          | `#e8ffb0`                         |
| Text glow (two shadows)                      | `rgb(141 255 166 / 65%)`, `/ 25%` |
| Scanlines                                    | `rgb(0 0 0 / 22%)`                |

## Type

NL Sans (no monospace font is allowed; the terminal feel comes from glow, `>` prompts and
blocks). Landscape: sentence 44/600 (line-height 1.35), candidate rows 32, percentages 28,
slider label 28, pick line 28, the command line 26, buttons the body's 32. Portrait: sentence 50,
rows 34, and percentages, label, pick and command line 32.

## Drawing technique

No canvas: everything is HTML and CSS, rebuilt from state in `onState`.

- `.bezel` (inset 14px, radius 34, padding 22) holds `.screen` (radius 26, `overflow: hidden`)
  with the radial gradient and two inset shadows: `0 0 70px rgb(0 0 0 / 70%)` for the curved
  dark edge and `0 0 18px rgb(141 255 166 / 18%)` for the inner glow.
- Scanlines are one pseudo-element over the screen; glow is a text-shadow on `.glow, .glow *`:

```css
.screen::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(0deg, rgb(0 0 0 / 22%) 0 2px, transparent 2px 5px);
}
.glow,
.glow * {
  text-shadow:
    0 0 6px rgb(141 255 166 / 65%),
    0 0 18px rgb(141 255 166 / 25%);
}
```

- Bars are block segments: a 30px box with a 2px `--dim` border and 3px padding; the fill is
  `repeating-linear-gradient(90deg, var(--ph) 0 14px, transparent 14px 18px)`, its width set
  inline to the rounded percentage. Rows are a grid `150px 1fr 90px`: word, bar, percent.
- The command line is literal terminal text, LTR: `` `> next_word --temperature ${tf}` ``.
- A block cursor (22×40, `--ph`) ends the sentence and blinks with `steps(1)`.
- Determinism: no randomness at all. `model.js` uses fixed tables and `LOTTERY` numbers, so
  `generate(lang, words, temperature)` always returns the same sentence; temperature is rounded
  to one decimal before use.

## Layout

- **Landscape 1280×720:** bezel fills the board; `.screen` is a grid `1fr 330px`, gap 36,
  padding 30/40: left the prompt, sentence and bars; right `.side` (slider, two buttons, the
  pick sentence), centred vertically.
- **Portrait 720×1280:** `.screen` becomes one column (`grid-template-rows: auto 1fr`), padding
  30/32; rows widen to `170px 1fr 100px`; `.side` starts at the top.
- Only CSS switches the layout (`[data-layout='portrait']`); `onState` also sets
  `document.documentElement.dir` from `env.lang`.

## Controls and states

- Buttons: transparent, 3px `--ph` border, radius 10, phosphor text 600, `min-height: 88px`
  in the reference; new boards use 96. Labels carry arrows (`◀`/`▶`, `↺`).
- Slider: `accent-color: var(--ph)`, height 88 in the reference (use 96), `direction: ltr`.
- A step forward is a button that sets the next value (`words + 1`), not a hidden animation.
- The answer is marked in the look: newest word `#e8ffb0`, picked row `#e8ffb0` with `▶ `.
- Highlight and notes are the helper's (4px `#e0a526` outline, `#fff8e1` notes).

## Motion

Nothing moves between states except the blinking cursor: every state, from the lesson or the
learner, is rebuilt instantly. Reduced motion: the helper sets `data-reduced-motion`, which turns
CSS animations off, so the cursor stays lit: that is the end picture.

## Do and don't

- Do keep the bezel, curved dark screen, scanlines and text glow on every board of the course.
- Do draw quantities as segmented blocks with an exact percentage beside them.
- Do keep one bright accent (`#e8ffb0`) for the answer; the rest is phosphor and dim phosphor.
- Do write prompts and numbers like terminal output, left to right.
- Don't use `Math.random`; fixed tables or fixed lottery numbers stand in for chance.
- Don't fill with pure black or white; the darkest screen edge is `#040b06`.
- Don't add CSS transitions or animations other than the cursor blink.
- Don't add a monospace font; only NL Sans, NL Naskh and KaTeX are allowed.

## Before put_board

- `npm run board:check -- <folder>` passes: both layouts, Arabic and English.
- Text ≥24 landscape and ≥32 portrait, including the prompt line and percentages.
- Buttons and sliders 96 high (the reference's 88 is the bare minimum).
- Same state, same picture: no randomness; the cursor is not part of the state.
- `libraries: []`, classic `<script src>` files, `NewLearnBoard.observe` on every state.
