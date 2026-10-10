# Architecture and contracts

This foundation is an independent npm workspace, not a copy of the old Learn checkout.
The default entry is the account/catalog host; explicit preview queries remain ephemeral review tools.
The deployed auth/session/catalog/lesson journey passed against real services on 2026-10-09. See account-delivery.md.

## Ownership

Platform -> lesson-runtime -> React/Remotion.
The runtime cannot import platform, fixtures, authentication, server or database code.
The platform host receives data and a renderer registry through props.
The development entry selects a pinned chemistry review fixture or the synthetic probe; the runtime has no curriculum discovery switch.
Only features with implemented responsibilities are created.

## Content and playback

The LessonPackage v1 shape was extracted from old Learn's src/motion/lessonPackage.ts.
flow.ts preserves the old question validation and completion semantics.
The previous UI was coupled to CSS, assistant and persistence; it was not copied.
Session state, player events, question input, controls and composition are separate modules.
Session epochs reject abandoned audio events after replay, retry and navigation.
One persistent Remotion Player retains its warmed shared audio tags across ordinary scene changes.
Visuals use the Remotion frame and explicit cues, not an independent narration clock.
Question parts appear at their own word-start anchors; backward seeking reverses disclosure.
Model answers are rendered only in feedback after a valid attempt.
Submitting starts feedback, whose completion starts the next narration automatically.
First play is user initiated; no sound starts on initial page load.
Failure stops progression and exposes retry, rather than silently skipping a recording.
Native errors from pooled audio tags are forwarded explicitly; stale sources are ignored.
Audio recovery reloads the failed native media while retaining the Player and frame clock.
Custom renderers have a resettable content boundary; unexpected core faults require reloading the preview.

## Structural compatibility and review

Two additive/clarifying changes to the old package shape:

- question.readingParts optionally supplies independently timed English/Arabic clauses.
- Structural validation accepts declared negative contentAudit findings in a preview.

The old faithful boolean is not review evidence or publication authorization.
The development fixture explicitly sets faithful=false and describes its synthetic data.
No publication API exists in this foundation. A future importer must require independent
review evidence bound to the exact source, audio, renderer artifacts and runtime versions.
Cues and reading-part onsets must refer to delivered word starts; this validates structure,
not whether the ASR or listening review was correct.

## Shared preview SDK

Public exports: LessonPreview, composition/renderer contracts, package validation and cue helpers.
The /core subpath exposes contracts/validation without React UI or CSS for future build tools.
Packaging builds versioned ESM/types/CSS and an npm tarball under distributions.
An independent consumer installs that tarball and verifies Node core, types, CSS and Vite build.
learn-curriculums pins its immutable GitHub commit URL and integrity; its Python adapter
reuses receipt/alignment/cue verification without another engine or source checkout.
Question and feedback may use lesson-owned custom renderers. Prompt props exclude answers;
feedback answer parts have individual word-bound onsets. Runtime review binds the SDK edition.
schemaVersion, contentRevision and runtimeVersion remain separate identities.
Updates reach the authoring repo through a pinned dependency upgrade and review.
Student sessions and artifact URLs need edition compatibility; a runtime upgrade alone must
not rewrite previously released content or student progress.

## Engineering gates

At most 300 lines for authored code, CSS, tests and documentation; generated lockfiles excluded.
Boundaries are checked by tools/check-boundaries.mjs, alongside the line limit.
Useful modules are copied with behavior tests; unrelated legacy features remain outside this repo.
Build and unit tests are mandatory; browser behavior checks run in CI with Chromium.
Chromium viewport emulation is not proof of Mobile Safari autoplay behavior.
Real speech/word timing and a real mobile browser remain part of SDK acceptance.

Primary references:

- https://www.remotion.dev/docs/player/autoplay
- https://www.remotion.dev/docs/player/player
- https://github.com/addvaluewithai-hub/learn/blob/cac4dd78bcaa0ace444362fa76a5b0a7497ee2b7/src/motion/lessonPackage.ts
