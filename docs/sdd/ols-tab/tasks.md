# Tasks — OLS tab

| #  | Task | Rules | Check first | Done when |
| -- | ---- | ----- | ----------- | --------- |
| T1 | Tab + `renderOls()` reading the JSON | R1–R6 | render with a fixture JSON whose numbers are known; missing JSON shows the error | values on screen equal the JSON |
| T2 | Motion + reduced-motion no-op | R7 | reduced-motion emulation shows final state at once | both modes checked |
| T3 | Responsive 1440 / 900 / 390 | R8 | measure `scrollWidth ≤ clientWidth` | no overflow at all three |
| T4 | Preview deploy → owner check → production on "ดีพอย" | — | — | production URL shows the tab |
| T5 | Cards: count large, percent smaller on the line under it | R2, R7, R8 | at 1440 / 900 / 390 measure that the percent's top is below the count's bottom | values equal the JSON, no overflow, no clipped text, equal card heights per row, count-up still runs |
| T6 | Round HTML report link | R5b | link absent when `round.reportUrl` missing | link opens the private report in a new tab |
| T7 | Remove repeated figures/definitions | R9 | count each number's occurrences in the visible text | every count, percent and definition appears once |
| T8 | Scope line names the platforms | R10 | visible text equals the R10 wording | text matches, no overflow at 390 px |
| T9 | “Cases by type” card from `caseTypes` | R7, R8, R9, R11 | fixture JSON with known type counts; card absent when `caseTypes` missing | values equal the JSON at 1440 / 900 / 390, overflow 0, no clipped text, each number once |
| T10 | Case table from `caseRows`, English headers, Qase link | R16, R16f | fixture JSON with known rows; table absent when `caseRows` missing | cells equal the JSON |
| T11 | Filters + search (listbox desktop, bottom sheet mobile) | R16a, R16d | fixture: each filter's count equals the matching card | counts equal, no native select at 390 |
| T12 | Sortable headers with `aria-sort` | R16b | sort each column asc/desc on a known fixture order | order + aria-sort correct |
| T13 | Pagination 25/50/100 | R16c | fixture 120 rows: page counts 5/3/2, reset to page 1 on filter | correct ranges |
| T14 | Responsive + motion + axe | R16e | 1440/900/390 scrollWidth ≤ clientWidth; re-render ×3 node count stable | overflow 0, axe clean |
| T15 | One status vocabulary across the tab (R17) | R17a–c | fixture: visible labels = the six uppercase values; rows per status = cards | labels + counts equal at 1440/900/390 |
| T19 | “%” column + “Total” row on Cases by type | R19, R18, R11 | fixture where type sums ≠ case totals → card absent; known fixture → % and sums exact | values equal the JSON at 1440 / 900 / 390, overflow 0 |
