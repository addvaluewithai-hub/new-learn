import { dirOf, nativeName } from '../../src/i18n/core';
import { isGrade } from '../../src/features/market/grades';
import { serverText } from '../i18n';

// The marketplace's public pages (docs/marketplace.md, M2): HTML made on the server, so search
// engines read them and visitors without an account browse. No script runs on them; every
// value a teacher wrote is escaped. Starting a course opens the app, which asks to sign in.

export type PageCourse = {
  id: string;
  title: string;
  subject: string;
  description: string;
  language: string;
  grade: string;
  teacher: string;
  priceCents: number;
  currency: string;
  publishedAt: string;
  lessons: number;
};
export type PageLesson = { title: string; goals: Array<{ text: string }> };

const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
export const esc = (value: string) => String(value).replace(/[&<>"']/g, (c) => ESC[c]);

/** Text for a page, by key under `server.market.page`. */
const say = (locale: string) => (key: string, vars?: Record<string, string | number>) =>
  serverText(locale, `market.page.${key}`, vars);
const gradeName = (locale: string, grade: string) =>
  isGrade(grade) ? serverText(locale, `market.grades.${grade}`) : '';
const languageName = (locale: string, code: string) => {
  try {
    return new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? nativeName(code);
  } catch {
    return nativeName(code);
  }
};
export function priceText(locale: string, course: { priceCents: number; currency: string }) {
  if (!course.priceCents) return say(locale)('free');
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: course.currency,
      numberingSystem: 'latn',
    }).format(course.priceCents / 100);
  } catch {
    return `${(course.priceCents / 100).toFixed(2)} ${course.currency}`;
  }
}

const STYLE = `
@font-face{font-family:Plex;src:url(/fonts/book/ibm-plex-sans-arabic-arabic-400-normal.woff2) format('woff2');font-weight:400}
@font-face{font-family:Plex;src:url(/fonts/book/ibm-plex-sans-arabic-arabic-600-normal.woff2) format('woff2');font-weight:600}
:root{--ink:#10201c;--muted:#5d6b66;--paper:#f6f4ee;--line:#e2e0d8;--primary:#1d4a3c;--accent:#c4e86b}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Plex,system-ui,sans-serif}
a{color:var(--primary)}header,main,footer{max-width:1040px;margin:0 auto;padding:16px}
header{display:flex;justify-content:space-between;align-items:center;gap:12px}
.brand{font-weight:600;font-size:22px;color:var(--ink);text-decoration:none}
h1{font-size:clamp(28px,5vw,40px);line-height:1.2;margin:16px 0 8px}h2{font-size:20px;margin:24px 0 8px}
.lead,.meta,.note{color:var(--muted)}.meta span+span::before{content:" · "}
.grid{list-style:none;padding:0;margin:16px 0;display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))}
.card{background:#fff;border-radius:18px;padding:20px;display:grid;gap:6px;box-shadow:0 1px 2px rgb(16 32 28/8%)}
.card h2{margin:0;font-size:18px}.card a{color:inherit;text-decoration:none}.card a:hover{text-decoration:underline}
.card p{margin:0;color:var(--muted);overflow-wrap:anywhere}
.price{display:inline-block;padding:2px 10px;border-radius:999px;background:#e7f3d0;font-size:14px;font-weight:600;width:max-content}
form{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}input,select,button{font:inherit;min-height:44px;padding:0 12px;border:1px solid var(--line);border-radius:12px;background:#fff;color:var(--ink)}
input{flex:1 1 14rem}button,.cta{background:var(--primary);color:#fff;border:0;border-radius:12px;padding:10px 18px;font-weight:600;text-decoration:none;display:inline-block;cursor:pointer}
.panel{background:#fff;border-radius:18px;padding:20px;margin:16px 0}.panel h2{margin-top:0}.panel ol{margin:0;padding-inline-start:1.4em}.panel li{margin:6px 0}
.goals{margin:2px 0 0;padding-inline-start:1.2em;color:var(--muted);font-size:15px}
footer{color:var(--muted);font-size:14px;display:flex;flex-wrap:wrap;gap:16px}
`;

function shell(
  locale: string,
  head: {
    title: string;
    description: string;
    canonical: string;
    origin: string;
    noindex?: boolean;
    jsonLd?: object;
  },
  body: string,
) {
  const t = say(locale);
  const ld = head.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(head.jsonLd).replace(/</g, '\\u003c')}</script>`
    : '';
  return `<!doctype html>
<html lang="${esc(locale)}" dir="${dirOf(locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(head.title)}</title>
<meta name="description" content="${esc(head.description)}">
${head.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(head.canonical)}">`}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(head.title)}">
<meta property="og:description" content="${esc(head.description)}">
<meta property="og:url" content="${esc(head.canonical)}">
<meta property="og:image" content="${esc(head.origin)}/site/og.png">
<meta name="twitter:card" content="summary_large_image">
${ld}
<style>${STYLE}</style>
</head>
<body>
<header><a class="brand" href="/">learn</a><a href="/courses">${esc(t('allCourses'))}</a></header>
<main>${body}</main>
<footer><a href="/">${esc(t('home'))}</a><a href="/teachers">${esc(t('teach'))}</a><a href="/privacy">${esc(t('privacy'))}</a><a href="/terms">${esc(t('terms'))}</a></footer>
</body>
</html>`;
}

/** `/courses`: every listed course, with a search and filters that work without script. */
export function cataloguePage(
  locale: string,
  origin: string,
  courses: PageCourse[],
  facets: { subjects: string[]; grades: string[] },
  filters: { q?: string; subject?: string; grade?: string },
) {
  const t = say(locale);
  const option = (value: string, label: string, chosen?: string) =>
    `<option value="${esc(value)}"${value === chosen ? ' selected' : ''}>${esc(label)}</option>`;
  const form = `<form method="get" action="/courses" role="search">
