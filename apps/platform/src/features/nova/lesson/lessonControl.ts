import type { LessonContext, LessonController } from '@learn/lesson-runtime';

export type ControlHost = {
  controller: LessonController | null;
  context: LessonContext | null;
  /** The lesson moves alone (Nova reads it aloud, or a reading pace). */
  moving: boolean;
  pause: () => void;
  /** Carry on moving once Nova has said its word or two. */
  carryOn: () => void;
};

/**
 * Nova's lesson_control tool (docs/voice-agent.md): the learner asked, in their own words, to
 * skip the question, see its answer, hear the line again, move a step, pause or continue.
 * The result goes back to Nova as-is.
 */
export function lessonControl(args: Record<string, unknown>, host: ControlHost) {
  const lesson = host.controller;
  if (!lesson) return { error: 'The lesson is not ready yet.' };
  switch (args.action) {
    case 'skip_question':
      if (!lesson.skip?.()) return { error: 'There is no open question here.' };
      break;
    case 'show_answer':
      if (!lesson.reveal?.()) return { error: 'There is no open question here.' };
      break;
    case 'back':
      lesson.back?.();
      break;
    case 'next':
      lesson.next?.();
      break;
    case 'repeat':
      // A lesson read aloud reads the line again when it carries on; otherwise Nova says it.
      if (!host.moving) return { ok: true, line: host.context?.line ?? '' };
      break;
    case 'pause':
      host.pause();
      return { ok: true };
    case 'resume':
      break;
    default:
      return { error: 'Unknown action.' };
  }
  host.carryOn();
  return { ok: true };
}
