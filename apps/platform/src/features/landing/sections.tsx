import { ButtonLink } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { Rich } from '../../i18n/Rich';
import { Faq } from '../site/Faq';
import { CONNECTOR_URL, SITE_LINKS } from '../site/routes';
import { Shot } from '../site/SiteShell';
import './sections.css';

// The landing's sections below the hero: how it works, Nova, teachers, the connector, who
// it is for, and the questions. Each is a few lines of copy next to the real product.

const HOW_SHOTS = ['/site/studio.webp', '/site/progress.webp', '/site/reading.webp'];

export function HowSection() {
  const { t, list } = useI18n();
  return (
    <section className="landing-section" aria-labelledby="landing-how">
      <div className="site-head">
        <h2 id="landing-how">{t('landing.how.title')}</h2>
        <p>{t('landing.how.lead')}</p>
      </div>
      <ol className="site-steps landing-how">
        {list('landing.how.steps').map((step, i) => (
          <li key={step.title}>
            <Shot src={HOW_SHOTS[i]} alt="" />
            <strong>{step.title}</strong>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Points({ items }: { items: ReadonlyArray<{ title: string; text: string }> }) {
  return (
    <ul className="landing-points">
      {items.map((item) => (
        <li key={item.title}>
          <strong>{item.title}</strong>
          <p>{item.text}</p>
        </li>
      ))}
    </ul>
  );
}

export function NovaSection() {
  const { t, list } = useI18n();
  return (
    <section className="landing-section landing-split" aria-labelledby="landing-nova">
      <div className="landing-split-copy">
        <div className="site-head">
          <span className="eyebrow">{t('landing.nova.eyebrow')}</span>
          <h2 id="landing-nova">{t('landing.nova.title')}</h2>
          <p>{t('landing.nova.lead')}</p>
        </div>
        <Points items={list('landing.nova.points')} />
      </div>
      <Shot src="/site/reading.webp" alt={t('landing.nova.shotAlt')} tall />
    </section>
  );
}

export function TeacherSection() {
  const { t, list } = useI18n();
  return (
    <section
      className="landing-section landing-split landing-split--flip"
      aria-labelledby="landing-teacher"
    >
      <div className="landing-split-copy">
        <div className="site-head">
          <span className="eyebrow">{t('landing.teacher.eyebrow')}</span>
          <h2 id="landing-teacher">{t('landing.teacher.title')}</h2>
        </div>
        <Points items={list('landing.teacher.points')} />
        <ButtonLink variant="secondary" href={SITE_LINKS.teachers}>
          {t('landing.teacher.cta')}
        </ButtonLink>
      </div>
      <Shot src="/site/publish.webp" alt={t('landing.teacher.shotAlt')} tall />
    </section>
  );
}

export function ConnectSection() {
  const { t } = useI18n();
  return (
    <section className="landing-connect" aria-labelledby="landing-connect">
      <div className="site-head">
        <span className="eyebrow">{t('landing.connect.eyebrow')}</span>
        <h2 id="landing-connect">{t('landing.connect.title')}</h2>
        <p>{t('landing.connect.lead')}</p>
      </div>
      <div className="landing-connect-url">
        <code>{CONNECTOR_URL}</code>
        <ButtonLink variant="accent" href={SITE_LINKS.connect}>
          {t('landing.connect.cta')}
        </ButtonLink>
      </div>
    </section>
  );
}

const WHO_LINKS = [SITE_LINKS.signup, SITE_LINKS.teachers, '/?preview=demo&id=fractions'];

export function WhoSection() {
  const { t, list } = useI18n();
  return (
    <section className="landing-section" aria-labelledby="landing-who">
      <div className="site-head">
        <h2 id="landing-who">{t('landing.who.title')}</h2>
      </div>
      <ul className="landing-who">
        {list('landing.who.items').map((item, i) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
            <a href={WHO_LINKS[i]}>
              {item.cta} <span aria-hidden="true">{t('common.forward')}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FaqSection() {
  const { t, list } = useI18n();
  return (
    <section className="landing-section landing-faq" aria-labelledby="landing-faq">
      <div className="site-head">
        <h2 id="landing-faq">{t('landing.faq.title')}</h2>
        <p>
          <Rich
            k="landing.faq.more"
            parts={{ link: <a href={SITE_LINKS.support}>{t('landing.faq.moreLink')}</a> }}
          />
        </p>
      </div>
      <Faq items={list('site.faq.general').slice(0, 5)} />
    </section>
  );
}
