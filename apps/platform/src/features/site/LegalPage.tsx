import { useHead } from './head';
import { PRIVACY, TERMS, type Legal } from './legal';
import { SITE_LINKS, SUPPORT_EMAIL } from './routes';
import { SiteFrame } from './SiteShell';

function Page({ legal, path }: { legal: Legal; path: string }) {
  useHead({ title: `${legal.title} · New Learn`, description: legal.description, path });
  return (
    <SiteFrame>
      <div className="site-title">
        <h1>{legal.title}</h1>
        <p>{legal.intro}</p>
        <span className="site-updated">آخر تعديل: {legal.updated}</span>
      </div>
      <article className="site-prose">
        {legal.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((text) => (
              <p key={text}>{text}</p>
            ))}
            {section.bullets && (
              <ul>
                {section.bullets.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <p className="site-note">
          عندك سؤال عن أي بند؟ راسلنا على <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> أو
          من <a href={SITE_LINKS.support}>صفحة الدعم</a>.
        </p>
      </article>
    </SiteFrame>
  );
}

export function PrivacyPage() {
  return <Page legal={PRIVACY} path="/privacy" />;
}

export function TermsPage() {
  return <Page legal={TERMS} path="/terms" />;
}
