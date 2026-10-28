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

## Nova inside reading lessons (the lesson conversation)

Reading lessons have no Nova modal. The runtime shows the lesson as one conversation
(`ReadingLesson` `conversation` prop): every authored line up to the current step, the
learner's answers, and the host's notes pinned to the step they were asked on (`ThreadNote`).
Authored lines read like a page; Nova replies carry its name and a tint, so AI text is never
mistaken for curriculum. On wide screens the conversation is a column beside the board and the
controls hold the field; on phones the board shrinks to the top and a round Nova button sits in
the controls (tap opens the conversation, hold to speak). The controls never move.
Typed questions use /nova/chat with the conversation as history (spoken and typed turns merged).
Voice is hold-to-talk by default: the button, the Nova button or the Space key is held while
speaking. /nova/live with `purpose: "talk"` locks manual activity detection, so the client
sends activityStart/activityEnd and audio flows only while held. The session opens on the
first hold, gets earlier talk and the current position as silent context (turnComplete false),
receives silent position updates as the learner moves, and closes after two quiet minutes or
when the lesson closes. Speaking over Nova interrupts it. Errors appear in the conversation.
How the lesson moves is a per-device setting in the top bar (default: by Next only).
A reading pace (slower/normal/faster) fills the Next button for a time based on the line's
length and turns the page; it holds while the conversation, a sheet or a hidden tab needs the
learner, and a pause button sits beside Back. "Nova reads the lesson" (off by default, with volume) is one continuous live session, not a
request per step: from where the learner is, the client sends one `TEACH` message with the
numbered lines up to the next question; Nova reads them continuously, word for word and slowly,
and turns the board itself by calling the non-blocking `show_step(n)` tool before each line.
The client answers each call silently (`scheduling: SILENT`) and turns the page when the audio
received so far has played, so the board changes as Nova starts that line. Nova reads the
question, then waits; after the answer the next stretch starts from the feedback. Turning the
page by hand, asking Nova (typed or held) or pausing cuts the teaching; it continues from
wherever the learner then is. A dropped session is retried once, then narration turns itself
off with a note in the conversation. Each new reply starts with a short audio cushion so a
slow network does not make the voice stutter.

### Hands-free (audio) mode

A lesson setting, «وضع الاستماع (من غير شاشة)», for studying the same lesson with the screen
off (`features/nova/handsfree/`). Turning it on also turns on "Nova reads the lesson". The
microphone and the session stay open the whole lesson (no idle close; a dropped session
reopens). Silero VAD (onnxruntime-web, loaded lazily; loudness if it fails) finds utterances:

- On an unanswered question, speech is a turn without any button. Nova waits as long as it
  takes. Nova's reply is held until the learner's transcript shows real words (`AnswerGate`),
  so noise («¿Qué?», fillers) gets no reply; twice in a row switches on "noisy place", where
  the floor opens only after the wake word or an earbud press.
- A spoken answer goes through the lesson's own answer flow: the hands-free session
  (`/nova/live` with `handsFree: true` and the learner's `wakeWord`) gets a `submit_answer`
  tool, and the client calls `LessonController.answer` (runtime 0.3.3). Nova then reads the
  feedback as usual.
- While Nova reads, speech is only a wake-word candidate: `/nova/wake` asks the chat model
  whether the clip contains the learner's wake word (default «يا نوفا», editable in the
  settings). The wake word or an earbud/lock-screen press (Media Session) cuts in; after the
  reply, eight quiet seconds mean "carry on".

Off, the lesson behaves exactly as before.

### Moving through the lesson by voice (OR19, runtime 0.4.2)

Every lesson talk session has a `lesson_control` tool. Nova calls it only when the learner
asks:

| Action            | What happens                                                                |
| ----------------- | --------------------------------------------------------------------------- |
| `skip_question`   | The open question stays unanswered and the lesson goes on to the next scene |
| `show_answer`     | The model answer is shown, recorded as "I don't know" (an empty answer)     |
| `repeat`          | A lesson read aloud reads the line again; otherwise Nova says it            |
| `back`, `next`    | One step, as the buttons do (next never passes an open question)            |
| `pause`, `resume` | Stop and wait; carry on                                                     |

- **After an action:** Nova says a word or two. A lesson that moves on its own carries on
  once Nova is quiet (`ReadingClassroom`, `lessonControl.ts`).
- **In hands-free mode:** an action waits behind the same reply gate as answers, so noise that
  was taken for words never skips a question.
- **On screen:** «فوّت» sits next to «معرفتش، وريني الحل».
- **Settings:** «الأسئلة» is either «اسألني» (the default) or «اعرض الحلول». «اعرض الحلول»
  shows each question and its model answer without waiting, and Nova reads both as plain
  lines.
- **Goals:** only a real attempt reaches a goal. "I don't know", a skip and a shown answer do
  not. The same rule applies on the server (`summarize`) and in the lesson (`attempted`).
- **Understanding real speech:** `npm run eval:nova-tools` (needs `GEMINI_API_KEY`) asks the
  real Live model what it does with 25 Egyptian Arabic phrases and fails below 90%. The
  browser tests use a scripted tutor, so they prove the wiring, not the understanding.
- **Session length:** every connected session that closes sends `/api/nova/ended` (seconds and
  reason: goaway, dropped, error, idle or closed). The server writes one `nova_session_end`
  log line with nothing about the user or the lesson. Session resumption (Y3) waits until these
  logs show a need.

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
Real provider acceptance on the branch preview passed on 2026-10-10: authorized grounded chat,
exactly ten generated questions, full constrained Live setup, PCM audio response and output transcript.
This was a protocol/API check, not a real phone microphone test; test consent/audio on an actual phone as well.

Primary API references:
https://ai.google.dev/api/generate-content (AuthToken/BidiGenerateContentSetup)
https://ai.google.dev/gemini-api/docs/live-api/capabilities
https://ai.google.dev/gemini-api/docs/models
