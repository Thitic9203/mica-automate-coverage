# Mica Automate Coverage

## Deployment

- **Platform: Cloudflare Pages** — NOT Netlify
- Auto-deploys from `main` branch
- `netlify.toml` exists but is legacy/unused — do not reference Netlify in any messaging
- Cloudflare Pages Functions in `functions/` directory
- `.wrangler/` is Cloudflare local dev tooling

## Stack

- Static HTML + vanilla JS (no framework)
- Qase.io API for test case data (proxied via Cloudflare Pages Function)
- Firebase Auth (Google sign-in, skilllane.com domain only)
- Chart.js for donut chart
