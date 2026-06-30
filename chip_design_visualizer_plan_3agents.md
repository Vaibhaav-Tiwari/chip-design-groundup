# 🔲 Chip Design Visualizer — 3-Agent Orchestrated Build Plan

### Reformed for the **AgentWrapper/agent-orchestrator** (worktree-per-worker, PR-per-task)

This is the original [`chip_design_visualizer_plan.md`](chip_design_visualizer_plan.md) restructured so **three coding agents build it in parallel** under the orchestrator. Nothing from the original vision, design system, or section specs has been dropped — it has been re-sliced into **conflict-free work packages**, each carrying the exact source quotes from [`chip_design.md`](chip_design.md) so every agent matches the hardware mechanics precisely.

---

## 0. Read this first — the orchestration model

The orchestrator (AgentWrapper/agent-orchestrator) runs each worker agent in **its own git worktree**, each produces a **PR**, and it **auto-routes merge conflicts, CI failures, and review comments back** to the responsible agent. Two consequences shape this entire plan:

1. **Worktrees branch from `main`.** A worker can only build against shared code that is *already merged*. So the shared foundation (design tokens, circuit-grid background, the section-registration API, the frozen `index.html`) must land as **PR #0 before the three section workers start.** This is the one hard sequential gate.
2. **Clean merges require disjoint file ownership.** The single biggest risk in parallelizing a one-page app is two agents editing the same file (`index.html`, a central `main.js`, a shared CSS file). We eliminate that entirely with the **self-registration pattern** below: after PR #0, **no agent ever edits a file another agent owns.** Each section is one JS file + one CSS file that *register themselves*. The orchestrator's auto-merge then has nothing to resolve.

### The conflict-free trick (why this works)

All 13 sections are known up front. So **PR #0 pre-wires every `<script>` and `<link>` tag in `index.html`** — even for files that don't exist yet (a missing file just 404s harmlessly until its owner creates it). From then on:

- `index.html` is **FROZEN**. Nobody touches it.
- Each section file calls `ChipViz.register({...})` to add itself. `main.js` discovers sections from the registry — it is **never edited** to add a section.
- Each agent **only creates** files in its own numbered lane (`js/sections/05-*.js`, `css/sections/05-*.css`, …).

Result: three PRs that touch **completely disjoint file sets** → zero merge conflicts by construction.

---

## 1. Phase map & milestone gates

```
PR #0  FOUNDATION  (Agent A, solo)              ← GATE: must merge before #1–#3 start
  └─ frozen index.html, design tokens, circuit-grid bg, ChipViz registry API,
     shared helpers, main.js orchestration, contract stub for B & C

   ── after PR #0 merges, fan out in parallel ──

PR #1  Agent A   Hero + S1 Gates + S2 MAC
PR #2  Agent B   S3 Full Adder + S4 Dadda + S5 Register/Mux + S6 Systolic
PR #3  Agent C   S7 Clock/Pipeline + S8 FPGA/LUT + S9 Cache + S10 GPU/TPU

   ── after #1–#3 merge ──

PR #4  INTEGRATION (Agent A)                     ← needs all section ids to exist
  └─ S11 Throughput/Latency thread, S12 Concept Map, single-file bundle, deploy config
```

### Keeping B and C busy during the PR #0 gate (optional, recommended)

B and C don't have to idle while A builds the foundation. PR #0's deliverables include a **`contract-stub.html`** (a ~30-line standalone harness that defines a minimal `window.ChipViz` with `register`, `svg`, `pulse`, `bitToggle`, and the CSS tokens). The orchestrator can hand B and C this stub plus the **Shared Contract spec (§2)** immediately, so they develop each section against the stub in isolation and drop the finished files in once PR #0 lands. The contract is frozen in §2 precisely so this works.

---

## 2. THE SHARED CONTRACT  *(PR #0 — read by ALL agents)*

> Every agent must treat this section as an API spec. A, B, and C build against these exact names, signatures, tokens, and classes. If a section needs something not here, it builds it **inside its own file** — it does **not** modify shared files.

### 2.1 File tree

