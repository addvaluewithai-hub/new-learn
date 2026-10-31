import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import '../../shared/platform.css';
import './consent.css';
import { Alert, Button, Spinner } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';
import { Brand } from '../../shared/Brand';

const FIELDS = ['client_id', 'redirect_uri', 'code_challenge', 'state'] as const;

/**
 * `?oauth=consent&...`: a signed-in teacher allows (or refuses) an AI app such as Claude to
 * work on their courses. The server checks every value again before issuing a code.
 */
export default function Consent({ query, userName }: { query: URLSearchParams; userName: string }) {
  const { t, list, dir } = useI18n();
  const request = Object.fromEntries(FIELDS.map((f) => [f, query.get(f) ?? undefined]));
  const [app, setApp] = useState<{ name: string; redirectHost: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ name: string; redirectHost: string }>('/oauth/consent', request).then(setApp, (e) =>
      setError(e.message),
    );
    // The request comes from the address once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Never approve from inside another site's frame (clickjacking); the header also forbids it.
  const framed = window.top !== window.self;
  const decide = async (allow: boolean) => {
    if (framed) return;
    setBusy(true);
    try {
      const { redirect } = await api<{ redirect: string }>(
        `/oauth/${allow ? 'approve' : 'deny'}`,
        request,
      );
      location.assign(redirect);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <main className="platform-ui consent-page" dir={dir}>
      <section className="consent-card">
        {error ? (
          <Alert tone="error">{error}</Alert>
        ) : !app ? (
          <Spinner label={t('authoring.consent.checking')} />
        ) : (
          <>
            <Brand />
            <h1>
              <Rich k="authoring.consent.title" parts={{ name: <bdi>{app.name}</bdi> }} />
            </h1>
            <p>
              <Rich
                k="authoring.consent.greeting"
                parts={{ name: <bdi>{userName.split(' ')[0]}</bdi> }}
              />
            </p>
            <ul className="consent-list" data-tone="can">
              {list('authoring.consent.can').map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <ul className="consent-list" data-tone="cannot">
              {list('authoring.consent.cannot').map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="consent-host">
              <Rich
                k="authoring.consent.host"
                parts={{ host: <bdi dir="ltr">{app.redirectHost}</bdi> }}
              />
            </p>
            <p className="consent-host">{t('authoring.consent.revoke')}</p>
            <div className="consent-actions">
              <Button disabled={busy} onClick={() => decide(true)}>
                {t('authoring.consent.allow')}
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => decide(false)}>
                {t('authoring.consent.deny')}
              </Button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
