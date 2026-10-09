import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../../shared/api';
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
    [message, setMessage] = useState('');
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
        setMessage('لو البريد مسجّل، هيوصلك رابط لاستعادة كلمة المرور.');
      } else if (mode === 'reset') {
        const token = params.get('token');
        if (!token) throw new Error('رابط الاستعادة غير صالح. اطلب رابط جديد.');
        await api('/auth/reset-password', { newPassword: password, token });
        history.replaceState(null, '', '/?auth=login');
        window.dispatchEvent(new PopStateEvent('popstate'));
        setMode('login');
        setPassword('');
        setMessage('اتغيّرت كلمة المرور. سجّل دخولك.');
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
          ? 'البريد أو كلمة المرور غير صحيحة.'
          : error instanceof ApiError &&
              (error.code?.startsWith('USER_ALREADY_EXISTS') || error.status === 422)
            ? 'البريد مسجّل بالفعل. جرّب تسجيل الدخول.'
            : error instanceof Error
              ? error.message
              : 'تعذر تنفيذ الطلب.',
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
