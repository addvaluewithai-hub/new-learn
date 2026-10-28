# Pixel game (`pixel`)

A retro pixel-art game on dark purple, with chunky square buttons: for programming, logic,
puzzles and step-by-step rules, where the learner builds moves and watches what happens.

## Reference board

`demo-robot-pixel` in `fixtures/demos/boards/robot-pixel/` (`board.json`, `index.html`,
`game.js`). A 7×5 maze: a program of six slots `c1`–`c6` (`none` | `up` | `down` | `left` |
`right`), repeated `repeat` (1–3) times, walks a robot towards a battery; a wall stops it.
Targets: `#maze`, `#program`, `#repeat-choice`, `#status`. `libraries` is `[]`. `get_style`
returns these files: start a new board from their structure (pure game logic and drawing in
`game.js`, text and buttons in `index.html`) and swap in the new puzzle.

## Palette

| Role                                            | Hex                   |
| ----------------------------------------------- | --------------------- |
| Background, `--nl-backdrop`, robot eyes (`c`)   | `#1b1035`             |
| Floor / button fill                             | `#2a1f4a`             |
| Floor checker                                   | `#33275a`, `#30245a`  |
| Wall / wall brick lines                         | `#5b3fa0` / `#7d5fd0` |
| Cyan: maze frame, move buttons, robot body (b)  | `#7cf2ff`             |
| Pink: robot antenna (a), wall bump, wall status | `#ff5d8f`             |
| Yellow: title, trail, repeat buttons, (d), (f)  | `#ffd166`             |
| Green: battery (g), goal sparks, goal status    | `#06d6a0`             |
| Robot legs (e) / battery cells (h)              | `#4cc9f0` / `#b8ffe9` |
| Text / hint and waiting status                  | `#e9f9ff` / `#b9a8ff` |
| Empty slot (`none`) text and border             | `#5b4f86`             |

Letters in brackets are the sprite palette keys in `game.js` (`PAL`).

## Type

NL Sans only; no text is drawn on the canvas. Landscape: title 38/600 in yellow, hint 26,
move arrows 44/600 (`·` `↑` `↓` `←` `→`), repeat buttons 32, status 28/600. Portrait raises the
hint and status to 32; the rest already meet it. Arrows are characters, so they need no
translation; each move button gets an `aria-label` with the move's name.

## Drawing technique

A tiny `<canvas id="maze" width="128" height="96">` is drawn with `fillRect` only and scaled
up by CSS with `image-rendering: pixelated` (832×624 landscape, 6.5×; 660×495 portrait). The
grid is 16px tiles at an 8px margin. Walls are a fill plus 1–2px lighter lines for bricks;
floors alternate two near shades. Sprites are 8×8 string grids, one character per pixel,
`.` transparent, each other character a key into `PAL`:

```js
const ROBOT = [
  '..aaaa..',
  '.abbbba.',
  '.bcbbcb.',
  '.bbbbbb.',
  '..bddb..',
  '.eeeeee.',
  '.e.ee.e.',
  '..e..e..',
];
```

```js
const sprite = (g, rows, x, y, s) =>
  rows.forEach((row, j) =>
    [...row].forEach((c, i) => {
      if (c === '.') return;
      g.fillStyle = PAL[c];
      g.fillRect(x + i * s, y + j * s, s, s);
    }),
  );
```

Each state redraws the whole frame in a fixed order: background, tiles, trail (4×4 yellow
dots on visited cells), battery (hidden once reached), robot at its last cell, then an
end effect (a pink X of 2×2 squares on the wall it bumped, or five green sparks at the goal).
The outcome comes from a pure `run(program, repeat)` that returns `{ path, end, bump, moves }`
with `end` one of `goal`, `wall`, `short`, `empty`; the drawing, status and observation all
read that one result. No randomness: the maze, start and goal are constants.

## Layout

Landscape 1280×720: the maze at left 30, top 48 with a 6px cyan `content-box` border; a 376px
panel on the right (padding 30/28, 12px gaps): title, hint, a 3×2 grid of move slots
(`direction: ltr` so moves read left to right in both languages), the repeat row, the status.
Portrait 720×1280: the maze at 24, 24 (660×495), the panel from `top: 560px`, 720×720,
padding 10/36/30. Switching is CSS on `[data-layout='portrait']`; the canvas is identical.

## Controls and states

Buttons are square (`border-radius: 0`), `min-height: 96px`, 4px solid borders, `#2a1f4a`.
A move slot is cyan, or muted `#5b4f86` when empty; tapping cycles
`none → up → right → down → left → none` through `NewLearnBoard.setVariables`. Repeat buttons
are yellow and fill solid yellow when `aria-pressed`. `#status` is a box with a 4px
`currentColor` border, coloured by `end` (green goal, pink wall, lavender otherwise). All
buttons are rebuilt each state. Highlight, reveal and notes are the helper's: a 4px `#e0a526`
outline, `[data-reveal]` (unused here) and a `#fff8e1` note at 32px.

## Motion

The reference does not animate: the robot appears at its end cell and the trail shows the
path, so a tap redraws at once and reduced motion is already the end picture. To step the
robot when the lesson moves on (`view.step` changed), move in whole tiles, draw the final
frame at once when `env.reducedMotion` is set, and end on exactly that frame.

## Do and don't

- Do keep one tiny canvas, integer tile sizes and a scale that fills the art area.
- Do draw sprites from string grids and a small named palette; keep 8×8, bright on dark.
- Do show the path or history (the trail) so the end picture explains what happened.
- Do give every outcome its own colour and sentence (goal, wall, short, empty), in HTML.
- Don't use rounded corners, shadows, gradients or smooth curves.
- Don't load sprite images, put words on the canvas, or use `Math.random` or time to draw.
- Don't draw sprites at fractional positions if you can avoid it: the reference's 1.5× robot
  lands on half pixels, which blurs once scaled; prefer whole-pixel scales.

## Before put_board

- `npm run board:check -- <folder>` passes: landscape and portrait, Arabic and English.
- Text ≥ 24px landscape and ≥ 32px portrait (hint and status are raised to 32 in portrait).
- Every button ≥ 88px on its short side (use 96); Tab reaches them when input is open.
- Same state ⇒ same frame: the logic is pure, the whole canvas is repainted each state.
- `image-rendering: pixelated` on the canvas, `libraries: []`, classic `<script src>` only.
