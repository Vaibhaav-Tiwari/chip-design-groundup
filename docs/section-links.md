# Visualization section links

This is the standalone reference for linking to sections in the visualization.

## Anchor convention

Each registered section receives a DOM anchor in the form `sec-<id>`, where
`<id>` is the literal `id` from its registration object. For example, the
section registered with `id: 'gates'` is linked as
`../index.html#sec-gates`. Use the registered id exactly; do not derive it
from a JavaScript filename.

The registry orders sections by numeric `order`, then by `id` when orders are
equal. The table below follows that same ordering.

| Order | ID | Displayed title | Site link |
| ---: | --- | --- | --- |
| 0 | `hero` | How does a chip actually work? | [Open section](../index.html#sec-hero) |
| 1 | `gates` | Logic Gates: The Primitives | [Open section](../index.html#sec-gates) |
| 2 | `mac` | Multiply-Accumulate: The AI Primitive | [Open section](../index.html#sec-mac) |
| 3 | `fulladder` | Full Adder: 3→2 Compressor | [Open section](../index.html#sec-fulladder) |
| 4 | `dadda` | Dadda Multiplier: Building the Adder Tree | [Open section](../index.html#sec-dadda) |
| 5 | `mux` | Register File & The Mux Tax | [Open section](../index.html#sec-mux) |
| 6 | `systolic` | Systolic Array: Tensor Cores & TPU MXU | [Open section](../index.html#sec-systolic) |
| 7 | `pipeline` | Clock Cycles & Pipelining | [Open section](../index.html#sec-pipeline) |
| 8 | `fpga` | FPGA vs ASIC: Lookup Tables | [Open section](../index.html#sec-fpga) |
| 9 | `memory` | Memory: Cache vs Scratchpad | [Open section](../index.html#sec-memory) |
| 10 | `gputpu` | GPU vs TPU: Architecture Comparison | [Open section](../index.html#sec-gputpu) |

Filenames alone do not register a section. A new section must be registered
through the registry before it can have an anchor or appear here. This
reference documents the existing registrations; this task does not add or
register new sections.
