# Plan — Qase proxy token

- Secret `QASE_API_TOKEN` set on the Pages project (production — the only environment, owner 2026-10-28)
  with `wrangler pages secret put`, value from the owner's local token file, never printed.
- `functions/api/qase/[[path]].js`: `context.env.QASE_API_TOKEN`; missing → 500 JSON (R2).
- `scripts/qase-proxy.test.mjs`: imports the function, mocks `fetch`; checks R1–R3.
- Cost: none (Pages secrets are free). Other repos: none.
- Risk: deploy before the secret exists → every Qase call 500s. Order: secret first (done), then deploy.
