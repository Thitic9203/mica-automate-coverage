# Mica Automate Coverage

## Deployment

- **Platform: Cloudflare Pages** — NOT Netlify
- **Manual deploy** — no git auto-deploy configured
- Deploy command: `wrangler pages deploy public/ --project-name mica-automate-coverage`
- Always deploy after pushing to main
- `netlify.toml` exists but is legacy/unused — do not reference Netlify
- Cloudflare Pages Functions in `functions/` directory
- `.wrangler/` is Cloudflare local dev tooling

## Stack

- Static HTML + vanilla JS (no framework)
- Qase.io API for test case data (proxied via Cloudflare Pages Function)
- Firebase Auth (Google sign-in, skilllane.com domain only)
- Chart.js for donut chart
