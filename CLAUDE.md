# Mica Automate Coverage

## Deployment

- **Platform: Cloudflare Pages** — NOT Netlify
- **Manual deploy** — no git auto-deploy configured
- Deploy command: `wrangler pages deploy public/ --project-name pluton-automate-coverage --branch main` (spec docs/sdd/pyrite-tab-pluton R8; run from the repo root so `functions/` and `lib/` are bundled)
- Old project `mica-automate-coverage` serves only `redirect/_redirects` (301 to the new host): `wrangler pages deploy redirect/ --project-name mica-automate-coverage --branch main`
- Pages secrets on `pluton-automate-coverage` (set by the owner): `QASE_API_TOKEN`, `JIRA_BASIC` (`email:token`), `GITHUB_TOKEN` (read-only contents of pyrite-qa-e2e)
- `--branch main` = production deploy → stable production URL (not per-deploy hash URL)
- **Production only** (owner 2026-10-28): no staging/preview environment, branch, deploy or secret. Deploy straight to `--branch main` and verify on https://pluton-automate-coverage.pages.dev. This overrides the global staging-first rules for this repo.
- Always commit + push + deploy when user says "ดีพอย"
- `netlify.toml` exists but is legacy/unused — do not reference Netlify
- Cloudflare Pages Functions in `functions/` directory
- `.wrangler/` is Cloudflare local dev tooling

## Stack

- Static HTML + vanilla JS (no framework)
- Qase.io API for test case data (proxied via Cloudflare Pages Function)
- Firebase Auth (Google sign-in, skilllane.com domain only)
- Chart.js for donut chart

## Save context
- Before reading a whole file, grep first and only read the parts you need.
- To understand the whole project, send a subagent to look and bring back only the summary.
- Show me the diff, not the whole file.
- Don't restate anything we've already decided in this session.
- When we switch tasks, suggest /compact or a new session.
- Keep answers short by default.
