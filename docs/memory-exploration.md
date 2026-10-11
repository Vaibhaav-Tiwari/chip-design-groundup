# Memory exploration guide

This guide accompanies the **Memory: Cache vs Scratchpad** section.

- **Section id:** `memory`
- **Title:** Memory: Cache vs Scratchpad
- **Source:** [`js/sections/09-memory.js`](../js/sections/09-memory.js)

## Controls and model

The **Cache hit rate** slider accepts values from **50% through 95%**, in
**5-percentage-point steps**, and starts at **80%**. Changing it resets the
cache history and the deterministic pseudo-random sequence so that different
settings can be compared consistently.

The visualization models two different memory approaches:

- **CPU cache:** each access is determined as a hit or miss using the selected
  hit rate. A hit is represented as latency `1`; a miss uses `20`, standing in
  for a full DDR access. The page describes a cache hit as approximately 100×
  faster than DDR, while warning that misses lose that advantage.
- **TPU scratchpad/HBM:** the instruction selector chooses either “Read
  Scratchpad (fast)” or “Read HBM (slow).” Scratchpad is represented as
  latency `1`, while HBM is represented as `10`. The selected instruction
  always produces the same kind of bar, rather than an unpredictable hit or
  miss.

This illustrates the tradeoff: a cache is convenient and can be very fast, but
its hit or miss depends on the surrounding workload and recently touched or
evicted data, so latency is non-deterministic. A scratchpad requires an
explicit choice of memory in the instruction, but that explicitness provides
predictable behavior. The chart makes this visible as mixed-height CPU-cache
bars versus uniform TPU bars for the selected instruction.

The latency numbers are **illustrative values used by this visualization**
(normalized simulation units, with the labels “1 cycle,” “10 cycles,” and the
approximately 100× cache-vs-DDR comparison supplied by the page). They are not
hardware measurements, timing specifications, or guarantees for a particular
CPU, TPU, cache, DDR, or HBM device. Real latency depends on the architecture,
access pattern, contention, and other system conditions.

## Learner exercises

1. Set the cache hit rate to **50%**, start the simulation, and compare the two
   columns. **Expected observation:** the CPU Cache column contains a visibly
   mixed sequence of short hit bars and tall miss bars; the TPU column remains
   uniform for whichever instruction is selected.
2. Change the cache hit rate from **50%** to **95%**, restarting or observing
   each run. **Expected observation:** the 95% run generally has more short
   cache-hit bars and fewer tall misses, but it is still not guaranteed to be
   entirely short because the simulation samples individual accesses.
3. Switch the TPU instruction between **Read Scratchpad (fast)** and **Read
   HBM (slow)** while the simulation is paused, then resume it. **Expected
   observation:** the TPU history resets and new bars switch from the short
   scratchpad level to the taller HBM level (or back), demonstrating explicit,
   repeatable selection rather than cache-like randomness.
