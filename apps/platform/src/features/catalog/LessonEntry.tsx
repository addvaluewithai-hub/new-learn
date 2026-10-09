import { lazy, Suspense, useEffect, useState } from 'react';
import { api } from '../../shared/api';
import pinnedModules from '../../../content-modules.json';
const ChemistryLesson = lazy(() => import('../../app/ChemistryLesson'));
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
}: {
  lessonId: string;
  curriculumId: string | null;
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
  const module = edition ? modules[edition.moduleId] : undefined;
  const pinned = edition
    ? pinnedModules[edition.moduleId as keyof typeof pinnedModules]
    : undefined;
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
  if (
    !module ||
    !pinned ||
    pinned.manifestHash !== edition.manifestHash ||
    module.lessonId !== edition.lessonId ||
    module.revision !== edition.contentRevision ||
    edition.runtimeVersion !== '0.2.1'
  )
    return (
      <main className="platform-ui lesson-entry-message">
        <p role="alert">نسخة الدرس دي لسه مش متاحة على المنصة الجديدة.</p>
        <a href={backHref}>ارجع للمنهج</a>
      </main>
    );
  const Lesson = module.component;
  return (
    <Suspense fallback={<p role="status">بنجهّز مساحة الدرس…</p>}>
      <Lesson backHref={backHref} />
    </Suspense>
  );
}
