// The board states board:check draws: every page of a lesson that shows the board, and a
// generic sweep (defaults, each variable at its extremes, every target marked).
import { defaultValues } from '../../packages/lesson-runtime/src/board/manifest.ts';
import {
  boardManifest,
  readingBoardView,
} from '../../packages/lesson-runtime/src/reading/board.ts';
import { readingPages } from '../../packages/lesson-runtime/src/reading/model.ts';

const blank = (variables, extra = {}) => ({
  variables,
  highlight: [],
  reveal: [],
  notes: [],
  input: 'locked',
  phase: 'teach',
  step: 0,
  ...extra,
});

export function genericStates(manifest) {
  const base = defaultValues(manifest);
  const states = [{ label: 'defaults', view: blank(base) }];
  for (const [name, v] of Object.entries(manifest.variables)) {
    const values = v.type === 'number' ? [v.min, v.max] : v.options;
    for (const value of values)
      states.push({ label: `${name}=${value}`, view: blank({ ...base, [name]: value }) });
  }
  const targets = manifest.targets;
  if (targets.length)
    states.push({
      label: 'every target marked',
      view: blank(base, {
        highlight: targets,
        reveal: targets,
        notes: targets.map((target) => ({ target, text: 'ملاحظة على البورد: F = k·x' })),
      }),
    });
  states.push({ label: 'input open', view: blank(base, { input: 'open' }) });
  return states;
}

/** Every page of `lesson` whose board is this one, as the lesson would show it. */
export function lessonStates(lesson, manifest) {
  const pages = readingPages(lesson);
  const boards = { [manifest.id]: manifest };
  const states = [];
  pages.forEach((page, index) => {
    const scene = lesson.scenes[page.scene];
    const spec = page.kind === 'feedback' ? scene.question.feedback.visual : scene.visual;
    if (boardManifest(spec, boards)?.id !== manifest.id) return;
    const view = readingBoardView(lesson, pages, index, {}, {}, manifest);
    states.push({ label: `${scene.id} ${page.kind} ${page.step + 1}`, view });
  });
  return states;
}

/** The first exported reading package of a lesson module. */
export async function loadLesson(path) {
  const module = await import(path);
  const lesson = Object.values(module).find((v) => v?.delivery === 'reading');
  if (!lesson) throw new Error(`${path} exports no reading lesson`);
  return lesson;
}
