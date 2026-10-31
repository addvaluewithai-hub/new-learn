import { useI18n } from '../i18n';

export function Brand() {
  const { t } = useI18n();
  return (
    <a className="brand" href="/" aria-label={t('common.brandHome')}>
      <span className="brand-mark">
        L<span />
      </span>
      <strong>
        learn<span>{t('common.brandTagline')}</span>
      </strong>
    </a>
  );
}
