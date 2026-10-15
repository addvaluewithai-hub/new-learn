# Book guided Chapter 8 review

Open `/?preview=book-ch08` to study the separate Chapter 8 draft in the platform.
It follows printed pages 121–133, with typeset math, a section index, one explanatory
passage at a time, and the four original exercises. Solutions open after a written
attempt or an explicit request to see the worked solution. Answers are not auto-graded.

This is an ephemeral document-study experiment, separate from the released 801–804
lessons and from the runtime playback/import contract. It has no account progress,
database calls, localStorage, recorded audio, or Nova integration. It neither changes
the student catalog nor publishes a new curriculum edition.

## Source display

The learner selects their original PDF with the local file picker. SHA256 identifies
the supplied 19-page scan or the clearer one-page spread for printed 124–125. PDF.js
renders the known page/rotation/crop locally; the selected file is never uploaded.
Both files may be opened together. The clearer spread is preferred where available.
An unrelated or altered PDF is rejected, rather than showing the wrong page as evidence.
The part outline is a broad editorial region, not an OCR or word-level match.

No textbook scan or source image is committed or distributed. The app serves only
the teacher-authored draft, source hash identifiers, and ordinary application assets.
Reading can begin without the PDF; the interface explains how to open it alongside.

## Content provenance

`content/book-guided/physics-ch08/metadata.json` records the source commit, path,
per-file hashes and content revision. Rebuild the review data from the authoring draft:

```bash
node tools/import-book-draft.mjs ../learn-curriculums/curricula/physics-1-mechanics-waves/experiments/book-guided-ch08
```

Do not hand-edit the generated page JSON. Changes to the explanation belong in the
authoring experiment first. This import is only for the review route; student release
continues to use the existing reviewed bundle importer.

## Source limits retained in the UI

The load exponent in Exercise 1 is unresolved; its numerical shortening is conditional,
and the maximum-load subproblem lacks the limiting compressive stress. Steel/bone
moduli are explicitly added approximate values. Exercise 4 uses the book's 4.2e10 Pa
bulk modulus. The damaged bulk formula is identified as a teacher clarification.

## Verification

Unit tests cover book order, the four question boundaries, answer gating, source-page
mapping, and the absence of a release pin. The browser check walks all passages,
equations and questions at desktop/phone widths and tests wrong-PDF rejection.
With `BOOK_SOURCE_MAIN` and `BOOK_SOURCE_CLOSEUP` pointing to the authorized source
files locally, it also verifies actual PDF rendering and page changes. No PDF is
included in the test repository or an uploaded screenshot artifact.

```bash
npm run test:browser:book
```
