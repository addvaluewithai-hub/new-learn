# The marketplace

Status (2026-10-31): listing, review and the Explore page are built and tested (M1, X7;
migration `0010_marketplace.sql`). Pages that search engines find and browsing without an
account come next (M2).

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

## Next (M2 and after)

- Public pages per course that search engines index, a sitemap, and browsing without an
  account; a free preview lesson.
- Ratings and reviews (M3), teacher profile pages (T5), and showing a reviewer only what
  changed since the last approved version (X5).
