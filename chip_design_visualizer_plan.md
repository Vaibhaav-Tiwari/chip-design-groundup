# 🔲 Chip Design from the Ground Up — Interactive Visualizer
### A complete build plan for Claude Code

---

## Vision

An interactive, self-paced learning experience that mirrors the Dwarkesh × Reiner Pope conversation — building understanding from a single logic gate all the way to a full AI chip. The experience should feel like a **whiteboard that comes alive**: each concept is revealed progressively, animations respond to user interaction, and nothing is shown before it's been earned through the prior lesson.

**Target audience:** Curious people from a software background who want hardware intuition, not a textbook.

**Published as:** A static HTML/JS/CSS single-page app deployable to Vercel, Netlify, or GitHub Pages. Zero dependencies on a backend.

---

## Design Identity

**Palette (dark-mode, chip-board aesthetic):**
- Background: `#0A0E1A` — deep navy, like a PCB substrate
- Surface: `#111827` — slightly lighter panels
- Grid/trace lines: `#1E293B` — circuit board grid overlay
- Primary accent: `#38BDF8` — electric sky blue (signal wire)
- Secondary accent: `#A78BFA` — soft violet (data flow)
- Highlight: `#34D399` — logic-green (correct/active state)
- Destructive/carry: `#F59E0B` — amber (carry bits, warnings)
- Text primary: `#F1F5F9`
- Text muted: `#64748B`

**Typography:**
- Display/headers: `JetBrains Mono` (monospace, feels like code and hardware)
- Body: `Inter` (clean, readable prose)
- Data/labels: `JetBrains Mono` — all bit values, gate labels, numbers

**Signature element:** A persistent **circuit board grid background** (subtle SVG dot/line pattern) that animates signal pulses whenever a concept is activated — like electricity flowing through traces on a real board. This unifies every section visually and reinforces the "chip" metaphor at all times.

**Layout:** Vertical scroll, full-width sections that snap into view. Each section = one "lesson." Left side: explanation text + controls. Right side (or below on mobile): the live interactive visualization.

---

## Architecture Overview

```
index.html              ← single file entry point
├── style.css           ← all styles (or embedded in <style>)
├── main.js             ← section orchestration, scroll triggers
└── sections/
    ├── 01-gates.js     ← AND/OR/NOT gate playground
    ├── 02-multiply.js  ← bit-by-bit long multiplication
    ├── 03-fulladder.js ← 3→2 compressor, carry visualization
    ├── 04-dadda.js     ← Dadda multiplier animation
    ├── 05-mux.js       ← register file + mux cost demo
    ├── 06-systolic.js  ← systolic array matrix multiply
    ├── 07-pipeline.js  ← clock cycle + pipeline registers
    ├── 08-fpga.js      ← LUT + FPGA vs ASIC
    ├── 09-memory.js    ← cache vs scratchpad
    ├── 10-gpu-tpu.js   ← GPU SM vs TPU systolic diagram
    └── 11-summary.js   ← concept map / recap
```

Can be built as a single large `index.html` with inline JS modules — easier for deployment.

---

## Section-by-Section Build Spec

---

### Section 0 — Hero / Entry

**Visual:** Full-screen dark panel. Animated circuit traces pulse from the bottom of the screen upward. Large monospace title fades in:

```
"How does a chip actually work?"
— Reiner Pope, CEO of MatX
```

Subtitle: *"From a single AND gate to a full AI accelerator. Interactive."*

**CTA button:** `→ Start from the bottom`

Clicking scrolls to Section 1 and triggers a subtle "power on" flash animation across the trace grid.

---

### Section 1 — Logic Gates: The Primitives

**Concept:** AND, OR, NOT are the atomic units. Everything is built from these.

**Interactive widget:**
- Three large clickable gate symbols rendered in SVG: AND, OR, NOT
- Each has toggle-able inputs (click A or B to flip between 0 and 1)
- Output updates in real-time with animated signal pulse
- Truth table fills in live as you explore combinations
- A note appears: *"Every computation in this chip is built from these three primitives."*

