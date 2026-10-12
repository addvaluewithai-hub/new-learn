import { lazy, Suspense, useEffect, useState } from 'react';
import { api } from '../../shared/api';
import pinnedModules from '../../../content-modules.json';
import { readingModules } from '../../../../../content/imported/modules';
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
        <p role="alert">{error}</p>
        <button className="button secondary" onClick={() => setRetry((value) => value + 1)}>
          حاول تاني
        </button>
        <a href={backHref}>ارجع للمنهج</a>
      </main>
    );
  if (!edition) return <p role="status">بنجهّز الدرس…</p>;
  // The build allowlist must match the released edition exactly.
  const matches =
    !!pinned &&
    pinned.lessonId === edition.lessonId &&
    pinned.contentRevision === edition.contentRevision &&
    pinned.manifestHash === edition.manifestHash &&
    pinned.runtimeVersion === edition.runtimeVersion;
  if (matches && reading)
    return (
      <Suspense fallback={<p role="status">بنجهّز مساحة الدرس…</p>}>
        <ReadingClassroom load={reading} backHref={backHref} studentName={studentName} />
      </Suspense>
    );
  if (!matches || !module || module.lessonId !== edition.lessonId)
    return (
      <main className="platform-ui lesson-entry-message">
        <p role="alert">نسخة الدرس دي لسه مش متاحة على المنصة الجديدة.</p>
        <a href={backHref}>ارجع للمنهج</a>
      </main>
    );
  const Lesson = module.component;
  return (
    <Suspense fallback={<p role="status">بنجهّز مساحة الدرس…</p>}>
      <Lesson backHref={backHref} studentName={studentName} />
    </Suspense>
  );
}
