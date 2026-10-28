# Tasks — live Qase tabs

| #  | Task | Rules | Fails before | Done when | Status (2026-10-28) |
| -- | ---- | ----- | ------------ | --------- | ------------------- |
| T1 | Per-case run walk in `buildOverview`; MA uses it | R2–R4, R6 | test: case only in older run reads not run today | core tests green; MA live = 2011 / 586 / 1 / 1424 | Done — PR #27 · core tests green · MA live 2011/586/1/1424 |
| T2 | `buildOlsOverview` (all OLS cases) | R1, R3, R5 | test: export missing | core tests green; dry run through production proxy | Done — PR #27 · dry run via production proxy: OLS 639/235/199/205 |
| T3 | Page: shared live renderer, OLS live, ticket card from JSON with its own date | R1, R7–R9 | test: OLS renderer reads `ols-progress.json` cases | page tests green | Done — PRs #27 #28 #29 #30 #31 #36 · 49 unit + 13 visual/axe green |
| T4 | Deploy production; verify both tabs | all | — | production numbers in PR | Done — 76c55bb deployed 21:48; 12 views (3 widths × 2 tabs × 2 themes) live, axe 0 |
| T5 | 429 retry + 60 s edge cache | R12, R13 | tests failed before | 4 concurrent-load rounds (6–12 views) all live | Done — PR #33 |
| T6 | Visual regression + light/dark themes | R14, R15 | — | 13/13 × 3 reruns, 0 px | Done — PRs #35 #36 |
| T7 | OLS ticket card from `site-data` (auto, every open) | R16 | test: card read `ols-progress.json` | 292/684 "updated automatically" on production | Done — PR #38 |
| T8 | No data file in `public/` | R17 | test fails while files exist | 52 tests green, files gone | Done — PR #39 |
