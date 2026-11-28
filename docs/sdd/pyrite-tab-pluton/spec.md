# Spec — "Pyrite" tab, Pluton brand and the pluton URL

Status: owner order 2026-11-28 ("เพิ่ม tab ว่า Pyrite เพื่อแสดง progress automate ของ Pyrite ใช้ฟอแมตรายละเอียดแบบเดียวกับ
tab OLS · ต้องมีการไปสร้าง filter ใน jira มาเพื่อมันด้วย และต้องซิงก์กับ Qase.io ด้วย · ตรงตามรูปปรับเป็นคำว่า Pluton ·
ปรับ URL ให้จาก mica เป็น pluton"). Owner answers 2026-11-28 (popup): ticket figure computed live by a Pages Function;
"automated ticket" = ticket named by a `tickets` annotation in pyrite-qa-e2e; old URL redirects to the new one.
Production only (CLAUDE.md, memory mica-coverage-no-staging).

## Sources

- Qase project code `Pyrite` (2,283 cases, 43 runs on 2026-11-28; custom field 4 "Test Case Type" enabled for it).
- Jira filter 24024 "Pyrite: Done Bug & Story" (owner's own scope of Done Story/Bug tickets, shared to project PYR).
- `Thitic9203/pyrite-qa-e2e` (private) `main`: every test names its tickets as
  `annotation: { type: 'tickets', description: 'PYR-951, PYR-781' }` (docs/sdd/e2e-tickets-annotation there).

## Rules

- **R1** — The tab strip MUST show a third tab **Pyrite** after OLS. It renders with the OLS layout (live-qase-tabs
  R1–R6, R10–R11, R18–R19): Total / Passed / Not passed / To be automated cards, Case progress bar and legend, Cases by
  type, notes row, plus a "Done tickets with an automated case" card.
- **R2** — Case figures MUST be computed in the browser from Qase project `Pyrite` through `/api/qase` on every open,
  with `buildPyriteOverview` in `public/ma-progress-core.mjs` (same per-case run walk and classification as OLS,
  live-qase-tabs R2–R5). Cache key `pluton-pyrite-overview`; the same retry, hedge and timeout as the other tabs.
- **R3** — Wording: header "Pyrite · Automation progress", scope "All cases of project Pyrite on Qase.io", case source
  "Qase project Pyrite, every case in the project", Qase link `app.qase.io/project/Pyrite`. While the tab is active the
  page title reads "Pyrite Automation Coverage" and the eyebrow "PYRITE · QA".
- **R4** — The ticket card MUST read `GET /api/pyrite-tickets`, a Pages Function that on each call (edge-cached 5 min):
  - **R4a** lists the keys of Jira filter **ALL** (R5) via the Jira REST search;
  - **R4b** reads every `tests/**/*.spec.ts` of pyrite-qa-e2e `main` in one tarball request and collects every
    `PYR-<n>` named in a `type: 'tickets'` annotation description;
  - **R4c** returns `{ measuredAt, done, withAutomatedCase, percent, filters: { automated, all } }` where
    `done` = keys of ALL, `withAutomatedCase` = keys of ALL also annotated, `percent` = one decimal;
  - **R4d** when the JQL of filter **AUTOMATED** (R5) is not `filter = <ALL> AND issuekey in (<sorted keys>)`
    (no keys: `filter = <ALL> AND created < "1970-01-01"`; Jira rejects `issuekey is EMPTY`), rewrites it, so the filter always equals the card;
  - **R4e** answers only GET/HEAD (405 otherwise); with a secret missing or an upstream error it answers 502/500 with
    the reason and no number; it never returns a token or a ticket summary.
- **R5** — Two Jira saved filters MUST exist, owned by the owner's account, shared to project PYR:
  **ALL** = 24025 "Pyrite Automate · Done tickets (board scope)" JQL `filter = 24024`, and **AUTOMATED** = 24026 "Pyrite Automate · Done
  tickets with an automated case" (JQL written by R4d). The card links both, one per line.
- **R6** — The card shows the percent, "x of y tickets" and "updated automatically, measured <Bangkok time>"; on error
  it says "Ticket figure not available (<reason>)" and shows no number.
- **R7** — Brand: the top-left chrome name reads **Pluton** (was "Mica"); the browser title reads "Pluton · Automate
  Coverage". Tab titles/eyebrows of MA and OLS stay as they are (ols-tab R13).
- **R8** — URL: the site is served at `https://pluton-automate-coverage.pages.dev/` (new Cloudflare Pages project,
  free tier; a Pages project cannot be renamed). `https://mica-automate-coverage.pages.dev/<path>` answers a 301 to the
  same path on the new host. Sign-in MUST work on the new host (Firebase authorized domain).
- **R9** — Secrets live only in the new project's Pages secrets: `QASE_API_TOKEN`, `JIRA_BASIC` (`email:token`),
  `GITHUB_TOKEN` (read-only contents of pyrite-qa-e2e). They are set by the owner, never by the AI (global safety rule:
  no token typed by the AI); no token in the repo or page.
- **R10** — Visual regression (live-qase-tabs R14) covers the Pyrite tab at 390 / 900 / 1440 px, both themes, axe 0.

## Edge cases

- A Pyrite case never in a completed run and with Qase `automation` = 0 counts as To be automated (live-qase-tabs R3).
  On 2026-11-28 every Pyrite case has `automation` = 0 and scripts carry no Qase case id, so scripted-but-not-run cases
  cannot be told apart yet (follow-up, not in scope).
- Annotations naming a key outside ALL do not count (they are not Done in scope).

## Out of scope

- Writing Qase `automation` flags for Pyrite (needs a case↔script mapping that does not exist).
- Renaming the GitHub repository.

## Done when

- Pyrite tab live on the new URL with numbers equal to a node dry run against Qase.
- Card equals the AUTOMATED filter count; both filters open in Jira.
- Old URL 301s to the new one; sign-in works on the new host.
- Unit + visual/axe tests green.
