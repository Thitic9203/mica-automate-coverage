# Plan — Pyrite tab, Pluton brand, pluton URL

## Files

- `public/ma-progress-core.mjs` — export `buildPyriteOverview` (= `buildOverview({ project: 'Pyrite', systems: null })`).
- `public/index.html` — Pyrite tab button, `LIVE_TABS.pyrite`, `renderPyrite`, generic ticket card (`ticketsCard(cfg)`)
  used by OLS (site-data JSON) and Pyrite (`/api/pyrite-tickets`), title/eyebrow switch, brand "Pluton", `<title>`.
- `functions/api/pyrite-tickets.js` — new Function (R4). Pure helpers in `functions/lib/pyrite-tickets-core.js`
  (tar parse, annotation scan, JQL build, figure) so node tests can import them.
- `scripts/pyrite-tickets-core.test.mjs`, `scripts/ma-progress-core.test.mjs` (Pyrite builder) — unit tests.
- `tests/visual/tabs.visual.spec.cjs` + 6 new baselines.
- `redirect/_redirects` — the only file deployed to the old project (`/* https://pluton-automate-coverage.pages.dev/:splat 301`).
- `CLAUDE.md`, `README.md` — new deploy command and URL.

## Data

- Jira: `POST /rest/api/3/search/jql` `{ jql: 'filter = <ALL>', fields: ['key'] }`, paged by `nextPageToken`.
  Filter rewrite: `GET/PUT /rest/api/3/filter/<AUTOMATED>`.
- GitHub: `GET /repos/Thitic9203/pyrite-qa-e2e/tarball/main` (one subrequest; free Workers limit is 50) →
  `DecompressionStream('gzip')` → ustar walk → `.spec.ts` under `tests/` → regex
  `type:\s*['"]tickets['"]\s*,\s*description:\s*['"]([^'"]+)['"]` → `PYR-\d+`.
- Edge cache: `caches.default` keyed on the request URL, 300 s.

## Choices weighed

- Live Function vs 30-min publisher: owner chose live (no runner exists for pyrite-qa-e2e; matches mica-coverage-auto-update).
- Tarball vs per-file fetch: 33 spec files today would already approach the 50-subrequest cap with Jira paging; tarball is 1.
- New Pages project vs custom domain: custom domain costs money (global rule 3); new `*.pages.dev` project is free.

## Cost / other repos

- New cost: **NO** (Cloudflare Pages free tier; no paid API).
- Touches another repo: **NO** (pyrite-qa-e2e only read).

## What can break

- Firebase sign-in on the new host until the domain is authorized (owner/console step).
- Function errors while secrets are missing: card shows "not available"; the rest of the tab works.
- Visual baselines of MA/OLS change (brand text) — regenerate all 18 and review.
