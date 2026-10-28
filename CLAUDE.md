# Mica Automate Coverage

## Deployment

- **Platform: Cloudflare Pages** — NOT Netlify
- **Manual deploy** — no git auto-deploy configured
- Deploy command: `wrangler pages deploy public/ --project-name mica-automate-coverage --branch main`
- `--branch main` = production deploy → stable production URL (not per-deploy hash URL)
- **Production only** (owner 2026-10-28): no staging/preview environment, branch, deploy or secret. Deploy straight to `--branch main` and verify on https://mica-automate-coverage.pages.dev. This overrides the global staging-first rules for this repo.
- Always commit + push + deploy when user says "ดีพอย"
- `netlify.toml` exists but is legacy/unused — do not reference Netlify
- Cloudflare Pages Functions in `functions/` directory
- `.wrangler/` is Cloudflare local dev tooling

## Stack

- Static HTML + vanilla JS (no framework)
- Qase.io API for test case data (proxied via Cloudflare Pages Function)
- Firebase Auth (Google sign-in, skilllane.com domain only)
- Chart.js for donut chart
