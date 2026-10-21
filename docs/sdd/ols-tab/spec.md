# Spec — "OLS" tab on the coverage site

Status: draft for implementation · owner order 2026-10-20 (“สร้าง tab ใหม่ชื่อว่า OLS แล้วออกแบบการแสดง
progress ลงไป … ทั้งหมดกี่เคส · automate แล้ว passed กี่เคส % · not passed กี่เคส % · รอทำ automate
อีกกี่เคส %”).

## Source of every number

`public/ols-progress.json`, written by `npm run report:olsprogress` in ols-qa-e2e (spec
`ols-qa-e2e/docs/sdd/ols-progress-export`). The page never computes or types a count of its own.

## Rules

- **R1** — The tab bar MUST show a tab labelled **OLS** after the existing three; clicking it renders
  the OLS view; the other tabs keep working unchanged.
  *Amended 2026-10-21 (spec `docs/sdd/ma-tabs` R1–R2): Overview, By Suite and All Test Cases are hidden;
  the tab bar is “MICA 1 · EvMS · ELMS · CBMS” then OLS.*
- **R2** — The view MUST show four cards: total cases, automated · passed, automated · not passed,
  waiting to automate — each with its count, and (except total) its percent of total, read from
  `cases` in the JSON. The not-passed card also shows failed / flaky / skipped / not run.
  Layout (owner, 21 Oct 2026): the count MUST be large, and its percent MUST sit smaller on its own
  line directly under the count — never side by side. The total card, which has no percent, MUST
  reserve the same line so the counts and the lines below them line up across the four cards.
- **R3** — The view MUST show one proportion bar of passed / not passed / waiting whose segment widths
  are the JSON percents, with a legend naming each segment.
- **R4** — The view MUST show the Done-ticket figure (`tickets.withAutomatedCase` of `tickets.done`,
  `tickets.percent`) labelled as tickets, not cases.
- **R5** — The view MUST show when the numbers were measured (`measuredAt`, Bangkok time) and which
  round the pass results come from (`round.label`, `round.startedAt`), and the definitions: unique
  caseId · all platforms · Done tickets excluding Dev_Task / QA_Task · flaky counts as not passed.
- **R5b** — When `round.reportUrl` is present the view MUST show a link labelled “Open HTML report”
  next to the round, opening in a new tab; the report itself is hosted privately (claude.ai artifact),
  never on this public site. When it is absent the view shows no link. Owner order 2026-10-21.
- **R6** — When the JSON is missing or malformed the view MUST say so and show no numbers.
- **R7** — Motion follows the owner's UI rule: bar segments grow from the left with `gsap.from()` +
  `clearProps`; numbers count up; nothing animates when `prefers-reduced-motion` is set or GSAP did
  not load; no logic depends on a tween having run.
- **R8** — Layout works at ≥1280, 768–1024 and ≤430 px wide without horizontal page scroll; the four
  cards use CSS grid; text never clips.

- **R9** — Each figure and each definition MUST appear on the page once (owner order 2026-10-21,
  “อย่าแสดงข้อมูลซ้ำซ้อนกัน”): the bar legend names the segments only (counts and percents live on the
  cards), and the notes row carries only what no card says (cases retired by the PO are not counted).

- **R10** — The header scope line MUST read “Unique caseId from all platforms (Desktop 1440×900 · Tablet
  768×1024 · Tablet landscape 1024×768 · Mobile 375×812 · Mobile landscape 844×390)”, viewports from
  `ols-qa-e2e/tests/e2e/config/viewports.ts`. The notes row “Case source” MUST read “**Done tickets (Story /
  Task / Bug)**, excluding Dev_Task and QA_Task”, replacing the earlier retired-cases note (owner order
  2026-10-21).

- **R11** — The view MUST show a “Cases by type” card: one row per Qase Test Case Type (Happy Path,
  Failure Scenario, Edge Case, Exceptional Case) plus “No type”, each with its case count, passed and not
  passed, read from `caseTypes` in the JSON (export spec R6). The rows use CSS grid and the existing
  tokens; each number appears once (R9); counts count up under R7. When `caseTypes` is missing or
  malformed the card is not shown (the rest of the view still renders). Owner order 2026-10-21
  (“เพิ่มการบอกลักษณะของเคสด้วย เช่น happy path …”).

- **R12** — Under the ticket figure the card MUST show two links, one per line, to saved Jira filters whose
  JQL is the exact key list the figure counts: the tickets with an automated case, and all Done tickets in
  scope. URLs come from `tickets.filters` in the JSON; a missing or malformed URL shows no link. Owner order
  2026-10-21.

- **R13** — While the OLS tab is active the page title MUST read “OLS Automation Coverage” and the eyebrow
  “OLS · QA”; the other tabs keep “Mica Automation Coverage” / “MICA · QA”. Owner order 2026-10-21.

- **R14** — Every case has a type (export R6f/R6g), so the type card shows no “No type” row. Both tabs
  MUST link their Qase project (OLS tab → app.qase.io/project/OLS, MA tab → app.qase.io/project/MA) in the
  notes row. Owner order 2026-10-21.

- **R15** — The notes row MUST show the linked HTML report's own run totals (`round.reportStats`: passed ·
  failed · skipped · flaky, counted per test × viewport) next to the report link, copied from that report's
  embedded `report.json` stats, so the page and the report never disagree. The case cards stay per unique
  caseId and are labelled as such. Owner order 2026-10-21 (every automate round).

- **R16** — (owner order 2026-10-22, approved 2026-10-22) Below the rest of the OLS view
  the page MUST show a case table from `public/ols-cases.json` `rows` (export spec R7/R7h), headers in English:
  **Qase ID** (link to the case in app.qase.io project OLS; plain text when `qaseId` is null) · **Case** ·
  **Title** · **Automation** · **Result** · **Case Type** · **Role** · **Module**.
  - **R16a** — Above the table: filters Automation, Result, Case Type, Role, Module (options built from the
    row values, each with its count) and one search box (matches Qase ID, Case, Title, Module). At ≥768 px
    the filters are custom listbox controls; below 768 px they open a bottom sheet with
    `env(safe-area-inset-bottom)` padding — no native `<select>` on mobile (global rule 16).
  - **R16b** — Every header is a button that sorts asc/desc and sets `aria-sort` on its `th`; one sort
    active at a time; Thai titles sort with `localeCompare('th')`.
  - **R16c** — Below the table: pagination with page size 25 / 50 / 100 (default 25), page x of y, and
    "a–b of n" for the filtered set. Filters, search and sort reset to page 1.
  - **R16d** — With no filter, the counts per Automation / Result / Case Type MUST equal the cards and the
    type card above (same JSON); the page computes nothing that the JSON does not carry as rows.
  - **R16e** — Layout: a real `<table>` inside a scroll container on desktop/tablet; at ≤430 px each row
    becomes a CSS-grid card; no horizontal page scroll at 1440 / 900 / 390; tap targets ≥44 px; tokens
    only. Motion per R7 (rows fade with `gsap.from` + `clearProps` on first render only; no-op under
    reduced motion). Re-render 2–3 times leaves no extra nodes.
  - **R16f** — When `ols-cases.json` is missing or malformed, or its `measuredAt` differs from
    `ols-progress.json`, the table section is not shown (the mismatch is stated); the rest renders.
  - **R16g** — Role cells list every role of the case; the Role filter matches a row when any of its
    roles is selected (so per-role counts may add up to more than the case total — stated under the
    filter). Result values: Passed, Failed, Flaky, Skipped, Not run, — (Flaky counts as not passed).

## Out of scope

Dark mode for the whole site (the site has no theme system today — a separate change).
