import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { User } from '../auth/session';
import type { Catalog, Curriculum, Resume } from './types';
import { LibraryShell } from './LibraryShell';
import { CurriculumCards } from './CurriculumCards';
import { ContinueCard } from './ContinueCard';
import { StudyPlan } from './StudyPlan';
import { MyDrafts } from '../authoring/MyDrafts';
import { MyCourses } from '../courses/MyCourses';
import '../../shared/platform.css';
import './library-shell.css';
import './library-account.css';
import './catalog-cards.css';
import './home-pick.css';
import './study-plan.css';
import { Alert, Button, ButtonLink, Spinner } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';
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
  const { t } = useI18n();
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
          <ButtonLink variant="link" href="/">
            {t('common.backLink')} {t('catalog.page.allCurricula')}
          </ButtonLink>
        )}
        {current ? <span className="eyebrow">{current.subject}</span> : null}
        <h1>
          {current ? (
            <bdi>{current.title}</bdi>
          ) : (
            <Rich
              k={
                new Date().getHours() < 12
                  ? 'catalog.page.greeting.morning'
                  : 'catalog.page.greeting.evening'
              }
              parts={{ name: <bdi>{user.name.split(' ')[0]}</bdi> }}
            />
          )}
        </h1>
        {current ? <p>{current.description}</p> : null}
      </div>
      {loading ? (
        <Spinner label={t('catalog.page.loading')} />
      ) : error ? (
        <Alert tone="error">
          {error}{' '}
          <Button variant="link" onClick={() => setRetry((value) => value + 1)}>
            {t('catalog.retry')}
          </Button>
        </Alert>
      ) : curriculumId && !current ? (
        <Alert tone="error">{t('catalog.page.notFound')}</Alert>
      ) : current ? (
        <StudyPlan curriculum={current} resume={resume} />
      ) : (
        <>
          <ContinueCard curricula={curricula} resume={resume} />
          <CurriculumCards curricula={curricula} />
          <MyCourses />
          <MyDrafts />
        </>
      )}
    </LibraryShell>
  );
}