**Annotation callouts:**
- "AND: output is 1 only if BOTH inputs are 1"
- "This is how we compute a single partial product in multiplication"

---

### Section 2 — Multiply-Accumulate: The AI Primitive

**Concept:** MAC (Multiply-Accumulate) = the fundamental operation in matrix math. Why 4-bit × 4-bit + 8-bit.

**Layout:** Split: left = text explanation, right = interactive grid

**Interactive widget — Long Multiplication Visualizer:**
- Two 4-bit binary number inputs (user can toggle each bit individually)
- Below: the long multiplication grid renders row by row with animation
- Each partial product row appears with a highlight showing *which AND gate produced it*
- Counter in corner: "AND gates used: X / 16"
- Below the grid: the 8-bit accumulator input, shown being "added in" to the sum
- Final result shown in binary and decimal

**Key callout box:**
> "This is exactly what happens at every step of a matrix multiply:  
> `output[i][k] += input[i][j] × input[j][k]`"

**Bit-width selector:** Tabs for 4-bit, 8-bit to show how gate count scales **quadratically** (p×q). Renders a small bar chart comparing FP4 vs FP8 gate costs.

---

### Section 3 — The Full Adder: 3→2 Compressor

**Concept:** A full adder takes 3 single-bit inputs, produces 2 outputs (sum + carry). It's the main tool for collapsing the partial products.

**Interactive widget:**
- Three large bit toggle buttons (labeled A, B, Cin)
- Truth table on the right highlights the current row
- Animated output shows Sum and Carry-out with color-coded wires
- Binary counter at bottom: "This is just counting how many 1s there are, in binary"

**State machine:** Cycles through all 8 possible input combinations with a "Step through" button, showing the sum in the column layout Reiner drew.

**Visual metaphor:** Column of partial product bits stacked vertically. Full adder reaches in, grabs 3, and outputs 2. Watch the column shrink.

---

### Section 4 — Dadda Multiplier: Building the Adder Tree

**Concept:** Keep applying full adders to columns until only 2 rows remain, then do a final carry-propagate add.

**Interactive widget — Dadda Tree Animator:**
- Shows the full 4×4 partial product grid (16 bits + 8-bit accumulator = 24 start bits)
- "Step" button walks through each full adder application one at a time
- Bits being processed glow blue → consumed (crossed out, gray)
- Carry output shown shifting to next column (amber color)
- Sum output shows in current column (green)
- FA counter: "Full adders used: X / 16"
- At end: "We started with 24 bits. Ended with 8. Used exactly 16 full adders (= p×q)."

**Side panel:** Formula display `pq AND gates + pq full adders` updates live.

---

### Section 5 — Register File & The Mux Tax

**Concept:** Before Tensor Cores, all the circuit area was wasted on *moving data*, not computing it. The mux is expensive.

**Interactive widget — CUDA Core Cost Breakdown:**
- Animated diagram: register file (8 slots) on the left, MAC unit on the right
- "Select register" dropdown — pick any 3 registers as inputs to the MAC
- Wires animate from register → mux → MAC → back to register
- **Gate counter panel** shows live:
  - AND gates for mux: `3 × n × p = ?`
  - AND gates for MAC: `p × q = ?`
  - **Ratio**: "X% of gates spent on data movement"
- Slider: change register file size (n = 4, 8, 16, 32) → watch the ratio get worse

**Key insight box:** *"With n=8 and p=4, q=4: 96 gates on moving data, 16 on actual multiply. 6:1 overhead. This is the problem Tensor Cores solved."*

---

### Section 6 — Systolic Array: Tensor Cores & TPU MXU

**Concept:** Fix the weight matrix in local registers. Stream vectors through. Amortize register file cost over a 2D compute surface.

**Interactive widget — Systolic Array Simulator:**

