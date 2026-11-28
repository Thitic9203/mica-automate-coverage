# Plan — Pyrite automation only

## Files

- `lib/pyrite-tickets-core.mjs` — `automatedCaseIds(files)` (R1), pure, node-testable.
- `functions/api/pyrite-automated.js` — new Function (R2): tarball → `automatedCaseIds`, 5 min edge cache.
- `public/ma-progress-core.mjs` — `buildPyriteOverview({ fetchJson, now, automatedIds })`: `automatedIds` is a promise
  of the id list, awaited while Qase loads; `buildOverview` gets `runFilter` and `isAutomated` options (R3, R4).
- `public/index.html` — Pyrite tab fetches `/api/pyrite-automated` beside Qase and passes it to the builder (R5).
- `scripts/*.test.mjs`, `tests/visual/tabs.visual.spec.cjs` (route `/api/pyrite-automated`, Pyrite fixture run
  renamed "Pyrite Automate · …") and Pyrite baselines.
- Qase write (R6): one script call per case `PATCH /v1/case/Pyrite/<id> {"automation":2}` with the owner's token from
  `~/.ols-qa-secrets/qase_api_token` read by the script, never printed; before/after counted.

## Options weighed

- Separate Function vs adding ids to `/api/pyrite-tickets`: separate, so a Jira outage does not block the Qase numbers.
- Run filter by title vs `is_api_result`: title, because the AI agent also posts manual results through the API.

## Risks

- A future automated run titled differently is ignored — the reporter's title is fixed in pyrite-qa-e2e
  (`scripts/lib/qase-report.mjs`). No new cost (free tier); no other repo changed.
