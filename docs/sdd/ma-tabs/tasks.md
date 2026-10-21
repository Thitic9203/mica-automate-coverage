# Tasks — MA tab

| #  | Task | Rules | Check first (fails before) | Done when |
| -- | ---- | ----- | -------------------------- | --------- |
| T1 | Builder pure function + CLI | R4–R9 | tests: no run → `run:null`; mixed statuses; missing suite absent; token not printed | `node --test scripts/` green |
| T2 | Generate `public/ma-progress.json` from live MA | R8 | — | file written by the builder, values match Qase totals |
| T3 | Tab bar: hide 3 tabs, add MA tab first, default view | R1–R3 | tab texts in DOM | order "MICA 1 · EvMS · ELMS · CBMS", "OLS" |
| T4 | `renderMa()` sections, cards, empty states, notes | R10–R15, R18 | page text vs JSON | every value equals the JSON, each once |
| T5 | Motion + reduced-motion | R16 | reduced-motion shows final state | both modes |
| T6 | Responsive 1440 / 900 / 390 | R17 | `scrollWidth ≤ clientWidth` | overflow 0 at all three, OLS tab unchanged |
