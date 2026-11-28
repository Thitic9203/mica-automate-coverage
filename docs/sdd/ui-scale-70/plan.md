# Plan — UI scale 70%

## Files

- `public/index.html` — `:root { --ui-scale: 0.7 }`; `body { zoom: var(--ui-scale) }`;
  `#app { min-height: calc(100vh / var(--ui-scale)) }` (R3, because vh inside a zoomed root is scaled too).
- `tests/visual/tabs.visual.spec.cjs` — asserts body zoom 0.7 and #app height (R1, R3); shoots the viewport grown to
  the document height instead of `fullPage`, because `fullPage` sizes the shot in unzoomed px under CSS zoom (900 px page
  gave a 1286 px shot with unstable pixels beyond the rendered area: flaky, rule 21).
- `tests/visual/__snapshots__/*` — regenerated baselines (intended visual change, R1).
- `RISK_REGISTER.md` — owner-chosen exception to global rule 19 (tap/type scale).

## Options weighed

- CSS `zoom` on `body` (chosen): one line, scales everything including inline-styled HTML and the canvas; supported in
  Chrome, Safari, Firefox >= 126. Media queries still use the real window width.
- `transform: scale()`: breaks layout flow and fixed positioning; rejected.
- Rewriting 368 px values to rem: large risky diff; rejected.

## Risks

- Text 7–9px and tap targets ~31px (accepted by owner, see spec).
- Older Firefox (< 126) ignores `zoom`: page shows at 100% (safe fallback).
- Free tier only; no new cost. No other repo touched.
