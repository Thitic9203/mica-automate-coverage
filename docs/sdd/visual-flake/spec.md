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

## Revision 2 (2026-11-29)

- The per-worker font cache still let the first test in each worker wait on the network (page.goto timeouts).
  **R1 rev 2**: fonts are served from `tests/visual/fonts/` (Google Fonts CSS + 13 woff2, OFL, owner-approved download).
- **R3**: GSAP (cdnjs) is stubbed in the test — the page's motion guard makes it a no-op under reduced motion.
- **R4**: axe-core 4.9.1 is loaded from `tests/visual/vendor/` (owner-approved download), not the CDN.
- Remaining timeouts (locator.click / toHaveText at 30 s) were measured only while the Mac's load average was 13–16 on
  8 cores (other sessions' runs; suite took 1.1–1.5 min instead of 46 s). On the same code with load ~3:
  `--repeat-each 5` 95/95 three times in a row. No timeout or retry was raised. Run the gate on a quiet machine.
