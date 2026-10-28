# Tasks — MA tab

| #  | Task | Rules | Check first (fails before) | Done when |
| -- | ---- | ----- | -------------------------- | --------- |
| T1 | Builder pure function + CLI | R4–R9 | tests: no run → `run:null`; mixed statuses; missing suite absent; token not printed | `node --test scripts/` green |
| T2 | Generate `public/ma-progress.json` from live MA | R8 | — | file written by the builder, values match Qase totals |
| T3 | Tab bar: hide 3 tabs, add MA tab first, default view | R1–R3 | tab texts in DOM | order "MICA 1 · EvMS · ELMS · CBMS", "OLS" |
| T4 | `renderMa()` sections, cards, empty states, notes | R10–R15, R18 | page text vs JSON | every value equals the JSON, each once |
| T5 | Motion + reduced-motion | R16 | reduced-motion shows final state | both modes |
| T6 | Responsive 1440 / 900 / 390 | R17 | `scrollWidth ≤ clientWidth` | overflow 0 at all three, OLS tab unchanged |
| T7 | Builder `totalCases` + guard | R19 | test: mixed automation → totalCases counts all; automated > cases throws | `node --test scripts/` green |
| T8 | Page: Total cases card first, validation, 4/2/1 grid | R20–R22 | page text vs JSON; malformed JSON message | every value equals the JSON once; overflow 0 at 1440 / 900 / 390 |
| T9 | Regenerate JSON; deploy staging → verify → production | R19, R8 | live JSON on staging has `totalCases` | production JSON and page show CBMS 317 / ELMS 66 total cases |
| T10 | Core module + concurrent paging; builder re-exports | R24, R25 | existing builder tests import still resolves; test: pages come back in offset order | `node --test scripts/` green |
| T11 | `renderMa()` computes live, loading + error states | R23, R26, R27 | page text vs fresh builder run | every value equals a builder run at the same time |
| T12 | Deploy staging → verify → production | R23 | staging MA tab shows MICA 1 2153 / CBMS 627 | production shows the live totals with no JSON change |
| T13 | Retry transient page failures | R28 | test: 521 twice then ok → ok; 521 always → rejects after 3; 401 → 1 call | `node --test scripts/` green |
