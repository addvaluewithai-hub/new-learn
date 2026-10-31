import { useEffect, useState } from 'react';
import { api } from '../../shared/api';

/** The signed-in account's credit balance, read again when `key` changes (null while loading). */
export function useBalance(key?: unknown) {
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    api<{ balance: number }>('/credits').then(
      (r) => live && setBalance(r.balance),
      () => live && setBalance(null),
    );
    return () => {
      live = false;
    };
  }, [key]);
  return balance;
}
