import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../../shared/api';
export type User = { id: string; name: string; email: string };
export function useSession() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const refresh = useCallback(async () => {
    const result = await api<{ user: User }>('/me');
    setUser(result.user);
    setError('');
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api<{ user: User }>('/me', undefined, controller.signal)
      .then((result) => {
        setUser(result.user);
        setError('');
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (!(error instanceof ApiError && error.status === 401)) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  const signOut = async () => {
    await api('/auth/sign-out', {});
    setUser(null);
    setError('');
    history.replaceState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  return { user, loading, error, refresh, signOut };
}
