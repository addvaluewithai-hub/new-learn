import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { User } from '../auth/session';
import type { Catalog, Curriculum, Resume } from './types';
import { LibraryShell } from './LibraryShell';
import { CurriculumCards } from './CurriculumCards';
import { ContinueCard } from './ContinueCard';
import { StudyPlan } from './StudyPlan';
import { MyDrafts } from '../authoring/MyDrafts';
import '../../shared/platform.css';
import './library-shell.css';
import './library-account.css';
import './catalog-cards.css';
import './home-pick.css';
import './study-plan.css';
export default function CatalogPage({
  user,
  onSignOut,
  curriculumId,
}: {
  user: User;
  onSignOut: () => Promise<void>;
  curriculumId: string | null;
}) {
  const [curricula, setCurricula] = useState<Curriculum[]>([]),
    [resume, setResume] = useState<Resume | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api<Catalog>('/catalog', undefined, controller.signal)
      .then((result) => {
        setCurricula(result.curricula);
        setResume(result.resume ?? null);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);
  const current = curricula.find((group) => group.id === curriculumId);
  return (
    <LibraryShell user={user} onSignOut={onSignOut}>
      <div className="page-heading">
        {curriculumId && (
          <a className="text-button" href="/">
            ← كل المناهج
          </a>
        )}
        {current ? <span className="eyebrow">{current.subject}</span> : null}
        <h1>
          {current?.title ??
            `${new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير'}، ${user.name.split(' ')[0]}`}
        </h1>
        {current ? <p>{current.description}</p> : null}
      </div>
      {loading ? (
        <p role="status">بنجهّز مناهجك…</p>
      ) : error ? (
        <div className="error-message" role="alert">
          {error}
          <button className="button secondary" onClick={() => setRetry((value) => value + 1)}>
            حاول تاني
          </button>
        </div>
      ) : curriculumId && !current ? (
        <p role="alert">المنهج غير موجود أو مش متاح حاليًا.</p>
      ) : current ? (
        <StudyPlan curriculum={current} resume={resume} />
      ) : (
        <>
          <ContinueCard curricula={curricula} resume={resume} />
          <CurriculumCards curricula={curricula} />
          <MyDrafts />
        </>
      )}
    </LibraryShell>
  );
}
