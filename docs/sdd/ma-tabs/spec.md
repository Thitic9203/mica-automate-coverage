# Spec — "MICA 1 · EvMS · ELMS · CBMS" tab (Qase project MA)

Status: draft for implementation · owner order 2026-10-21, corrected the same day to **one tab** holding all
four systems (not four tabs).

## Source of every number

`public/ma-progress.json`, written by `scripts/build-ma-progress.mjs` from the Qase API v1, project **MA**
("MICA - Automation"). The page never computes or types a count of its own and never calls Qase for this tab.

## Rules — tab bar

- **R1** — The tab bar MUST NOT show the tabs Overview, By Suite and All Test Cases (hidden permanently,
  owner order 2026-10-21). Their render code stays in the file; only the tab buttons are removed.
- **R2** — The tab bar MUST show exactly two tabs, in this order: **"MICA 1 · EvMS · ELMS · CBMS"**, then
  **"OLS"**. The page MUST open on the MA tab.
- **R3** — While the MA tab is active the title and eyebrow stay "Mica Automation Coverage" / "MICA · QA"
  (ols-tab R13 is unchanged).

## Rules — builder (`scripts/build-ma-progress.mjs`)

- **R4** — The builder MUST read the Qase token from env `QASE_API_TOKEN`, else from the file named by env
  `QASE_TOKEN_FILE`, and MUST NOT print, log or write the token anywhere.
- **R5** — A **system** is a top-level MA suite (no parent) whose title, compared case-insensitively and
  ignoring spaces, is `MICA1`, `EVMS`, `ELMS` or `CBMS`. A system's **cases** are the cases in that suite
  and all its descendant suites.
- **R6** — `totalAutomated` = the system's cases with Qase `automation` = automated (value `2`).
- **R7** — `run` = the latest **completed** MA run (by end time, then id) that contains at least one of the
  system's cases; `null` when no such run exists. For that run: each of the system's cases in the run takes
  its latest result in the run; `passed` = cases whose status is `passed`; `notPassed` = all other cases of
  the system in the run (failed, blocked, skipped, invalid, untested, …); `cases` = passed + notPassed;
  percents = count ÷ `cases` × 100, one decimal. `title` and `completedAt` come from the run.
- **R8** — Output `public/ma-progress.json`:
  `{ measuredAt, project: "MA", systems: { MICA1?, EVMS?, ELMS?, CBMS? } }`, each system
  `{ suite, totalAutomated, run: null | { title, completedAt, cases, passed, notPassed, passedPercent,
  notPassedPercent } }`. A system with no suite is **absent** from `systems`. No host, email, token or id.
- **R9** — On any API error the builder MUST exit non-zero and MUST NOT overwrite the existing JSON.

## Rules — the tab

- **R10** — The tab MUST show one section per system, in the order MICA 1, EvMS, ELMS, CBMS, each with
  the system name as heading.
- **R11** — A present system's section MUST show three cards in the OLS card format (count large, percent
  smaller on its own line under it, the total card reserving that line): **Total automated**
  (`totalAutomated`), **Automated · passed** and **Automated · not passed** (from `run`).
  When `run` is `null` the two run cards read **"No test run yet"** and show no number.
- **R12** — An absent system's section MUST read **"No data in Qase yet"** and show no number. It fills in
  automatically once the builder finds the suite (R5).
- **R13** — No "Waiting to automate" card, no HTML report link, no ticket card (owner order 2026-10-21).
- **R14** — One shared notes row: **Measured** (`measuredAt`, Bangkok time) and **Source**
  ("Qase project MA · one top-level suite per system"). For each system with a run, the row also names the
  latest run: title, completed date (Bangkok time) and its case count for that system.
- **R15** — Each figure appears on the page once (ols-tab R9).
- **R16** — Motion as ols-tab R7: `gsap.from()` + `clearProps`, numbers count up, nothing animates when
  `prefers-reduced-motion` is set or GSAP did not load, no logic depends on a tween.
