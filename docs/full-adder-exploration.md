# Full-Adder Exploration Guide

## Section details

- **Registered id:** `fulladder`
- **Order:** `3`
- **Title:** **Full Adder: 3→2 Compressor**

The interactive section is implemented in [`js/sections/03-fulladder.js`](../js/sections/03-fulladder.js).

## What to explore

A full adder counts the three one-bit inputs and writes the total as a two-bit binary number. Toggle **A**, **B**, and **Cin** (carry in) between 0 and 1. The outputs are:

- **Sum**: the low bit of `A + B + Cin`.
- **Cout**: the high bit of `A + B + Cin`, or the carry out.

For example, when all three inputs are 1, their total is 3 (`11` in binary), so `Sum = 1` and `Cout = 1`.

## Truth table

The source lists the rows in binary input order, from `000` through `111`:

| A | B | Cin | Sum | Cout |
|---:|---:|---:|---:|---:|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 1 | 0 |
| 0 | 1 | 0 | 1 | 0 |
| 0 | 1 | 1 | 0 | 1 |
| 1 | 0 | 0 | 1 | 0 |
| 1 | 0 | 1 | 0 | 1 |
| 1 | 1 | 0 | 0 | 1 |
| 1 | 1 | 1 | 1 | 1 |

## Three worked examples

1. **`A=0, B=0, Cin=1`**: `0 + 0 + 1 = 1`, which is binary `01`. Therefore **Sum = 1** and **Cout = 0**.
2. **`A=0, B=1, Cin=1`**: `0 + 1 + 1 = 2`, which is binary `10`. Therefore **Sum = 0** and **Cout = 1**.
3. **`A=1, B=1, Cin=1`**: `1 + 1 + 1 = 3`, which is binary `11`. Therefore **Sum = 1** and **Cout = 1**.

## Why “3→2 compressor”?

Think of each input as a bit in one binary column. Three input bits can contain zero, one, two, or three 1s. The full adder compresses those three bits into two output bits that preserve the same count: `Sum` is the 1s-place and `Cout` is the 2s-place. Thus three bits become two bits without losing the numeric total—hence **3→2 compressor**. The `Cout` bit would be carried into the next column when adding larger binary numbers.

This exploration is an educational bit visualization: it demonstrates the Boolean result and the bit-counting idea. It is **not** a timing-accurate hardware simulator and does not model propagation delays or physical circuit timing.
