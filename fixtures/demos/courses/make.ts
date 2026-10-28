import type { ReadingPackage, ReadingScene, VisualSpec } from '@learn/lesson-runtime';

// Demo courses (docs/visuals/demos.md): short lessons that show what a style can do.
// Synthetic showcase content, playable without an account at `?preview=demo&id=<id>`.

/** A scene's live board by its id (built from fixtures/demos/boards). */
export const board = (id: string): VisualSpec => ({
  renderer: 'html-board',
  params: { board: id },
});

export function course(input: {
  id: string;
  title: string;
  englishTitle: string;
  scenes: ReadingScene[];
  goals: ReadingPackage['goals'];
  glossary?: ReadingPackage['glossary'];
}): ReadingPackage {
  return {
    schemaVersion: 1,
    delivery: 'reading',
    lessonId: `demo-${input.id}`,
    curriculumId: 'demos',
    contentRevision: `demo-${input.id}-1`,
    title: input.title,
    englishTitle: input.englishTitle,
    curriculumTitle: 'معرض New Learn',
    lessonOrder: 1,
    fps: 30,
    dimensions: { landscape: { width: 1280, height: 720 }, portrait: { width: 720, height: 1280 } },
    glossary: input.glossary ?? [],
    goals: input.goals,
    scenes: input.scenes,
  };
}
