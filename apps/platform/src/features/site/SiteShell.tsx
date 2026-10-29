import type { ReactNode } from 'react';
import { Brand } from '../../shared/Brand';
import { ButtonLink } from '../../shared/ui';
import { SITE_LINKS } from './routes';
import '../../shared/platform.css';
import './site.css';

/** The website's top bar: dark over the landing's hero, light on the other pages. */
export function SiteNav({ tone = 'light' }: { tone?: 'dark' | 'light' }) {
  return (
    <header className={`site-nav site-nav--${tone}`}>
      <Brand />
      <nav aria-label="روابط الموقع">
        <a href={SITE_LINKS.looks}>الأشكال</a>
        <a href={SITE_LINKS.teachers}>للمدرسين</a>
        <a href={SITE_LINKS.demos}>الديموز</a>
        <a href={SITE_LINKS.support}>الدعم</a>
        <ButtonLink variant="ghost" size="sm" href={SITE_LINKS.login}>
          ادخل
        </ButtonLink>
        <ButtonLink variant="accent" size="sm" href={SITE_LINKS.signup}>
          ابدأ مجانًا
        </ButtonLink>
      </nav>
    </header>
  );
}

const COLUMNS: Array<[string, Array<[string, string]>]> = [
  [
    'المنتج',
    [
      ['الأشكال', SITE_LINKS.looks],
      ['الديموز', SITE_LINKS.demos],
      ['للمدرسين', SITE_LINKS.teachers],
      ['وصّل الـAI بتاعك', SITE_LINKS.connect],
    ],
  ],
  [
    'الحساب',
    [
      ['اعمل حساب', SITE_LINKS.signup],
      ['ادخل', SITE_LINKS.login],
    ],
  ],
  [
    'المساعدة',
    [
      ['الدعم والأسئلة', SITE_LINKS.support],
      ['الخصوصية', SITE_LINKS.privacy],
      ['الشروط', SITE_LINKS.terms],
    ],
  ],
];

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="site-foot-brand">
        <Brand />
        <p>أي فكرة، تبقى درس بيترسم قدامك.</p>
      </div>
      {COLUMNS.map(([title, links]) => (
        <nav key={title} aria-label={title}>
          <strong>{title}</strong>
          {links.map(([text, href]) => (
            <a key={href} href={href}>
              {text}
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
  return (
    <div className="platform-ui site" dir="rtl">
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
