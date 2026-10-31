import { useState, type ReactNode } from 'react';
import { Brand } from '../../shared/Brand';
import { PlatformIcon } from '../../shared/PlatformIcon';
import type { User } from '../auth/session';
import { Alert, IconButton } from '../../shared/ui';
import { useI18n } from '../../i18n';
export function LibraryShell({
  user,
  onSignOut,
  children,
  page = 'library',
}: {
  user: User;
  onSignOut: () => Promise<void>;
  children: ReactNode;
  page?: 'library' | 'studio' | 'teach' | 'credits' | 'review' | 'settings';
}) {
  const [menu, setMenu] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const { t } = useI18n();
  async function signOut() {
    setBusy(true);
    setError('');
    try {
      await onSignOut();
    } catch (error) {
      setError(error instanceof Error ? error.message : t('catalog.shell.signOutFailed'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="platform-ui library-shell">
      <aside className={`sidebar ${menu ? 'open' : ''}`} aria-label={t('catalog.shell.navLabel')}>
        <IconButton
          className="mobile-close"
          label={t('catalog.shell.closeMenu')}
          onClick={() => setMenu(false)}
        >
          <PlatformIcon name="close" />
        </IconButton>
        <Brand />
        <span className="nav-label">{t('catalog.shell.navTitle')}</span>
        <nav>
          <a href="/" aria-current={page === 'library' ? 'page' : undefined}>
            <PlatformIcon name="books" />
            {t('catalog.shell.nav.library')}
          </a>
          <a href="/?studio" aria-current={page === 'studio' ? 'page' : undefined}>
            <PlatformIcon name="spark" />
            {t('catalog.shell.nav.studio')}
          </a>
          <a href="/?teach" aria-current={page === 'teach' ? 'page' : undefined}>
            <PlatformIcon name="teach" />
            {t('catalog.shell.nav.teach')}
          </a>
          <a href="/?credits" aria-current={page === 'credits' ? 'page' : undefined}>
            <PlatformIcon name="credits" />
            {t('catalog.shell.nav.credits')}
          </a>
          {user.staff && (
            <a href="/?review" aria-current={page === 'review' ? 'page' : undefined}>
              <PlatformIcon name="review" />
              {t('catalog.shell.nav.review')}
            </a>
          )}
          <a href="/?settings" aria-current={page === 'settings' ? 'page' : undefined}>
            <PlatformIcon name="settings" />
            {t('catalog.shell.nav.settings')}
          </a>
        </nav>
        <div className="sidebar-account">
          <div className="avatar">{user.name.slice(0, 1)}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{t('catalog.shell.account')}</span>
          </div>
          <IconButton label={t('catalog.shell.signOut')} disabled={busy} onClick={signOut}>
            <PlatformIcon name="logout" />
          </IconButton>
        </div>
      </aside>
      {menu && (
        <button
          className="menu-overlay"
          onClick={() => setMenu(false)}
          aria-label={t('catalog.shell.closeMenu')}
        />
      )}
      <div className="library-main">
        <header className="topbar">
          <IconButton
            className="mobile-menu"
            label={t('catalog.shell.openMenu')}
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            <PlatformIcon name="menu" />
          </IconButton>
          <Brand />
        </header>
        <main className="library-content library-sheet" id="main-content">
          {error && <Alert tone="error">{error}</Alert>}
          {children}
        </main>
      </div>
    </div>
  );
}
