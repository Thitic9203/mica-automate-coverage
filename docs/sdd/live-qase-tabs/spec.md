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

- **R10** — (owner order 2026-10-28, screenshot) The top-right status pill MUST read, on two lines,
  **"Updated Date: DD/Mon/YYYY hh:mm AM|PM"** (Bangkok, the `measuredAt` of the numbers the active tab shows)
  and **"Refreshes each time you open this tab"**. While the live update runs the second line reads
  "Updating from Qase…"; when it fails, "Update failed — showing the last numbers". It never stays on
  "Loading…" once a tab has numbers. At ≤1024 px the pill and Sign out take their own row above the tabs
  so the header never overflows; tab names are never cut (they wrap); tabs and Sign out are ≥44 px tall
  on ≤1024 px and on touch screens.

- **R11** — (owner order 2026-10-28 "not passed ไม่มีสีเลย ต้องมีครบนะ") Every status with a count > 0 MUST
  show its colour in the Case progress bar, however small its share (segment widths follow the counts,
  each non-zero segment at least 6 px wide); a status with count 0 shows no segment. A card whose count
  is > 0 but rounds to 0.0 % MUST read "<0.1%", never "0%".

- **R12** — (measured 2026-10-28 21:27: six tabs opened together got `Qase HTTP 429`) An HTTP 429 from Qase
  MUST be retried, waiting the `Retry-After` seconds when given (else 2 s, 4 s, 6 s), up to 3 more tries;
  supersedes ma-tabs R28 "4xx fails at once" for 429 only. The proxy forwards `Retry-After`.
- **R13** — The proxy MUST cache each Qase GET at the Cloudflare edge for 60 s (`cf.cacheTtl`), so viewers
  opening the board together share one Qase call per page; a run completed in Qase shows within 60 s.

- **R14** — (global rule 19) Visual regression: `tests/visual/tabs.visual.spec.cjs` screenshots both tabs at
  390 / 900 / 1440 px against committed baselines (Firebase stubbed, Qase fixtures, motion off, web fonts
  loaded, live pill and Measured masked), 0 differing pixels allowed, plus no horizontal scroll. Run:
  `NODE_PATH=<ols-qa-e2e>/node_modules <ols-qa-e2e>/node_modules/.bin/playwright test -c
  playwright.visual.config.cjs`. Both themes are shot (12 baselines) and each shot also runs axe (wcag2a/aa, wcag21aa) → 0 violations.
- **R15** — (owner order 2026-10-28 "ทำเสร็จทั้งหมด", global rule 16.2; supersedes ma-tabs "dark mode out of
  scope") Light and dark themes: every CSS colour is a `:root` token with a `[data-theme="dark"]` set; the theme
  is applied by a head script before first paint; a saved choice (`localStorage` `mica-theme`) wins over the
  system setting; a square icon button left of the date pill toggles it
  (owner screenshot 2026-10-28: sun icon in light theme, moon icon in dark theme, 1 px border, ≥44 px,
  `aria-label` "Dark mode", `aria-pressed`); Sign out shows a log-out icon before its label.

- **R16** — (owner order 2026-10-28 "ตรงนี้ต้องคำนวณและปรับอัตโนมัติเสมอ ตามจริง โดยไม่ดีพอยใหม่"; supersedes R7)
  The OLS "Done tickets with an automated case" card MUST read
  `https://raw.githubusercontent.com/Thitic9203/mica-automate-coverage/site-data/ols-tickets.json`
  (`{ measuredAt, done, withAutomatedCase, percent }`, published every 30 min by ols-qa-e2e spec ols-tickets-publish,
  same figure as gate:tickets and the Slack notify). The card shows "updated automatically" and the measured time;
  when that time is more than 2 h old it adds "publisher has not reported for over 2 h". When the file is missing or
  malformed the card says so and shows no number. No deployed file is read for it any more.

- **R17** — (owner 2026-10-28 "แดชบอร์ด … ต้องอัตโนมัติ ไม่ใช่จะเปลี่ยนค่าทีต้องดีพอยใหม่") `public/` MUST NOT ship any data
  file: every figure comes from Qase (live) or the `site-data` branch (auto-published). `ma-progress.json` and
  `ols-progress.json` are removed.

## Done when

- Tests: a case in an older run keeps its result when the newest run omits it; a 1-case retest run does
  not touch other cases; the walk stops after the newest run when it covers every listed case; OLS
  overview built from mocked Qase.
- Production: MA still reads total 2011 · passed 586 · not passed 1 · to be automated 1424; OLS reads its
  live numbers from Qase OLS (runs 6–8); `node --test scripts/*.test.mjs` green.
