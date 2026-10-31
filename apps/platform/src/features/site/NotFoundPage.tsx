import { ButtonLink } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { useHead } from './head';
import { SITE_LINKS } from './routes';
import { SiteFrame } from './SiteShell';

/** An address that is neither the app nor one of the site's pages. */
export default function NotFoundPage() {
  const { t } = useI18n();
  useHead({
    title: t('site.notFound.metaTitle'),
    description: t('site.notFound.lead'),
    path: location.pathname,
  });
  return (
    <SiteFrame>
      <div className="site-title">
        <span className="eyebrow">404</span>
        <h1>{t('site.notFound.title')}</h1>
        <p>{t('site.notFound.lead')}</p>
        <div className="site-ctas">
          <ButtonLink href="/">{t('site.notFound.home')}</ButtonLink>
          <ButtonLink variant="secondary" href={SITE_LINKS.support}>
            {t('site.notFound.support')}
          </ButtonLink>
        </div>
      </div>
    </SiteFrame>
  );
}
