# Spec — Whole-page UI scale 70% (all tabs)

Source: owner, 2026-11-28 chat: "ลดขนาดลง 30 % หน่อย ทุกอย่างที่แสดงในปัจจุบัน", "ทุก tab เลย".
Owner popup answer 2026-11-28: "ย่อทุกจอ 30%" (all viewports), chosen knowing that 10–13px text becomes 7–9px and
44px tap targets become ~31px, which fails global rule 19 (tap >= 44px, type scale). Recorded in RISK_REGISTER.md.

## Rules

- **R1** — When any tab (MA, OLS, Pyrite, and any later tab) is shown, everything rendered (text, cards, charts,
  tables, chrome, sign-in card) must render at 70% of its current size, on every viewport width.
- **R2** — The scale is one token (`--ui-scale: 0.7` in `:root`) applied once; no per-component size edits.
- **R3** — Full-height layout must still fill the viewport: `#app` min-height must compensate for the scale
  (no empty band at the bottom of the window).
- **R4** — Breakpoints keep reacting to the real window width (media queries are unchanged).
- **R5** — Both themes and axe (wcag2a/2aa/21aa) must still pass; contrast is unchanged by scale.
- **R6** — Out of scope: changing fonts, colors, tokens other than `--ui-scale`, or content.

## Edge cases

- Fixed full-screen overlay (`position: fixed; inset: 0`) must still cover the whole window.
- Chart.js donut hover must still hit the hovered segment.

## Done when

- `--ui-scale: 0.7` applied; a measured element is 70% of its previous rendered width.
- `#app` fills the window height at 390 / 900 / 1440 px.
- Visual baselines regenerated for all tabs × 3 widths × 2 themes; suite 2× green; axe 0 violations.
- Unit tests green; deployed to production and verified.
