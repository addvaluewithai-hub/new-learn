import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';
import { useHead } from './head';
import { SITE_LINKS, SUPPORT_EMAIL } from './routes';
import { SiteFrame } from './SiteShell';

// The privacy policy and the terms (owner tasks L1 and L2, docs/tasks/launch.md): drafts that
// say what the product does today, in `site.legal` of every language file. Facts must match
// docs/account-delivery.md, nova.md, connector.md and builder-server.md.

function Page({ which }: { which: 'privacy' | 'terms' }) {
  const { t, list } = useI18n();
  const base = `site.legal.${which}` as const;
  useHead({
    title: t(`${base}.metaTitle`),
    description: t(`${base}.description`),
    path: `/${which}`,
  });
  return (
    <SiteFrame>
      <div className="site-title">
        <h1>{t(`${base}.title`)}</h1>
        <p>{t(`${base}.intro`)}</p>
        <span className="site-updated">
          {t('site.legal.updatedLabel', { date: t(`${base}.updated`) })}
        </span>
      </div>
      <article className="site-prose">
        {list(`${base}.sections`).map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
            {section.bullets.length > 0 && (
              <ul>
                {section.bullets.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <p className="site-note">
          <Rich
            k="site.legal.question"
            parts={{
              email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>,
              support: <a href={SITE_LINKS.support}>{t('site.legal.supportLink')}</a>,
            }}
          />
        </p>
      </article>
    </SiteFrame>
  );
}

export function PrivacyPage() {
  return <Page which="privacy" />;
}

export function TermsPage() {
  return <Page which="terms" />;
}
