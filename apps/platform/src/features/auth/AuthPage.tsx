import { Brand } from '../../shared/Brand';
import { AuthStory } from './AuthStory';
import { AuthForm } from './AuthForm';
import '../../shared/platform.css';
import './auth-layout.css';
import './auth-form.css';
import { Alert } from '../../shared/ui';
export default function AuthPage({
  onLogin,
  error,
}: {
  onLogin: () => Promise<void>;
  error?: string;
}) {
  return (
    <main className="platform-ui auth-layout">
      <AuthStory />
      <section className="auth-form-wrap">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <AuthForm onLogin={onLogin} />
      </section>
    </main>
  );
}
