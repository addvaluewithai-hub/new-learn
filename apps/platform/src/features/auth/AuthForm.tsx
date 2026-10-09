import { PlatformIcon } from '../../shared/PlatformIcon';
import { useAuthForm } from './useAuthForm';
const headings = {
  signup: 'رحلتك تبدأ من هنا.',
  login: 'نكمّل من مكاننا؟',
  forgot: 'نرجّع حسابك.',
  reset: 'كلمة مرور جديدة.',
};
const buttons = {
  signup: 'إنشاء حساب',
  login: 'تسجيل الدخول',
  forgot: 'إرسال رابط الاستعادة',
  reset: 'حفظ كلمة المرور',
};
export function AuthForm({ onLogin }: { onLogin: () => Promise<void> }) {
  const form = useAuthForm(onLogin),
    { mode, busy } = form;
  return (
    <form className="auth-form" onSubmit={form.submit} aria-busy={busy}>
      <span className="eyebrow">أهلًا بيك في LEARN</span>
      <h2>{headings[mode]}</h2>
      <p className="muted">
        {mode === 'signup'
          ? 'اعمل حساب وابدأ رحلتك.'
          : mode === 'login'
            ? 'دروسك مستنياك.'
            : 'خليك قريب من بريدك الإلكتروني.'}
      </p>
      <fieldset disabled={busy}>
        {mode === 'signup' && (
          <label>
            اسمك
            <input
              value={form.name}
              onChange={(e) => form.setName(e.target.value)}
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="تحب نناديك إيه؟"
            />
          </label>
        )}
        {mode !== 'reset' && (
          <label>
            البريد الإلكتروني
            <input
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
            كلمة المرور
            <input
              type="password"
              dir="ltr"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              maxLength={128}
              value={form.password}
              onChange={(e) => form.setPassword(e.target.value)}
              placeholder="٨ أحرف على الأقل"
            />
          </label>
        )}
      </fieldset>
      {mode === 'login' && (
        <button
          type="button"
          className="text-button forgot"
          disabled={busy}
          onClick={() => form.changeMode('forgot')}
        >
          نسيت كلمة المرور؟
        </button>
      )}
      {form.error && (
        <p className="error-message" role="alert">
          {form.error}
        </p>
      )}
      {form.message && (
        <p className="success-message" role="status">
          {form.message}
        </p>
      )}
      <button
        className="button primary"
        disabled={busy || (mode === 'signup' && form.name.trim().length < 2)}
      >
        {busy ? 'لحظة واحدة…' : buttons[mode]}
        <PlatformIcon name="arrow" />
      </button>
      {mode === 'signup' || mode === 'login' ? (
        <p className="auth-switch">
          {mode === 'signup' ? 'عندك حساب بالفعل؟' : 'جديد في Learn؟'}{' '}
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => form.changeMode(mode === 'signup' ? 'login' : 'signup')}
          >
            {mode === 'signup' ? 'سجّل دخولك' : 'اعمل حساب'}
          </button>
        </p>
      ) : (
        <button
          type="button"
          className="text-button auth-back"
          disabled={busy}
          onClick={() => form.changeMode('login')}
        >
          العودة لتسجيل الدخول
        </button>
      )}
      <div className="auth-assurance">
        <PlatformIcon name="lock" />
        <span>بيانات الدخول مرتبطة بحسابك.</span>
      </div>
    </form>
  );
}
