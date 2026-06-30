/* ============================================================
   registry.js  —  PR #0 FROZEN.  Defines window.ChipViz and the
   section-registration API. Loaded BEFORE all section files and
   before grid-bg.js / helpers.js (which attach to ChipViz).
   This is the ONLY integration point between agents.
   ============================================================ */
(function () {
  'use strict';

  if (window.ChipViz) return; // idempotent

  var sections = [];

  var ChipViz = {
    /* internal list of registered section specs */
    _sections: sections,

    /**
     * Register a section. Call this at the top level of each
     * js/sections/NN-*.js file.
     *
     * spec = {
     *   id:       'gates',        // unique slug; used for anchors + concept-map nodes
     *   order:    1,              // page order (Hero = 0 … 12)
     *   title:    'Logic Gates: The Primitives',
     *   subtitle: 'AND, OR, NOT — the atomic units.',
     *   build(ctx) { ... }        // called ONCE, lazily, on first scroll into view
     * }
     *
     * ctx passed to build():
     *   { root, left, stage, pulseGrid }
     *   - root:  the <section> element
     *   - left:  left column (explanation + controls)
     *   - stage: right column (live visualization)
     *   - pulseGrid(): trigger the signature background trace-pulse
     */
    register: function (spec) {
      if (!spec || typeof spec.id !== 'string') {
        console.error('[ChipViz] register() requires a spec with a string id', spec);
        return;
      }
      if (sections.some(function (s) { return s.id === spec.id; })) {
        console.warn('[ChipViz] duplicate section id ignored:', spec.id);
        return;
      }
      if (typeof spec.build !== 'function') {
        console.error('[ChipViz] section "' + spec.id + '" has no build() function');
        return;
      }
      spec.order = typeof spec.order === 'number' ? spec.order : 999;
      sections.push(spec);
    },

    /** Sorted copy of registered sections (by order, then id). */
    list: function () {
      return sections.slice().sort(function (a, b) {
        return (a.order - b.order) || (a.id < b.id ? -1 : 1);
      });
    },

    /** Smooth-scroll to a section by id (used by S11 thread + S12 concept map). */
    scrollTo: function (id) {
      var el = document.getElementById('sec-' + id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    /**
     * Trigger the background circuit pulse. Real implementation is
     * installed by grid-bg.js; this no-op stub keeps section code
     * safe if grid-bg.js is absent (e.g. isolated unit tests).
     */
    pulseGrid: function () {}
  };

  window.ChipViz = ChipViz;
})();
