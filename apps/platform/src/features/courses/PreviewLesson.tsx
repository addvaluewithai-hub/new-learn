import { useEffect, useMemo, useState } from 'react';
import { ReadingLesson } from '@learn/lesson-runtime';
import type { BoardManifest, ReadingPackage } from '@learn/lesson-runtime';
import '@learn/lesson-runtime/style.css';
import { api } from '../../shared/api';
import { ErrorState, PageSkeleton } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { TextBoard } from '../boards/TextBoard';
import { HtmlBoard } from '../boards/HtmlBoard';
import { BoardSourcesProvider, teacherSources } from '../boards/sources';
import { joinHref } from './CoursePreview';
import '../classroom/reading-classroom.css';

type Served = {
  course: { lessons: Array<{ id: string; title: string }> };
  lesson: {
    id: string;
    title: string;
    scenes: number;
    package: ReadingPackage;
    boards: Record<string, { hash: string; manifest: BoardManifest }>;
  };
};
const REGISTRY = { 'html-board': HtmlBoard, 'text-board': TextBoard };

/**
 * `?course=<id>&preview=play` without an account (M7): the first scene of the first lesson,
 * played like a lesson but saving nothing and without Nova. Its end offers the rest, with an
 * account.
 */
export default function PreviewLesson({ courseId }: { courseId: string }) {
  const { t } = useI18n();
  const [served, setServed] = useState<Served | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<Served>(`/public/courses/${courseId}/preview`).then(setServed, (e) => setError(e.message));
  }, [courseId]);
  useEffect(() => {
    document.documentElement.classList.add('in-lesson');
    return () => document.documentElement.classList.remove('in-lesson');
  }, []);
  const sources = useMemo(() => teacherSources(served?.lesson.boards ?? {}), [served]);
  const boards = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(served?.lesson.boards ?? {}).map(([k, b]) => [k, b.manifest]),
      ),
    [served],
  );
  if (error)
    return (
      <main className="platform-ui lesson-entry-message">
        <ErrorState
          message={error}
          retryLabel={t('courses.preview.back')}
          onRetry={() => location.assign(`/?course=${courseId}`)}
        />
      </main>
    );
  if (!served) return <PageSkeleton label={t('courses.loading')} />;
  const rest =
    served.lesson.scenes > 1 || !served.course.lessons[1]
      ? t('courses.preview.rest', { lesson: served.lesson.title })
      : served.course.lessons[1].title;
  return (
    <BoardSourcesProvider value={sources}>
      <div className="reading-classroom">
        <ReadingLesson
          lesson={served.lesson.package}
          registry={REGISTRY}
          boards={boards}
          exit={{ label: t('courses.preview.back'), href: `/?course=${courseId}` }}
          // What comes after this scene asks for an account; the end screen names it.
          next={{ title: rest, href: joinHref(courseId) }}
          status={
            <span className="reading-save" data-state="preview">
              {t('courses.preview.badge')}
            </span>
          }
        />
      </div>
    </BoardSourcesProvider>
  );
}
