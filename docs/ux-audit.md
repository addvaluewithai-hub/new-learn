# Student UX audit, 2026-10-12

Walked the built app with a controlled API (no DB): library → curriculum → lesson →
tools → Nova, at 1366×860 and 390×844. Recorded lesson: chemistry review lesson.
Reading lessons: imported Mathematics I lessons. Screenshots were inspected by eye.
Full-page screenshots cut the fixed classroom background at the viewport height; that is
a capture artefact, not a defect, and is not listed.

## Fixed in this change

| #   | Problem                                                                                              | Fix                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | The floating "اسأل Nova" capsule covered the Play/Pause button and the timeline on desktop and phone | Capsule now sits in the page flow under the lesson; nothing floats over lesson controls |
| 2   | No way to study a lesson without audio                                                               | Reading lessons: board + written text, step by step                                     |
| 3   | Video-style scrubber as the only progress                                                            | Reading lessons show scene segments plus "المشهد 2 من 7" and "خطوة 3 من 5"              |
| 4   | Question answers reachable by skipping ahead                                                         | Reading flow locks «التالي» until an attempt; the answer screen opens only after it     |

## Fixed after the audit (2026-10-12, second pass)

- Progress is saved and resumed for reading lessons; home shows one "Continue/Start" card.
- Goals replace time as progress: lesson goals chip and list, goal marks on the study plan.
- Curriculum page is a study plan: parts, lesson path, current lesson with its goals.
- Reading lesson: scene path beside the board, Nova question bar inside the lesson controls.
- Classroom header no longer duplicates the tool bar; a real «ارجع للمنهج» link replaces the
  inert pill. Western digits in counts; subject artwork for maths and chemistry.

## Still open (ranked by impact on a real student)

Round ER1 (2026-10-31) closed the rest of the earlier list: page skeletons and a board
shimmer while loading, retry on load errors, an offline line, a not-found page, square
subject badges and correct counts on library cards, one «قريبًا» per coming-soon lesson,
Western digits in every language, no review-stage wording shown to students, and a
completion screen with practice with Nova and a small celebration.

0. Recorded (audio) lessons do not save progress yet and still use the playback scrubber;
   they get goals and resume when audio lessons are imported with objectives (K3, E12).
1. **Recorded lesson start:** the board is mostly blank before Play and the Play button is
   small at the bottom (E11).

## How to re-run

`npm run build`, then the browser suites: `npm run test:browser:platform`,
`test:browser:chemistry`, `test:browser:nova`, `test:browser:reading` (screenshots in
test-results/). Look at the screenshots; passing assertions are not UX review.
