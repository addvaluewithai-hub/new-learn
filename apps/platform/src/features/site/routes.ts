// The website's pages live at real paths (shareable, indexable); the app itself stays on `/`
// with its query routes. Cloudflare Pages and `vite preview` both serve index.html for these.

export type SitePage = 'teachers' | 'privacy' | 'terms' | 'support';

const PAGES: Record<string, SitePage> = {
  '/teachers': 'teachers',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/support': 'support',
};

/** The site page at a path, or null for the app. A trailing slash is the same page. */
export function sitePage(pathname: string): SitePage | null {
  return PAGES[pathname.replace(/\/+$/, '') || '/'] ?? null;
}

/** The public origin, for canonical links and the share image. */
export const SITE_ORIGIN = 'https://new-learn.pages.dev';

/** Where a teacher's AI connects (docs/connector.md). */
export const CONNECTOR_URL = `${SITE_ORIGIN}/mcp`;

/** The address written on the support, privacy and terms pages. */
export const SUPPORT_EMAIL = 'addvaluewithai@gmail.com';

export const SITE_LINKS = {
  looks: '/#looks',
  demos: '/?preview=demos',
  teachers: '/teachers',
  connect: '/teachers#connect',
  support: '/support',
  privacy: '/privacy',
  terms: '/terms',
  signup: '/?auth=signup',
  login: '/?auth=login',
};
