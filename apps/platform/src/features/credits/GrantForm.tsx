import { useState, type FormEvent } from 'react';
import { api } from '../../shared/api';
import { Alert, Button, Card, Field, TextInput } from '../../shared/ui';
import { useI18n } from '../../i18n';

/** Staff only: give credits to an account by its e-mail (beta testers, refunds by hand). */
export function GrantForm({ onGranted }: { onGranted: () => Promise<void> | void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('50');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const done = await api<{ email: string; balance: number }>('/credits/grant', {
        email,
        amount: Number(amount),
        note,
      });
      setMessage({ tone: 'success', text: t('credits.granted', done) });
      await onGranted();
    } catch (e) {
      setMessage({ tone: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="credits-grant">
      <h2>{t('credits.grantTitle')}</h2>
      <p className="credits-note">{t('credits.grantLead')}</p>
      <form onSubmit={submit}>
        <Field id="grant-email" label={t('credits.grantEmail')}>
          <TextInput
            id="grant-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field id="grant-amount" label={t('credits.grantAmount')}>
          <TextInput
            id="grant-amount"
            type="number"
            min={1}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field id="grant-note" label={t('credits.grantNote')}>
          <TextInput
            id="grant-note"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={busy}>
          {t('credits.grantButton')}
        </Button>
      </form>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
    </Card>
  );
}
