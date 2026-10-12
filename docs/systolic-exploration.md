# Systolic-array phase exploration

This guide describes the three phases in the standalone [systolic-array demo](../js/sections/06-systolic.js).
It is an interactive illustration of a 2×2 array, not a general-purpose hardware simulator: it does
not model arbitrary dimensions, timing, latency, area, or measured performance.

## Phase 1: Matrix x Vector

- **Controls:** Edit the four values in **Weight Matrix W** or the two values in **Input
  Vector I**; use **Step**, **Run**, or **Reset**. Editing a value also resets the phase.
- **What a step does:** The display advances from clock 0 through clock 4. Clock 1
  accumulates `I0 * W00`; clock 2 accumulates `I0 * W01` and `I1 * W10`; clock 3
  accumulates `I1 * W11`; clock 4 collects the two column sums into `Out0` and `Out1`.
  Thus the final outputs are `I0*W00 + I1*W10` and `I0*W01 + I1*W11`.
- **Data movement:** The weight values stay fixed in the MAC-cell registers while the
  input values are shown as flowing through the array. Partial sums accumulate in cells;
  outputs are collected only at the final clock. `Run` advances the same sequence
  automatically (or completes it immediately when reduced motion is preferred).

## Phase 2: Trickle-Load

- **Controls:** Use **Tick** to advance one clock or **Reset** to return to clock 0.
- **What a clock does:** Clock 0 shows all cells as `?`. Clock 1 starts the first row's
  weight feed (`…`); clock 2 places `W00` and `W01` while the next row starts loading;
  clock 3 places `W10` while `W11` is still traveling; clock 4 places `W11`, leaving
  all four weights loaded. The diagram illustrates staggered, one-hop-per-clock loading.
- The accompanying bandwidth annotation is the demo's stated comparison: `N = 2`
  values per clock rather than `N² = 4`, not a measured bandwidth result.

## Phase 3: Scaling

- **Control:** Move the **Array size** slider among `N = 2`, `N = 4`, and `N = 8`.
  The readouts show compute as `N² MACs` and register-file bandwidth as `N values/clock`.
- **Chart observation:** The chart uses the actual formulas `compute = N * N` and
  `bandwidth = N`, with compute values 4, 16, and 64 and bandwidth values 2, 4, and
  8. Therefore the compute-to-bandwidth ratio is `N`: it grows from 2× at `N=2`
  to 8× at `N=8`. The bars are scaled against the chart maximum of 64.

## Short walkthrough

1. Open the demo; it starts on **Phase 1** at clock 0 with the default weights `1, 2, 3, 4`
   and inputs `1, 2`.
2. Press **Step** four times to see partial products accumulate and outputs appear at clock 4.
3. Press **Reset** (or edit an input) to return Phase 1 to its initial clock-0 state.
4. Select **Phase 2**, press **Tick** through clock 4, then press **Reset** to restore its
   initial all-`?` state.
5. Select **Phase 3** and move the slider to compare the three formula-driven array sizes.
