import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import '../../shared/platform.css';
import './consent.css';
import { Alert, Button, Spinner } from '../../shared/ui';

const FIELDS = ['client_id', 'redirect_uri', 'code_challenge', 'state'] as const;

/**
 * `?oauth=consent&...`: a signed-in teacher allows (or refuses) an AI app such as Claude to
 * work on their courses. The server checks every value again before issuing a code.
 */
export default function Consent({ query, userName }: { query: URLSearchParams; userName: string }) {
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
    <main className="platform-ui consent-page">
      <section className="consent-card">
        {error ? (
          <Alert tone="error">{error}</Alert>
        ) : !app ? (
          <Spinner label="بنتأكد من الطلب…" />
        ) : (
          <>
            <h1>«{app.name}» عايز يوصل لكورساتك</h1>
            <p>
              أهلًا {userName.split(' ')[0]}. لو سمحت، هيقدر يعمل كورسات ودروس وبوردات تفاعلية
              كمسودات في حسابك، ويقرا ملاحظاتك على الدروس ويصلّحها. مش هيقدر ينشر حاجة للطلبة ولا
              يشوف حسابك أو بيانات طلبتك.
            </p>
            <p className="consent-host">هيرجّعك على: {app.redirectHost}</p>
            <div className="consent-actions">
              <Button disabled={busy} onClick={() => decide(true)}>
                اسمح
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => decide(false)}>
                لأ
              </Button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
