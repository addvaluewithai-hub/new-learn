import { database, type Db } from '../db/connection';
import type { Env } from '../env';
import { HttpError } from '../http';
import { localeOf, SERVER_LOCALES } from '../i18n';
import { ipOf, rateLimit } from '../ops/limits';
import { logError } from '../ops/record';
import { marketCourse, marketCourses, marketFacets } from './store';
import { cataloguePage, coursePage, missingPage, sitemap } from './pages';

// The public side of the marketplace (docs/marketplace.md, M2), served by Pages Functions
// without an account: `/courses`, `/courses/<id>`, `/sitemap.xml` and `/robots.txt`.

const UUID = /^\/courses\/([0-9a-f-]{36})\/?$/;
const SECURITY = {
  'content-security-policy':
    "default-src 'none'; style-src 'unsafe-inline'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
};
const html = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Short, so a course that leaves the catalogue soon leaves the cache too.
      'cache-control': status === 200 ? 'public, max-age=300' : 'no-store',
      ...SECURITY,
    },
  });
const text = (body: string, type: string) =>
  new Response(body, {
    headers: { 'content-type': type, 'cache-control': 'public, max-age=3600' },
  });

/** The visitor's language: `?lang=` when we have it, else the browser's, else Arabic. */
function pageLocale(request: Request, url: URL) {
  const asked = url.searchParams.get('lang') ?? '';
  return SERVER_LOCALES.includes(asked) ? asked : localeOf(request);
}

export async function handlePublic(
  request: Request,
  env: Env,
  deps: { db?: Db } = {},
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const origin = url.origin;
  if (path === '/robots.txt')
    return text(
      `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /builder/\nDisallow: /mcp\nDisallow: /oauth/\nSitemap: ${origin}/sitemap.xml\n`,
      'text/plain; charset=utf-8',
    );
  if (request.method !== 'GET' && request.method !== 'HEAD')
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
  const locale = pageLocale(request, url);
  try {
    const db = deps.db ?? database(env);
    if (path === '/sitemap.xml')
      return text(
        sitemap(origin, await marketCourses(db, {}, 1000)),
        'application/xml; charset=utf-8',
      );
    await rateLimit(db, 'pages.public', ipOf(request) || 'unknown');
    if (path === '/courses' || path === '/courses/') {
      const pick = (k: string) => url.searchParams.get(k)?.slice(0, 80) || undefined;
      const filters = { q: pick('q'), subject: pick('subject'), grade: pick('grade') };
      const [courses, facets] = await Promise.all([
        marketCourses(db, filters, 120),
        marketFacets(db),
      ]);
      return html(cataloguePage(locale, origin, courses, facets, filters));
    }
    const m = UUID.exec(path);
    const found = m ? await marketCourse(db, m[1]) : null;
    if (!found) return html(missingPage(locale, origin), 404);
    return html(coursePage(locale, origin, found.course, found.lessons));
  } catch (error) {
    if (error instanceof HttpError && error.status === 429)
      return new Response('Too many requests.', { status: 429, headers: { 'retry-after': '600' } });
    if (error instanceof HttpError && error.status === 503)
      return new Response('Unavailable.', { status: 503 });
    if (env.DATABASE_URL)
      await logError(deps.db ?? database(env), {
        source: 'server',
        place: `GET ${path}`,
        status: 500,
        message: error instanceof Error ? error.message : String(error),
        detail: { stack: error instanceof Error ? error.stack : '' },
      });
    return new Response('Server error.', { status: 500 });
  }
}
