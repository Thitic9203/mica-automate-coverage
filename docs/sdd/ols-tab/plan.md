# Plan — OLS tab

- `public/index.html`: one new `.tab[data-view="ols"]`, `renderView()` branch, `renderOls()` that fetches
  `/ols-progress.json` (no-store) and renders with the existing tokens (`--green`, `--amber`, `--muted`,
  `.card`, `.chart-card`); GSAP 3.12.5 from cdnjs for R7.
- `public/ols-progress.json`: generated, not hand-edited; refreshed before each deploy.
- No new paid service, no new dependency beyond the GSAP script tag (cost: none).
- Risk: the JSON is served without auth like every static file here — it carries counts and
  timestamps only (export spec R3).

## R16 — case table (2026-10-22, plan only)

- `public/index.html`: `renderOlsCases(rows)` after the existing OLS sections; state `{filters, q, sort,
  page, size}` in memory (per-viewer only); filter/sort/paginate in plain JS over ≤ ~450 rows.
- Filter control: one custom listbox component reused for the five filters; on <768 px it renders as a
  bottom sheet (focus trap, Esc closes, `aria-modal`).
- Data: `public/ols-cases.json` (owner 2026-10-22), fetched after the cards render.
- Public repo: titles and Qase numbers public — approved by the owner 2026-10-22 with the export's denylist scan.
- No new dependency (cost: none).
