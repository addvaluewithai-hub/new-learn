# Design system

One set of tokens and one set of shared parts for every screen. Change a token or a part and
every screen built from it changes; see them all at `?preview=ui` (no login).

## Tokens: apps/platform/src/shared/tokens.css

- Names start with `--nl-`: brand (`--nl-green-*`, `--nl-lime-*`, `--nl-violet-*`), roles
  (`--nl-primary`, `--nl-accent`, `--nl-tutor` for Nova, `--nl-success`, `--nl-danger`,
  `--nl-warning`, `--nl-focus`), surfaces and text (`--nl-bg`, `--nl-paper`, `--nl-surface*`,
  `--nl-ink`, `--nl-muted`, `--nl-line*`), type (`--nl-font`, `--nl-text-*`), space
  (`--nl-space-*`, 4px steps), shape (`--nl-radius-*`, `--nl-control-*`), depth
  (`--nl-shadow-*`, `--nl-scrim`) and motion (`--nl-fast`, `--nl-normal`, zero under reduced
  motion).
- Screens use role tokens, not brand ones, and never a raw colour. Older names (`--ink`,
  `--green`, `--accent`, `--soft`, `--line`, `--leaf`, `--lime`) are aliases of the tokens.
- The lesson runtime cannot import app files, so its `--rl-*` variables read the same `--nl-*`
  names with their own fallbacks; a host theme is just these tokens.
- `apps/platform/tests/tokens.test.ts` keeps every text-on-background pair at WCAG AA (4.5:1).

## Shared parts: apps/platform/src/shared/ui

| Part                                              | Use                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Button`, `ButtonLink`                            | primary (main action), secondary, accent (hero on dark), ghost, danger; sm, md, lg |
| `IconButton`                                      | round, icon only, `label` is required                                              |
| `Chip`                                            | a toggle in a row; several can be on                                               |
| `Segmented`                                       | one of a few short options                                                         |
| `ChoiceCard`                                      | one of a group, with a title and a line                                            |
| `Field`, `TextInput`, `TextArea`                  | a labelled control with hint or error                                              |
| `PillSelect`                                      | a menu that reads as part of a sentence                                            |
| `Switch`                                          | on/off; a real checkbox announced as a switch                                      |
| `Card`, `Badge`, `Alert`, `Spinner`, `EmptyState` | surfaces and states                                                                |
| `Dialog`                                          | native `<dialog>`: focus trap, Escape and backdrop close                           |

Buttons are pills; fields have the medium radius; cards and dialogs the large. Touch targets are
at least 44px except the small size on dense desktop rows. `npm run test:browser:ui` checks the
page by mouse and keyboard at 1280px and 390px.

## The older classroom (`?preview=probe`, `?preview=chemistry`)

This is a clean implementation of the established Learn classroom, not a visual reset.
Reference: old Learn states-lesson.css, LessonPlayer/LessonGuide and reviewed classroom screenshots.

- Typography: the existing lesson's Segoe UI, Tahoma, Arial stack; board components retain their original font declarations.
- Assets: the same study-room image, Nova and subject illustrations. No replacement artwork.
- Palette, panel/control radii and shadows: shared/design-tokens.css.
- Base typography/focus: shared/base.css. No authentication or playback logic here.
- Header and breadcrumb/workspace/tool dock: features/classroom/classroom.css.
- Host styling of the public SDK: lesson-chrome.css; SDK source is not copied.
- Guide, glossary, ephemeral notes and references: LessonGuide.tsx / lesson-guide.css.
- One Phosphor icon family, matching the old classroom.

All interface controls have real local behavior. Notes remain in memory until reload.
The guide is ready-made lesson content, not an AI assistant. No pretend login, catalog or saving.
The runtime owns timing, scene changes and answer gating; the host owns tools and visual chrome.
The scene map opens on request to keep the board uncluttered. Both ratios remain exact.

Known pending fidelity work: the old scene dropdown/progress readout and scene-specific guide
need explicit runtime host APIs; do not infer playback state by scraping the DOM or clone it.
Account pages, database integration and AI/Live helpers are separate features.

## Account and library preservation

Accounts and catalog preserve the old IBM Plex Sans Arabic font, #153d35 green and #d7f77b accent.
These are scoped by .platform-ui; the classroom keeps Segoe UI/Tahoma/Arial and its existing tokens.
Brand, CourseArt and PlatformIcon are shared; auth and catalog own their separate styles.
Old reference pinned at learn/cac4dd78bcaa0ace444362fa76a5b0a7497ee2b7.
No cumulative reward/progress UI is shown until backed by real persistence.
