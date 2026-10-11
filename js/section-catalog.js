// Contributors: keep this catalog aligned with the section registrations.
(function () {
  var catalog = [
    Object.freeze({ id: 'hero', order: 0, title: 'How does a chip actually work?' }),
    Object.freeze({ id: 'gates', order: 1, title: 'Logic Gates: The Primitives' }),
    Object.freeze({ id: 'mac', order: 2, title: 'Multiply-Accumulate: The AI Primitive' }),
    Object.freeze({ id: 'fulladder', order: 3, title: 'Full Adder: 3→2 Compressor' }),
    Object.freeze({ id: 'dadda', order: 4, title: 'Dadda Multiplier: Building the Adder Tree' }),
    Object.freeze({ id: 'mux', order: 5, title: 'Register File & The Mux Tax' }),
    Object.freeze({ id: 'systolic', order: 6, title: 'Systolic Array: Tensor Cores & TPU MXU' }),
    Object.freeze({ id: 'pipeline', order: 7, title: 'Clock Cycles & Pipelining' }),
    Object.freeze({ id: 'fpga', order: 8, title: 'FPGA vs ASIC: Lookup Tables' }),
    Object.freeze({ id: 'memory', order: 9, title: 'Memory: Cache vs Scratchpad' }),
    Object.freeze({ id: 'gputpu', order: 10, title: 'GPU vs TPU: Architecture Comparison' })
  ];

  globalThis.ChipVizSectionCatalog = Object.freeze(catalog);
}());
