# Spec — Both tabs follow the latest Qase test runs with no deploy

Status: owner order 2026-10-28 ("จัดการให้ครบ มันต้องออโตถ้ามีเทสรันใหม่ ใน qase.io มันจะแสดงผลล่าสุด ใหม่เลย
ในบอร์ดทั้งสองแท้ป แบบไม่ต้องดีพอยใหม่"). Production only (CLAUDE.md).

Supersedes: ma-tabs R7 and the run choice in R31–R33 (one latest run for all cases); ols-tab "Source of every
number", R2–R5, R10, R11, R14 for the case figures (they came from `ols-progress.json`).

## Why

- MA used only the single newest completed run that touched any case. A partial run (one system, or a
  1-case retest) would turn every other case back to "to be automated" — Qase OLS already has such a run
  (run 7, 1 case).
- OLS read a JSON file made in ols-qa-e2e, so a new Qase run showed only after an export + deploy.

## Definitions

- **Project scope** — MA: cases in the suite trees MICA1 · EVMS · ELMS · CBMS (ma-tabs R5). OLS: every case
  in Qase project OLS (no Qase field marks the old Done-ticket set; checked 2026-10-28: tags are ticket
  keys, milestones are sprints).
- **Completed run** — a run with `end_time` (ma-tabs R30, unchanged). A run left open never counts.
- **Case result** — for each case in scope: the newest completed run (end_time desc, then id desc) whose
  `cases` lists it; inside that run, its result with the latest `end_time`. Results for case ids not in
  scope (deleted cases) are ignored.

## Rules

- **R1** — Both tabs MUST compute their numbers in the browser from Qase through `/api/qase` on every open,
  with the same module (`public/ma-progress-core.mjs`); no number may come from a deployed file except
  the OLS ticket figure (R7).
- **R2** — Each case takes its own **case result** (Definitions). A newer run that does not list a case
  MUST NOT change that case.
- **R3** — Classification (ma-tabs R32, unchanged): result `passed` → passed; any other result status →
  not passed (failed / skipped / other); listed in its run with no result, or no run lists it while
  Qase `automation` = automated → not passed · not run; otherwise → to be automated.
  `passed + notPassed + waiting = total` MUST hold, else the tab shows an error and no numbers.
- **R4** — Results are fetched run by run, newest first, and the walk MUST stop once every case listed by
  any completed run has its result; cases no run lists need no result fetch.
- **R5** — "Cases by type" for both tabs: Qase custom field 4 (1 Happy Path, 2 Failure Scenario, 3 Edge
  Case, 4 Exceptional Case) plus **Empty**; rows add to the totals (ma-tabs R35, OLS R19 shares).
- **R6** — The notes row MUST name the newest completed run that gave any case its result (title, started,
  completed, Bangkok time) and how many completed runs contributed.
- **R7** — The OLS "Done tickets with an automated case" card keeps reading `tickets` from
  `ols-progress.json` (Jira, not in Qase) and MUST show that file's own measured time on the card, so it is
  never mistaken for live.
- **R8** — The OLS tab MUST use the MA pattern: last numbers from this browser at once (key
  `mica-ols-overview`), then live (ma-tabs R41); the same timeout, retry and hedge (R28, R29, R40).
- **R9** — Wording: OLS header scope "All cases in Qase project OLS"; case source "Qase project OLS";
  the to-be-automated card reads "not automated and no run result" on both tabs.

## Done when

- Tests: a case in an older run keeps its result when the newest run omits it; a 1-case retest run does
  not touch other cases; the walk stops after the newest run when it covers every listed case; OLS
  overview built from mocked Qase.
- Production: MA still reads total 2011 · passed 586 · not passed 1 · to be automated 1424; OLS reads its
  live numbers from Qase OLS (runs 6–8); `node --test scripts/*.test.mjs` green.
