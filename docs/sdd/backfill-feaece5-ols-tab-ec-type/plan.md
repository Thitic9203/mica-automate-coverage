# Plan — backfill-feaece5-ols-tab-ec-type (written after the code, 2026-10-21)

Files the commit touched (already on `main`, not changed by this backfill):

- `public/index.html` — one line: the type-card note names Exceptional = ticket EC item (R1)
- `public/ols-progress.json` — numbers refreshed from the export (R2)

Libraries: none. Cost: none.
What could break: the note and the numbers disagree if the export rule changes without this page.
Prevention: code commits here must cite a `docs/sdd/<slug>/` folder in **this** repo
(the SDD commit gate in the test repo and in the skills repo; see their `sdd-commit-gate` specs).
