import { lazy, Suspense, useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { contentPins as pinnedModules } from '../../../contentPins';
import { readingModules as importedModules } from '../../../../../content/imported/modules';
import { bookReadingModules } from '../../../../../content/book-guided/modules';
import { bookReference } from '../book/references';
const readingModules = { ...importedModules, ...bookReadingModules };
import { Loading } from '../../shared/Loading';
import { Alert, Button, ButtonLink } from '../../shared/ui';
import { useI18n } from '../../i18n';
const ChemistryLesson = lazy(() => import('../../app/ChemistryLesson'));
const ReadingClassroom = lazy(() => import('../../app/ReadingClassroom'));
type Pin = {
  lessonId: string;
  contentRevision: string;
  manifestHash: string;
  runtimeVersion: string;
  delivery?: 'reading';
};
type Edition = {
  lessonId: string;
  contentRevision: string;
  moduleId: string;
  manifestHash: string;
  runtimeVersion: string;
  stage: 'review' | 'published';
};
const modules: Record<
  string,
  { lessonId: string; revision: string; component: typeof ChemistryLesson }
> = {
  'states-of-matter-review': {
    lessonId: 'chem-gas-states-matter',
    revision: 'curriculum-v3-english-2026-10-06',
    component: ChemistryLesson,
  },
};
export default function LessonEntry({
  lessonId,
  curriculumId,
  studentName,
}: {
  lessonId: string;
  curriculumId: string | null;
  studentName: string;
}) {
  const [edition, setEdition] = useState<Edition | null>(null),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  const { t } = useI18n();
  useEffect(() => {
    const controller = new AbortController();
    setEdition(null);
    setError('');
    api<Edition>(`/lessons/${encodeURIComponent(lessonId)}`, undefined, controller.signal)
      .then(setEdition)
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [lessonId, retry]);
  const pinned = edition ? (pinnedModules as Record<string, Pin>)[edition.moduleId] : undefined;
  const reading =
    edition && pinned?.delivery === 'reading'
      ? readingModules[edition.moduleId as keyof typeof readingModules]
      : undefined;
  const module = edition && !reading ? modules[edition.moduleId] : undefined;
  const backHref = curriculumId ? `/?curriculum=${encodeURIComponent(curriculumId)}` : '/';
  if (error)
    return (
      <main className="platform-ui lesson-entry-message">
        <Alert tone="error">{error}</Alert>
        <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
          {t('catalog.retry')}
        </Button>
        <ButtonLink variant="link" href={backHref}>
          {t('catalog.backToCurriculum')}
        </ButtonLink>
      </main>
    );
  if (!edition) return <Loading text={t('catalog.lesson.loading')} />;
  // The build allowlist must match the released edition exactly.
  const matches =
    !!pinned &&
    pinned.lessonId === edition.lessonId &&
    pinned.contentRevision === edition.contentRevision &&
    pinned.manifestHash === edition.manifestHash &&
    pinned.runtimeVersion === edition.runtimeVersion;
  if (matches && reading)
    return (
      <Suspense fallback={<Loading text={t('common.loadingLesson')} />}>
        <ReadingClassroom
          load={reading}
          backHref={backHref}
          studentName={studentName}
          reference={bookReference(lessonId)}
        />
      </Suspense>
    );
  if (!matches || !module || module.lessonId !== edition.lessonId)
    return (
      <main className="platform-ui lesson-entry-message">
        <Alert tone="error">{t('catalog.lesson.unavailable')}</Alert>
        <a href={backHref}>{t('catalog.backToCurriculum')}</a>
      </main>
    );
  const Lesson = module.component;
  return (
    <Suspense fallback={<Loading text={t('common.loadingLesson')} />}>
      <Lesson backHref={backHref} studentName={studentName} />
    </Suspense>
  );
}
