# Listen mode: audio-only lessons with the live tutor (experiment)

Branch `audio-mode`. A second way to study: no board and no multiple choice. The live tutor
(Gemini Live, the same Nova voice stack) teaches, asks spoken questions, listens, corrects and
moves on, so the learner can study while washing dishes, walking, or with the screen off.
Open it from the library card or `/?listen=manhaj-almarifa` (signed in).

## Content: reviewed scripts, read word for word

Owner decision (2026-10-25): lessons are **scripts**, not teaching notes, so every learner hears
the same reviewed words. `content/listen/<course>/` holds `course.json` (title, description,
wake word, `visibleTo`, lesson order) and one `lesson-NN.json` per lesson. Per scene:

- `lines`: the script, read word for word, one line per tutor turn.
- `check.ask`: the question, read word for word; then the tutor waits as long as it takes.
- `check.answer`: private; only for the tutor's verdict, never sent to the student app.
- `check.feedback`: read word for word after the verdict; the scripted explanation.
- `avoid` (optional): misconceptions the tutor must never state in its own words.

The tutor's own words are limited to a one-or-two-sentence verdict on the learner's answer and
short replies when the learner cuts in. `content/listen/courses.ts` checks structure (and that
no script says the wake word); that is not editorial approval.

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
- **Scripted reading (drift guard).** The client sends each item as `READ:` / `READ QUESTION:` /
  `READ FEEDBACK:` with the exact text. Each reading's audio is held until its turn completes
  and its transcript matches the line (lenient: spelling, diacritics, English terms written in
  Arabic letters; strict on rewording, cuts and added sentences). A drifted reading is thrown
  away unheard and asked for once more with `READ AGAIN:`. The next line is requested while the
  current one plays, so there are no gaps.
- After the question, **the learner has the floor** for as long as it takes (owner decision
  2026-10-25): the microphone is already open, speech goes in as a manual activity turn
  (local loudness detector, 0.5 s pre-roll). The tutor gives its verdict and calls `check_done`;
  the app reads the scripted feedback, then opens the next scene.
- **Cutting in** (wake word, earbud press, talk button) stops the audio and tells the tutor
  which line was playing. It answers from the lesson and calls `resume_lesson`; the app re-reads
  from that line. Ten silent seconds after cutting in also resume the reading.
- **What the tutor knows:** the whole current lesson's script is in its instruction (the
  current scene marked, only this scene's answer), plus the course outline. For questions about
  other lessons it calls `get_lesson(n)`, which the client answers from
  `GET /api/listen/<course>/lessons/<n>` (script and questions, never answers).
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

`apps/platform/tests/listen.test.ts` (course structure, every question has feedback, scripts
hide answers, positions, visibility, the instruction and tools, WAV wrapping, PCM joining, heard
tracking, speech detection), `listen-script.test.ts` (transcript matching, reader order,
drift re-read, failure, cut-in position) and `npm run test:browser:listen` (mocked API and Live
socket, silent fake mic: scripted reading with one drifted line, patient wait, `get_lesson`,
verdict → feedback → next scene, cut-in re-read, quiet drop, skip, lesson jump, 390px).
Not yet tested: the real Gemini Live model reading Arabic scripts (how often it drifts, how its
transcripts compare), and real phones.
