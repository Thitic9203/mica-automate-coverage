# Tasks — tab load within 5 s

| # | Task | Rules | Failing test first | Done when | Status |
|---|------|-------|--------------------|-----------|--------|
| T1 | Paging by `filtered` | R1 | fixture with total≫filtered requests 1 page | test green | Pending |
| T2 | Shared limiter + parallel lists + planned parallel results | R2–R4 | equality vs serial walk; max in flight ≤ 8 | tests green | Pending |
| T3 | Ticket card does not block cached paint | R5 | — | visual suite green | Pending |
| T4 | Deploy, measure each tab cold on production | R7 | — | timings recorded | Pending |
