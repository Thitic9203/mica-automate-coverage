# Plan — UI scale 70%

## Files

- `public/index.html` — `:root { --ui-scale: 0.7 }`; `html { zoom: var(--ui-scale) }`;
  `#app { min-height: calc(100vh / var(--ui-scale)) }` (R3, because vh inside a zoomed root is scaled too).
- `tests/visual/__snapshots__/*` — regenerated baselines (intended visual change, R1).
- `RISK_REGISTER.md` — owner-chosen exception to global rule 19 (tap/type scale).

## Options weighed

- CSS `zoom` on root (chosen): one line, scales everything including inline-styled HTML and the canvas; supported in
  Chrome, Safari, Firefox >= 126. Media queries still use the real window width.
- `transform: scale()`: breaks layout flow and fixed positioning; rejected.
- Rewriting 368 px values to rem: large risky diff; rejected.

## Risks

- Text 7–9px and tap targets ~31px (accepted by owner, see spec).
- Older Firefox (< 126) ignores `zoom`: page shows at 100% (safe fallback).
- Free tier only; no new cost. No other repo touched.
