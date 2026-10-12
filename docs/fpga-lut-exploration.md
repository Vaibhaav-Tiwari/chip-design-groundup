# FPGA lookup-table exploration

This guide accompanies the registered section **`fpga` — “FPGA vs ASIC: Lookup Tables”**. The implementation is in [`js/sections/08-fpga.js`](../js/sections/08-fpga.js).

## Explore the inputs and functions

The section has four independent input toggles, labeled **A**, **B**, **C**, and **D**. Each starts at `0` and can be switched to `1`. Together they form the four-bit address `ABCD`, so there are 16 possible input combinations. The selected row is the LUT entry whose output is shown.

The **Function** menu contains exactly these choices:

- `AND (A,B,C,D)`
- `OR (A,B,C,D)`
- `XOR (A,B)`
- `Majority (A,B,C)`
- `Custom truth table`

Changing a toggle recomputes the selected LUT row and the displayed output. Choosing a built-in function recomputes all 16 rows from that function.

### Worked example: AND

For `AND (A,B,C,D)`, the output is `1` only when every input is `1`:

- Set `A=1`, `B=1`, `C=1`, `D=1` (`ABCD=1111`): the selected row outputs `1`.
- Set `D=0` (`ABCD=1110`): the selected row outputs `0`.

### Worked example: XOR

For `XOR (A,B)`, the output is `1` when A and B differ. C and D do not affect this function:

- Set `A=0`, `B=0`, `C=1`, `D=1` (`ABCD=0011`): the output is `0`.
- Set `A=1`, `B=0`, `C=1`, `D=1` (`ABCD=1011`): the output is `1`.

## Custom truth table

The custom mode uses a 16-entry table, indexed by `ABCD` from `0000` through `1111`. The output for the current inputs is the value stored at that address; changing that entry changes the LUT output, and changing A–D selects a different entry.

In the current source, `customTable` is initialized as sixteen zeros, and this file does not wire a separate table-edit control. Therefore, selecting `Custom truth table` initially produces `0` for every address. This description avoids assuming controls that are not implemented in the section.

## LUT-versus-ASIC gate counts

The visualizer uses an educational cost model: a LUT is represented as **16 AND + 16 OR = 32 gates**, regardless of the selected function. It compares that model with the function’s modeled ASIC count—for example, the four-input AND is represented as **3 gates**, while XOR is represented as **3 gates** and majority as **6 gates**.

These are teaching constants for illustrating LUT flexibility versus a direct implementation. They are not hardware benchmarks, measurements, or predictions of a real FPGA or ASIC’s area, timing, power, or cost.
