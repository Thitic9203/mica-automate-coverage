# Spec — Stable visual suite (RISK_REGISTER R-003)

Source: owner 2026-11-28 ("Do this task here: แก้ visual suite ภาพไม่คงที่ (R-003)"); global rule 21 (flaky = fail, fix the cause).

## Root cause (verified 2026-11-28)

- Repro: `--repeat-each 3` failed 3–6 of 57 shots, already at a385aaa.
- Layout dump of every element just before the shot, compared across repeats: only the failing test differed, and the
  only text whose width differed was the brand name "Pluton" (`.chrome-brand-name` 25.359 vs 25.375 px, one LayoutUnit),
  which moved every tab to its right by 1/64 px (`tab` x 65.531 vs 65.547) and changed anti-aliasing across the bar.
- Web fonts come live from fonts.googleapis.com / fonts.gstatic.com (`public/index.html:10`, `display=swap`) and were
  not routed in the test, so their arrival time varied with load. Ruled out: GPU raster, faces not loaded at shot time.
- Experiment: serving the font CSS and files from a per-worker in-memory cache (fetched once, then answered at once)
  gave 57/57 twice and 95/95 (`--repeat-each 5`) three times in a row.

## Rules

- **R1** — The visual test MUST answer font requests (fonts.googleapis.com, fonts.gstatic.com) from a per-worker
  in-memory cache: the first request fetches from the network, every later one is fulfilled from memory.
- **R2** — No tolerance, mask, retry or blind wait is added; baselines stay as they are.

## Done when

- `--repeat-each 5` passes twice in a row; R-003 marked resolved.
