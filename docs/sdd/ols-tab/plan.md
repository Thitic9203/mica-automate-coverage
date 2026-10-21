# Plan — OLS tab

- `public/index.html`: one new `.tab[data-view="ols"]`, `renderView()` branch, `renderOls()` that fetches
  `/ols-progress.json` (no-store) and renders with the existing tokens (`--green`, `--amber`, `--muted`,
  `.card`, `.chart-card`); GSAP 3.12.5 from cdnjs for R7.
- `public/ols-progress.json`: generated, not hand-edited; refreshed before each deploy.
- No new paid service, no new dependency beyond the GSAP script tag (cost: none).
- Risk: the JSON is served without auth like every static file here — it carries counts and
  timestamps only (export spec R3).
