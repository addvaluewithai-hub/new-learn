import { useCallback, useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { User } from '../auth/session';
import { LibraryShell } from '../catalog/LibraryShell';
import { ErrorState, PageSkeleton } from '../../shared/ui';
import { TeachDashboard } from './TeachDashboard';
import { TeachCourse } from './TeachCourse';
import type { TeachCourse as Course, Workspace } from './types';
import { useI18n } from '../../i18n';
import '../../shared/platform.css';
import '../catalog/library-shell.css';
import '../catalog/library-account.css';
import './teach.css';

/** `?teach`: the teacher's courses; `?teach&course=<id>`: one course's workspace. */
export default function TeachPage({
  user,
  onSignOut,
  courseId,
}: {
  user: User;
  onSignOut: () => Promise<void>;
  courseId: string | null;
}) {
  const { t } = useI18n();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [work, setWork] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setError('');
    return (
      courseId
        ? api<Workspace>(`/teach/courses/${courseId}`).then(setWork)
        : api<{ courses: Course[] }>('/teach/courses').then((r) => setCourses(r.courses))
    ).catch((e) => setError(e.message));
  }, [courseId]);
  useEffect(() => {
    setWork(null);
    setCourses(null);
    void load();
  }, [load]);
  return (
    <LibraryShell user={user} onSignOut={onSignOut} page="teach">
      {error ? (
        <ErrorState message={error} retryLabel={t('common.retry')} onRetry={() => void load()} />
      ) : courseId ? (
        work ? (
          <TeachCourse work={work} onChanged={load} />
        ) : (
          <PageSkeleton label={t('teach.loadingCourse')} rows={2} />
        )
      ) : courses ? (
        <TeachDashboard courses={courses} />
      ) : (
        <PageSkeleton label={t('teach.loadingCourses')} />
      )}
    </LibraryShell>
  );
}
