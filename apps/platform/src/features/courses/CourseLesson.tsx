import { useCallback, useEffect, useMemo } from 'react';
import type { BoardManifest, ReadingPackage } from '@learn/lesson-runtime';
import ReadingClassroom, { type ReadingModule } from '../../app/ReadingClassroom';
import { api } from '../../shared/api';
import { TextBoard } from '../boards/TextBoard';
import { BoardSourcesProvider, teacherSources } from '../boards/sources';
import { courseHref } from './types';

type Served = {
  lessonId: string;
  package: ReadingPackage;
  boards: Record<string, { hash: string; manifest: BoardManifest }>;
};

/** `?course=<id>&lesson=<id>`: a published lesson, played with saved progress and Nova. */
export default function CourseLesson({
  courseId,
  lessonId,
  studentName,
}: {
  courseId: string;
  lessonId: string;
  studentName: string;
}) {
  // Opening a lesson from its link puts the student in the course.
  useEffect(() => {
    void api(`/courses/${courseId}`, {}).catch(() => undefined);
  }, [courseId]);
  const boards = useMemo(() => ({ current: {} as Served['boards'] }), []);
  const load = useCallback(
    () =>
      api<Served>(`/courses/${courseId}/lessons/${lessonId}`).then((d): ReadingModule => {
        boards.current = d.boards;
        return {
          readingLesson: d.package,
          readingRenderers: { 'text-board': TextBoard },
          readingBoards: Object.fromEntries(
            Object.entries(d.boards).map(([k, b]) => [k, b.manifest]),
          ),
        };
      }),
    [courseId, lessonId, boards],
  );
  const sources = useMemo(
    () => ({
      get: (key: string) => {
        const board = boards.current[key];
        return board ? teacherSources({ [key]: board }).get(key) : teacherSources({}).get(key);
      },
    }),
    [boards],
  );
  return (
    <BoardSourcesProvider value={sources}>
      <ReadingClassroom
        key={lessonId}
        load={load}
        backHref={courseHref(courseId)}
        studentName={studentName}
      />
    </BoardSourcesProvider>
  );
}
