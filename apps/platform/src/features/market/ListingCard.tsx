import { useState } from 'react';
import { api } from '../../shared/api';
import { Alert, Badge, Button, Card } from '../../shared/ui';
import { useI18n } from '../../i18n';
import type { Published } from '../teach/types';
import { GRADES } from './grades';
import './market.css';

const TONE = { private: 'neutral', requested: 'warning', listed: 'success' } as const;

/** In the teacher's publish tab: list the course in the marketplace, or take it out. */
export function ListingCard({
  courseId,
  published,
  onChanged,
}: {
  courseId: string;
  published: Published;
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [grade, setGrade] = useState(published.grade);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const listing = published.listing;
  const set = async (list: boolean) => {
    setBusy(true);
    setError('');
    try {
      await api(`/teach/courses/${courseId}/listing`, { list, grade });
      await onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="teach-listing">
      <h2>{t('market.listing.title')}</h2>
      <p className="teach-note">{t('market.listing.lead')}</p>
      <Badge tone={TONE[listing]}>{t(`market.listing.status.${listing}`)}</Badge>
      <label className="teach-listing-grade">
        <span>{t('market.listing.grade')}</span>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          disabled={busy || listing !== 'private'}
        >
          <option value="">{t('market.grades.none')}</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {t(`market.grades.${g}`)}
            </option>
          ))}
        </select>
      </label>
      <div className="teach-publish-actions">
        {listing === 'private' ? (
          <Button disabled={busy} onClick={() => set(true)}>
            {t('market.listing.list')}
          </Button>
        ) : (
          <Button variant="secondary" disabled={busy} onClick={() => set(false)}>
            {t('market.listing.unlist')}
          </Button>
        )}
        {listing === 'listed' && (
          <a className="nl-button nl-button--ghost" href="/?explore">
            {t('market.listing.see')}
          </a>
        )}
      </div>
      <p className="teach-note">
        {t(published.priceCents > 0 ? 'market.listing.paidNote' : 'market.listing.freeNote')}
      </p>
      {error && <Alert tone="error">{error}</Alert>}
    </Card>
  );
}
