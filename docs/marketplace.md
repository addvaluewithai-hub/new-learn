# The marketplace

Status (2026-10-31): listing, review and the Explore page (M1, X7; migration
`0010_marketplace.sql`), and the public pages, sitemap and robots file (M2) are built and
tested. A free preview lesson without an account comes next.

## Listing a course

A published course is `private` by default: only people with its link find it. In the
teacher's publish tab, the **Marketplace** card lists it, with the school grade it is for
(`GRADES` in `src/features/market/grades.ts`), or takes it out again.

| Course                | Asking to list                                               | A new version                                     |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| Free                  | `requested`: a review opens for the newest version (price 0) | goes back to `requested` and leaves the catalogue |
| Paid, approved        | `listed` at once: every paid version is reviewed before sale | stays listed with its approved version            |
| Paid, first in review | `requested`; listed when staff approve the sale              | —                                                 |

`published_courses.listing` is `private`, `requested` or `listed`; `grade` is the grade.
Reviews of free versions are rows in `course_reviews` with `price_cents = 0`, so staff use the
same queue (`?review`, labelled "Free · for listing") with the same AI first pass (X7: accuracy,
clarity, safety, rights, quality). Approving lists the course; sending it back takes it out
until the teacher publishes a fixed version (asking again on the same version answers
`market.fixFirst`). Unlisting while a review waits closes that review; asking again reopens it.
A withdrawn course is never listed.

## Explore

`?explore` (nav: «استكشف») shows the listed courses, newest first: subject and grade, title,
description, teacher, lessons, language and price. Filters: search (title, description,
subject, teacher), subject, grade and language, offered from what the listed courses use.
Cards open the course page (`?course=<id>`), where a learner starts it, or buys it once
payments connect (docs/credits.md).

API: `GET /api/courses/market?q=&subject=&grade=&language=` → `{ courses, facets }` (signed
in); `POST /api/teach/courses/<id>/listing` `{ list, grade }` (the course's teacher).

## Public pages (M2)

Served by Pages Functions (`functions/courses/[[path]].ts`, `functions/sitemap.xml.ts`,
`functions/robots.txt.ts` → `server/market/public.ts`), without an account and without script:

- `/courses`: the listed courses with a search and subject and grade filters (a plain form).
  The unfiltered list has a canonical link; filtered lists are `noindex`.
- `/courses/<id>`: one listed course: subject, grade, language, title, teacher, description,
  price, the lessons with their goals, and «ابدأ الكورس», which opens the app at
  `/?course=<id>` (signing in first). It carries `og:` tags and a schema.org `Course` (JSON-LD)
  for search engines. A course that is not listed answers 404 with `noindex`, so private
  courses stay link-only.
- `/sitemap.xml`: the site's pages and every listed course; `/robots.txt` points at it and keeps
  crawlers out of `/api/`, `/builder/`, `/mcp` and `/oauth/`.

The pages are in the visitor's language (`?lang=`, then the browser's, then Arabic; texts under
`server.market.page`). Everything a teacher wrote is escaped; the pages send a strict CSP (no
script, styles inline, fonts and images from the site), are cached for five minutes, and are
limited per IP (`pages.public`, 600 an hour). The site's footer links to `/courses`.

## Next

- A free preview lesson playable without an account (M7), and the public page in the app's own
  look once the brand is chosen (B1).
- Ratings and reviews (M3), teacher profile pages (T5), and showing a reviewer only what
  changed since the last approved version (X5).
