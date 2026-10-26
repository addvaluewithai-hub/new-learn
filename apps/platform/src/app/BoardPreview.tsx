import ReadingClassroom, { type ReadingModule } from './ReadingClassroom';
import { HtmlBoard } from '../features/boards/HtmlBoard';
import { boardManifests } from '../features/boards/editions';

// `?preview=board`: the synthetic live-board probe, with no account and no saved progress.
const load = (): Promise<ReadingModule> =>
  import('../../../../fixtures/board-probe/lesson').then((m) => ({
    readingLesson: m.boardProbeLesson,
    readingRenderers: { 'html-board': HtmlBoard },
    readingBoards: boardManifests,
  }));

export default function BoardPreview() {
  return <ReadingClassroom load={load} backHref="/" studentName="طالب" preview />;
}
