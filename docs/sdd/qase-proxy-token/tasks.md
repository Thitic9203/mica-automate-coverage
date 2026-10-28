# Tasks — Qase proxy token

| #  | Task | Rules | Check first (fails before) | Done when |
| -- | ---- | ----- | -------------------------- | --------- |
| T1 | Set secret on Pages | R1 | `wrangler pages secret list` lacks it | secret listed |
| T2 | Proxy reads env, 500 when missing | R1–R3 | test: env token sent; missing → 500, no fetch; no hex token in file | `node --test scripts/*.test.mjs` green |
| T3 | Deploy + verify; owner revokes old token | R1, R4 | — | production `/api/qase/project/MA` 200 · Owner kept the token (RISK_REGISTER R-001) |
| T4 | Proxy: only GET/HEAD, else 405 + `Allow`, no fetch | R5 | test: `DELETE`/`POST` reach `fetch` today | tests green |
| T5 | Page: drop `QASE_TOKEN` and the `Token` header | R6 | test: `public/index.html` contains a 64-hex token | tests green |
| T6 | Deploy production; `DELETE` → 405, GET → 200, MA tab loads | R5, R6 | — | curl output in PR · Done 058b351: GET/HEAD 200, DELETE/POST/PUT 405, 0 tokens in page |
