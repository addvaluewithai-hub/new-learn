# @learn/lesson-runtime

Shared React/Remotion lesson playback. Source owner: addvaluewithai-hub/new-learn.
Use the exact versioned tarball, not another source checkout or a floating branch.

```tsx
import { LessonPreview } from '@learn/lesson-runtime';
import '@learn/lesson-runtime/style.css';
// lesson is a validated LessonPackage; registry contains locally built components.
<LessonPreview lesson={lesson} registry={registry} />;
```

`/core` exports JSON contracts, validation, cues and runtimeVersion without UI/CSS.
The package has no login, database, persistence or curriculum discovery.
React and React DOM are peers; use one React instance and the pinned Remotion version.

Custom components default-export a React component accepting VisualProps.
Animate from frame/fps or Remotion hooks; cueIsVisible reverses correctly on seek.
Question readingVisual and feedbackVisual optionally customize those boards.
The question prop contains prompts/options only; answer is supplied only in feedback.
Default question/feedback boards remain available when those visuals are omitted.

Compilation and structural validity are not listening, editorial or publication approval.

## Optional host integration (0.2.2)

`onReady(controller)` supplies pause/getContext; cleanup sends null.
`onContext(context)` reports scene/phase, word boundaries, visible cue IDs and playback changes.
For an exact frame snapshot at interaction time, call controller.getContext().
`suspended` blocks playback and automatic starts while a host overlay owns audio.
Closing the overlay does not auto-resume; the learner explicitly presses Play.
No assistant, account or persistence code is inside the SDK.
0.2.2 is additive and plays previously pinned 0.2.1 content editions;
old tarballs/manifest hashes and authoring dependency pins are not rewritten.
