import { Brand } from '../../shared/Brand';
import { AuthStory } from './AuthStory';
import { AuthForm } from './AuthForm';
import '../../shared/platform.css';
import './auth-layout.css';
import './auth-form.css';
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
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <AuthForm onLogin={onLogin} />
      </section>
    </main>
  );
}
