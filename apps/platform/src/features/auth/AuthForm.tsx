import { PlatformIcon } from '../../shared/PlatformIcon';
import { useAuthForm } from './useAuthForm';
import { Alert, Button } from '../../shared/ui';
import { useI18n } from '../../i18n';
export function AuthForm({ onLogin }: { onLogin: () => Promise<void> }) {
  const form = useAuthForm(onLogin),
    { mode, busy } = form;
  const { t } = useI18n();
  return (
    <form className="auth-form" onSubmit={form.submit} aria-busy={busy}>
      <span className="eyebrow">{t('auth.form.eyebrow')}</span>
      <h2>{t(`auth.form.heading.${mode}`)}</h2>
      <p className="muted">
        {mode === 'signup'
          ? t('auth.form.lead.signup')
          : mode === 'login'
            ? t('auth.form.lead.login')
            : t('auth.form.lead.recover')}
      </p>
      <fieldset disabled={busy}>
        {mode === 'signup' && (
          <label>
            {t('auth.form.name')}
            <input
              className="nl-input"
              value={form.name}
              onChange={(e) => form.setName(e.target.value)}
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              placeholder={t('auth.form.namePlaceholder')}
            />
          </label>
        )}
        {mode !== 'reset' && (
          <label>
            {t('auth.form.email')}
            <input
              className="nl-input"
              type="email"
              dir="ltr"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => form.setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
        )}
        {mode !== 'forgot' && (
          <label>
            {t('auth.form.password')}
            <input
              className="nl-input"
              type="password"
              dir="ltr"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              maxLength={128}
              value={form.password}
              onChange={(e) => form.setPassword(e.target.value)}
              placeholder={t('auth.form.passwordPlaceholder')}
            />
          </label>
        )}
      </fieldset>
      {mode === 'login' && (
        <Button
          variant="link"
          className="forgot"
          disabled={busy}
          onClick={() => form.changeMode('forgot')}
        >
          {t('auth.form.forgotLink')}
        </Button>
      )}
      {form.error && <Alert tone="error">{form.error}</Alert>}
      {form.message && <Alert tone="success">{t(form.message)}</Alert>}
      <Button
        type="submit"
        size="lg"
        block
        className="auth-submit"
        disabled={busy || (mode === 'signup' && form.name.trim().length < 2)}
      >
        {busy ? t('auth.form.busy') : t(`auth.form.submit.${mode}`)}
        <PlatformIcon name="arrow" />
      </Button>
      {mode === 'signup' || mode === 'login' ? (
        <p className="auth-switch">
          {mode === 'signup' ? t('auth.form.haveAccount') : t('auth.form.newHere')}{' '}
          <Button
            variant="link"
            disabled={busy}
            onClick={() => form.changeMode(mode === 'signup' ? 'login' : 'signup')}
          >
            {mode === 'signup' ? t('auth.form.toLogin') : t('auth.form.toSignup')}
          </Button>
        </p>
      ) : (
        <Button
          variant="link"
          className="auth-back"
          disabled={busy}
          onClick={() => form.changeMode('login')}
        >
          {t('auth.form.backToLogin')}
        </Button>
      )}
      <div className="auth-assurance">
        <PlatformIcon name="lock" />
        <span>{t('auth.form.assurance')}</span>
      </div>
    </form>
  );
}
