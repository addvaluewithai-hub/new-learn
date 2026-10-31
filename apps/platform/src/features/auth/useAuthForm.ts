import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../../shared/api';
import { t, type TextKey } from '../../i18n';
export type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';
export function useAuthForm(onLogin: () => Promise<void>) {
  const params = new URLSearchParams(location.search);
  const [mode, setMode] = useState<AuthMode>(
    params.has('token') || params.get('auth') === 'reset'
      ? 'reset'
      : params.get('auth') === 'login'
        ? 'login'
        : 'signup',
  );
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState<TextKey | ''>('');
  function changeMode(next: AuthMode) {
    if (busy) return;
    setMode(next);
    setError('');
    setMessage('');
    setPassword('');
    const query = new URLSearchParams(location.search);
    query.delete('token');
    query.delete('error');
    query.set('auth', next);
    history.replaceState(null, '', `/?${query}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'forgot') {
        await api('/auth/request-password-reset', { email: email.trim() });
        setMessage('auth.messages.resetSent');
      } else if (mode === 'reset') {
        const token = params.get('token');
        if (!token) throw new Error(t('auth.messages.resetInvalid'));
        await api('/auth/reset-password', { newPassword: password, token });
        history.replaceState(null, '', '/?auth=login');
        window.dispatchEvent(new PopStateEvent('popstate'));
        setMode('login');
        setPassword('');
        setMessage('auth.messages.passwordChanged');
      } else {
        await api(
          mode === 'signup' ? '/auth/sign-up/email' : '/auth/sign-in/email',
          mode === 'signup'
            ? { name: name.trim(), email: email.trim(), password }
            : { email: email.trim(), password },
        );
        setPassword('');
        await onLogin();
        const query = new URLSearchParams(location.search);
        query.delete('auth');
        query.delete('token');
        history.replaceState(null, '', query.size ? `/?${query}` : '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (error) {
      setError(
        error instanceof ApiError &&
          (error.code === 'INVALID_EMAIL_OR_PASSWORD' || error.status === 401)
          ? t('auth.messages.wrongCredentials')
          : error instanceof ApiError &&
              (error.code?.startsWith('USER_ALREADY_EXISTS') || error.status === 422)
            ? t('auth.messages.emailTaken')
            : error instanceof Error
              ? error.message
              : t('common.network.failed'),
      );
    } finally {
      setBusy(false);
    }
  }
  return {
    mode,
    name,
    email,
    password,
    busy,
    error,
    message,
    setName,
    setEmail,
    setPassword,
    changeMode,
    submit,
  };
}
