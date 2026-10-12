# Logic Gates: The Primitives

This is the guide for the registered section **`gates` — “Logic Gates: The
Primitives.”** It explores three basic Boolean gates: AND, OR, and NOT.

## How to explore

Each gate has a bit toggle for its input(s). Click the **0/1** button to
change a bit. AND and OR each have inputs **A** and **B**; NOT has only **A**.
The output display and output wire update immediately, and the matching row
in that gate's truth table is highlighted. The wire also pulses when an input
changes. The AND table in the section's left column is highlighted in sync
with the AND panel as well.

## Truth tables

### AND

AND outputs 1 only when both inputs are 1.

| A | B | OUT |
|---|---|-----|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

### OR

OR outputs 1 when at least one input is 1.

| A | B | OUT |
|---|---|-----|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 1 |

### NOT

NOT inverts its one input.

| A | NOT A |
|---|-------|
| 0 | 1     |
| 1 | 0     |

## Three questions to investigate

1. **What happens when AND has A = 1 and B = 0?** Its output is 0, because
   both inputs are not 1.
2. **Which OR combinations produce output 0?** Only A = 0 and B = 0.
3. **What happens when NOT changes from A = 0 to A = 1?** Its output changes
   from 1 to 0.

This is a logic visualization: it shows Boolean input/output behavior with
interactive SVG gates and tables. It is not a transistor simulator.

See the [registered gate implementation](../js/sections/01-gates.js) for the
section registration, gate functions, and table data.
