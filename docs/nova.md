# Nova: lesson help and practice

Platform feature owns UI/services; the shared runtime owns the board clock.
Nova never imports runtime internals or creates another narration timer.

## Contract

SDK 0.2.2 adds onReady(pause/getContext), onContext and suspended.
Snapshot includes pinned lesson/revision, scene/phase, exact Remotion frame,
recording, word, recent spoken excerpt, question onset and visible cue identifiers.
Notifications arrive at word/cue/playback boundaries; getContext reads the current frame on demand.
The host pauses before opening; suspension prevents hidden autoplay/overlap while the modal owns audio.
Closing does not autoplay the lesson. The existing Play control continues from the paused frame.
Student name comes from the signed-in session. Preview has no authenticated AI service.
SDK/authoring previews still have no auth/DB/assistant dependency.
0.2.2 is additive to content authored for 0.2.1; old content edition and tarball identities remain pinned.

## UI and session ownership

Capsule exposes Voice and Chat as two labeled accessible actions.
Native modal dialog provides focus trapping, Escape, focus restoration and a mobile layout.
Chat has loading, stop/cancel, request errors/retry by resend, multiline draft and polite message log.
Scroll follows new messages only when near the bottom; otherwise a latest-message button appears.
Completed conversation pairs survive closing within the mounted lesson, capped at forty messages.
Only the latest fifteen bounded messages are sent. Aborted/failed exchanges are not model history.
Closing cancels pending requests and unmounts Live; no microphone or audio remains active.
Live starts only with explicit consent/button, and supports microphone mute, temporary audio pause,
interruption and hangup. Transcripts are displayed; a disconnected session requires explicit reconnect.
Context remains fixed while the modal is open because lesson playback is suspended.
Changing mode ends the old voice connection. A new connection receives fresh authorized context.

## Server boundary

POST /api/nova/chat, /live, /quiz require same-origin requests and a valid account.
The server authorizes the released compiled edition through the existing catalog, rejects revision drift,
unknown scene/phase/out-of-range frame, and reconstructs transcript/cues from trusted lesson files.
No client-provided name, script, word timestamp, renderer URL or API key is trusted.
New content modules add a trusted server context loader beside their compiled module registration.
GEMINI_API_KEY stays in Pages secrets; optional server-only model overrides are supported.
Chat defaults to gemini-3.5-flash-lite; Live to gemini-3.8-live, voice Kore.
Live token is single-use, starts within sixty seconds, expires after twenty minutes,
and locks the full model/setup/system instruction server-side via bidiGenerateContentSetup.
A bounded per-isolate request guard limits repeated calls; distributed quotas are a later production step.
Provider failure returns a real error, never an invented assistant reply.
No transcript/account content is logged or persisted by this feature.

## Lesson-end practice

Completion offers large Voice/Chat buttons. Preparation is explicit and cancellable.
Server generates exactly ten distinct four-option questions grounded in named lesson scenes,
with English prompt/options/answer and Arabic translation/explanation.
Structural validation rejects malformed, duplicate, missing or unknown-scene questions.
That validation is not scientific/editorial approval; UI labels this as AI practice.
Quiz state/count/score are controlled by client code, independently of model text.
Answers/explanations are shown only after an attempt. The next button controls advancement.
Voice reads the supplied question; answer_question accepts only the current unanswered question/valid option.
Duplicate/future tool calls cannot grade or advance. Tool results supply feedback; Nova does not invent score.
The quiz is ephemeral and is not saved progress or an official exam.
Scripted questions can later replace the producer behind the same PracticeQuestion contract.

## Verification

Unit tests cover trusted positions/cues, history bounds, generated quiz validation, duplicate attempts and PCM.
Controlled browser checks cover exact pause, context payload, chat cancellation/error/reopen,
320/390/1280 layouts, real browser microphone capture with synthetic input, mute/pause/hangup,
and completion/ten-question result. Provider traffic is mocked in those UI tests.
Real deployed provider checks are separate; test microphone consent/audio on an actual phone as well.

Primary API references:
https://ai.google.dev/api/generate-content (AuthToken/BidiGenerateContentSetup)
https://ai.google.dev/gemini-api/docs/live-api/capabilities
https://ai.google.dev/gemini-api/docs/models
