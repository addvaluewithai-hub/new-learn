import { useState, type ReactNode } from 'react';
import { Brand } from '../../shared/Brand';
import { PlatformIcon } from '../../shared/PlatformIcon';
import type { User } from '../auth/session';
export function LibraryShell({
  user,
  onSignOut,
  children,
}: {
  user: User;
  onSignOut: () => Promise<void>;
  children: ReactNode;
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
        <button
          className="mobile-close icon-button"
          onClick={() => setMenu(false)}
          aria-label="اقفل القائمة"
        >
          <PlatformIcon name="close" />
        </button>
        <Brand />
        <span className="nav-label">مساحة تعلّمك</span>
        <nav>
          <a href="/" aria-current="page">
            <PlatformIcon name="books" />
            مناهجي
          </a>
        </nav>
        <div className="sidebar-note">
          <PlatformIcon name="spark" />
          <strong>خد وقتك في الفهم.</strong>
          <p>كل فكرة بتفتح لك طريق جديد.</p>
        </div>
        <div className="sidebar-account">
          <div className="avatar">{user.name.slice(0, 1)}</div>
          <div>
            <strong>{user.name}</strong>
            <span>حسابك في Learn</span>
          </div>
          <button
            className="icon-button"
            aria-label="تسجيل الخروج"
            disabled={busy}
            onClick={signOut}
          >
            <PlatformIcon name="logout" />
          </button>
        </div>
      </aside>
      {menu && (
        <button className="menu-overlay" onClick={() => setMenu(false)} aria-label="اقفل القائمة" />
      )}
      <div className="library-main">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setMenu(true)}
            aria-label="افتح القائمة"
            aria-expanded={menu}
          >
            <PlatformIcon name="menu" />
          </button>
          <span>مساحة تعلّمك، على مهلك.</span>
          <span>{user.name.split(' ')[0]}</span>
        </header>
        <main className="library-content" id="main-content">
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
