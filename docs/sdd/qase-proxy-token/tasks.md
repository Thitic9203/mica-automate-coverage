# Tasks — Qase proxy token

| #  | Task | Rules | Check first (fails before) | Done when |
| -- | ---- | ----- | -------------------------- | --------- |
| T1 | Set secret on Pages | R1 | `wrangler pages secret list` lacks it | secret listed |
| T2 | Proxy reads env, 500 when missing | R1–R3 | test: env token sent; missing → 500, no fetch; no hex token in file | `node --test scripts/*.test.mjs` green |
| T3 | Deploy + verify; owner revokes old token | R1, R4 | — | production `/api/qase/project/MA` 200 |
