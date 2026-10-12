import type { ReadingGoal } from './types';

/**
 * A goal counts as reached once every question that checks it has an attempt (or, for a
 * goal with no question, once all its scenes were reached). Attempts are not graded here.
 */
export function goalProgress(
  goals: ReadingGoal[] | undefined,
  answeredQuestionIds: Iterable<string>,
  reachedSceneIds: Iterable<string> = [],
) {
  const answered = new Set(answeredQuestionIds);
  const reached = new Set(reachedSceneIds);
  const met = (goals ?? [])
    .filter((goal) =>
      goal.questionIds.length
        ? goal.questionIds.every((id) => answered.has(id))
        : goal.sceneIds.every((id) => reached.has(id)),
    )
    .map((goal) => goal.id);
  return { met: new Set(met), done: met.length, total: goals?.length ?? 0 };
}
