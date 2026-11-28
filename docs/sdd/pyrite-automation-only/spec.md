# Spec — Pyrite tab counts automation only

Source: owner popup 2026-11-28: "นับเฉพาะ automation (แนะนำ)" and "ตั้งให้ 135 case" (Qase automation = 2 for the
scripted cases). Amends pyrite-tab-pluton R2 (Pyrite overview) and its "known gap" note, and live-qase-tabs R2–R4 for
the Pyrite tab only. MA and OLS are unchanged.

Evidence (2026-11-28): Pyrite has 34 completed runs; one is automated, run 101 "Pyrite Automate · dev · filter 24024
first round · 28 Nov 2026 20:57" (133 cases, all passed, created by `npm run report:qase` in pyrite-qa-e2e). The other
33 are manual per-ticket runs ("PYR-xxx …"). pyrite-qa-e2e `main` names a Qase case in a test title as
`` test(`PYRITE-<id> — ${tc('PYRITE-<id>').title} …`) `` (its rule N1, gate `npm run gate:titles`): 135 distinct ids,
all present in Qase. The old count (passed 351 / not passed 136 / to be automated 1,796) mixed manual results in.

## Rules

- **R1** — A Pyrite case is *automated* when its id appears in a test title `` `PYRITE-<id> — `` in any
  `tests/**/*.spec.ts` of Thitic9203/pyrite-qa-e2e branch `main`, read live (GitHub tarball, same token as the ticket
  figure). The Qase `automation` field is not used for Pyrite.
- **R2** — A new Pages Function `GET /api/pyrite-automated` returns `{ measuredAt, caseIds: [<number>…] }` (ascending),
  edge-cached 5 min, GET/HEAD only; on failure a non-200 with `errorMessage`.
- **R3** — Pyrite results come only from completed runs whose title starts with `Pyrite Automate ·`; the newest such
  run that lists a case gives its result (live-qase-tabs R2/R4 otherwise unchanged).
- **R4** — Classification: a result → passed / not passed by status; no result and automated (R1) → not passed
  ("not run (script ready)"); otherwise → to be automated.
- **R5** — If the automated id list cannot be read, the Pyrite tab shows no new numbers (update fails, cached numbers
  stay with the failure note, as live-qase-tabs R12).
- **R6** — Qase: the scripted cases get `automation = 2` (one-off write, owner-approved), so Qase itself agrees.

## Edge cases

- A case in an automated run but no longer in any script: still counted by its result (it was run by automation).
- A test title id missing from Qase: ignored (not a case of the project).

## Done when

- Production Pyrite tab: passed 133, not passed 2 (2696, 2697 not run), to be automated 2,148 of 2,283 (or the live
  values at the time, checked against run 101 and the 135 ids).
- Unit tests for R1, R3, R4, R5; visual + axe green under `--repeat-each`.
- Qase: the 135 cases read automation = 2.
