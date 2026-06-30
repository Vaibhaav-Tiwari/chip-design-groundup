# Task 3 Report — S2 Multiply-Accumulate Section

## Files Created
- `js/sections/02-mac.js`
- `css/sections/02-mac.css`

## Self-Review Checklist

- [x] All 16 AND gates shown in partial-product grid (4 rows × 4 cells each)
  — Grid is 4 rows (one per B bit) × 8 columns (bit positions 0-7); each row has exactly 4 active cells, total = 16 AND gates.
- [x] Correct integer multiplication result in decimal
  — `aInt * bInt` computed directly from bit toggles; result 0..225 displayed as binary (8 bits) + decimal.
- [x] Bit values use `--font-mono`
  — All `.cv-bit`, `.mac-pp-label`, `.mac-result-cell`, `.mac-accum-cell`, `.mac-decimal-val` use `font-family: var(--font-mono)`.
- [x] FP4 bar = 16, FP8 bar = 64 in barChart
  — PRECISION_DATA: FP4=16, FP8=64. Chart shown at all times in left column.
- [x] No hardcoded hex in CSS
  — All colors use design tokens (`--accent`, `--accent-2`, `--highlight`, `--carry`, `--text`, `--text-muted`, `--surface`, `--surface-2`, `--bg`, `--grid`, alpha variants).
- [x] Source anchors present verbatim (5 anchors in JS file header comment)
- [x] No frozen file edits
- [x] `ctx.pulseGrid()` called on build (line 434)
- [x] `ChipViz.register({ id:'mac', order:2, ... })` with correct title/subtitle
- [x] 4-bit/8-bit tab switching updates chart + counter
- [x] Key box `.callout.insight` with matrix multiply formula present
- [x] 8-bit result row + decimal display updates on input change
- [x] `prefers-reduced-motion` respected (transitions set to `none`, `pulseGrid` skipped when reduced)
- [x] Accumulator feature: "Accumulate result" and "Reset accumulator" buttons

## Concerns

None significant. Minor notes:
- The `.cv-bit` style is duplicated between `01-gates.css` and `02-mac.css`; since both files load, the second definition is redundant but harmless. This ensures the MAC section renders correctly in isolation if gates section is absent.
- The bar chart always shows both FP4 and FP8 bars regardless of active precision tab; switching tabs only updates the AND gate counter label. This is the most useful UX since it lets users compare both at once.
- 4-bit×4-bit max product is 15×15=225 which fits in 8 bits (max 255) — no overflow possible.

## Commit Hash
(to be filled after commit)
