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
