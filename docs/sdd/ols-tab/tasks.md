# Tasks — OLS tab

| #  | Task | Rules | Check first | Done when |
| -- | ---- | ----- | ----------- | --------- |
| T1 | Tab + `renderOls()` reading the JSON | R1–R6 | render with a fixture JSON whose numbers are known; missing JSON shows the error | values on screen equal the JSON |
| T2 | Motion + reduced-motion no-op | R7 | reduced-motion emulation shows final state at once | both modes checked |
| T3 | Responsive 1440 / 900 / 390 | R8 | measure `scrollWidth ≤ clientWidth` | no overflow at all three |
| T4 | Preview deploy → owner check → production on "ดีพอย" | — | — | production URL shows the tab |
| T5 | Cards: count large, percent smaller on the line under it | R2, R7, R8 | at 1440 / 900 / 390 measure that the percent's top is below the count's bottom | values equal the JSON, no overflow, no clipped text, equal card heights per row, count-up still runs |
| T6 | Round HTML report link | R5b | link absent when `round.reportUrl` missing | link opens the private report in a new tab |
