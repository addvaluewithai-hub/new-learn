import { useCallback, useState } from 'react';
import { ButtonLink } from '../../shared/ui';
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
  const [look, setLook] = useState<HeroLook>(() => initialLook(location.hash));
  const [pinned, setPinned] = useState(false);
  const onChange = useCallback((next: HeroLook, pin: boolean) => {
    setLook(next);
    setPinned(pin);
  }, []);
  useHead({
    title: 'New Learn: أي فكرة، تبقى درس بيترسم قدامك',
    description:
      'اكتب الموضوع واختار شكله. بورد بيترسم بالكود، وسؤال بعد كل فكرة، وNova بتشرح بالصوت. للمذاكرة، ولطلابك، ولولادك.',
    path: '/',
  });
  const tint = { '--look-bg': look.colors[0], '--look-ink': look.colors[1] } as React.CSSProperties;
  return (
    <div className="platform-ui site landing" dir="rtl" style={tint}>
      <SiteNav tone="dark" />
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="eyebrow">درس من أي فكرة، في دقايق</span>
          <h1>أي فكرة، تبقى درس بيترسم قدامك.</h1>
          <p>
            اكتب الموضوع واختار شكله. البورد بيترسم بالكود، وNova بتشرح بالصوت وتسألك بعد كل فكرة.
          </p>
          <div className="landing-ctas">
            <ButtonLink variant="accent" size="lg" href={SITE_LINKS.signup}>
              اعمل أول درس
            </ButtonLink>
            <ButtonLink variant="ghost" size="lg" href={`/?preview=demo&id=${look.demo}`}>
              افتح الدرس ده كامل
            </ButtonLink>
          </div>
        </div>
        <HeroStage look={look} pinned={pinned} onChange={onChange} />
      </section>
      <main>
        <section id="looks" className="landing-section" aria-labelledby="landing-looks">
          <div className="site-head">
            <h2 id="landing-looks">شكل لكل موضوع</h2>
            <p>كل درس بيترسم بالكود، بشكل يناسب موضوعه. دوس على أي واحد وجرّبه.</p>
          </div>
          <ul className="landing-looks">
            {LOOKS.map((item) => (
              <li key={item.id}>
                <a href={`/?preview=demo&id=${item.demo}`}>
                  <img src={`/styles/${item.id}.webp`} alt="" loading="lazy" />
                  <strong>{item.name}</strong>
                  <span>{item.line}</span>
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
          <h2>جرّب بفكرة واحدة.</h2>
          <p>مجانًا، ومن غير ما تثبّت حاجة.</p>
          <ButtonLink variant="accent" size="lg" href={SITE_LINKS.signup}>
            اعمل حسابك
          </ButtonLink>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
