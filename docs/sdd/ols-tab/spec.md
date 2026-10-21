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
- **R3** — The view MUST show one proportion bar of passed / not passed / waiting whose segment widths
  are the JSON percents, with a legend naming each segment.
- **R4** — The view MUST show the Done-ticket figure (`tickets.withAutomatedCase` of `tickets.done`,
  `tickets.percent`) labelled as tickets, not cases.
- **R5** — The view MUST show when the numbers were measured (`measuredAt`, Bangkok time) and which
  round the pass results come from (`round.label`, `round.startedAt`), and the definitions: unique
  caseId · all platforms · Done tickets excluding Dev_Task / QA_Task · flaky counts as not passed.
- **R6** — When the JSON is missing or malformed the view MUST say so and show no numbers.
- **R7** — Motion follows the owner's UI rule: bar segments grow from the left with `gsap.from()` +
  `clearProps`; numbers count up; nothing animates when `prefers-reduced-motion` is set or GSAP did
  not load; no logic depends on a tween having run.
- **R8** — Layout works at ≥1280, 768–1024 and ≤430 px wide without horizontal page scroll; the four
  cards use CSS grid; text never clips.

## Out of scope

Dark mode for the whole site (the site has no theme system today — a separate change).
