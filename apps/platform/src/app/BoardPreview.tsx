import { useEffect } from 'react';
import ReadingClassroom, { type ReadingModule } from './ReadingClassroom';
import { setCourseVoice } from '../features/nova/voice/voicePrefs';
import { DEMOS } from '../../../../fixtures/demos';
import { useI18n } from '../i18n';
import { Rich } from '../i18n/Rich';

// `?preview=board`: the synthetic live-board probe; `?preview=demo&id=…`: one demo course
// (docs/visuals/demos.md). No account and no saved progress.
const probe = (): Promise<ReadingModule> =>
  import('../../../../fixtures/board-probe/lesson').then((m) => ({
    readingLesson: m.boardProbeLesson,
    readingRenderers: {},
  }));

export default function BoardPreview({ demo }: { demo?: string | null }) {
  const { t } = useI18n();
  // A demo with its own voice and character: Nova speaks in it while the demo is open.
  const found = DEMOS.find((d) => d.id === demo);
  useEffect(() => {
    setCourseVoice(found?.voice ?? null);
    return () => setCourseVoice(null);
  }, [found]);
  if (demo === undefined)
    return (
      <ReadingClassroom load={probe} backHref="/" studentName={t('app.preview.student')} preview />
    );
  if (!found?.load)
    return (
      <p className="lesson-entry-message" role="alert">
        <Rich
          k="app.preview.notReady"
          parts={{ link: <a href="/?preview=demos">{t('app.preview.backToGallery')}</a> }}
        />
      </p>
    );
  const load = found.load;
  return (
    <ReadingClassroom
      load={() => load().then((readingLesson) => ({ readingLesson, readingRenderers: {} }))}
      backHref="/?preview=demos"
      studentName={t('app.preview.student')}
      preview
    />
  );
}
