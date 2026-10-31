import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { User } from '../auth/session';
import { LibraryShell } from '../catalog/LibraryShell';
import { Alert, Badge, Card, EmptyState, PageSkeleton } from '../../shared/ui';
import { useI18n } from '../../i18n';
import '../../shared/platform.css';
import '../catalog/library-shell.css';
import './ops.css';

type UsageKind =
  | 'nova.chat'
  | 'nova.live'
  | 'nova.quiz'
  | 'nova.wake'
  | 'mcp.call'
  | 'build.job'
  | 'review.ai'
  | 'auth.signup';
type Usage = { day: string; kind: string; count: number; cents: number };
type Logged = {
  id: string;
  at: string;
  source: string;
  place: string;
  status: number;
  message: string;
  detail: Record<string, string>;
};

/** Days, newest first, each with its counts and the rough cost in dollars. */
function byDay(rows: Usage[]) {
  const days = new Map<string, { kinds: Usage[]; cents: number }>();
  for (const r of rows) {
    const d = days.get(r.day) ?? { kinds: [], cents: 0 };
    d.kinds.push(r);
    d.cents += r.cents;
    days.set(r.day, d);
  }
  return [...days.entries()];
}

/** `?ops` (staff): what the platform used and what broke (docs/operations.md). */
export default function OpsPage({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const [usage, setUsage] = useState<Usage[] | null>(null);
  const [errors, setErrors] = useState<Logged[] | null>(null);
  const [failed, setFailed] = useState('');
  useEffect(() => {
    api<{ usage: Usage[] }>('/ops/usage').then(
      (r) => setUsage(r.usage),
      (e) => setFailed(e.message),
    );
    api<{ errors: Logged[] }>('/ops/errors').then(
      (r) => setErrors(r.errors),
      (e) => setFailed(e.message),
    );
  }, []);
  const time = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    numberingSystem: 'latn',
  });
  const dollars = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      numberingSystem: 'latn',
    }).format(cents / 100);
  return (
    <LibraryShell user={user} onSignOut={onSignOut} page="ops">
      <div className="page-heading">
        <h1>{t('ops.title')}</h1>
        <p>{t('ops.lead')}</p>
      </div>
      {failed && <Alert tone="error">{failed}</Alert>}
      <section className="ops-section" aria-labelledby="ops-usage">
        <h2 id="ops-usage">{t('ops.usage.title')}</h2>
        <p className="ops-note">{t('ops.usage.note')}</p>
        {!usage ? (
          !failed && <PageSkeleton label={t('ops.loading')} rows={2} />
        ) : usage.length === 0 ? (
          <EmptyState title={t('ops.usage.empty')} />
        ) : (
          <div className="ops-days">
            {byDay(usage).map(([day, d]) => (
              <Card key={day} className="ops-day">
                <header>
                  <strong>{day}</strong>
                  <span>{t('ops.usage.cost', { cost: dollars(d.cents) })}</span>
                </header>
                <dl>
                  {d.kinds.map((k) => (
                    <div key={k.kind}>
                      <dt>{t(`ops.kinds.${k.kind as UsageKind}`)}</dt>
                      <dd>{k.count}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
          </div>
        )}
      </section>
      <section className="ops-section" aria-labelledby="ops-errors">
        <h2 id="ops-errors">{t('ops.errors.title')}</h2>
        {!errors ? (
          !failed && <PageSkeleton label={t('ops.loading')} rows={3} />
        ) : errors.length === 0 ? (
          <EmptyState title={t('ops.errors.empty')} />
        ) : (
          <ul className="ops-errors">
            {errors.map((e) => (
              <li key={e.id}>
                <Card className="ops-error">
                  <header>
                    <Badge tone={e.source === 'server' ? 'danger' : 'warning'}>
                      {t(e.source === 'server' ? 'ops.errors.server' : 'ops.errors.browser')}
                    </Badge>
                    <code dir="ltr">{e.place}</code>
                    <small>{time.format(new Date(e.at))}</small>
                  </header>
                  <p dir="ltr">{e.message}</p>
                  {e.detail.stack && (
                    <details>
                      <summary>{t('ops.errors.details')}</summary>
                      <pre dir="ltr">{e.detail.stack}</pre>
                    </details>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </LibraryShell>
  );
}