- **R17** — CSS grid layout; no horizontal page scroll and no clipped text at 1440, 900 and 390 px.
- **R18** — When the JSON is missing or malformed the tab says so and shows no numbers.

## Rules — total cases per system (owner order 2026-10-22: "เพิ่มการ์ดจำนวนเคสทั้งหมดต่อระบบ")

Source: owner chat 22/Oct after CBMS (317 cases) and ELMS (66 cases) showed only "Total automated 0" —
the owner expects the cases that exist in Qase to be visible.

- **R19** — The builder MUST write `totalCases` for each present system: the count of all cases in the
  system's suite and its descendant suites (R5), whatever their `automation` value. R8's system shape
  becomes `{ suite, totalCases, totalAutomated, run }`; `totalAutomated ≤ totalCases` MUST hold, otherwise
  the builder exits non-zero and writes nothing (R9).
- **R20** — A present system's section MUST show four cards, in this order: **Total cases**
  (`totalCases`), **Total automated**, **Automated · passed**, **Automated · not passed**. Total cases
  uses the same card format as Total automated (count, reserved percent line, no percent). R11 is amended
  from three cards to these four.
- **R21** — The card grid for the MA tab: 4 columns above 1024 px, 2 columns at ≤ 1024 px, 1 column at
  ≤ 640 px (R17 still applies: no overflow, no clipped text at 1440 / 900 / 390).
- **R22** — The page MUST treat JSON without a numeric `totalCases`, or with `totalAutomated > totalCases`,
  as malformed (R18).

## Rules — live data, no redeploy (owner order 2026-10-28)

Source: owner chat 28/Oct — "มันควรจะอัตโนมัตินะ ทำไมต้องให้ดีพอยใหม่ตลอดเลย" after the 22/Oct snapshot showed
MICA 1 1349 / CBMS 317 total cases while Qase MA held 2153 / 627. Owner picked "ดึงสดในเบราว์เซอร์" after a
server-side Pages Function was measured over the free plan (case pages 7.51 MB, `JSON.parse` 19.3 ms vs the
10 ms CPU limit, Cloudflare Workers Limits page, updated 12 Oct 2026). This section supersedes the "Source of
every number" note and the "Calling Qase from the browser" out-of-scope line for this tab.

- **R23** — The MA tab MUST compute its numbers in the browser each time the tab renders, from Qase project MA
  through the existing proxy `/api/qase/*`, with the same rules as the builder (R5–R7, R19). No snapshot file
  and no deploy are needed for the numbers to change.
- **R24** — The counting logic MUST live in one module, `public/ma-progress-core.mjs` (no Node-only imports),
  used by both the page and `scripts/build-ma-progress.mjs`; the builder's exports stay as they are.
- **R25** — Paging MUST fetch the first page, then the remaining pages of the same list concurrently, and keep
  the entities in offset order.
- **R26** — `measuredAt` is the time the browser finished the computation; the notes row shows it (R14).
- **R27** — While computing, the tab MUST show a loading message and no numbers; on any Qase or shape error it
  MUST show an error message and no numbers (R18). The message MUST NOT ask anyone to regenerate a file or deploy.

- **R28** — (measured 28/Oct: the proxy returned HTTP 521 for 3 of 31 pages in one round) A page request that
  fails with HTTP 5xx or a network error MUST be tried again at most twice with a short back-off; a 4xx MUST
  fail at once. If it still fails, R27 applies (error, no numbers).

- **R29** — (measured 28/Oct in production: proxy `wallTime` 29.3 s and 38.8 s with 1–3 ms CPU on single case
  pages, i.e. waiting on Qase, while the same pages answer in ~2–3 s most of the time) each page request MUST
  be aborted after 10 s; an abort counts as a network failure and is retried under R28.

Done when (R23–R29): page values equal a fresh builder run against Qase MA at the same time; the tab shows
MICA 1 2153 / CBMS 627 total cases as of 28/Oct without any JSON change; `node --test scripts/` green.

## Rules — OLS layout, all systems together (owner order 2026-10-28)