**Phase 1: Matrix-Vector multiply walkthrough**
- 2×2 matrix shown with editable weight values in each cell
- Input vector of size 2 on the left
- "Run" button: values flow cell-by-cell with animation
  - Multiply happens (glows green)
  - Partial sums flow downward (carry-accumulate)
  - Output vector emerges at the bottom
- Annotation: "Each cell is one MAC unit. The weight stays fixed. Only the input moves."

**Phase 2: Trickle-load visualization**
- Shows how the weight matrix is loaded one row at a time over N clock cycles
- Clock cycle counter ticks up
- "Bandwidth from register file: only X, not X²"

**Phase 3: Size scaler**
- Slider: 2×2 → 4×4 → 8×8 systolic array
- Shows how register file bandwidth stays linear while compute grows quadratic
- "This is why bigger systolic arrays are more efficient"

**Data flow legend:** Colors distinguish weight loading (purple), input streaming (blue), output collecting (green).

---

### Section 7 — Clock Cycles & Pipelining

**Concept:** The chip runs in lockstep. The longest logic path sets the clock. Pipelining splits paths with registers to go faster.

**Interactive widget — Pipeline Register Visualizer:**

**Part A: Clock cycle demo**
- Animated "cloud of logic" between two registers
- Draggable slider: "Logic depth (number of gates in path)"
- As you add gates, a red warning bar fills: "Clock period must be ≥ gate delay"
- Clock frequency counter updates: "Max frequency: X GHz"

**Part B: Pipeline insertion**
- Button: "Insert pipeline register in the middle"
- Animation: the cloud splits into two halves with a register between them
- Clock frequency doubles
- But: area counter increases (register cost shown)
- Throughput vs. latency chart updates in real-time

**Part C: Feedback loop problem**
- Toggle: "Enable feedback (running sum)"
- Shows why you can't pipeline a feedback loop the same way
- "Even and odd sum" visualization shows what goes wrong

---

### Section 8 — FPGA vs ASIC: Lookup Tables

**Concept:** FPGAs emulate any logic via lookup tables (LUTs) + programmable routing muxes. 10× overhead but reprogrammable.

**Interactive widget — LUT Emulator:**

**Part A: Build your own LUT**
- 4-bit input display (A, B, C, D toggles)
- 16-row truth table you can fill in (click any cell to set output to 0 or 1)
- Shows which row is currently active (highlighted)
- Live output updates

**Part B: Function comparison**
- Dropdown: "Choose a function" (AND, OR, XOR, 4-way AND, majority vote)
- ASIC column: shows the gates needed (3 for 4-way AND)
- LUT column: always shows 16+16 = 32 gates (the mux)
- Ratio counter: "FPGA costs X× more gates"

**Part C: Routing mux overhead**
- Animated diagram: pool of LUTs + registers connected by a web of muxes
- "Program" button overlays a specific orange circuit path on top
- Annotation: "The white wires must always exist. You're paying for all of them."

---

### Section 9 — Memory: Cache vs Scratchpad

**Concept:** CPUs have hardware-managed caches (non-deterministic). TPUs have software-managed scratchpads (deterministic).

**Interactive widget — Memory Access Simulator:**

**Two-column comparison: CPU Cache vs TPU Scratchpad**

Left (CPU):
- Animated pipeline of memory accesses
- Each access: dice roll animation → cache HIT (fast, green) or MISS (slow, red, fetches from DDR)
- Hit rate slider (50%–95%)
- Latency graph shows spiky, non-deterministic timeline

Right (TPU/Scratchpad):
- Two explicit instructions: "Read Scratchpad" and "Read HBM"
- No randomness — colors always match what you chose
- Latency graph is flat and predictable

**Key insight:** "The cache is 100× faster than DDR. But when it misses, all bets are off. For HFT or AI inference, you want to know *exactly* how long something takes."

---

### Section 10 — GPU vs TPU: Architecture Comparison

