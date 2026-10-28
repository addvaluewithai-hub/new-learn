// What a teacher's AI reads before writing for New Learn (get_authoring_guide). Kept in step
// with docs/boards.md and the checks in server/authoring.
export const GUIDE = `# Writing New Learn lessons

New Learn shows reading lessons: a board above, one short step of text below, the learner
presses Next. Nova, a voice tutor, explains and answers questions on any step. You write the
lesson and its boards; the teacher previews them, writes notes, and you fix the notes.

## Ask first (before a new course)
Teachers build in very different ways, so ask before writing. One short round, each with a
few options the teacher can pick from or answer in their own words; skip what they already
said:
1. Who learns: age or grade, and level (new to it, some background, revision).
2. Language: Egyptian Arabic, Modern Standard Arabic, English, or Arabic with English terms.
3. Size: how many lessons, and minutes each (a step takes about 20 seconds).
4. Teaching style, one or a mix:
   - story first: a real situation, then the idea;
   - step by step: definitions, then rules, then examples;
   - problem first: a puzzle, and the learner discovers the idea;
   - worked examples: solve one, then the learner tries;
   - everyday analogies: each idea tied to daily life.
5. Boards: plain text boards (fastest), an interactive board where it helps (sliders,
   diagrams, simulations), or interactive in most scenes.
6. Questions: after every scene, a few at key points, or none; kinds: choice, written, or a
   board question where the learner sets the board.
7. Tone: friendly and casual, or formal; local names and examples or neutral ones.
8. Sources to follow: the teacher's notes, a syllabus, a book chapter (pasted or attached).
Then propose an outline: course title, parts, lesson titles with 2-3 goals each, and the
board ideas. Write lessons only after the teacher agrees. Keep the choices in one line of the
course description (e.g. "Style: story first; boards: interactive where useful; questions:
after each scene") so later lessons and fixes follow them.

## Workflow
1. list_my_courses, or ask first (above), then create_course.
2. If a scene needs an interactive board, write it and put_board first (see below).
3. add_lesson with the whole lesson, one lesson per call. Fix every problem it returns and
   send again. After the first lesson, share its preview so the teacher can check the style
   before you write the rest.
4. Give the teacher the previewUrl. The preview checks every board's drawing on their screen.
5. Later: get_feedback -> fix with update_lesson / put_board -> resolve_feedback("review").

## Lesson format (add_lesson / update_lesson take the whole lesson)
- title, optional englishTitle, glossary [{term, meaning}], goals [{text, sceneIds}].
- scenes: 1-40, each {id, title, steps, board?, question?}.
  - id: lowercase a-z 0-9 -, unique in the lesson (notes point at it, keep ids stable).
  - steps: 1-20 short steps, one idea each, at most 800 characters. Write in the lesson's
    language (the teacher's). Math inline as $...$, e.g. $F = kx$. Nova reads steps aloud,
    so write them the way a teacher would say them.
  - board: id of a board uploaded with put_board. Without one, the scene shows its title and
    steps on a plain text board.
  - step.board: how that board looks once the step is reached (only with scene.board).
- question (optional, after the steps): {kind, arabic and/or english, options?, answer,
  board?, feedback}.
  - kind "choice" (2-6 options), "written", "choice-and-written", or "board".
  - answer: the model answer, shown after the learner tries. feedback: steps explaining it.
  - kind "board": the learner sets the board and presses Send; our code grades it with
    board.check. Never put the answer in the board.

## Interactive boards (put_board)
A board is a small web page in a sandbox: no network, no storage, no access to the lesson.
Files (text only): board.json, index.html, optional .js/.css/.json/.svg. Up to 2 MB.

board.json:
{"apiVersion":1,"id":"spring","title":"...","description":"one sentence a student can read",
 "libraries":[],"variables":{"k":{"type":"number","min":10,"max":100,"step":10,"unit":"N/m",
 "label":"k","default":50},"mode":{"type":"choice","options":["a","b"],"default":"a"}},
 "targets":["#spring","#readout"]}
- variables: the board's public state; the lesson sets them per step, the learner changes
  them when a step opens the board, and board questions check them.
- targets: element ids the lesson may highlight, reveal ([data-reveal] elements) or annotate.
- libraries: pinned ones only, from /lib/<name>@<version>/: "katex@0.16.25" (katex.min.js,
  .css), "p5@2.3.3" (lib/p5.min.js), "p5.brush@2.2.3" (dist/p5.brush.js), "three@0.186.1"
  (build/three.module.js, an ES module; keep your own scripts classic).

index.html must load the helper and start it:
<script src="/lib/newlearn-board@1/board.js"></script>
<script>
  NewLearnBoard.start({ onState(view, env) { /* draw view.variables; same view = same picture */ } });
  // learner changed something: NewLearnBoard.setVariables({ k: 60 })
  // after every change: NewLearnBoard.observe('k = 60 N/m, the spring stretches 0.2 m.')
</script>
- view: {variables, highlight, reveal, notes, input: "locked"|"open", phase, step}. The
  helper already applies highlight, reveal, notes and locks the board when input is locked.
- env: {lang, dir, layout: "landscape"|"portrait", reducedMotion}.
- Draw only from view.variables. Do not animate forever; respect reduced motion.

### Canvas (the most common problems)
- The page body is a fixed canvas: 1280x720 in landscape, 720x1280 in portrait
  (html[data-layout]). The helper scales it to the screen, so lay out in these pixels and
  support both layouts with CSS on html[data-layout='portrait'].
- Nothing may leave the canvas; text keeps 8px from its edge; no element may cut its text.
- Text at least 24px (landscape) and 32px (portrait); buttons/sliders at least 88px on their
  short side. Use the board font (it is the default); 'NL Naskh' (Amiri) for Arabic display
  text such as grammar or poetry; no other font families.
- Pointer positions: NewLearnBoard.point(event) gives canvas pixels (correct at any scale).
- Formulas and sliders read left to right even in Arabic: give them direction: ltr.

## Looks (get_style)
New Learn has looks a course can be drawn in: chalk, watercolour, crt, space3d, seachart,
shadow, blueprint, crayon, calligraphy, pixel. When a course has a look, call get_style with it
before the first board and follow the guide; it comes with a working reference board to start
from (never upload the reference unchanged). Use one look for the whole course.

## Teacher notes
get_feedback returns open notes: position {sceneId, phase, step}, the current text there,
kind (text, board, question, translation) and the note, plus boardChecks (drawing problems
found in the preview, by board). Fix them, then resolve_feedback with a one-line summary.
`;
