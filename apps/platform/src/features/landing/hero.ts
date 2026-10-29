import {
  boardViewAt,
  defaultValues,
  type BoardView,
  type ReadingPackage,
} from '@learn/lesson-runtime';
import { boardManifests } from '../boards/editions';
import { DEMOS } from '../../../../../fixtures/demos';
import { LOOKS, type Look } from '../studio/looks';

// The hero replays a real demo lesson on its real board: the first scene's steps, one every
// few seconds, each with the lesson's own line. The page takes the look's colours while it
// plays, so the looks are the design, not a picture of it.

export type HeroLook = Look & { demo: string; board: string; colors: [string, string] };

/** The looks with a demo and a board, in the order they play, with the demo's colours. */
export const HERO_LOOKS: HeroLook[] = LOOKS.flatMap((look) => {
  const demo = DEMOS.find((d) => d.id === look.demo);
  return look.demo && look.board && demo?.load
    ? [{ ...look, demo: look.demo, board: look.board, colors: demo.colors }]
    : [];
});

export type HeroStep = { text: string; view: BoardView };

/** The first scene of a look's demo as hero steps: its lines and the board at each one. */
export async function loadHeroSteps(look: HeroLook): Promise<HeroStep[]> {
  const load = DEMOS.find((d) => d.id === look.demo)?.load;
  if (!load) return [];
  const course: ReadingPackage = await load();
  const scene =
    course.scenes.find((s) => s.visual?.params?.board === look.board) ?? course.scenes[0];
  const base = defaultValues(boardManifests[look.board]);
  return scene.steps.map((step, i) => ({
    text: step.text,
    view: boardViewAt(scene.steps, i, 'teach', base, 'locked'),
  }));
}

/** How long a line stays before the next, and the pause before the next look. */
export const STEP_MS = 4200;
export const LOOK_PAUSE_MS = 2600;

/** Which look to show first: the one named in the hash (`#look=chalk`), else the first. */
export function initialLook(hash: string): HeroLook {
  const id = /look=([a-z0-9]+)/.exec(hash)?.[1];
  return HERO_LOOKS.find((l) => l.id === id) ?? HERO_LOOKS[0];
}