Source: owner chat 28/Oct — "ปรับ tab MICA 1 · EvMS · ELMS · CBMS ให้มีเนื้อหาและรูปแบบเหมือน tab OLS ยกเว้นแค่ไม่มี
Playwright report"; answers: "Mica1/EvMS, ELMS, CBMS พวกนี้นับสถิติรวมกัน ไม่แยก", TO BE AUTOMATED = every case not
automated, statuses "เอาตามสถานะของ Playwright report", parts with no MA source are dropped; "ทุกข้อมูลจะอัปเดต
อัตโนมัติ รีเฟรชทุกครั้งที่มีการสลับ tab หรือรีเฟรชหน้า … แบบที่ไม่ต้องดีพอยใหม่". The OLS tab as served on
28/Oct (cards, bar, tickets card, cases-by-type card, notes; no case table — that is open PR #11) is the model.
These rules replace R10–R12, R15 and R19–R22 for the page; R23–R29 still apply.

- **R30** — Defect fix (measured 28/Oct): run #1 "MICA1 & MICA2" is returned by `GET /run/MA?status=complete` with
  `status: 3` / `status_text: "failed"`, and the old `status === 1` re-check dropped it, so the tab said "No test
  run yet" while Qase held 586 passed / 1 failed. A run counts as completed when the API's `status=complete`
  filter returns it **and** it has an `end_time`; no other status check.
- **R31** — The four systems (R5) are counted **together** as one case set: the union of their suite trees.
- **R32** — Per case: `automation ≠ 2` → **waiting** (TO BE AUTOMATED), whatever results exist. Otherwise the
  case's latest result in the **pass-results run** (the latest completed run, R30, containing any counted case):
  `passed` → PASSED; `failed` → FAILED; `skipped` → SKIPPED; no result → NOT RUN; any other Qase status →
  counted under not passed under its own Qase name (never folded into another word). FLAKY has no Qase source
  and shows "—", never a number (global rule 20).
- **R33** — Cards as the OLS tab: Total cases · Automated · passed · Automated · not passed (failed / flaky /
  skipped / not run, plus any other status by name) · Waiting to automate; percents of total to one decimal;
  `passed + notPassed + waiting = total` or the tab shows its error (R27).
- **R34** — "Case progress" bar (passed / not passed / waiting) as OLS R3, full width (no ticket card: MA has no
  Jira source).
- **R35** — "Cases by type" card as OLS R11/R19 from Qase custom field 4 ("Test Case Type": 1 Happy Path,
  2 Failure Scenario, 3 Edge Case, 4 Exceptional Case) plus an **Empty** row for cases with no value (counted
  normally — owner rule for dashboards); shares by largest remainder to exactly 100.0%; Total row; a value that is
  not one of 1–4 (or several values) hides the card and says why.
- **R36** — Notes: Measured · Pass results from (run title, started, completed) · when results exist for cases
  not marked automated, the count of those results, stated · Case source (Qase project MA, MICA 1 · EvMS · ELMS ·
  CBMS counted together) · Qase link. No report link, no report totals, no ticket filters.
- **R37** — Every render (tab switch, reload, URL open) recomputes from Qase (R23); no redeploy is ever needed
  for numbers.

Done when (R30–R37): live page equals a Node run of the same core against Qase at the same time; 28/Oct expected
from Qase: total 3074, automated 587, run #1 results 586 passed / 1 failed; no overflow at 1440 / 900 / 390;
`node --test scripts/*.test.mjs` green.

## Done when

- The tab bar reads "MICA 1 · EvMS · ELMS · CBMS", "OLS" and nothing else; the page opens on the MA tab.
- Builder known-answer tests pass: no run → `run: null`; mixed statuses → correct counts; missing suite →
  system absent; token never in stdout/stderr.
- Values on screen equal `public/ma-progress.json`; overflow 0 at 1440 / 900 / 390; OLS tab unchanged.

## Out of scope

Calling Qase from the browser for this tab; dark mode for the site; deleting the hidden tabs' code.
