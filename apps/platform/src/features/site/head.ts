import { useEffect } from 'react';
import { LOCALES, currentLocale } from '../../i18n';
import { SITE_ORIGIN } from './routes';

type Head = { title: string; description: string; path: string };

function meta(selector: string, make: () => HTMLMetaElement | HTMLLinkElement) {
  let node = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
  if (!node) {
    node = make();
    document.head.appendChild(node);
  }
  return node;
}
const named = (name: string) =>
  meta(`meta[name="${name}"]`, () => Object.assign(document.createElement('meta'), { name }));
const property = (p: string) =>
  meta(`meta[property="${p}"]`, () => {
    const node = document.createElement('meta');
    node.setAttribute('property', p);
    return node;
  });

/** The title, description, canonical address and share card of a website page. */
export function useHead({ title, description, path }: Head) {
  useEffect(() => {
    const url = `${SITE_ORIGIN}${path}`;
    document.title = title;
    named('description').setAttribute('content', description);
    property('og:title').setAttribute('content', title);
    property('og:description').setAttribute('content', description);
    property('og:url').setAttribute('content', url);
    property('og:type').setAttribute('content', 'website');
    property('og:image').setAttribute('content', `${SITE_ORIGIN}/site/og.png`);
    named('twitter:card').setAttribute('content', 'summary_large_image');
    property('og:locale').setAttribute('content', currentLocale());
    // The same page in every language, for search engines (hreflang).
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((n) => n.remove());
    for (const code of [...LOCALES, 'x-default']) {
      const link = Object.assign(document.createElement('link'), { rel: 'alternate' });
      link.hreflang = code;
      link.href = code === 'x-default' ? url : `${url}?lang=${code}`;
      document.head.appendChild(link);
    }
    meta('link[rel="canonical"]', () =>
      Object.assign(document.createElement('link'), { rel: 'canonical' }),
    ).setAttribute('href', url);
  }, [title, description, path]);
}
