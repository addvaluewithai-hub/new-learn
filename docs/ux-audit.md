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

## Still open (ranked by impact on a real student)

1. **Progress is not saved.** Leaving a lesson loses the place; the library cannot say
   "continue lesson 3"; the curriculum hero always offers lesson 1. The DB already has
   enrollment/progress tables (data-contract.md); the write API and resume are missing.
2. **Recorded-lesson progress bar** is a per-scene playback scrubber. Owner is sending a
   preferred design (numbers/steps); reading lessons already use numbers.
3. **Classroom header labels mislead:** "الدروس" opens the scene map, "المكتبة" opens
   sources; both duplicate the bottom tool bar; the "مساحة الدرس" pill does nothing; the
   "Learn" logo is the only way back to the curriculum.
4. **Review wording for review-stage lessons** ("شوف نسخة المراجعة", footer "نسخة
   للمراجعة · …") is shown to students when review content is enabled. Published
   reading lessons already say "متاح للتعلّم".
5. **Library cards** use the same globe artwork for every subject, a filler "خطوة بخطوة"
   label, and "٠ متاحة" counts; no "continue" entry.
6. **Mixed digit systems:** Arabic-Indic digits in counts/positions (٢ مناهج، ١ ٢ ٣) next
   to Western digits in titles and maths ("رياضة 1", boards). Pick one (Western suits maths).
7. **Curriculum page:** the hero repeats the first list item; large cards make 8+ lessons a
   long scroll; coming-soon rows show both a label and a disabled "قريبًا" button.
8. **Recorded lesson start:** the board is mostly blank white before Play and the Play
   button is small at the bottom; a clear start state would help.
9. **Nova for reading lessons** works from the step context, but the end-of-lesson practice
   card appears only after completion; consider offering it from the completion screen.

## How to re-run

`npm run build`, then the browser suites: `npm run test:browser:platform`,
`test:browser:chemistry`, `test:browser:nova`, `test:browser:reading` (screenshots in
test-results/). Look at the screenshots; passing assertions are not UX review.
