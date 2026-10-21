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

- **R10** — The scope line MUST read “Unique caseId from all platforms (…)” and name each platform with its
  viewport from `ols-qa-e2e/tests/e2e/config/viewports.ts`: Desktop 1440×900 · Tablet 768×1024 · Tablet
  landscape 1024×768 · Mobile 375×812 · Mobile landscape 844×390 (owner order 2026-10-21).

## Out of scope

Dark mode for the whole site (the site has no theme system today — a separate change).
