# Tasks — live Qase tabs

| #  | Task | Rules | Fails before | Done when |
| -- | ---- | ----- | ------------ | --------- |
| T1 | Per-case run walk in `buildOverview`; MA uses it | R2–R4, R6 | test: case only in older run reads not run today | core tests green; MA live = 2011 / 586 / 1 / 1424 |
| T2 | `buildOlsOverview` (all OLS cases) | R1, R3, R5 | test: export missing | core tests green; dry run through production proxy |
| T3 | Page: shared live renderer, OLS live, ticket card from JSON with its own date | R1, R7–R9 | test: OLS renderer reads `ols-progress.json` cases | page tests green |
| T4 | Deploy production; verify both tabs | all | — | production numbers in PR |
