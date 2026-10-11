# Mux section exploration guide

The standalone section is registered with the id **`mux`**, order **5**, and the
title **“Register File & The Mux Tax.”** Its subtitle is “Why reading registers
costs 6× more than the multiply itself.” The implementation is in [`js/sections/05-mux.js`](../js/sections/05-mux.js).

## What to explore

The register-file slider selects the number of register slots, `n`, from **4,
8, 16, or 32**. The default is **`n = 8`** (slider index 1). The section keeps
`p = 4` as the bit width and `q = 4` as the MAC operand width.

For each setting, the section calculates:

- Mux AND gates: `3 × n × p`
- MAC AND gates: `p × q = 4 × 4 = 16`
- Data-movement share: `round(100 × mux gates / (mux gates + MAC gates))`
- Mux-to-MAC overhead ratio: `round(mux gates / MAC gates):1`

The displayed comparison is therefore based on the mux gate count divided by
the MAC gate count; both counts are included in the total used for the
percentage. JavaScript `Math.round` is used for the percentage and ratio.

| Register slots (`n`) | Mux gates (`3 × n × 4`) | MAC gates (`4 × 4`) | Total gates | Data movement | Mux:MAC comparison |
|---:|---:|---:|---:|---:|---:|
| 4  | 48  | 16 | 64  | `round(100 × 48 / 64)` = **75%**  | `round(48 / 16):1` = **3:1** |
| 8  | 96  | 16 | 112 | `round(100 × 96 / 112)` = **86%** | `round(96 / 16):1` = **6:1** |
| 16 | 192 | 16 | 208 | `round(100 × 192 / 208)` = **92%** | `round(192 / 16):1` = **12:1** |
| 32 | 384 | 16 | 400 | `round(100 × 384 / 400)` = **96%** | `round(384 / 16):1` = **24:1** |

## Learner exercises

1. Set the slider to `n = 4`, then `n = 32`. **Expected observation:** mux
   gates rise from 48 to 384, while MAC gates remain 16; the displayed ratio
   changes from 3:1 to 24:1.
2. Start at the default `n = 8` and move the slider through every tick.
   **Expected observation:** data movement is already 86% of total gates at
   the default and increases to 96% at `n = 32`.
3. Change the A, B, and Acc register selectors, then press **Run**.
   **Expected observation:** the highlighted register slots and the three
   input wires change, but the gate counts do not, because the selectors do
   not change `n`, `p`, or `q`.
