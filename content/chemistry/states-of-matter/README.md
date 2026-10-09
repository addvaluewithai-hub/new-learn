# States of Matter: existing lesson for UI/runtime review

A controlled copy of the existing first chemistry lesson, not a newly approved course release.
Origin: addvaluewithai-hub/learn at cac4dd78bcaa0ace444362fa76a5b0a7497ee2b7.
The original revision, words, cue onsets, duration, audio hashes and source limitations remain.
Legacy contentAudit declarations are retained as provenance, not a new review approval.

| Folder/file                       | Responsibility                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| data/manifest.json                | Original generated word timestamps/media metadata (line-limit exception)                    |
| data/board                        | Original semantic choreography, split by scene; edition retains sourceHash                  |
| data/media-lock.json              | Pinned original assets with SHA256; copied from lesson-owned media, served from same origin |
| media                             | Exact original recordings and images; no credentials or external repository required        |
| states-source.json / questions.ts | Existing script and question content                                                        |
| scenes                            | Bespoke scene layouts, one file per scene                                                   |
| visuals                           | Reusable chemistry diagrams grouped by purpose                                              |
| statesPackage.ts / index.tsx      | Adapt existing content to public SDK contracts and local renderers                          |
| SpokenBoard.tsx / spokenBoard.ts  | Legacy question/feedback clauses, anchored to actual word starts                            |

The retained spoken-clause splitter groups the original transcript by punctuation/language
and caps clause length for legibility. It does not generate or estimate timestamps.
These legacy chunks still need editorial listening review; they are not the new authoring
contract's explicitly reviewed semantic-unit alignment. A missing original PDF remains missing.

No audio regeneration. Build verifies the included media bytes against the pinned edition and fails
on missing/mismatched assets. Nothing reaches the browser from the old site's runtime.
The source copy is a review fixture; production artifact importing remains separate work.
