# Preserve the existing classroom design

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
