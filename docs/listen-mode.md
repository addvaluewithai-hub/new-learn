# Listen mode: audio-only lessons with the live tutor (experiment)

Branch `audio-mode`. A second way to study: no board and no multiple choice. The live tutor
(Gemini Live, the same Nova voice stack) teaches, asks spoken questions, listens, corrects and
moves on, so the learner can study while washing dishes, walking, or with the screen off.
Open it from the library card or `/?listen=manhaj-almarifa` (signed in).

## Content

`content/listen/<course>/`: `course.json` (title, description, wake word, lesson order) and one
`lesson-NN.json` per lesson. Each scene has **teaching notes** (`lines`), not a script: the
tutor explains them in its own words. An optional `check` holds the spoken question (`ask`)
and the idea the tutor looks for (`answer`), judged by meaning, not wording.
`content/listen/courses.ts` loads and structurally checks them; it is not editorial approval.
The student app receives titles only (`GET /api/listen/<course>`), never notes or answers.

First course: **منهج المعرفة**, an introduction to epistemology as taught in philosophy
departments, in 10 Egyptian Arabic lessons: what knowledge is (JTB), the Gettier problem, the
structure of justification, perception, reason and the a priori, testimony and memory,
scientific knowledge (Hume, Popper, Kuhn), skepticism, theories of truth and relativism,
social epistemology and critical thinking. The sequence follows Duncan Pritchard, _What Is This
Thing Called Knowledge?_ (Routledge, 5th ed. 2023) and the Stanford Encyclopedia of Philosophy;
the text is authored here and still needs a subject review.

## Terms and visibility

- The tutor says every technical term in Arabic and then its standard English term (and repeats
  the English later); the notes carry the English terms and names too.
- `visibleTo` in `course.json` limits a course to named account emails. Other accounts get 404
  for its outline, sessions and wake checks, and the library lists it only for allowed accounts
  (`GET /api/listen/`). منهج المعرفة is limited to the owner's account. The check trusts the
  signed-in account's email from Neon Auth.

## How a run works

- **One live session per scene.** `POST /api/listen/live` resolves the position against the
  server-owned course and returns a single-use token whose setup (instruction, voice, tools) is
  locked server-side. Short sessions stay well inside Live's ~10-minute connection limit.
- The client sends `START`; the tutor teaches the scene. When its turn ends and the audio has
  played, **the learner has the floor**: the microphone is already open, speech is sent as a
  manual activity turn (`activityStart`/`activityEnd` from a local loudness detector, with a
  0.5 s pre-roll so the first word is kept). **After a question the tutor waits silently for as
  long as it takes** (owner decision 2026-10-25): no timeout and no reminder. Every tutor turn
  ends with a question or `scene_done`, so the floor never opens on a dead end. `SILENCE` is sent
  only when the learner cut in and then said nothing (10 s), meaning "carry on".
- If the session drops while waiting (Live connections last ~10 minutes), it stays closed and
  costs nothing; the learner's next words reopen it, are held during the reconnect, and reach the
  tutor with a note of what it last asked.
- The tutor calls `scene_done` after correcting the answer (or when asked to skip); the app
  opens the next scene's session. The place is remembered per device (localStorage).
- **Interrupting while it talks:** say the wake word «يا نوفا», press the earbud button once
  (Media Session play/pause), or tap «عايز أتكلم». Playback stops at once and the tutor gets a
  silent note of what was actually heard (`HeardTracker`), so it continues from that point.
- **Wake word:** while the tutor talks, each utterance's first ~2 s go to `POST /api/listen/wake`,
  which asks the chat model (audio input) whether the wake word was said. Audio keeps
  collecting during the check, so on "yes" the whole utterance (wake word + question) reaches
  the tutor. One check at a time, ≥1.5 s apart, server limit 40/min; short clinks never count.
- A dropped session reopens once with a `RESUME` note; a second failure stops with an error.
- Lock-screen: a silent looping `<audio>` claims the Media Session (title = scene, artist =
  lesson), which is what routes headset buttons and tells the phone this page plays audio.
  Next/previous track skip scenes.

## Known limits (test on a real phone)

- **Android Chrome** is the target: audio and an already-open microphone are expected to keep
  running with the screen off while audio plays. Not yet verified on a device.
- **iPhone Safari** suspends pages and the microphone when locked; screen-off use there will
  likely need a native wrapper (e.g. Capacitor) later.
- On a loudspeaker the tutor's voice can leak into the mic. Echo cancellation and a higher
  speech threshold while it talks reduce this; earbuds avoid it. Leaks only cost a wake check.
- The token's locked setup (including expected answers) is returned to the client, as with
  Nova; a determined learner could read their own answers in devtools.
- Gemini's audio understanding of the Egyptian wake word, and the tutor's restraint in saying
  nothing after `scene_done`, need real-world tuning.

## Checks

`apps/platform/tests/listen.test.ts` (course structure, titles-only outline, positions, the
instruction and live setup, WAV wrapping, PCM joining, heard tracking, speech detection) and
`npm run test:browser:listen` (mocked API and Live socket, silent fake mic: teach → floor →
SILENCE → scene_done → next session, interrupt note, skip, lesson jump, 390px, Media Session).
Real provider and real phone tests are still to do.