```
index.html                  ← PR #0, then FROZEN. Pre-wires ALL tags below.
contract-stub.html          ← PR #0. Standalone harness for B/C to dev against.
vercel.json                 ← PR #4
README.md                   ← PR #4
css/
  tokens.css                ← PR #0 frozen — palette, fonts, spacing vars
  base.css                  ← PR #0 frozen — layout, typography, grid bg, a11y
  sections/
    00-hero.css   01-gates.css   02-mac.css        ← Agent A
    03-fulladder.css 04-dadda.css 05-mux.css 06-systolic.css  ← Agent B
    07-pipeline.css 08-fpga.css 09-memory.css 10-gputpu.css   ← Agent C
    11-thread.css 12-conceptmap.css               ← Agent A (PR #4)
js/
  core/
    registry.js             ← PR #0 frozen — window.ChipViz, register(), boot
    grid-bg.js              ← PR #0 frozen — animated circuit-trace background
    helpers.js              ← PR #0 frozen — svg(), pulse(), bitToggle(), etc.
  main.js                   ← PR #0 frozen — builds DOM from registry, lazy-init
  sections/
    00-hero.js   01-gates.js   02-mac.js          ← Agent A
    03-fulladder.js 04-dadda.js 05-mux.js 06-systolic.js  ← Agent B
    07-pipeline.js 08-fpga.js 09-memory.js 10-gputpu.js   ← Agent C
    11-thread.js 12-conceptmap.js                 ← Agent A (PR #4)
```

**Ownership rule:** a file's lane number = the owner. Touching a file outside your lane (especially anything marked *frozen*) is a plan violation and will cause a merge conflict the orchestrator routes back to you.

### 2.2 Design tokens  (`css/tokens.css`)

```css
:root {
  /* palette — dark PCB aesthetic */
  --bg:           #0A0E1A;  /* deep navy PCB substrate */
  --surface:      #111827;  /* panels */
  --grid:         #1E293B;  /* trace/grid lines */
  --accent:       #38BDF8;  /* electric sky-blue — signal wire */
  --accent-2:     #A78BFA;  /* soft violet — data flow */
  --highlight:    #34D399;  /* logic-green — correct/active */
  --carry:        #F59E0B;  /* amber — carry bits / warnings */
  --text:         #F1F5F9;
  --text-muted:   #64748B;
  /* type */
  --font-mono: 'JetBrains Mono', ui-monospace, monospace; /* headers, ALL bit values, labels, numbers */
  --font-body: 'Inter', system-ui, sans-serif;            /* prose */
  /* rhythm */
  --section-pad: clamp(1.5rem, 5vw, 5rem);
  --radius: 10px;
}
```

**Semantic color law (every agent obeys):** signals/wires = `--accent`; data flow = `--accent-2`; active/correct/sum = `--highlight`; carry bits/warnings = `--carry`. Weight-loading in systolic/data uses `--accent-2`, input streaming uses `--accent`, output collecting uses `--highlight`.

### 2.3 The registration API  (`js/core/registry.js`)

Each section file self-registers. This is the *only* integration point.

```js
// window.ChipViz.register(spec)
// spec = {
//   id:       'gates',            // unique slug, used for anchors & concept-map nodes
//   order:    1,                  // sort order on the page (Hero = 0 … 12)
//   title:    'Logic Gates: The Primitives',
//   subtitle: 'AND, OR, NOT — the atomic units.',
//   build(ctx) { ... }            // called ONCE, lazily, when section scrolls into view
// }
//
// ctx = {
//   root,      // the <section> element (already has heading + 2-col layout shell)
//   left,      // left column element (put explanation text + controls here)
//   stage,     // right column element (put the live SVG/canvas visualization here)
//   pulseGrid()// trigger the signature background trace-pulse for this section
// }
ChipViz.register({ id, order, title, subtitle, build });
```

`main.js` (frozen) reads the registry on `DOMContentLoaded`, sorts by `order`, creates each `<section id="sec-{id}">` with its heading and a two-column shell (`.left` / `.stage`), and uses an `IntersectionObserver` to call `build(ctx)` **once** the first time it enters the viewport (lazy init). On first activation it also calls `pulseGrid()` so a signal pulse runs across the background — the signature element.

**Scroll-to helper (for S11 & S12):** `ChipViz.scrollTo(id)` smooth-scrolls to a section. Already provided so the throughput thread and concept map can link back without DOM coupling.

### 2.4 Shared helpers  (`js/core/helpers.js`)

Provided so agents don't reinvent primitives (and so visuals stay consistent). All under `ChipViz.*`:

