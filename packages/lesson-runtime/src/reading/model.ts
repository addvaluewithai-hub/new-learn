import type { LessonContext } from '../context';
import type { VisualProps } from '../renderers';
import type { LessonLayout } from '../types';
import type { ReadingPackage, ReadingPage, ReadingScene } from './types';

// Step times only order the board's own unit cues; they are NOT audio timing.
export const STEP_MS = 10_000; // must exceed SETTLE_MS so a step never shows the next cue
export const SETTLE_MS = 1600;

export function readingPages(lesson: ReadingPackage): ReadingPage[] {
  const pages: ReadingPage[] = [];
  lesson.scenes.forEach((scene, index) => {
    const kind = scene.question ? 'ask' : 'teach';
    scene.steps.forEach((_, step) => pages.push({ scene: index, kind, step }));
    if (scene.question) {
      pages.push({ scene: index, kind: 'attempt', step: scene.steps.length - 1 });
      scene.question.feedback.steps.forEach((_, step) =>
        pages.push({ scene: index, kind: 'feedback', step }),
      );
    }
  });
  return pages;
}

/** Steps of the clip a page belongs to (scene narration or question feedback). */
export function pageSteps(scene: ReadingScene, page: ReadingPage) {
  return page.kind === 'feedback' ? scene.question!.feedback.steps : scene.steps;
}

const plain = (text: string) => text.replace(/\$([^$]+)\$/g, '$1');

export function boardTimeMs(page: ReadingPage) {
  return page.step * STEP_MS + SETTLE_MS;
}

/** VisualProps for the lesson's own board at the settled state of a page. */
export function readingBoardProps(
  scene: ReadingScene,
  page: ReadingPage,
  layout: LessonLayout,
  fps: number,
  reducedMotion: boolean,
): Omit<VisualProps, 'frame'> | null {
  const feedback = page.kind === 'feedback';
  const spec = feedback ? scene.question!.feedback.visual : scene.visual;
  if (!spec) return null;
  const steps = pageSteps(scene, page);
  const q = scene.question;
  return {
    spec,
    fps,
    layout,
    reducedMotion,
    phase: feedback ? 'feedback' : q ? 'question-reading' : 'teaching',
    recording: {
      id: feedback ? q!.feedback.clipId : scene.clipId,
      file: '',
      audioHash: '',
      durationMs: steps.length * STEP_MS + SETTLE_MS,
      words: [],
      cues: steps.flatMap((step, index) =>
        step.unitIds.map((id) => ({ id, atMs: index * STEP_MS })),
      ),
      contentAudit: { faithful: false, issues: ['Reading lesson: no audio.'] },
    },
    // Boards print question text as-is, so drop the reading text's $…$ symbol markers.
    question: q
      ? {
          english: plain(q.english),
          title: plain(q.arabic),
          options: q.options.map(plain),
          englishOptions: q.options.map(plain),
        }
      : undefined,
    answer: feedback && q ? { english: q.answer.english, arabic: q.answer.arabic } : undefined,
  };
}

/** Assistant/host context in the same shape as recorded lessons; no clock fields. */
export function readingContext(
  lesson: ReadingPackage,
  page: ReadingPage,
  complete: boolean,
): LessonContext {
  const scene = lesson.scenes[page.scene];
  const steps = page.kind === 'attempt' ? scene.steps : pageSteps(scene, page);
  const shown = steps.slice(0, page.step + 1);
  return {
    lessonId: lesson.lessonId,
    contentRevision: lesson.contentRevision,
    sceneId: scene.id,
    sceneTitle: scene.title,
    sceneIndex: page.scene,
    phase: complete
      ? 'complete'
      : page.kind === 'attempt'
        ? 'attempt'
        : page.kind === 'feedback'
          ? 'feedback'
          : 'narration',
    recordingId: page.kind === 'feedback' ? scene.question!.feedback.clipId : scene.clipId,
    frame: 0,
    timeMs: 0,
    playing: false,
    visibleCueIds: shown.flatMap((step) => step.unitIds),
    word: null,
    excerpt: shown
      .slice(-2)
      .map((step) => step.text)
      .join(' '),
    questionVisible: Boolean(scene.question) && page.kind !== 'teach',
    delivery: 'reading',
    step: page.step,
  };
}

/** Where a learner is, in words that survive re-rendering (no array indices). */
export type ReadingPosition = {
  sceneId: string;
  phase: 'narration' | 'attempt' | 'feedback' | 'complete';
  step: number;
};
export function readingPositionOf(
  lesson: ReadingPackage,
  page: ReadingPage,
  complete: boolean,
): ReadingPosition {
  const phase = complete
    ? 'complete'
    : page.kind === 'attempt' || page.kind === 'feedback'
      ? page.kind
      : 'narration';
  return { sceneId: lesson.scenes[page.scene].id, phase, step: page.step };
}
/** Page index for a saved position, or -1 when it no longer exists in this edition. */
export function readingPageIndex(
  lesson: ReadingPackage,
  pages: ReadingPage[],
  position: ReadingPosition,
) {
  const scene = lesson.scenes.findIndex((s) => s.id === position.sceneId);
  return pages.findIndex(
    (p) =>
      p.scene === scene &&
      (position.phase === 'attempt'
        ? p.kind === 'attempt'
        : position.phase === 'feedback'
          ? p.kind === 'feedback' && p.step === position.step
          : (p.kind === 'teach' || p.kind === 'ask') && p.step === position.step),
  );
}
