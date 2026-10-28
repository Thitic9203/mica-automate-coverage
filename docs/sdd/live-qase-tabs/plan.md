# Plan — live Qase tabs

- `public/ma-progress-core.mjs`: new `buildOverview({ fetchJson, project, systems, now })`. `systems` set →
  scope = those suite trees (MA); absent → every case (OLS). Run walk per R2/R4. `buildMaOverview` becomes
  a thin call with MA settings; `buildOlsOverview` the OLS one. Output shape unchanged
  (`cases`, `breakdown`, `types`, `typesError`, `run`) plus `runsUsed`.
- `public/index.html`: `paintMa` → `paintLive(d, refresh, animate, cfg)` with per-tab title, scope, source
  and an extra card slot; `renderMa`/`renderOls` share one `renderLive(cfg)`. OLS ticket card reads only
  `tickets` + `measuredAt` from `ols-progress.json`.
- Tests: `scripts/ma-progress-core.test.mjs` (run walk), new OLS cases there; existing page tests stay.
- Cost: none (same proxy, ~10–20 requests per tab open, under Qase's 50 / 10 s). Other repos: none.
- Risk: OLS figures change basis (452 Done-ticket cases → 639 Qase cases); shown to the owner before
  deploy. A run never completed in Qase never counts (R30).
- Deploy: production only, verify on the production URL.
