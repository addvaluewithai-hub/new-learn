import { ButtonLink } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { Faq } from './Faq';
import { useHead } from './head';
import { CONNECTOR_URL, SITE_LINKS } from './routes';
import { Shot, SiteFrame } from './SiteShell';

const SHOTS = [
  '/site/studio.webp',
  '/site/progress.webp',
  '/site/draft.webp',
  '/site/publish.webp',
];

export default function TeachersPage() {
  const { t, list } = useI18n();
  useHead({
    title: t('site.teachers.metaTitle'),
    description: t('site.teachers.metaDescription'),
    path: '/teachers',
  });
  return (
    <SiteFrame wide>
      <div className="site-title">
        <span className="eyebrow">{t('site.teachers.eyebrow')}</span>
        <h1>{t('site.teachers.title')}</h1>
        <p>{t('site.teachers.lead')}</p>
        <div className="site-ctas">
          <ButtonLink variant="accent" size="lg" href={SITE_LINKS.signup}>
            {t('site.teachers.start')}
          </ButtonLink>
          <ButtonLink variant="secondary" size="lg" href={SITE_LINKS.demos}>
            {t('site.teachers.demos')}
          </ButtonLink>
        </div>
      </div>
      <section aria-labelledby="t-studio">
        <div className="site-head">
          <h2 id="t-studio">{t('site.teachers.studioTitle')}</h2>
          <p>{t('site.teachers.studioLead')}</p>
        </div>
        <ol className="site-steps">
          {list('site.teachers.studio').map((step, i) => (
            <li key={step.title}>
              <Shot src={SHOTS[i]} alt="" />
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section id="connect" aria-labelledby="t-connect">
        <div className="site-head">
          <h2 id="t-connect">{t('site.teachers.connectTitle')}</h2>
          <p>{t('site.teachers.connectLead')}</p>
        </div>
        <ol className="site-steps">
          {list('site.teachers.connect').map((step, i) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <p>
                {step.text} {i === 0 && <code>{CONNECTOR_URL}</code>}
              </p>
            </li>
          ))}
        </ol>
        <p className="site-note">{t('site.teachers.chatgpt')}</p>
      </section>
      <section aria-labelledby="t-faq">
        <div className="site-head">
          <h2 id="t-faq">{t('site.teachers.faqTitle')}</h2>
        </div>
        <Faq items={list('site.faq.teachers')} open={0} />
      </section>
    </SiteFrame>
  );
}
