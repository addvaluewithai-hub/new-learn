# Chapter 8 in the original classroom

Open `/?preview=book-ch08`. This experiment uses the existing `ReadingClassroom`,
`ReadingLesson`, lesson settings, conversation, Nova live narration and voice/chat
controls. The difference is the teaching content: it follows printed pages 121–133
and the four original book exercises in order. The learner holds the book; no PDF
picker, scan, document viewer or separate study interface is present.

The teacher draft is pinned to learn-curriculums commit
`cc2801523844a577f474703883072b124272e252` (PR #33). Page JSON retains its hashes.
`reading/package.ts` adapts this draft into the existing public reading contract;
lesson-owned boards show verbatim English excerpts and 12 exact figure crops from
the supplied scans. Nova reads each short source excerpt before our Egyptian Arabic
explanation; the whole short source portion stays visible on the board and the
current source line is highlighted while read. All source lines precede the
explanation of that portion, including exercise introductions. Scientific terms
(including Solid, Liquid, Gas, Stress and Strain) remain English. Original source questions are retained.
Sixteen explicitly teacher-authored MCQs use the native choice and feedback flow.
Figure provenance and hashes are in `board/source-assets.json`; no full pages are served.

## Nova and accounts

Normal account sign-in is required, as for the existing lessons. All requests use the
existing authenticated Nova routes, same-origin checks, rate limits, tutor settings,
Gemini live transport, narration pacing and question-stop behavior. There is no
alternate voice engine. No sound or microphone starts on opening the lesson.

The server resolves only the exact compiled `phys1-book-guided-ch08` review revision
before validating the scene, phase and step. It ignores client-supplied lesson text.
Tutor context excludes model answers, as for other lessons. All other lesson IDs
still require the existing released database edition.

This preview creates no curriculum release or database edition. The shared classroom
receives `preview`, disables its progress adapter, and labels progress as session-only.
Existing published lessons retain their normal account saving behavior. The four
book questions remain gated behind a written attempt or an explicit request for the
solution. MCQ feedback appears after choosing an option or requesting the solution;
it explains the model answer without adding scores or automatic grading. The native end-of-lesson Nova practice is unchanged.

## Source limits

Exercise 1's load exponent remains unresolved; its numerical result is conditional,
and its failure-load subproblem lacks the limiting compressive stress. Steel/bone
moduli are disclosed as approximate external values. Exercise 4 keeps the book's
`4.2e10 Pa`. These limitations are spoken in the relevant explanation and retained
on the board. The damaged bulk relation is identified as a teacher clarification.

## Reimport and checks

```bash
node tools/import-book-draft.mjs ../learn-curriculums/curricula/physics-1-mechanics-waves/experiments/book-guided-ch08
npm test
npm run build
npm run test:browser:book
```

Unit tests check the normal runtime contract, book order, original questions,
readable live narration math, board equations, context/revision validation and no
release pin. Browser acceptance walks the chapter at desktop/phone sizes, verifies
no book viewer or progress writes, and exercises the existing live narration and
chat through a controlled transport. This checks integration; it does not claim a
human listening review of live model speech. Production release still follows the
normal reviewed importer and publication workflow.
