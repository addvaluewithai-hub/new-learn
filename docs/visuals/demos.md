# Demo courses: many styles, one platform

Short courses that show what New Learn can make. Each is one lesson of two scenes, in
its own visual style, with a live board the learner moves, a question answered on the board
or by choice, and Nova to talk to. They open without an account:

- the gallery: **`/?preview=demos`**
- one course: `/?preview=demo&id=<id>`

Every demo is also the reference for its style (docs/visuals/README.md, G7): its board is the
example a `STYLE.md` points to, and its card becomes the style's preview on the «اعمل كورس»
page. Code: `fixtures/demos/` (boards in `boards/`, lessons in `courses/`, the list in
`index.ts`). Synthetic showcase content, not a curriculum.

| id        | Course                   | Style                          | The learner                                                                                                           | Status |
| --------- | ------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------ |
| ai        | إزاي الـAI بيكمّل جملتك؟ | Green-phosphor screen          | Writes word by word; temperature reshapes the odds                                                                    | Done   |
| interest  | فلوسك بتكبر إزاي؟        | Chalk on a blackboard          | Sets rate and years; simple line vs compound curve                                                                    | Done   |
| plants    | نسقي ولا نستنى؟          | Watercolour, by hand           | Checks the soil: moist, dry, watered                                                                                  | Done   |
| seasons   | ليه فيه صيف وشتا؟        | 3D (three.js)                  | Tilts the Earth and moves it round the Sun                                                                            | Done   |
| solar     | رحلة في المجموعة الشمسية | 3D, with a voice and character | Flies to a planet, speeds time up; Nova narrates with tone directions in the course's own voice (docs/voice-agent.md) | Done   |
| suez      | قناة السويس ليه مهمة؟    | Old nautical map               | Picks Suez or the Cape: days and fuel                                                                                 | Done   |
| pyramid   | الهرم اتبنى إزاي؟        | Shadow puppets                 | Sets the ramp's slope: length against workers                                                                         | Done   |
| circuit   | ليه اللمبة بتنور؟        | Blueprint                      | Closes the switch, adds resistance: Ohm's law                                                                         | Done   |
| fractions | الكسور بالبيتزا          | Crayon picture book            | Cuts and shades slices: compares fractions                                                                            | Done   |
| grammar   | الفاعل والمفعول          | Arabic calligraphy             | Swaps the case endings: the meaning flips                                                                             | Done   |
| robot     | حرّك الروبوت             | Pixel game                     | Orders moves and a loop to reach the goal                                                                             | Done   |

## Adding one

1. A board in `fixtures/demos/boards/<name>/` (passes `npm run board:check`; CI checks every
   demo board).
2. A lesson in `fixtures/demos/courses/<id>.ts` with `course()` and `board()` from `make.ts`.
3. Its `load` in `fixtures/demos/index.ts`, and the board id in `apps/platform/tests/board.test.ts`.
4. `npm run test:browser:demos` opens the gallery and every ready course at 1280px and 390px;
   `apps/platform/tests/demos.test.ts` checks that each step sets only what its board declares.
