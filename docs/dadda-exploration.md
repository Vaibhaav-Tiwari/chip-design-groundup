# Dadda multiplier exploration

This guide describes the **existing simulation**, not a new feature. The
implementation is [js/sections/04-dadda.js](../js/sections/04-dadda.js).

## Find the demonstration

Open the section titled **“Dadda Multiplier: Building the Adder Tree”**
(section 4). Its subtitle identifies the demonstration as going from 24 bits
to 8 using 16 adder stages. The SVG labels eight bit columns, numbered 0
through 7; each circle represents one partial-product bit in the visualization.

## What the controls do

- **Initial state:** The column heights, from column 0 through column 7, are
  `[2, 3, 4, 5, 4, 3, 2, 1]`. Their sum is 24: the source describes these as
  16 partial-product bits plus 8 accumulator bits.
- **Step:** Each click follows the source's scripted column sequence
  `[3,4,2,3,4,5,1,2,3,4,5,6,0,1,2,3]`. It consumes two bits from the
  selected column and writes one carry bit into the next column. Thus the
  selected column decreases by 2 and its neighbour increases by 1. The source
  calls steps 1–12 full-adder reductions and steps 13–16 half-adder reductions;
  they look the same in the visualization.
- **Completion:** After 16 steps, the counter reads `16 / 16`, the columns are
  `[0,0,0,0,2,2,2,2]`, and every column is at most two bits high. The end-state
  insight appears, and the Step button changes to **Reset**.
- **Reset:** Clicking **Reset** (or clicking Step after completion) restores the
  initial column heights, sets the counter to `0 / 16`, hides the end-state
  insight, and returns the button to **Step**.

## A short exploration

1. Before stepping, add the visible column heights and confirm they total 24.
2. Click **Step** once and watch column 3 lose two bits while column 4 gains
   one carry; the counter becomes `1 / 16`.
3. Continue stepping and compare the counter with the scripted sequence above.
4. At `16 / 16`, verify the final array and that no column exceeds two bits.
5. Click **Reset**, then confirm the original `[2,3,4,5,4,3,2,1]` pattern
   returns.

**UI observation to check:** on the first step, the source column is 3 and the
carry appears in column 4; this is visible as the source/carry highlighting
changes after the click.

## The live bit-count formula

The source constants are `TOTAL_FA = 16`, `START_BITS = 24`, and
`END_BITS = 8`. The demonstration's count is therefore `START_BITS - END_BITS`
(`24 - 8 = 16`), matching `TOTAL_FA`. The source's formula panel displays
`p×q AND gates + p×q adder stages`, expanded for this simulation as
`16 AND gates + 16 adder stages`; its comments identify `p×q = 16` and
`p+q = 8`. These are the simulation's displayed counts and algebra, not a
claim about a newly implemented hardware design.
