# Spec — Each tab's data loads within 5 seconds

Source: owner 2026-11-28 chat: "แก้เรื่องการโหลดเข้อมูลแต่ละแท้ป ... ช้ามาก ... ควรโหลดเสร็จภายในไม่เกิน 5 วิ".
Measured 2026-11-28 against production (cold): Pyrite 82.6 s (303 Qase requests), OLS 80.9 s (354, later HTTP 429),
MA 13.8 s (35). Root cause verified: `public/ma-progress-core.mjs` paging reads `result.total`, which on
`/result?run=X` is the project-wide count (`{"total":1019,"filtered":2,"count":2}` for Pyrite run 50), so every run
pulls 8–14 empty pages; results are also fetched one run at a time after cases and runs, one after the other.

## Rules

- **R1** — Paging MUST size the list from Qase `filtered` when present, else `total` (amends ma-tabs R25: first page
  still tells the size, remaining pages still go out together in offset order).
- **R2** — Suites, cases and runs MUST be requested at the same time, not one after the other.
- **R3** — The runs whose results are needed MUST be planned from `run.cases` alone (same newest-first walk and stop
  rule as live-qase-tabs R4) and their results fetched concurrently, then applied newest first. The set of runs and
  the computed numbers MUST equal the old run-by-run walk (amends live-qase-tabs R4 wording, not its meaning).
- **R4** — All Qase requests of one tab load share one in-flight limit (ma-tabs R38: at most 8 at once).
- **R5** — The ticket card MUST NOT delay the paint of cached numbers (strengthens ma-tabs R41): cached numbers paint
  first, the ticket card fills in when it arrives.
- **R6** — Data stays live (no static data files, no deploy to change numbers); free tier only.
- **R7** — Target: each tab's live numbers on screen within 5 s of opening it (cold, production). If R1–R5 alone do not
  reach it, the remaining lever (more requests in flight than ma-tabs R38 allows) is an owner decision.

## Edge cases

- Run with more than 100 results: still paged, by `filtered`.
- Run listing cases that no longer exist in the project: excluded exactly as before (ownIds).
- Switching tabs mid-load: stale results still discarded (liveSeq).
- Ticket card fetch fails: card shows its error text; numbers unaffected.

## Done when

- Unit tests: paging uses `filtered`; planned-parallel build output equals the old serial walk on fixtures.
- Production timings measured per tab, before and after, in this folder's tasks.md.
- Visual + axe suite green twice; unit tests green.
