# Tasks — UI scale 70%

| # | Task | Rules | Failing test first | Done when | Status |
|---|------|-------|--------------------|-----------|--------|
| T1 | Add `--ui-scale` token, root zoom, `#app` height compensation | R1–R4 | visual suite fails vs old baselines | measured scale 0.7, no bottom gap | Done — body zoom 0.7 asserted, #app >= 899px at 900px window |
| T2 | Regenerate baselines, run suite twice, axe | R1, R5 | — | 2× green, 0 axe violations | Done — 19/19 three runs in a row, axe 0 |
| T3 | RISK_REGISTER entry; deploy production; verify | R1 | — | production shows 70% | Done 2026-11-28 — PR #44 merged (2e7a55a), deployed; production HTML carries --ui-scale 0.7 + body zoom |
