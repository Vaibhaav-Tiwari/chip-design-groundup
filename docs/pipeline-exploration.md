# Pipeline section exploration guide

This guide accompanies the interactive **Clock Cycles & Pipelining** section.

- **Section id:** `pipeline`
- **Title:** Clock Cycles & Pipelining
- **Source:** [`js/sections/07-pipeline.js`](../js/sections/07-pipeline.js)

## Explore the controls

### Logic depth

The **Logic depth (gate stages)** range input controls the number of gate stages in the critical path:

- Range: **1 through 8** gate stages
- Step: **1** (the range input's default step)
- Default: **4** gate stages

The section recalculates the maximum frequency whenever the slider changes. Without a pipeline register, the critical-path length is the selected depth. With a pipeline register, the path is split at `Math.ceil(depth / 2)` stages for the first half; the remaining stages form the second half.

### Insert a pipeline register

Click **Insert pipeline register** to split the logic cloud in the middle. The diagram changes from one logic cloud to Logic A, a middle `REG`, and Logic B. This is a timing-versus-area trade-off:

- Splitting the critical path reduces the gate delay per clock period and can raise the maximum frequency (up to about 2× for an even depth).
- The extra register increases the register area from `1x` to `2x`.
- The pipelined path has **2 cycles of latency**, while its throughput is **1 result per cycle**.

The demonstration is about throughput and clock speed, not free performance: the additional register consumes area and adds a cycle of latency.

## Worked example: depth 6

Leave the slider at 6 and compare the two pipeline states. The implementation uses:

```text
path = pipelined ? Math.ceil(d / 2) : d
frequency = (4 / path).toFixed(2)
area = pipelined ? 2 : 1
```

Here, `4` is the implementation's base-frequency constant in `freqGHz`.

- **Unpipelined:** `path = 6`, so `4 / 6 = 0.666…`, displayed as **0.67 GHz**; area is **1x registers**.
- **Pipelined:** `path = Math.ceil(6 / 2) = 3`, so `4 / 3 = 1.333…`, displayed as **1.33 GHz**; area is **2x registers**.

Thus the maximum frequency is approximately doubled, while the register-area value doubles and the pipelined demonstration reports 2-cycle latency.

## Learner exercises

1. **Compare shallow and deep logic.** Set the depth to 1, then to 8, without enabling the pipeline. Expected observation: the displayed frequency falls from **4.00 GHz** at depth 1 to **0.50 GHz** at depth 8, because the unpipelined path equals `d`.
2. **Test an odd depth.** Set depth to 5 and toggle the pipeline register. Expected observation: the unpipelined frequency is **0.80 GHz** (`4 / 5`), while the pipelined frequency is **1.33 GHz** because `Math.ceil(5 / 2)` is 3; the two halves are therefore 3 and 2 gate stages rather than equal halves.
3. **Observe the area and timing trade-off.** Set any depth, then click **Insert pipeline register** and inspect the diagram, labels, and mini chart. Expected observation: a middle register appears, area changes from `1x` to `2x` registers, the status describes 2-cycle latency and 1 result/cycle throughput, and the frequency increases according to the split-path formula.
