# Plan — tab load within 5 s

## Files

- `public/ma-progress-core.mjs` — `fetchAll` sizes from `filtered ?? total` (R1); a per-build limiter shared by every
  request (R4); `buildOverview` requests suites/cases/runs together (R2), plans runs from `run.cases`, fetches the
  planned results concurrently and applies them newest first (R3). `buildMaProgress` gets the same limiter/paging.
- `public/index.html` — `renderOls`/`renderPyrite` start the ticket card without awaiting it before `renderLive`;
  the card re-renders when it lands (R5).
- `scripts/ma-progress-core.test.mjs` — tests for R1, R3 (equality with old walk), R4 (max in flight).

## Options weighed

- Fix paging + parallel plan within 8 in flight (chosen first): agent prototype measured Pyrite 13.3 s, OLS 10.4 s,
  MA 10.4 s cold; output byte-equal to the old code on Pyrite and MA.
- 24 in flight + start results before cases (measured 4.7 s / 5.5 s): conflicts with ma-tabs R38 (Qase 50 per 10 s,
  measured timeouts under load) — owner decision (R7).
- Server-side overview in a Function: free tier caps a call at 50 subrequests; Pyrite needs 55. Rejected.

## Risks

- Planning differs from the old walk if a run's results omit a listed case: the old walk also only marks listed cases
  done, so the same. Covered by the equality test.
- No new cost; no other repo touched.