<input type="search" name="q" value="${esc(filters.q ?? '')}" placeholder="${esc(t('searchHint'))}" aria-label="${esc(t('search'))}">
<select name="subject" aria-label="${esc(t('subject'))}">${option('', t('anySubject'))}${facets.subjects.map((s) => option(s, s, filters.subject)).join('')}</select>
<select name="grade" aria-label="${esc(t('grade'))}">${option('', t('anyGrade'))}${facets.grades.map((g) => option(g, gradeName(locale, g), filters.grade)).join('')}</select>
<button type="submit">${esc(t('show'))}</button>
</form>`;
  const cards = courses
    .map(
      (c) => `<li class="card">
<span class="meta">${[c.subject, gradeName(locale, c.grade)]
        .filter(Boolean)
        .map((v) => `<span>${esc(v)}</span>`)
        .join('')}</span>
<h2><a href="/courses/${esc(c.id)}" dir="auto">${esc(c.title)}</a></h2>
${c.description ? `<p dir="auto">${esc(c.description)}</p>` : ''}
<span class="meta"><span dir="auto">${esc(c.teacher)}</span><span>${esc(t('lessons', { count: c.lessons }))}</span><span>${esc(languageName(locale, c.language))}</span></span>
<span class="price">${esc(priceText(locale, c))}</span>
</li>`,
    )
    .join('');
  const filtered = Boolean(filters.q || filters.subject || filters.grade);
  const list = courses.length
    ? `<ul class="grid">${cards}</ul>`
    : `<p class="note">${esc(t(filtered ? 'noMatch' : 'empty'))}</p>`;
  return shell(
    locale,
    {
      title: t('catalogueTitle'),
      description: t('catalogueLead'),
      canonical: `${origin}/courses`,
      origin,
      noindex: filtered,
    },
    `<h1>${esc(t('catalogueTitle'))}</h1><p class="lead">${esc(t('catalogueLead'))}</p>${form}${list}`,
  );
}

/** `/courses/<id>`: one listed course, what it teaches, and the way into the app. */
export function coursePage(
  locale: string,
  origin: string,
  course: PageCourse,
  lessons: PageLesson[],
) {
  const t = say(locale);
  const url = `${origin}/courses/${course.id}`;
  const description = course.description || t('fallbackDescription', { title: course.title });
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description,
    url,
    inLanguage: course.language,
    ...(course.subject ? { about: course.subject } : {}),
    provider: { '@type': 'Organization', name: 'Learn', url: origin },
    author: { '@type': 'Person', name: course.teacher },
    offers: {
      '@type': 'Offer',
      price: (course.priceCents / 100).toFixed(2),
      priceCurrency: course.currency,
      category: course.priceCents ? 'Paid' : 'Free',
    },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
  };
  const items = lessons
    .map(
      (l) =>
        `<li><span dir="auto">${esc(l.title)}</span>${
          l.goals.length
            ? `<ul class="goals">${l.goals.map((g) => `<li dir="auto">${esc(g.text)}</li>`).join('')}</ul>`
            : ''
        }</li>`,
    )
    .join('');
  return shell(
    locale,
    { title: `${course.title} · Learn`, description, canonical: url, origin, jsonLd },
    `<p class="meta">${[
      course.subject,
      gradeName(locale, course.grade),
      languageName(locale, course.language),
    ]
      .filter(Boolean)
      .map((v) => `<span>${esc(v)}</span>`)
      .join('')}</p>
<h1 dir="auto">${esc(course.title)}</h1>
<p class="lead">${esc(t('by', { teacher: course.teacher }))} · ${esc(t('reviewed'))}</p>
${course.description ? `<p dir="auto">${esc(course.description)}</p>` : ''}
<p><span class="price">${esc(priceText(locale, course))}</span></p>
<p><a class="cta" href="/?course=${esc(course.id)}">${esc(t(course.priceCents ? 'open' : 'start'))}</a></p>
<p class="note">${esc(t('startNote'))}</p>
<section class="panel"><h2>${esc(t('lessonsTitle', { count: lessons.length }))}</h2><ol>${items}</ol></section>`,
  );
}

export function missingPage(locale: string, origin: string) {
  const t = say(locale);
  return shell(
    locale,
    {
      title: t('notFound'),
      description: t('notFound'),
      canonical: `${origin}/courses`,
      origin,
      noindex: true,
    },
    `<h1>${esc(t('notFound'))}</h1><p><a class="cta" href="/courses">${esc(t('allCourses'))}</a></p>`,
  );
}

/** Every page search engines should know: the site's and each listed course. */
export function sitemap(origin: string, courses: Array<{ id: string; publishedAt: string }>) {
  const urls = ['/', '/teachers', '/support', '/privacy', '/terms', '/courses']
    .map((path) => `<url><loc>${esc(origin + path)}</loc></url>`)
    .concat(
      courses.map(
        (c) =>
          `<url><loc>${esc(`${origin}/courses/${c.id}`)}</loc><lastmod>${esc(c.publishedAt.slice(0, 10))}</lastmod></url>`,
      ),
    );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
}
