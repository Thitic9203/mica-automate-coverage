# Tasks — Pyrite automation only

| # | Task | Rules | Failing test first | Done when | Status |
|---|------|-------|--------------------|-----------|--------|
| T1 | `automatedCaseIds` + `/api/pyrite-automated` | R1, R2 | ids from fixture tar | tests green | Done |
| T2 | Builder: run filter + automated set; page wiring | R3–R5 | manual run ignored; scripted no-result = not run | tests green | Done |
| T3 | Qase automation = 2 for scripted cases | R6 | — | 135 read back as 2 | Done 2026-11-28 — written to custom field 97 \"Automation Status\" (the system `automation` field is never applied by Qase); read back 135 × \"2\" |
| T4 | Deploy, verify production numbers | all | — | numbers match evidence | Pending |
