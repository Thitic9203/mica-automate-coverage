# Plan — stable visual suite

- `tests/visual/tabs.visual.spec.cjs` — `FONT_CACHE` map + `route(/fonts\.(googleapis|gstatic)\.com/)` in `open()` (R1).
- `RISK_REGISTER.md` — R-003 revisit column: resolved.
- Options weighed: commit the woff2 files as fixtures (fully offline, but adds downloaded binaries to the repo);
  in-memory cache (chosen: no files added, same font bytes as production, timing no longer varies).
- Risk: the first test in each worker still waits for the network; measured stable. No new cost; no other repo touched.