**Concept:** GPUs = many tiny TPU-like units (SMs). TPUs = few giant systolic arrays. Different trade-offs.

**Interactive widget — Architecture Diff:**

Split view: GPU die layout vs TPU die layout (schematic, not literal)

**GPU side:**
- Grid of ~16 SMs (streaming multiprocessors)
- Each SM contains: mini tensor core + mini register file + warp scheduler + branch predictor space
- Click any SM → zooms in, shows components
- Wiring between SMs highlighted: "Data moves through many paths"

**TPU side:**
- 2–4 large MXUs (matrix multiply units)
- Shared vector unit in the middle
- Click MXU → zooms in, shows systolic array
- Wiring to vector unit highlighted: "All data must cross these 2 lanes"

**Slider: "Workload type"**
- "Huge matrix multiply" → TPU shading brightens, GPU dims, annotation: "TPU wins — giant systolic array amortizes register costs"
- "Mixed/irregular" → GPU brightens, annotation: "GPU wins — many independent SMs, more routing flexibility"

**Energy efficiency annotation:** Shows the perimeter bandwidth constraint in both architectures.

---

### Section 11 — The Throughput vs Latency Thread

**Concept:** This trade-off appears at every level: batch size, clock speed, pipeline depth, GPU vs TPU, cache vs scratchpad.

**Visual:** A unified diagram showing all 6 levels of the stack stacked vertically:

```
[Batch size for inference]        ↕ throughput vs latency
[GPU SM count vs SM size]         ↕ parallelism vs flexibility  
[Systolic array size]             ↕ compute vs register bandwidth
[Pipeline depth]                  ↕ clock speed vs area
[Precision (FP4 vs FP8)]          ↕ speed (quadratic!) vs accuracy
[Cache vs scratchpad]             ↕ flexibility vs determinism
```

Each row is clickable and scrolls back to the relevant section.

---

### Section 12 — Concept Map / Summary

**Visual:** Interactive node graph of all concepts learned

Nodes: AND Gate → Full Adder → Dadda Multiplier → MAC Unit → Register File → Mux → Systolic Array → Clock Cycle → Pipeline → LUT → FPGA/ASIC → Cache/Scratchpad → GPU/TPU

Clicking a node → highlights the connection chain and shows a 2-sentence summary.

**"Share what you learned" CTA** at the bottom.

---

## Publishing Plan

### Option A: GitHub Pages (Recommended — free, fast)
1. Build all files in a single repo
2. `git push` → GitHub Pages auto-deploys from `/docs` or `main` branch
3. Custom domain optional (e.g. `chipdesign.xyz`)
4. Free SSL, CDN via GitHub infrastructure

### Option B: Vercel (Easiest)
1. `vercel --prod` from project root
2. Auto-assigns `<project>.vercel.app`
3. Zero config for static HTML

### Option C: Netlify
1. Drag-and-drop the build folder at `netlify.com/drop`
2. Instant deploy with `<random>.netlify.app` URL

**Recommended for sharing:**  
Vercel (share the URL immediately) + then optionally connect to a custom domain.

---

## Prompt to Feed to Claude Code

Copy this exactly:

---