```js
ChipViz.svg(tag, attrs, children?) // create namespaced SVG el
ChipViz.el(tag, props, children?)  // create HTML el
ChipViz.pulse(wireEl, color?)      // animate a signal pulse along an SVG path/line
ChipViz.bitToggle(opts)            // returns a clickable 0/1 bit button {el, value, onChange}
ChipViz.counter(label)             // returns a live numeric readout {el, set(n)}
ChipViz.truthTable(cols, rows)     // returns {el, highlightRow(i)}
ChipViz.barChart(data)             // tiny SVG bar chart {el, update(data)}
ChipViz.prefersReducedMotion()     // boolean; agents MUST branch animations on this
```

If a helper is missing what you need, extend **inside your section file** — do not edit `helpers.js`.

### 2.5 Circuit-grid background  (`js/core/grid-bg.js` + `css/base.css`)

A fixed full-viewport SVG dot/line grid in `--grid` behind everything. Idle: faint static lattice. On `pulseGrid()` (and on section activation): a signal pulse in `--accent` travels along trace lines, like electricity through a PCB. Respects `prefers-reduced-motion` (no continuous motion; a single subtle fade instead). This is the unifying signature element referenced in every section — agents trigger it via `ctx.pulseGrid()`, they never reimplement it.

### 2.6 Global behaviors (frozen, inherited by all sections)

