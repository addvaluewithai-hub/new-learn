import ReadingClassroom, { type ReadingModule } from './ReadingClassroom';

// `?preview=board`: the synthetic live-board probe; `?preview=visuals`: the visual style trials
// (docs/visuals). No account and no saved progress.
const loaders: Record<'probe' | 'visuals', () => Promise<ReadingModule>> = {
  probe: () =>
    import('../../../../fixtures/board-probe/lesson').then((m) => ({
      readingLesson: m.boardProbeLesson,
      readingRenderers: {},
    })),
  visuals: () =>
    import('../../../../fixtures/visual-trials/lesson').then((m) => ({
      readingLesson: m.visualTrialsLesson,
      readingRenderers: {},
    })),
};

export default function BoardPreview({ lesson = 'probe' }: { lesson?: 'probe' | 'visuals' }) {
  return <ReadingClassroom load={loaders[lesson]} backHref="/" studentName="طالب" preview />;
}
