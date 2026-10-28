import { useState, type ReactNode } from 'react';
import { Brand } from '../../shared/Brand';
import { PlatformIcon } from '../../shared/PlatformIcon';
import type { User } from '../auth/session';
import { Alert, IconButton } from '../../shared/ui';
export function LibraryShell({
  user,
  onSignOut,
  children,
  page = 'library',
}: {
  user: User;
  onSignOut: () => Promise<void>;
  children: ReactNode;
  page?: 'library' | 'studio' | 'settings';
}) {
  const [menu, setMenu] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    setError('');
    try {
      await onSignOut();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'تعذر تسجيل الخروج.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="platform-ui library-shell">
      <aside className={`sidebar ${menu ? 'open' : ''}`} aria-label="تنقل المنصة">
        <IconButton className="mobile-close" label="اقفل القائمة" onClick={() => setMenu(false)}>
          <PlatformIcon name="close" />
        </IconButton>
        <Brand />
        <span className="nav-label">مساحة تعلّمك</span>
        <nav>
          <a href="/" aria-current={page === 'library' ? 'page' : undefined}>
            <PlatformIcon name="books" />
            مناهجي
          </a>
          <a href="/?studio" aria-current={page === 'studio' ? 'page' : undefined}>
            <PlatformIcon name="spark" />
            اعمل كورس
          </a>
          <a href="/?settings" aria-current={page === 'settings' ? 'page' : undefined}>
            <PlatformIcon name="settings" />
            الإعدادات
          </a>
        </nav>
        <div className="sidebar-account">
          <div className="avatar">{user.name.slice(0, 1)}</div>
          <div>
            <strong>{user.name}</strong>
            <span>حسابك في Learn</span>
          </div>
          <IconButton label="تسجيل الخروج" disabled={busy} onClick={signOut}>
            <PlatformIcon name="logout" />
          </IconButton>
        </div>
      </aside>
      {menu && (
        <button className="menu-overlay" onClick={() => setMenu(false)} aria-label="اقفل القائمة" />
      )}
      <div className="library-main">
        <header className="topbar">
          <IconButton
            className="mobile-menu"
            label="افتح القائمة"
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