- **Pure HTML + CSS + vanilla JS. No frameworks, no build step.** Must run by opening `index.html` (and as a single bundled file after PR #4).
- **Responsive to 375px.** Two-column shell collapses to stacked (stage below text) under ~720px. Agents test their stage at 375px.
- **`prefers-reduced-motion`:** every animation must have a reduced-motion path. Use `ChipViz.prefersReducedMotion()`.
- **Lazy init** via the registry's IntersectionObserver — agents do **not** write their own observers for section activation.
- **Vertical scroll, full-width sections that snap into view.** Left = explanation + controls, right/below = live visualization.

### 2.7 `index.html` pre-wiring (PR #0 writes this once, then FROZEN)

Includes — in order — Google Fonts (JetBrains Mono, Inter), `css/tokens.css`, `css/base.css`, **all 13** `css/sections/NN-*.css`, then `js/core/registry.js`, `grid-bg.js`, `helpers.js`, **all 13** `js/sections/NN-*.js`, then `js/main.js` last. Files that don't exist yet 404 silently — that's expected until their owner's PR lands.

---

## 3. Source-fidelity rule

Each section spec below embeds the **verbatim Reiner Pope quotes** from [`chip_design.md`](chip_design.md) that define its mechanics. When an animation's behavior is ambiguous, the quote is ground truth — match it exactly. Do not invent hardware behavior that contradicts the transcript.

---

# AGENT A — Foundation + Front Sections + Integration

**PRs:** #0 (foundation, solo gate) → #1 (Hero, S1, S2) → #4 (S11, S12, bundle, deploy).
**Files:** everything in §2.1 marked *PR #0* and *Agent A*, plus the `11-*`/`12-*` lanes and deploy files.

### PR #0 — Foundation (build & merge FIRST)

Deliver every *frozen* file in §2: `index.html` (fully pre-wired per §2.7), `contract-stub.html`, `css/tokens.css`, `css/base.css` (grid bg styles, layout shell, a11y, responsive), `js/core/registry.js`, `js/core/grid-bg.js`, `js/core/helpers.js`, `js/main.js`. Build the **circuit-grid background first** — it's used everywhere and is the visual signature. **Acceptance:** opening `index.html` shows the animated PCB grid; `ChipViz.register` adds a placeholder section that lazy-builds on scroll and fires a grid pulse; `contract-stub.html` runs a sample section standalone. Merge before anything else branches.

### PR #1 — Hero (S0), Logic Gates (S1), Multiply-Accumulate (S2)

#### Section 0 — Hero / Entry  `id:'hero', order:0`
Full-screen dark panel; circuit traces pulse upward from the bottom (reuse grid-bg). Monospace title fades in:

```
"How does a chip actually work?"   — Reiner Pope, CEO of MatX
```
Subtitle: *"From a single AND gate to a full AI accelerator. Interactive."* CTA `→ Start from the bottom` scrolls to S1 and triggers a "power-on" flash across the trace grid (`ctx.pulseGrid()`).

> **Source anchor:** *"I'll start with the smallest fundamental unit of chip design, and we'll build up to what an actual production chip is."* / *"the primitives we work with are logic gates, very simple things like AND, OR, and NOT… connected together by wires… laid out physically as metal traces on a chip."*

#### Section 1 — Logic Gates: The Primitives  `id:'gates', order:1`
Three large SVG gates: AND, OR, NOT, each with clickable 0/1 inputs (`ChipViz.bitToggle`). Output updates live with a `ChipViz.pulse` signal animation. Live-filling truth table (`ChipViz.truthTable`). Callouts: *"AND: output is 1 only if BOTH inputs are 1"* and *"This is how we compute a single partial product in multiplication."* Note: *"Every computation in this chip is built from these three primitives."*

> **Source anchor:** *"AND is almost the simplest logic gate that exists on a chip… the very largest logic gate you'll typically use is something called a full adder."* / *"This number is 1 if both this bit is 1 and this bit is 1. If either of them is 0, then 0 times anything is 0."*

#### Section 2 — Multiply-Accumulate: The AI Primitive  `id:'mac', order:2`
Two 4-bit inputs (toggle each bit). Long-multiplication grid renders row by row; each partial-product row highlights *which AND gate produced it*. Corner counter: "AND gates used: X / 16". 8-bit accumulator shown being added in. Result in binary + decimal. Bit-width tabs (4-bit / 8-bit) drive a small `ChipViz.barChart` showing **quadratic (p×q)** gate-cost scaling, FP4 vs FP8. Key box:
> "This is exactly what happens at every step of a matrix multiply:
> `output[i][k] += input[i][j] × input[j][k]`"

> **Source anchors:** *"a multiply of these two terms, and then we're going to add in an eight-bit number"* / *"multiply this four-bit number by every single bit position in the other four-bit number"* / *"To produce all of this, we ended up consuming 16 AND gates… p times q many ANDs"* / *"the precision will almost always be higher in the accumulation step than in the multiplication step… errors accumulate"* / quadratic scaling: *"the amount of area it takes… is quadratic with the bit length… Nvidia… B300… FP4 is three times faster than the FP8. Though it should be 4x."*

### PR #4 — Integration (build AFTER #1–#3 merge)

#### Section 11 — Throughput vs Latency Thread  `id:'thread', order:11`
Unified vertical diagram of the same trade-off at all 6 levels; each row clickable → `ChipViz.scrollTo(id)` back to its section:
```
[Batch size for inference]   ↕ throughput vs latency        → (note in summary)
[GPU SM count vs SM size]    ↕ parallelism vs flexibility   → 'gputpu'
[Systolic array size]        ↕ compute vs register bandwidth → 'systolic'
[Pipeline depth]             ↕ clock speed vs area          → 'pipeline'
[Precision (FP4 vs FP8)]     ↕ speed (quadratic!) vs accuracy → 'mac'
[Cache vs scratchpad]        ↕ flexibility vs determinism   → 'memory'
```
> **Source anchor:** *"You can have low latency but low throughput… throughput is the product of how much you get done per clock cycle… times how many clocks you get per second."* / *"In both cases, you're trying to maximize compute relative to communication. This shows up all the way up and down the stack."*

#### Section 12 — Concept Map / Summary  `id:'conceptmap', order:12`
Interactive node graph; nodes built from the registry ids: AND Gate → Full Adder → Dadda Multiplier → MAC Unit → Register File → Mux → Systolic Array → Clock Cycle → Pipeline → LUT → FPGA/ASIC → Cache/Scratchpad → GPU/TPU. Click a node → highlight its connection chain + 2-sentence summary + `ChipViz.scrollTo`. "Share what you learned" CTA at the bottom.

#### Bundle & deploy
Inline everything into a single self-contained `index.html` (CSS in `<style>`, JS in `<script>`), keeping the registry pattern intact. Add `vercel.json` (zero-config static) and `README.md` with GitHub Pages / Vercel / Netlify deploy steps. **Acceptance:** the one-file build opens offline with all 13 sections working and animations intact.

---

# AGENT B — Adder Tree + Data Movement + Systolic Array

**PR:** #2 (S3, S4, S5, S6). **Files:** `03-*`, `04-*`, `05-*`, `06-*` lanes only. Develop against `contract-stub.html` while PR #0 is in flight.

#### Section 3 — Full Adder: 3→2 Compressor  `id:'fulladder', order:3`
Three bit toggles (A, B, Cin). Live Sum + Carry-out on color-coded wires (sum = `--highlight`, carry = `--carry`). Truth table highlights the current row. "Step through" cycles all 8 input combos. Visual metaphor: a vertical column of partial-product bits — the full adder reaches in, grabs 3, outputs 2; watch the column shrink. Caption: *"This is just counting how many 1s there are, in binary."*

> **Source anchors:** *"a full adder… just adds three single-bit numbers together… the result can be 0,1,2, or 3, so I can express that in binary using just two bits… As input, three bits. As output, two bits."* / *"This is also known as a 3→2 compressor."* / *"if 101 → output 10; if 111 → 11; if 000 → 00; if 010 → 01."* / *"the three inputs are all bits in the same bit position… this is a carry out, whereas this was the sum."*

#### Section 4 — Dadda Multiplier: Building the Adder Tree  `id:'dadda', order:4`
Full 4×4 partial-product grid (16 bits + 8-bit accumulator = **24 start bits**). "Step" walks each full-adder application: 3 bits glow `--accent` → consumed (crossed out, gray); carry shifts to next column (`--carry`); sum stays in column (`--highlight`). FA counter "Full adders used: X / 16". End state: *"We started with 24 bits. Ended with 8. Used exactly 16 full adders (= p×q)."* Side panel shows the live formula `pq AND gates + pq full adders`.

> **Source anchors:** *"We proceed from the rightmost column toward the left… instead of remembering the carry, we'll explicitly write it out."* / *"keep applying full adders… constantly removing three numbers from a column and writing out two numbers as output… until I eventually get just one single number."* / *"This approach is called a Dadda multiplier… area-efficient multipliers."* / the algebra: *"24 minus 8, so there were 16 full adders… input bits 24 = p×q + p+q, output bits p+q, so p×q + p+q − (p+q) = p×q."*

#### Section 5 — Register File & The Mux Tax  `id:'mux', order:5`
Diagram: 8-slot register file (left) → mux → MAC unit (right) → write-back. Dropdown picks any 3 registers as MAC inputs; wires animate register → mux → MAC → register. Live gate-counter panel: mux AND gates `3 × n × p`, MAC AND gates `p × q`, and **ratio "X% of gates spent on data movement."** Slider for register-file size (n = 4/8/16/32) makes the ratio worse. Insight box: *"With n=8, p=4, q=4: 96 gates on moving data, 16 on actual multiply. 6:1 overhead. This is the problem Tensor Cores solved."*

> **Source anchors:** *"take three arbitrary registers from this register file, perform the multiply-accumulate, and then write back."* / mux build: *"We form a mask… AND every single entry with 1 or 0… then OR all of them together… n×p many AND gates… (n−1)×p many OR gates."* / *"3 × n × p AND gates… compared to p × q gates in the actual circuit."* / *"almost all of the cost, seven-eighths of the cost, is in reading and writing the register file."* / *"This problem statement is what motivated the introduction of Tensor Cores, which are more generically called systolic arrays."*

#### Section 6 — Systolic Array: Tensor Cores & TPU MXU  `id:'systolic', order:6`
**Phase 1 — Matrix-Vector multiply:** editable 2×2 weight matrix; size-2 input vector on the left; "Run" flows values cell-by-cell (multiply glows `--highlight`); partial sums flow downward; output vector emerges at bottom. Annotation: *"Each cell is one MAC unit. The weight stays fixed. Only the input moves."*
**Phase 2 — Trickle-load:** weights load one row at a time over N clock cycles (clock counter ticks). *"Bandwidth from register file: only X, not X²."*
**Phase 3 — Size scaler:** slider 2×2 → 4×4 → 8×8; show compute growing quadratically while register-file bandwidth stays linear. *"This is why bigger systolic arrays are more efficient."*
Legend (use the semantic colors): weight loading `--accent-2`, input streaming `--accent`, output collecting `--highlight`.

> **Source anchors:** *"this matrix is going to stay fixed for a long period of time… store these numbers… in a gate called a register… reuse them over and over for a large number of different vectors."* / *"we feed in 0s at the top of a column, and coming out the bottom we get results… a dot product summed vertically."* / trickle-load: *"we just do it very slowly… daisy chain: feed a number in here, and on the next clock cycle it moves down… keeps the wiring… down to a factor of x rather than xy."* / *"older TPUs were described as 128×128 of this circuit… the most efficient known circuit for implementing a matrix multiply."* / sizing: *"set a budget for what percentage of chip area you want to spend on data movement… 10%… and the systolic array 90%."*

---

# AGENT C — Timing, Reprogrammability, Memory & Macro-Architecture

**PR:** #3 (S7, S8, S9, S10). **Files:** `07-*`, `08-*`, `09-*`, `10-*` lanes only. Develop against `contract-stub.html` while PR #0 is in flight.

#### Section 7 — Clock Cycles & Pipelining  `id:'pipeline', order:7`
**Part A:** animated "cloud of logic" between two registers; slider "Logic depth (gates in path)"; a red warning bar fills (*"Clock period must be ≥ gate delay"*); "Max frequency: X GHz" updates.
**Part B:** "Insert pipeline register in the middle" splits the cloud in two with a register between; frequency doubles; area counter rises (register cost); throughput-vs-latency chart updates.
**Part C:** toggle "Enable feedback (running sum)"; show why you can't pipeline a feedback loop — the "even and odd sum" failure visualization.

> **Source anchors:** *"Every nanosecond or so, all circuitry in the chip will pause for a moment and synchronize. That is the clock cycle."* / *"split it in the middle, you can hit twice the clock frequency… at the cost of an extra register."* / *"This optimization is called pipeline register insertion… a pure trade-off between clock speed and area."* / feedback: *"if I put a pipeline register right in the middle… I'll end up with a running sum of the even numbers and a running sum of the odd numbers."* / over-pipelining: *"you've made your clock speed really fast at the cost of spending almost all of your area on pipeline registers… low latency but low throughput."*

#### Section 8 — FPGA vs ASIC: Lookup Tables  `id:'fpga', order:8`
**Part A:** 4-input LUT (A,B,C,D toggles), a fillable 16-row truth table (click any cell 0/1), active row highlighted, live output.
**Part B:** function dropdown (AND, OR, XOR, 4-way AND, majority vote); ASIC column shows gates needed (3 for 4-way AND); LUT column always shows 16 AND + 16 OR = 32; ratio "FPGA costs X× more gates."
**Part C:** pool of LUTs + registers webbed by muxes; "Program" overlays one orange path; *"The white wires must always exist. You're paying for all of them."*

> **Source anchors:** *"A lookup table has four bits of input and one bit of output. How many functions from four bits to one bit? 16."* / *"the lookup table itself you can think of as being a big mux that selects from all 16 rows… n=16, p=1… np = 16 AND gates and 16 ORs."* / *"a four-way AND… in an ASIC directly using three AND gates… Using a LUT… 32 gates instead of three."* / *"The orange is what has been programmed in the field, whereas the white is all the wires that must exist."* / business case: *"first FPGA costs $10,000, whereas the first ASIC… $30 million… an entire tape-out."*

#### Section 9 — Memory: Cache vs Scratchpad  `id:'memory', order:9`
Two columns. **Left (CPU cache):** animated stream of memory accesses; each = dice-roll → HIT (fast, `--highlight`) or MISS (slow, `--carry`, fetches from DDR); hit-rate slider (50–95%); spiky non-deterministic latency graph. **Right (TPU scratchpad):** two explicit instruction types ("Read Scratchpad" / "Read HBM"); no randomness — color always matches the chosen instruction; flat, predictable latency graph. Insight: *"The cache is ~100× faster than DDR, but on a miss, all bets are off. For HFT or AI inference, you want to know exactly how long something takes."*

> **Source anchors:** *"whether or not you get a cache hit depends on the ambient environment… what the random number generator inside the cache system is doing. That is a big source of non-determinism."* / *"The cache is two orders of magnitude faster than the DDR."* / scratchpad: *"one kind of instruction that says read or write scratchpad, and a totally different instruction that says read or write HBM."* / *"You see this in TPUs… HBM… rather than DDR."*

#### Section 10 — GPU vs TPU: Architecture Comparison  `id:'gputpu', order:10`
Split schematic die view (not literal). **GPU:** grid of ~16 SMs, each with mini tensor core + mini register file + warp scheduler + branch-predictor area; click an SM → zoom to components; wiring highlighted (*"Data moves through many paths"* — 16 lanes). **TPU:** 2–4 large MXUs + shared central vector unit; click an MXU → zoom to its systolic array; wiring highlighted (*"All data must cross these 2 lanes"*). Workload slider: "Huge matrix multiply" → TPU brightens (*"giant systolic array amortizes register costs"*); "Mixed/irregular" → GPU brightens (*"many independent SMs, more routing flexibility"*). Annotate the perimeter-bandwidth constraint.

> **Source anchors:** *"the GPU is mostly a bunch of almost-identical units, which are the SMs… a fairly regular grid of cores."* / *"a TPU… just a few matrix units… a vector unit in the middle."* / *"the GPU has a lot of tiny TPUs tiled across the whole chip."* / bandwidth trade-off: *"you need to move a lot of data from the vector unit to the matrix units, through just two lines of perimeter… in a GPU… 16 lines of wiring."* / branch predictor: *"the thing that does not have an equivalent in a GPU is the branch predictor."*

---

## 4. Coordination & git protocol (for the orchestrator)

1. **Gate:** Agent A's PR #0 merges to `main` **before** B and C branch their worktrees. (The orchestrator schedules #1/#2/#3 to fan out only after #0 is merged; B/C may pre-develop against `contract-stub.html`.)
2. **Disjoint lanes:** every PR touches only its owned files (§2.1). No PR edits a *frozen* file or another agent's lane → the orchestrator's auto-merge has nothing to resolve.
3. **Branch naming:** `agent-a/foundation`, `agent-a/sections-hero-mac`, `agent-b/sections-3-6`, `agent-c/sections-7-10`, `agent-a/integration`.
4. **PR #4 last:** the throughput thread and concept map reference *all* section ids, so Agent A builds them after #1–#3 merge.
5. **Feedback routing:** if CI/lint/visual review flags a section, the orchestrator routes it back to that section's owning agent — fixes stay within the owned lane.

## 5. Definition of Done (per section — agents self-verify before opening a PR)

- Section appears in correct `order`, lazy-builds on scroll, fires a grid pulse on first view.
- All interactions work; counters/ratios compute the **exact** algebra in the source anchors.
- Semantic colors (§2.2) used correctly; `--font-mono` on every bit value/label/number.
- Renders cleanly at **375px** and desktop; `prefers-reduced-motion` path verified.
- No console errors; no edits outside the agent's lane; opens with no build step.
- (PR #4) single-file bundle opens offline with all 13 sections intact.

## 6. Per-agent kickoff prompts (paste into each worker)

**Agent A — PR #0 then #1, later #4:**
> Read `chip_design_visualizer_plan_3agents.md` §2 (Shared Contract) and your "AGENT A" section. Build PR #0 first: all frozen foundation files exactly per §2, circuit-grid background first, `index.html` pre-wiring all 13 section tags per §2.7, plus `contract-stub.html`. Verify the foundation acceptance criteria, open PR #0, and stop for merge. After #0 merges, build Hero + S1 Gates + S2 MAC in your lanes only. After #1–#3 merge, build S11, S12, and the single-file bundle + deploy config. Match every Source anchor quote exactly. Never edit files outside your lane.

**Agent B — PR #2:**
> Read `chip_design_visualizer_plan_3agents.md` §2 (Shared Contract) and your "AGENT B" section. While PR #0 is in flight, develop S3 Full Adder, S4 Dadda, S5 Register/Mux, S6 Systolic against `contract-stub.html`. Each section = one self-registering JS file + one CSS file in lanes `03/04/05/06` only. Match every Source anchor quote exactly (especially the 24→8 bit / 16-full-adder algebra and the 7/8 mux-tax cost). Verify the Definition of Done, then open PR #2. Never edit frozen files or another agent's lane.

**Agent C — PR #3:**
> Read `chip_design_visualizer_plan_3agents.md` §2 (Shared Contract) and your "AGENT C" section. While PR #0 is in flight, develop S7 Clock/Pipeline, S8 FPGA/LUT, S9 Cache/Scratchpad, S10 GPU/TPU against `contract-stub.html`. Each section = one self-registering JS file + one CSS file in lanes `07/08/09/10` only. Match every Source anchor quote exactly (LUT = 32-gate mux vs 3-gate ASIC; cache non-determinism; 2-lane TPU vs 16-lane GPU perimeter). Verify the Definition of Done, then open PR #3. Never edit frozen files or another agent's lane.

---

*Original single-agent plan preserved at [`chip_design_visualizer_plan.md`](chip_design_visualizer_plan.md); source transcript at [`chip_design.md`](chip_design.md). This document re-slices that exact scope into three conflict-free, orchestrator-ready work packages.*
