import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { User } from '../auth/session';
import { LibraryShell } from '../catalog/LibraryShell';
import { Alert, Badge, ButtonLink, Card, EmptyState, PageSkeleton } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { formatPrice } from '../credits/format';
import { ReviewDetail } from './ReviewDetail';
import '../../shared/platform.css';
import '../catalog/library-shell.css';
import './review.css';

type Queued = {
  courseId: string;
  version: number;
  title: string;
  teacher: string;
  priceCents: number;
  currency: string;
  submittedAt: string;
  aiDone: boolean;
};

/** `?review` (staff): paid course versions waiting; `?review=<course>.<version>`: one of them. */
export default function ReviewPage({
  user,
  onSignOut,
  item,
}: {
  user: User;
  onSignOut: () => Promise<void>;
  item: string | null;
}) {
  const { t, locale } = useI18n();
  const [queue, setQueue] = useState<Queued[] | null>(null);
  const [error, setError] = useState('');
  const [courseId, version] = (item ?? '').split('.');
  useEffect(() => {
    if (item) return;
    api<{ reviews: Queued[] }>('/review/queue').then(
      (r) => setQueue(r.reviews),
      (e) => setError(e.message),
    );
  }, [item]);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', numberingSystem: 'latn' });
  return (
    <LibraryShell user={user} onSignOut={onSignOut} page="review">
      {item && courseId && Number(version) > 0 ? (
        <ReviewDetail courseId={courseId} version={Number(version)} />
      ) : (
        <>
          <div className="page-heading">
            <h1>{t('review.title')}</h1>
            <p>{t('review.lead')}</p>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          {!queue ? (
            !error && <PageSkeleton label={t('review.loading')} />
          ) : queue.length === 0 ? (
            <EmptyState title={t('review.empty')} />
          ) : (
            <ul className="review-queue">
              {queue.map((r) => (
                <li key={`${r.courseId}.${r.version}`}>
                  <Card className="review-item">
                    <div>
                      <strong>
                        <bdi>{r.title}</bdi>
                      </strong>
                      <span>
                        {t('review.item', {
                          teacher: r.teacher,
                          version: r.version,
                          price: formatPrice(r.priceCents, r.currency, locale),
                        })}
                      </span>
                      <small>
                        {t('review.waiting', { date: date.format(new Date(r.submittedAt)) })}
                      </small>
                    </div>
                    {r.aiDone && <Badge tone="tutor">{t('review.aiDone')}</Badge>}
                    <ButtonLink href={`/?review=${r.courseId}.${r.version}`}>
                      {t('review.open')}
                    </ButtonLink>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </LibraryShell>
  );
}
