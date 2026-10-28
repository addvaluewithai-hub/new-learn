import { goalProgress, type LessonPackage, type ReadingPackage } from '@learn/lesson-runtime/core';
import { HttpError } from '../http';
import type { ProgressSnapshot } from '../db/learners';

// What a saved position may refer to in one lesson edition.
export type Outline = {
  delivery: 'reading' | 'recorded';
  scenes: Array<{ id: string; steps: number; feedbackSteps: number; questionId?: string }>;
};
export function readingOutline(lesson: ReadingPackage): Outline {
  return {
    delivery: 'reading',
    scenes: lesson.scenes.map((s) => ({
      id: s.id,
      steps: s.steps.length,
      feedbackSteps: s.question?.feedback.steps.length ?? 0,
      questionId: s.question?.id,
    })),
  };
}
export function recordedOutline(lesson: LessonPackage): Outline {
  return {
    delivery: 'recorded',
    scenes: lesson.scenes.map((s) => ({
      id: s.id,
      steps: 0,
      feedbackSteps: 0,
      questionId: s.question?.id,
    })),
  };
}

const PHASES = ['narration', 'attempt', 'feedback', 'complete'] as const;
const bad = (): never => {
  throw new HttpError(400, 'بيانات التقدم غير صحيحة.');
};
const int = (v: unknown, min = 0) =>
  Number.isInteger(v) && (v as number) >= min ? (v as number) : bad();

/** Check a client snapshot against the lesson; never trust ids, steps or answers blindly. */
export function validateSnapshot(outline: Outline, input: unknown): ProgressSnapshot {
  const v = input as Record<string, unknown>;
  if (!v || typeof v !== 'object' || v.schemaVersion !== 1) bad();
  const scene = outline.scenes.find((s) => s.id === v.sceneId) ?? bad();
  const phase = PHASES.find((p) => p === v.phase) ?? bad();
  if ((phase === 'attempt' || phase === 'feedback') && !scene.questionId) bad();
  const frame = int(v.frame);
  let step: number | undefined;
  if (outline.delivery === 'reading') {
    step = int(v.step);
    const limit =
      phase === 'feedback' ? scene.feedbackSteps : phase === 'attempt' ? 1 : scene.steps;
    if (phase !== 'complete' && step >= limit) bad();
  }
  const ids = outline.scenes.map((s) => s.id);
  if (!Array.isArray(v.reachedSceneIds) || v.reachedSceneIds.length > ids.length) bad();
  const reached = (v.reachedSceneIds as unknown[]).map((id) =>
    ids.includes(id as string) ? (id as string) : bad(),
  );
  if (!Array.isArray(v.attempts) || v.attempts.length > 100) bad();
  const attempts = (v.attempts as Array<Record<string, unknown>>).map((a) => {
    const owner = outline.scenes.find((s) => s.id === a?.sceneId && s.questionId === a?.questionId);
    if (!owner || typeof a.id !== 'string' || !/^[\w:-]{1,80}$/.test(a.id)) bad();
    if (typeof a.written !== 'string' || a.written.length > 2000) bad();
    if (a.choice !== undefined) int(a.choice);
    return {
      id: a.id as string,
      sceneId: a.sceneId as string,
      questionId: a.questionId as string,
      written: a.written as string,
      ...(a.choice !== undefined ? { choice: a.choice as number } : {}),
    };
  });
  return {
    schemaVersion: 1,
    sceneId: scene.id,
    phase,
    frame,
    ...(step !== undefined ? { step } : {}),
    reachedSceneIds: ids.filter((id) => reached.includes(id)),
    attempts,
  };
}

/**
 * A save from an older edition of the lesson, kept for the new one: scenes and answers that
 * still exist carry over; a position that no longer exists restarts at the top. Saves that
 * do not fit at all are dropped rather than failing the lesson.
 */
export function carryOver(outline: Outline, saved: ProgressSnapshot): ProgressSnapshot | null {
  const ids = outline.scenes.map((s) => s.id);
  const attempts = saved.attempts.filter((a) =>
    outline.scenes.some((s) => s.id === a.sceneId && s.questionId === a.questionId),
  );
  const reachedSceneIds = ids.filter((id) => saved.reachedSceneIds.includes(id));
  try {
    return validateSnapshot(outline, { ...saved, reachedSceneIds, attempts });
  } catch {
    if (!ids.length) return null;
    const step = outline.delivery === 'reading' ? { step: 0 } : {};
    return validateSnapshot(outline, {
      schemaVersion: 1,
      sceneId: ids[0],
      phase: 'narration',
      frame: 0,
      ...step,
      reachedSceneIds,
      attempts,
    });
  }
}

/** Cursor from the newest save; reached scenes and attempt history only ever grow. */
export function mergeSnapshots(
  outline: Outline,
  saved: ProgressSnapshot,
  incoming: ProgressSnapshot,
): ProgressSnapshot {
  const reached = new Set([...saved.reachedSceneIds, ...incoming.reachedSceneIds]);
  const known = new Set(saved.attempts.map((a) => a.id));
  return {
    ...incoming,
    reachedSceneIds: outline.scenes.map((s) => s.id).filter((id) => reached.has(id)),
    attempts: [...saved.attempts, ...incoming.attempts.filter((a) => !known.has(a.id))],
  };
}

export type ProgressSummary = {
  status: 'started' | 'completed';
  goalsDone: number;
  goalsTotal: number;
  updatedAt: string;
};
export function summarize(
  goals: Array<{ id: string; text: string; sceneIds: string[]; questionIds: string[] }>,
  state: ProgressSnapshot,
  completed: boolean,
  updatedAt: Date,
): ProgressSummary {
  // Only real attempts reach a goal: not "I don't know" (an empty answer) nor a skip.
  const real = state.attempts.filter((a) => a.written.trim() || a.choice !== undefined);
  const progress = goalProgress(
    goals,
    real.map((a) => a.questionId),
    state.reachedSceneIds,
  );
  return {
    status: completed ? 'completed' : 'started',
    goalsDone: progress.done,
    goalsTotal: progress.total,
    updatedAt: updatedAt.toISOString(),
  };
}
