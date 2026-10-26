import ReadingClassroom, { type ReadingModule } from './ReadingClassroom';

// `?preview=board`: the synthetic live-board probe, with no account and no saved progress.
const load = (): Promise<ReadingModule> =>
  import('../../../../fixtures/board-probe/lesson').then((m) => ({
    readingLesson: m.boardProbeLesson,
    readingRenderers: {},
  }));

export default function BoardPreview() {
  return <ReadingClassroom load={load} backHref="/" studentName="طالب" preview />;
}
