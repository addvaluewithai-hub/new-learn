import { useCallback, useState } from 'react';
import { ButtonLink } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { LOOKS } from '../studio/looks';
import { useHead } from '../site/head';
import { SITE_LINKS } from '../site/routes';
import { SiteFooter, SiteNav } from '../site/SiteShell';
import { HeroStage } from './HeroStage';
import { initialLook, type HeroLook } from './hero';
import {
  ConnectSection,
  FaqSection,
  HowSection,
  NovaSection,
  TeacherSection,
  WhoSection,
} from './sections';
import '../../shared/platform.css';
import './landing.css';

/** The front door for visitors: a lesson drawing itself, in the looks it comes in, and one way in. */
export default function Landing() {
  const { t, dir } = useI18n();
  const [look, setLook] = useState<HeroLook>(() => initialLook(location.hash));
  const [pinned, setPinned] = useState(false);
  const onChange = useCallback((next: HeroLook, pin: boolean) => {
    setLook(next);
    setPinned(pin);
  }, []);
  useHead({ title: t('landing.metaTitle'), description: t('landing.metaDescription'), path: '/' });
  const tint = { '--look-bg': look.colors[0], '--look-ink': look.colors[1] } as React.CSSProperties;
  return (
    <div className="platform-ui site landing" dir={dir} style={tint}>
      <SiteNav tone="dark" />
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="eyebrow">{t('landing.hero.eyebrow')}</span>
          <h1>{t('landing.hero.title')}</h1>
          <p>{t('landing.hero.lead')}</p>
          <div className="landing-ctas">
            <ButtonLink variant="accent" size="lg" href={SITE_LINKS.signup}>
              {t('landing.hero.start')}
            </ButtonLink>
            <ButtonLink variant="ghost" size="lg" href={`/?preview=demo&id=${look.demo}`}>
              {t('landing.hero.openDemo')}
            </ButtonLink>
          </div>
        </div>
        <HeroStage look={look} pinned={pinned} onChange={onChange} />
      </section>
      <main>
        <section id="looks" className="landing-section" aria-labelledby="landing-looks">
          <div className="site-head">
            <h2 id="landing-looks">{t('landing.looks.title')}</h2>
            <p>{t('landing.looks.lead')}</p>
          </div>
          <ul className="landing-looks">
            {LOOKS.map((item) => (
              <li key={item.id}>
                <a href={`/?preview=demo&id=${item.demo}`}>
                  <img src={`/styles/${item.id}.webp`} alt="" loading="lazy" />
                  <strong>{t(item.name)}</strong>
                  <span>{t(item.line)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <HowSection />
        <NovaSection />
        <TeacherSection />
        <ConnectSection />
        <WhoSection />
        <FaqSection />
        <section className="landing-final">
          <h2>{t('landing.final.title')}</h2>
          <p>{t('landing.final.lead')}</p>
          <ButtonLink variant="accent" size="lg" href={SITE_LINKS.signup}>
            {t('landing.final.cta')}
          </ButtonLink>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
