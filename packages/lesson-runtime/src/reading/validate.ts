import { validBoardCheck, validStepBoard } from '../board/state';
import type { VisualSpec } from '../types';
import type { ReadingPackage, ReadingStep } from './types';

// Validate untrusted reading-package JSON before mounting boards. Renderer code comes
// from the application registry only. Structural validity is not content approval.
export function validateReadingPackage(
  value: unknown,
  renderers: ReadonlySet<string>,
): ReadingPackage {
  const pkg = value as ReadingPackage;
  const fail = (message: string): never => {
    throw new Error(`Invalid reading package: ${message}`);
  };
  const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  const visual = (v: VisualSpec | null | undefined, label: string) => {
    if (
      !v ||
      !renderers.has(v.renderer) ||
      !v.params ||
      typeof v.params !== 'object' ||
      Array.isArray(v.params)
    )
      fail(`unsupported visual in ${label}`);
  };
  const steps = (items: ReadingStep[], label: string) => {
    if (!Array.isArray(items) || !items.length) fail(`${label} has no steps`);
    for (const step of items)
      if (
        !step ||
        !text(step.text) ||
        !Array.isArray(step.unitIds) ||
        !step.unitIds.length ||
        !step.unitIds.every(text) ||
        !validStepBoard(step.board)
      )
        fail(`${label} step`);
  };
  if (!pkg || pkg.schemaVersion !== 1 || pkg.delivery !== 'reading') fail('schema/delivery');
  for (const field of [
    'lessonId',
    'curriculumId',
    'contentRevision',
    'title',
    'englishTitle',
    'curriculumTitle',
  ] as const)
    if (!text(pkg[field])) fail(field);
  if (
    !Number.isInteger(pkg.lessonOrder) ||
    pkg.lessonOrder < 1 ||
    !Number.isFinite(pkg.fps) ||
    pkg.fps < 1 ||
    pkg.fps > 120
  )
    fail('order/fps');
  for (const layout of ['landscape', 'portrait'] as const) {
    const d = pkg.dimensions?.[layout];
    if (!d || !Number.isInteger(d.width) || !Number.isInteger(d.height) || d.width < 1)
      fail(`${layout} dimensions`);
  }
  if (!Array.isArray(pkg.scenes) || !pkg.scenes.length) fail('scenes');
  const ids = pkg.scenes.map((scene) => scene?.id);
  if (!ids.every(text) || new Set(ids).size !== ids.length) fail('scene IDs');
  const questions = new Set<string>();
  for (const scene of pkg.scenes) {
    if (!text(scene.title) || !text(scene.clipId)) fail(`${scene.id} title/clip`);
    visual(scene.visual, scene.id);
    steps(scene.steps, scene.id);
    const q = scene.question;
    if (!q) continue;
    if (!text(q.id) || questions.has(q.id)) fail(`${scene.id} question ID`);
    questions.add(q.id);
    if (!text(q.english) && !text(q.arabic)) fail(`${q.id} wording`);
    if (!['written', 'choice', 'choice-and-written', 'board'].includes(q.attempt))
      fail(`${q.id} attempt`);
    const chooses = q.attempt === 'choice' || q.attempt === 'choice-and-written';
    if (!Array.isArray(q.options) || (chooses && q.options.length < 2)) fail(`${q.id} options`);
    if (
      (q.attempt === 'board') !== Boolean(q.board) ||
      (q.board && (!validBoardCheck(q.board.check) || !validStepBoard({ state: q.board.state })))
    )
      fail(`${q.id} board`);
    if (!q.answer || !(text(q.answer.english) || text(q.answer.arabic))) fail(`${q.id} answer`);
    if (!q.feedback || !text(q.feedback.clipId)) fail(`${q.id} feedback`);
    steps(q.feedback.steps, `${q.id} feedback`);
    if (q.feedback.visual) visual(q.feedback.visual, `${q.id} feedback`);
  }
  if (!Array.isArray(pkg.glossary)) fail('glossary');
  if (pkg.goals !== undefined) {
    if (!Array.isArray(pkg.goals)) fail('goals');
    const goalIds = new Set<string>();
    for (const goal of pkg.goals) {
      if (!goal || !text(goal.id) || goalIds.has(goal.id) || !text(goal.text)) fail('goal');
      goalIds.add(goal.id);
      if (!Array.isArray(goal.sceneIds) || !goal.sceneIds.every((id) => ids.includes(id)))
        fail(`${goal.id} scenes`);
      if (!Array.isArray(goal.questionIds) || !goal.questionIds.every((id) => questions.has(id)))
        fail(`${goal.id} questions`);
    }
  }
  return pkg;
}
