# Register-file mux-cost exploration

This guide accompanies section **5**, registered with id `mux`, titled **Register File & The Mux Tax**. The interactive source is [`js/sections/05-mux.js`](../js/sections/05-mux.js).

## What to explore

The section models three reads from a register file into a multiply-accumulate (MAC) unit:

- **A (Reg):** selects `Reg 0` through `Reg 7` (initially `Reg 0`).
- **B (Reg):** selects `Reg 0` through `Reg 7` (initially `Reg 1`).
- **Acc (Reg):** selects `Reg 0` through `Reg 7` (initially `Reg 2`).

Changing a selector updates the highlighted register slot and its wire to the mux. Click **Run** to animate the selected data path in order: A, B, Acc, mux-to-MAC, then MAC write-back. With reduced motion enabled, the highlights update without the animation. The button is temporarily disabled while the animation runs.

The **Register file** slider chooses the slot count `n` from the supported values **4, 8, 16, and 32**. Moving it updates the displayed mux count, MAC count, data-movement percentage, and overhead ratio.

## Educational gate model

The source fixes `P = 4` (bit width) and `Q = 4` (MAC operand width). For a slot count `n`:

- `muxGates = 3 × n × P` — three operand reads (A, B, Acc).
- `macGates = P × Q`.
- `totalGates = muxGates + macGates`.
- Mux percentage = `round(100 × muxGates / totalGates)`.

With `P = 4` and `Q = 4`, the values are:

| Slots `n` | Mux gates | MAC gates | Total gates | Mux percentage |
|---:|---:|---:|---:|---:|
| 4  | 48  | 16 | 64  | 75% |
| 8  | 96  | 16 | 112 | 86% |
| 16 | 192 | 16 | 208 | 92% |
| 32 | 384 | 16 | 400 | 96% |

These are educational model counts, not measured silicon benchmarks.
