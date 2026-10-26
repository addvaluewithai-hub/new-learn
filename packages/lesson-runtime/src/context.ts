import type { LessonPackage } from './types';
import type { Session } from './session';
import { recordingFor } from './recording';

export type LessonContext = {
  lessonId: string;
  contentRevision: string;
  sceneId: string;
  sceneTitle: string;
  sceneIndex: number;
  phase: Session['mode'];
  recordingId: string;
  frame: number;
  timeMs: number;
  playing: boolean;
  visibleCueIds: string[];
  word: { index: number; text: string; startMs: number; endMs: number } | null;
  excerpt: string;
  questionVisible: boolean;
  /** Reading lessons have no clock: frame/timeMs stay 0 and `step` gives the position. */
  delivery?: 'recorded' | 'reading';
  step?: number;
  /** Reading lessons: exactly what the learner is reading now (the step, or the question). */
  line?: string;
};
export type LessonController = {
  pause: () => void;
  getContext: () => LessonContext;
  /** Reading lessons: move to the next step, as the Next button would (not past a question). */
  next?: () => void;
  /** Reading lessons: show this step (not past a question the learner has not answered). */
  goTo?: (position: { sceneId: string; phase: LessonContext['phase']; step: number }) => void;
  /** Reading lessons: submit this answer to the question on its attempt page, as the answer
   * form would (e.g. an answer the learner spoke in audio mode). Ignored on any other page. */
  answer?: (value: string) => void;
};
// The host observes the same Remotion frame as the board. No second clock.
export function lessonContext(
  lesson: LessonPackage,
  state: Pick<Session, 'index' | 'mode' | 'frame' | 'playing'>,
): LessonContext {
  const scene = lesson.scenes[state.index];
  const recording = recordingFor(
    lesson,
    state.mode === 'feedback' ? scene.question!.feedbackId : scene.recordingId,
  );
  const timeMs = (state.frame / lesson.fps) * 1000;
  const words = recording.words ?? [];
  const index = words.findIndex((word) => word.start_ms <= timeMs && word.end_ms > timeMs);
  let last = -1;
  words.forEach((word, i) => {
    if (word.start_ms <= timeMs) last = i;
  });
  const word = index >= 0 ? words[index] : null;
  return {
    lessonId: lesson.lessonId,
    contentRevision: lesson.contentRevision,
    sceneId: scene.id,
    sceneTitle: scene.title,
    sceneIndex: state.index,
    phase: state.mode,
    recordingId: recording.id,
    frame: state.frame,
    timeMs,
    playing: state.playing,
    visibleCueIds: recording.cues.filter((cue) => cue.atMs <= timeMs).map((cue) => cue.id),
    word: word ? { index, text: word.text, startMs: word.start_ms, endMs: word.end_ms } : null,
    excerpt: words
      .slice(Math.max(0, last - 14), last + 1)
      .map((item) => item.text)
      .join(' '),
    questionVisible: Boolean(
      scene.question && recording.questionAtMs != null && timeMs >= recording.questionAtMs,
    ),
  };
}
