import { useState, type FormEvent } from 'react';
import { api } from '../../shared/api';
import { Alert, Button, Card, Field, TextInput } from '../../shared/ui';
import type { User } from '../auth/session';

/** Name and password, saved to the account itself (the auth service), so every device has them. */
export function AccountSettings({ user, onSaved }: { user: User; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(user.name);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState<'' | 'name' | 'password'>('');
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  async function run(kind: 'name' | 'password', send: () => Promise<unknown>, done: string) {
    setBusy(kind);
    setResult(null);
    try {
      await send();
      setResult({ tone: 'success', text: done });
    } catch (error) {
      setResult({ tone: 'error', text: error instanceof Error ? error.message : 'معرفناش نحفظ.' });
    } finally {
      setBusy('');
    }
  }
  const saveName = (event: FormEvent) => {
    event.preventDefault();
    run(
      'name',
      async () => {
        await api('/auth/update-user', { name: name.trim() });
        await onSaved();
      },
      'اسمك اتغيّر.',
    );
  };
  const savePassword = (event: FormEvent) => {
    event.preventDefault();
    run(
      'password',
      async () => {
        await api('/auth/change-password', { currentPassword: current, newPassword: next });
        setCurrent('');
        setNext('');
      },
      'كلمة السر اتغيّرت، وخرّجنا حسابك من أي جهاز تاني.',
    );
  };
  return (
    <Card className="settings-card">
      <h2>الحساب</h2>
      <p className="settings-note">بيتحفظ في حسابك، فيظهر على أي جهاز تدخل منه.</p>
      <form className="settings-form" onSubmit={saveName}>
        <Field id="settings-name" label="اسمك" hint="Nova بتناديك بيه.">
          <TextInput
            id="settings-name"
            value={name}
            minLength={2}
            maxLength={80}
            required
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field id="settings-email" label="الإيميل">
          <TextInput id="settings-email" value={user.email} dir="ltr" readOnly />
        </Field>
        <Button
          type="submit"
          variant="secondary"
          disabled={busy !== '' || name.trim() === user.name || name.trim().length < 2}
        >
          {busy === 'name' ? 'بنحفظ…' : 'احفظ الاسم'}
        </Button>
      </form>
      <form className="settings-form" onSubmit={savePassword}>
        <h3>غيّر كلمة السر</h3>
        <Field id="settings-current" label="كلمة السر الحالية">
          <TextInput
            id="settings-current"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field id="settings-new" label="كلمة السر الجديدة" hint="٨ أحرف على الأقل.">
          <TextInput
            id="settings-new"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <Button
          type="submit"
          variant="secondary"
          disabled={busy !== '' || !current || next.length < 8}
        >
          {busy === 'password' ? 'بنغيّر…' : 'غيّر كلمة السر'}
        </Button>
      </form>
      {result && <Alert tone={result.tone}>{result.text}</Alert>}
    </Card>
  );
}
