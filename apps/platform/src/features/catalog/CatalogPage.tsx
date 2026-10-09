import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { User } from '../auth/session';
import type { Curriculum } from './types';
import { LibraryShell } from './LibraryShell';
import { CurriculumCards } from './CurriculumCards';
import { CurriculumDetail } from './CurriculumDetail';
import '../../shared/platform.css';
import './library-shell.css';
import './library-account.css';
import './catalog-cards.css';
import './curriculum-detail.css';
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
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api<{ curricula: Curriculum[] }>('/catalog', undefined, controller.signal)
      .then((result) => setCurricula(result.curricula))
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
        <span className="eyebrow">{current ? 'رحلتك خطوة بخطوة' : 'مساحة تعلّمك'}</span>
        <h1>{current?.title ?? `أهلًا، ${user.name.split(' ')[0]}.`}</h1>
        <p>{current?.description ?? 'كل منهج له مكانه، ودروسه، ورحلتك الخاصة فيه.'}</p>
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
        <CurriculumDetail curriculum={current} />
      ) : (
        <CurriculumCards curricula={curricula} />
      )}
    </LibraryShell>
  );
}
