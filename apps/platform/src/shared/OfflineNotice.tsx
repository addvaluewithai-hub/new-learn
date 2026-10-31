import { useSyncExternalStore } from 'react';
import { useI18n } from '../i18n';

const subscribe = (listener: () => void) => {
  addEventListener('online', listener);
  addEventListener('offline', listener);
  return () => {
    removeEventListener('online', listener);
    removeEventListener('offline', listener);
  };
};

/** A thin line at the top while the device is offline; it goes away by itself. */
export function OfflineNotice() {
  const { t } = useI18n();
  const online = useSyncExternalStore(subscribe, () => navigator.onLine);
  if (online) return null;
  return (
    <p className="offline-notice" role="status">
      {t('common.offline')}
    </p>
  );
}