```
Build an interactive, single-page HTML/JS/CSS educational experience called "How Does a Chip Actually Work?" based on the Dwarkesh × Reiner Pope conversation about chip design.

DESIGN SYSTEM:
- Dark PCB-board aesthetic. Background #0A0E1A, surface #111827
- Circuit board grid overlay as background (subtle SVG dot/line pattern with animated signal pulses)
- Accent colors: electric blue #38BDF8 (signals), violet #A78BFA (data flow), green #34D399 (active/correct), amber #F59E0B (carry bits)
- Fonts: JetBrains Mono for all headers, bit values, labels; Inter for body text
- Signature element: circuit trace pulses animate across the background grid whenever a new concept activates

SECTIONS TO BUILD (in order):

1. HERO — Full-screen with animated circuit traces, title "How does a chip actually work?", subtitle, scroll CTA

2. LOGIC GATES — Interactive AND/OR/NOT gates with clickable inputs (0/1 toggles), live truth tables, signal pulse animation on output

3. MULTIPLY-ACCUMULATE — 4-bit × 4-bit binary long multiplication visualizer. User toggles bits, partial products render row by row showing which AND gate produced each partial product. 8-bit accumulator shown being added in. Live gate counter. Scaling tab shows FP4 vs FP8 gate cost comparison (quadratic scaling).

4. FULL ADDER (3→2 COMPRESSOR) — Three toggle inputs, live sum+carry output, truth table highlight, column-of-bits animation showing bits being "consumed"

5. DADDA MULTIPLIER — Step-through animation of full adder tree. 24 start bits → 8 end bits. Each step highlights 3 bits → 2 bits. Running counter of full adders used. Shows p×q algebra at the end.

6. REGISTER FILE + MUX TAX — Diagram of 8-register file feeding into MAC unit via mux. Live gate counter: "X% of area on data movement vs Y% on actual compute." Slider for register file size showing the overhead worsening.

7. SYSTOLIC ARRAY — 2×2 (scalable to 4×4, 8×8) matrix multiply simulator. Weight matrix editable. Vector inputs stream left-to-right with animation. Partial sums accumulate downward. Trickle-load animation shows how weights arrive slowly (bandwidth saving). Slider shows quadratic compute vs linear bandwidth.

8. CLOCK CYCLES & PIPELINING — Animated logic cloud between registers. Slider for logic depth → clock frequency updates. Pipeline register insertion button that splits the cloud and doubles frequency. Feedback loop demo showing why it breaks pipelining.

9. LUT & FPGA vs ASIC — Interactive 4-input LUT with programmable 16-row truth table. Function dropdown (AND, OR, XOR, etc.) shows gate cost ASIC vs LUT. Routing mux overlay shows "programming" an FPGA path in orange on a sea of white infrastructure wires.

10. CACHE vs SCRATCHPAD — Side-by-side CPU cache (random hit/miss dice roll, spiky latency graph) vs TPU scratchpad (explicit instruction types, flat deterministic latency graph).

11. GPU vs TPU ARCHITECTURE — Schematic die comparison. GPU: grid of SMs (click to zoom), show branch predictor area, warp scheduler. TPU: few large MXUs, shared vector unit, bandwidth bottleneck on 2-lane connection. Workload slider tilts the comparison.

12. THE THROUGHPUT/LATENCY THREAD — Unified vertical diagram showing this tradeoff at all 6 levels of abstraction (batch size → clock speed → pipeline depth → systolic size → precision → cache policy). Each row clickable to return to that section.

13. CONCEPT MAP — Interactive node graph of all concepts. Clicking a node highlights connections and shows a 2-sentence summary.

TECHNICAL REQUIREMENTS:
- Pure HTML + CSS + vanilla JS (no framework dependencies)
- All animations via CSS transitions + requestAnimationFrame
- Responsive down to 375px mobile width
- Respects prefers-reduced-motion
- Deployable as a single index.html or a flat folder to GitHub Pages / Vercel
- No build step required
- Each section lazy-initializes its JS when scrolled into view (IntersectionObserver)

Start by building sections 1–4, then 5–7, then 8–13. Test each section before moving to the next. The circuit board grid background should be implemented first as it's used everywhere.
```


## Tips for the Claude Code Session

- Ask Claude Code to **build one section at a time** and visually confirm it works before moving to the next
- Say: *"Open in browser and take a screenshot before continuing"* after each section
- If a section's animation is wrong, paste the specific Reiner Pope quote from the transcript into the prompt for that section — Claude Code will match the mechanics exactly
- At the end, ask: *"Bundle this into a single self-contained index.html for deployment"*
- For publishing: *"Create a vercel.json and README with deployment instructions"*
