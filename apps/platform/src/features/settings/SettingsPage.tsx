import type { User } from '../auth/session';
import { LibraryShell } from '../catalog/LibraryShell';
import { AccountSettings } from './AccountSettings';
import { LearningSettings } from './LearningSettings';
import '../../shared/platform.css';
import '../catalog/library-shell.css';
import '../catalog/library-account.css';
import './settings.css';
import { useI18n } from '../../i18n';

/** `?settings`: the account (saved to it) and how lessons and Nova behave (on this device). */
export default function SettingsPage({
  user,
  onSignOut,
  onSaved,
}: {
  user: User;
  onSignOut: () => Promise<void>;
  onSaved: () => Promise<void>;
}) {
  const { t } = useI18n();
  return (
    <LibraryShell user={user} onSignOut={onSignOut} page="settings">
      <div className="page-heading">
        <h1>{t('settings.title')}</h1>
      </div>
      <div className="settings">
        <AccountSettings user={user} onSaved={onSaved} />
        <LearningSettings />
      </div>
    </LibraryShell>
  );
}
