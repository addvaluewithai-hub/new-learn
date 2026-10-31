import { ButtonLink } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';
import { Faq } from './Faq';
import { useHead } from './head';
import { SITE_LINKS, SUPPORT_EMAIL } from './routes';
import { SiteFrame } from './SiteShell';

export default function SupportPage() {
  const { t, list } = useI18n();
  useHead({
    title: t('site.support.metaTitle'),
    description: t('site.support.metaDescription'),
    path: '/support',
  });
  const mail = `mailto:${SUPPORT_EMAIL}`;
  return (
    <SiteFrame>
      <div className="site-title">
        <h1>{t('site.support.title')}</h1>
        <p>
          <Rich k="site.support.lead" parts={{ email: <a href={mail}>{SUPPORT_EMAIL}</a> }} />
        </p>
        <div className="site-ctas">
          <ButtonLink href={`${mail}?subject=${encodeURIComponent(t('site.support.mailSubject'))}`}>
            {t('site.support.email')}
          </ButtonLink>
          <ButtonLink variant="secondary" href={SITE_LINKS.teachers}>
            {t('site.support.teachers')}
          </ButtonLink>
        </div>
      </div>
      <section className="site-prose" aria-labelledby="faq-all">
        <div className="site-head">
          <h2 id="faq-all">{t('site.support.faqTitle')}</h2>
        </div>
        <Faq items={[...list('site.faq.general'), ...list('site.faq.teachers')]} open={0} />
      </section>
      <section className="site-prose" aria-labelledby="support-more">
        <div className="site-head">
          <h2 id="support-more">{t('site.support.moreTitle')}</h2>
        </div>
        <ul>
          <li>
            <Rich
              k="site.support.privacy"
              parts={{ link: <a href={SITE_LINKS.privacy}>{t('site.foot.privacy')}</a> }}
            />
          </li>
          <li>
            <Rich
              k="site.support.terms"
              parts={{ link: <a href={SITE_LINKS.terms}>{t('site.foot.terms')}</a> }}
            />
          </li>
          <li>{t('site.support.takedown')}</li>
        </ul>
      </section>
    </SiteFrame>
  );
}
