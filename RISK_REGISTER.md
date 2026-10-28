# Risk register

| ID | Date | Risk | Owner decision | Mitigation in place | Revisit when |
| -- | ---- | ---- | -------------- | ------------------- | ------------ |
| R-001 | 2026-10-28 | The Qase API token used by the proxy was committed to this public repo (git history) and shipped in `public/index.html` until PR #26. Anyone who saw it can call the Qase API directly, including delete/create on project MA. On 2026-10-28 all MA cases were deleted and re-imported by the token's user ("Qase Viewer"). | Keep the existing token; do not revoke now ("ใช้อันเดิม"). | Proxy is read-only (GET/HEAD only, spec `docs/sdd/qase-proxy-token` R5); token lives only in the `QASE_API_TOKEN` Pages secret (production + preview); no token in the page (R6). | Any unexpected change in Qase data, or before the repo is shared further. Rotating = create a new token in Qase, `wrangler pages secret put QASE_API_TOKEN` for production and preview, then revoke the old one. |
