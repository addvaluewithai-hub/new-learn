import { checkedVariables, decodeBoardAnswer, boardViewAt } from '../board/state';
import { clampValues, defaultValues } from '../board/manifest';
import type { BoardManifest, BoardValues, BoardView, StepBoard } from '../board/types';
import type { VisualSpec } from '../types';
import { pageSteps } from './model';
import type { ReadingPackage, ReadingPage, ReadingScene } from './types';

/** Renderer name of teacher-made boards that run live in a sandbox (docs/boards.md). */
export const HTML_BOARD = 'html-board';
export type BoardManifests = Readonly<Record<string, BoardManifest>>;

export function boardManifest(spec: VisualSpec | null | undefined, boards: BoardManifests = {}) {
  if (spec?.renderer !== HTML_BOARD) return null;
  const id = spec.params.board;
  return typeof id === 'string' ? (boards[id] ?? null) : null;
}

/** Every live board has a manifest, and steps and checks use only what it declares. */
export function validateLessonBoards(lesson: ReadingPackage, boards: BoardManifests = {}) {
  const fail = (message: string): never => {
    throw new Error(`Invalid reading package: ${message}`);
  };
  const check = (manifest: BoardManifest, board: StepBoard | undefined, label: string) => {
    for (const name of Object.keys(board?.state ?? {}))
      if (!(name in manifest.variables)) fail(`${label}: unknown board variable ${name}`);
    const pointed = [...(board?.highlight ?? []), ...(board?.reveal ?? [])];
    for (const target of [...pointed, ...(board?.notes ?? []).map((n) => n.target)])
      if (!manifest.targets.includes(target)) fail(`${label}: undeclared board target ${target}`);
  };
  const clip = (spec: VisualSpec | null, steps: Array<{ board?: StepBoard }>, label: string) => {
    const manifest = boardManifest(spec, boards);
    if (spec?.renderer === HTML_BOARD && !manifest) fail(`${label}: unknown board`);
    if (!manifest) {
      if (steps.some((s) => s.board)) fail(`${label}: step boards need a live board`);
      return;
    }
    steps.forEach((step, i) => check(manifest, step.board, `${label} step ${i + 1}`));
  };
  for (const scene of lesson.scenes) {
    clip(scene.visual, scene.steps, scene.id);
    const q = scene.question;
    if (!q) continue;
    clip(q.feedback.visual, q.feedback.steps, `${q.id} feedback`);
    if (!q.board) continue;
    const manifest = boardManifest(scene.visual, boards);
    if (!manifest) fail(`${q.id}: board questions need a live board`);
    check(manifest!, { state: q.board.state }, q.id);
    for (const name of checkedVariables(q.board.check))
      if (!(name in manifest!.variables)) fail(`${q.id}: unknown checked variable ${name}`);
  }
  return lesson;
}

/** Values a page sets itself; a learner's own value stops applying at the next such page. */
function pageSets(scene: ReadingScene, page: ReadingPage): BoardValues | undefined {
  if (page.kind === 'attempt') return scene.question?.board?.state;
  return pageSteps(scene, page)[page.step]?.board?.state;
}
const clipOf = (page: ReadingPage) => `${page.scene}:${page.kind === 'feedback'}`;

/** A learner's change on an open board, remembered with the page it was made on. */
export type LearnerValues = Record<string, { value: number | string; page: number }>;

/**
 * The board for page `index`: the manifest defaults, then the authored states, then the
 * learner's own values that no later page of the same clip has set again.
 */
export function readingBoardView(
  lesson: ReadingPackage,
  pages: ReadingPage[],
  index: number,
  answers: Record<string, string>,
  learner: LearnerValues,
  manifest: BoardManifest,
): BoardView {
  const page = pages[index];
  const scene = lesson.scenes[page.scene];
  const q = scene.question;
  const sceneEnd = boardViewAt(scene.steps, scene.steps.length - 1, 'ask').variables;
  const base = { ...defaultValues(manifest) };
  let view: BoardView;
  if (page.kind === 'feedback') {
    const answered = decodeBoardAnswer(answers[q!.id])?.values;
    Object.assign(base, sceneEnd, q!.board?.state, answered);
    view = boardViewAt(q!.feedback.steps, page.step, 'feedback', base);
  } else if (page.kind === 'attempt') {
    view = boardViewAt([], 0, 'attempt', { ...base, ...sceneEnd, ...q?.board?.state }, 'open');
    view.step = page.step;
  } else view = boardViewAt(scene.steps, page.step, page.kind, base);
  for (const [name, { value, page: at }] of Object.entries(learner)) {
    if (at > index || clipOf(pages[at]) !== clipOf(page)) continue;
    const reset = pages
      .slice(at + 1, index + 1)
      .some((p) => pageSets(scene, p)?.[name] !== undefined);
    if (!reset) view.variables[name] = value;
  }
  view.variables = { ...defaultValues(manifest), ...clampValues(manifest, view.variables) };
  return view;
}
