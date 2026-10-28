# 3D space scene (`space3d`)

Bold, simple 3D forms in deep space that move as you watch: astronomy, planets, atoms, bodies.

## Reference board

`demo-seasons-3d` in `fixtures/demos/boards/seasons-3d/` (`index.html`, `space.js`, `sky.js`;
library `three@0.186.1`). The Sun, the orbit and the tilted Earth; `month` (1–12) moves the Earth
round the Sun, `tilt` (0–45°) tilts its axis; the panel shows Cairo's day length and noon Sun
height. Targets: `#space`, `#info`, `#month-control`, `#tilt-control`, `#season`. `get_style`
returns these files: start new boards from this structure (a pure maths file like `sky.js`, a
scene builder like `space.js`, the same inline module and `onState`).

## Palette

| Role                                      | Hex / value                                |
| ----------------------------------------- | ------------------------------------------ |
| Space: body, `--nl-backdrop`, scene       | `#050816`                                  |
| Panel text                                | `#eef2ff`                                  |
| Accent: season, key numbers, slider, pole | `#ffd36e`                                  |
| Panel backing (landscape, fades leftward) | `rgb(10 16 48 / 92%)` → transparent        |
| Info card                                 | `rgb(255 255 255 / 7%)`, radius 16         |
| Stars; orbit line; label sprites          | `#c8d0ff`; `#3d4f96`; `#c9d4ff`            |
| Sun; its glow (radial)                    | `#ffcf5a`; `rgba(255,214,110,.95)` → 0     |
| Light: point; ambient                     | `#fff4dd` (3.2); `#8090ff` (0.3)           |
| Earth ocean; land cap; axis; equator      | `#2f6fd6`; `#3f9a6a`; `#e8ecff`; `#ffffff` |

## Type

NL Sans in the HTML panel: title 38/600, season 30/600, info lines 28 with values in `<b>`
(`#ffd36e`), slider labels 28; portrait raises season, info and labels to 32. In the scene, month
names are sprites drawn on a 256×80 canvas in `600 40px 'NL Sans'`; they are pictures, so the
checker does not measure them: keep them few and large.

## Drawing technique

three.js 0.186.1 in a WebGL renderer, `antialias: true`, `setPixelRatio(1)`, **rendered only on
demand** (no render loop). Load it from the one inline `<script type="module">`; keep your own
files classic scripts that take `THREE` as a parameter:

```js
import * as THREE from '/lib/three@0.186.1/build/three.module.js';
const space = buildSpace(THREE, $('space')); // space.js: function buildSpace(THREE, container)
NewLearnBoard.start({
  onState(view, env) {
    // …clamp variables, fill the panel, then:
    const animate = env?.reducedMotion !== true && view.input !== 'open';
    space.show({ month, tilt, layout, animate, labels: t.months });
  },
});
```

The scene, built once: 700 stars as `THREE.Points` (size 0.18) on a radius-60 sphere from an LCG
with seed 9; the Sun as `MeshBasicMaterial` (unlit) with a glow `Sprite` (scale 7) whose texture
is a canvas radial gradient; one `PointLight` (decay 0) and a blue `AmbientLight`; the orbit as a
128-segment `THREE.Line`. Lit bodies use `MeshStandardMaterial` (roughness 0.75–0.85). Thin
`TorusGeometry` rings mark lines on a body (equator, Cairo's latitude). Nesting does the physics:
`earth` group (position on the orbit) holds `tilted` group (`rotation.z = -tilt`), which holds
globe, axis cylinder, pole dot and rings. `place(angle, tilt)` is the only thing that changes per
state, then `renderer.render(scene, camera)`. Text sprites are rebuilt only when the language's
labels change. The maths lives in `sky.js` (pure functions of the variables), not in the scene.

## Layout

- **Landscape 1280×720:** `#space` 820×720 at the left, renderer `setSize(820, 720)`, camera
  `PerspectiveCamera(38)` at `(0, 8.5, 14.5)`; `.panel` 460×720 at the right, padding 30/36,
  gap 10, over a gradient that fades into space.
- **Portrait 720×1280:** `#space` 720×680, renderer resized, camera pulled back to
  `(0, 11.5, 17.5)`; `.panel` at top 680, 720×600, padding 20/44/36, no backing.
- Both cameras `lookAt(0, -0.8, 0)`; `show()` resets size, aspect and camera only when the
  layout changes.

## Controls and states

- `<input type="range">` in a `<label>` grid, width 100%, height 96, `accent-color: #ffd36e`,
  `direction: ltr`. The label names the value in words (`Month: June`, `Axis tilt: 23.5°`).
- Key numbers sit in the `#info` card in `#ffd36e` bold; the season line is the headline.
- Highlight and notes are the helper's (4px `#e0a526` outline, `#fff8e1` notes); `#space` is the
  whole 3D view as one target. Mark parts of the scene with accent colour, not with targets.

## Motion

- **Lesson moves on (input locked):** `show()` eases from the shown pose to the new one over
  1000 ms, `k * k * (3 - 2 * k)`; the orbit angle always goes forward (delta wrapped to 0–2π)
  and the tilt eases with it. `cancelAnimationFrame` first.
- **Learner drags (input open)** and the **first state:** placed and rendered at once.
- **Reduced motion:** `animate` is false, so the end pose is rendered straight away.

## Do and don't

- Do render on demand: one `render()` per state or per animation frame, never a loop.
- Do seed anything scattered (stars) with a fixed LCG; never `Math.random`.
- Do use groups for motion (position group → tilt group → parts), so one setter places it.
- Do use unlit materials for what glows and for markers; one warm light for the rest.
- Do drop true scale where it would hide the idea (the reference is not to scale).
- Don't put sentences in the 3D scene; the panel carries the words and numbers.
- Don't add camera drags: only three.module.js and three.core.js are served, no addons.
- Don't import three.js from your own files; only the inline module imports it.

## Before put_board

- `npm run board:check -- <folder>` passes: both layouts, Arabic and English.
- HTML text ≥24 landscape and ≥32 portrait; sliders 96 high; 8px from the edges.
- Same state, same picture: seeded stars, pose from state only, reduced motion renders the end.
- `libraries: ["three@0.186.1"]`, imported from `/lib/three@0.186.1/build/three.module.js`.
- Renderer and camera resized on layout change; nothing outside the 1280×720 / 720×1280 canvas.
