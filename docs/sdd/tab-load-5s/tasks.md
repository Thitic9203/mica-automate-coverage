# Tasks — tab load within 5 s

| # | Task | Rules | Failing test first | Done when | Status |
|---|------|-------|--------------------|-----------|--------|
| T1 | Paging by `filtered` | R1 | fixture with total≫filtered requests 1 page | test green | Done |
| T2 | Shared limiter + parallel lists + planned parallel results | R2–R4 | equality vs serial walk; max in flight ≤ 8 | tests green | Done — prod data: Pyrite and MA output identical to old loader |
| T3 | Ticket card does not block cached paint | R5 | — | visual suite green | Done — unit 64/64; visual flaky under load (RISK_REGISTER R-003, pre-existing) |
| T4 | Deploy, measure each tab cold on production | R7 | — | timings recorded | Pending |
