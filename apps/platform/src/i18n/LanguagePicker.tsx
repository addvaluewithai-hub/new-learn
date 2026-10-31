import { useId } from 'react';
import { LOCALES, languageName, useI18n } from './index';
import './language-picker.css';

/**
 * Every language there is a file for, each in its own name. A native select: it works by
 * keyboard and screen reader, and phones show their own picker.
 */
export function LanguagePicker({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { locale, setLocale, t } = useI18n();
  const id = useId();
  return (
    <span className={`language-picker language-picker--${tone}`}>
      <label htmlFor={id} className="language-picker-label">
        {t('common.language')}
      </label>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3a15.6 15.6 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8ZM12 4a13.7 13.7 0 0 1 1.9 4h-3.8A13.7 13.7 0 0 1 12 4ZM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4H4.3Zm.8 2h3a15.6 15.6 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16Zm3-8h-3a8 8 0 0 1 4.4-3.6A15.6 15.6 0 0 0 8.1 8ZM12 20a13.7 13.7 0 0 1-1.9-4h3.8A13.7 13.7 0 0 1 12 20Zm2.3-6H9.7a14.6 14.6 0 0 1 0-4h4.6a14.6 14.6 0 0 1 0 4Zm.2 5.6a15.6 15.6 0 0 0 1.4-3.6h3a8 8 0 0 1-4.4 3.6Zm1.8-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4h-3.4Z"
        />
      </svg>
      <select id={id} value={locale} onChange={(e) => void setLocale(e.target.value)}>
        {LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {languageName(code)}
          </option>
        ))}
      </select>
    </span>
  );
}
