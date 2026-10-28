import ReadingClassroom, { type ReadingModule } from './ReadingClassroom';
import { DEMOS } from '../../../../fixtures/demos';

// `?preview=board`: the synthetic live-board probe; `?preview=demo&id=…`: one demo course
// (docs/visuals/demos.md). No account and no saved progress.
const probe = (): Promise<ReadingModule> =>
  import('../../../../fixtures/board-probe/lesson').then((m) => ({
    readingLesson: m.boardProbeLesson,
    readingRenderers: {},
  }));

export default function BoardPreview({ demo }: { demo?: string | null }) {
  if (demo === undefined)
    return <ReadingClassroom load={probe} backHref="/" studentName="طالب" preview />;
  const found = DEMOS.find((d) => d.id === demo);
  if (!found?.load)
    return (
      <p className="lesson-entry-message" role="alert">
        الكورس ده لسه مش جاهز. <a href="/?preview=demos">ارجع للمعرض</a>
      </p>
    );
  const load = found.load;
  return (
    <ReadingClassroom
      load={() => load().then((readingLesson) => ({ readingLesson, readingRenderers: {} }))}
      backHref="/?preview=demos"
      studentName="طالب"
      preview
    />
  );
}
