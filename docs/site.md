# The website

The site lives in the app (`apps/platform/src/features/site` and `features/landing`), served
from the same Cloudflare Pages project. Visitors at `/` see the landing; members see the app.
The other pages are real paths, public to everyone, and Cloudflare Pages (no `404.html`) and
`vite preview` both serve `index.html` for them:

| Path        | Page                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| `/`         | Landing: live hero, the looks, how it works, Nova, teachers, connector, FAQ |
| `/teachers` | The studio in four steps, then "connect your Claude or ChatGPT"             |
| `/support`  | Contact address, every FAQ, links to the legal pages                        |
| `/privacy`  | What is stored, who sees it, the AI providers, deletion                     |
| `/terms`    | The service, accounts, content rights, AI-made content, acceptable use      |

- `routes.ts` maps paths to pages and holds the public origin, the connector address, the
  support address and every link the bar and foot use. Add a page there and in `SitePages`.
- `head.ts` sets each page's title, description, canonical link and share card.
- `SiteShell.tsx`: the bar (`SiteNav`, dark on the landing, light elsewhere), the foot, the
  `SiteFrame` page frame and the `Shot` screenshot frame. Styles in `site.css`.
- `faq.ts` is the one list of questions; `for: 'teachers'` marks the ones the teachers page
  shows. `legal.ts` holds the privacy and terms texts as sections; they describe what the
  product does today (Neon Auth, Gemini for Nova, Claude for the builder, the connector) and
  the owner reviews them before launch (tasks L1–L3).
- The landing's hero (`landing/hero.ts`, `HeroStage.tsx`) replays a demo lesson on its
  board; the sections below are in `landing/sections.tsx`.
- Screenshots on the site are in `apps/platform/public/site/*.webp`, cropped from the browser
  tests' `test-results/*.png`. The share image is rendered by `node tools/site-og.mjs`.
- `tests/platform-browser.mjs` opens every page, checks its heading, title, foot and that
  nothing overflows at 1280, 390 and 320.
