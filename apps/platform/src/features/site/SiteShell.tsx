import type { ReactNode } from 'react';
import { Brand } from '../../shared/Brand';
import { ButtonLink } from '../../shared/ui';
import { useI18n, type TextKey } from '../../i18n';
import { LanguagePicker } from '../../i18n/LanguagePicker';
import { SITE_LINKS } from './routes';
import '../../shared/platform.css';
import './site.css';

/** The website's top bar: dark over the landing's hero, light on the other pages. */
export function SiteNav({ tone = 'light' }: { tone?: 'dark' | 'light' }) {
  const { t } = useI18n();
  return (
    <header className={`site-nav site-nav--${tone}`}>
      <Brand />
      <nav aria-label={t('site.nav.label')}>
        <a href={SITE_LINKS.looks}>{t('site.nav.looks')}</a>
        <a href={SITE_LINKS.teachers}>{t('site.nav.teachers')}</a>
        <a href={SITE_LINKS.demos}>{t('site.nav.demos')}</a>
        <a href={SITE_LINKS.support}>{t('site.nav.support')}</a>
        <LanguagePicker tone={tone} />
        <ButtonLink variant="ghost" size="sm" href={SITE_LINKS.login}>
          {t('site.nav.login')}
        </ButtonLink>
        <ButtonLink variant="accent" size="sm" href={SITE_LINKS.signup}>
          {t('site.nav.start')}
        </ButtonLink>
      </nav>
    </header>
  );
}

const COLUMNS: Array<[TextKey, Array<[TextKey, string]>]> = [
  [
    'site.foot.product',
    [
      ['site.foot.looks', SITE_LINKS.looks],
      ['site.foot.demos', SITE_LINKS.demos],
      ['site.foot.teachers', SITE_LINKS.teachers],
      ['site.foot.connect', SITE_LINKS.connect],
    ],
  ],
  [
    'site.foot.account',
    [
      ['site.foot.signup', SITE_LINKS.signup],
      ['site.foot.login', SITE_LINKS.login],
    ],
  ],
  [
    'site.foot.help',
    [
      ['site.foot.support', SITE_LINKS.support],
      ['site.foot.privacy', SITE_LINKS.privacy],
      ['site.foot.terms', SITE_LINKS.terms],
    ],
  ],
];

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="site-foot">
      <div className="site-foot-brand">
        <Brand />
        <p>{t('site.foot.tagline')}</p>
        <LanguagePicker />
      </div>
      {COLUMNS.map(([title, links]) => (
        <nav key={title} aria-label={t(title)}>
          <strong>{t(title)}</strong>
          {links.map(([text, href]) => (
            <a key={href} href={href}>
              {t(text)}
            </a>
          ))}
        </nav>
      ))}
      <small>© {new Date().getFullYear()} New Learn</small>
    </footer>
  );
}

/** A website page: the light bar, a readable column, the footer. */
export function SiteFrame({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const { dir } = useI18n();
  return (
    <div className="platform-ui site" dir={dir}>
      <SiteNav />
      <main className={wide ? 'site-main site-main--wide' : 'site-main'}>{children}</main>
      <SiteFooter />
    </div>
  );
}

/** A product screenshot in a frame, cropped to the same shape everywhere. */
export function Shot({ src, alt, tall }: { src: string; alt: string; tall?: boolean }) {
  return (
    <figure className={tall ? 'site-shot site-shot--tall' : 'site-shot'}>
      <img src={src} alt={alt} loading="lazy" />
    </figure>
  );
}
