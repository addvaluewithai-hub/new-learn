import { useCallback, useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { User } from '../auth/session';
import { LibraryShell } from '../catalog/LibraryShell';
import { Alert, Badge, Button, Card, Spinner } from '../../shared/ui';
import { useI18n, type TextKey } from '../../i18n';
import { ACTION_KEYS, formatPrice, type CreditsView } from './format';
import { GrantForm } from './GrantForm';
import '../../shared/platform.css';
import '../catalog/library-shell.css';
import './credits.css';

/** `?credits`: the balance, what things cost, the packs (once payments connect), the history. */
export default function CreditsPage({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [view, setView] = useState<CreditsView | null>(null);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState('');
  const load = useCallback(
    () => api<CreditsView>('/credits').then(setView, (e) => setError(e.message)),
    [],
  );
  useEffect(() => void load(), [load]);
  const buy = async (pack: string) => {
    setBuying(pack);
    setError('');
    try {
      const { url } = await api<{ url: string }>('/credits/checkout', { pack });
      location.assign(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBuying('');
    }
  };
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', numberingSystem: 'latn' });
  return (
    <LibraryShell user={user} onSignOut={onSignOut} page="credits">
      <div className="page-heading">
        <h1>{t('credits.title')}</h1>
        <p>{t('credits.lead')}</p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {!view ? (
        !error && <Spinner label={t('credits.loading')} />
      ) : (
        <div className="credits">
          <Card className="credits-balance">
            <span>{t('credits.balanceLabel')}</span>
            <strong>{t('credits.count', { count: view.balance })}</strong>
            <small>{t('credits.starterNote', { count: view.starter })}</small>
          </Card>
          <section aria-labelledby="credits-prices">
            <h2 id="credits-prices">{t('credits.pricesTitle')}</h2>
            <ul className="credits-prices">
              {view.prices.map((p) => (
                <li key={p.id} data-soon={p.status === 'soon' || undefined}>
                  <span>{t(ACTION_KEYS[p.id])}</span>
                  {p.status === 'soon' && <Badge>{t('credits.soon')}</Badge>}
                  <strong>
                    {t('credits.count', { count: p.credits })}{' '}
                    <small>{t(`credits.units.${p.unit}` as TextKey)}</small>
                  </strong>
                </li>
              ))}
              <li>
                <span>{t('credits.connectorFree')}</span>
              </li>
            </ul>
          </section>
          <section aria-labelledby="credits-packs">
            <h2 id="credits-packs">{t('credits.packsTitle')}</h2>
            <div className="credits-packs">
              {view.packs.map((pack) => (
                <Card key={pack.id} className="credits-pack">
                  <strong>{t('credits.count', { count: pack.credits })}</strong>
                  <Button
                    variant="secondary"
                    disabled={!view.payments.connected || buying !== ''}
                    onClick={() => void buy(pack.id)}
                  >
                    {t('credits.buy', { price: formatPrice(pack.priceCents, 'USD', locale) })}
                  </Button>
                </Card>
              ))}
            </div>
            {!view.payments.connected && (
              <p className="credits-note">{t('credits.paymentsSoon')}</p>
            )}
          </section>
          <section aria-labelledby="credits-history">
            <h2 id="credits-history">{t('credits.historyTitle')}</h2>
            {view.entries.length === 0 ? (
              <p className="credits-note">{t('credits.historyEmpty')}</p>
            ) : (
              <ul className="credits-history">
                {view.entries.map((e) => (
                  <li key={e.id}>
                    <span>
                      {t(`credits.kinds.${e.kind}` as TextKey)}
                      {e.action in ACTION_KEYS && (
                        <small> · {t(ACTION_KEYS[e.action as keyof typeof ACTION_KEYS])}</small>
                      )}
                      {e.note && (
                        <small>
                          {' '}
                          · <bdi>{e.note}</bdi>
                        </small>
                      )}
                    </span>
                    <time dateTime={e.at}>{date.format(new Date(e.at))}</time>
                    <strong data-sign={e.amount < 0 ? 'minus' : 'plus'} dir="ltr">
                      {e.amount > 0 ? '+' : ''}
                      {e.amount}
                    </strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {user.staff && <GrantForm onGranted={load} />}
        </div>
      )}
    </LibraryShell>
  );
}
