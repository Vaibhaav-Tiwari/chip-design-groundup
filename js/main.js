/* ============================================================
   main.js  —  PR #0 FROZEN.  Loaded LAST. Builds the page DOM
   from the section registry and lazy-initializes each section
   (build(ctx)) the first time it scrolls into view.
   Agents NEVER edit this file to add a section — they register.
   ============================================================ */
(function (ChipViz) {
  'use strict';

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function makeSection(spec) {
    var left = ChipViz.el('div', { className: 'left' });
    var stage = ChipViz.el('div', { className: 'stage' });
    var section = ChipViz.el('section', {
      id: 'sec-' + spec.id,
      className: 'section',
      dataset: { sectionId: spec.id }
    }, [
      ChipViz.el('div', { className: 'section-inner' }, [
        ChipViz.el('header', { className: 'section-head' }, [
          ChipViz.el('span', { className: 'section-num', text: pad2(spec.order) }),
          ChipViz.el('h2', { text: spec.title || spec.id }),
          spec.subtitle ? ChipViz.el('p', { className: 'subtitle', text: spec.subtitle }) : null
        ]),
        ChipViz.el('div', { className: 'section-body' }, [left, stage])
      ])
    ]);
    return { section: section, left: left, stage: stage };
  }

  function boot() {
    var app = document.getElementById('app');
    if (!app) {
      app = ChipViz.el('div', { id: 'app' });
      document.body.appendChild(app);
    }

    var specs = ChipViz.list();
    var built = {};

    var pending = specs.map(function (spec) {
      var parts = makeSection(spec);
      app.appendChild(parts.section);
      return { spec: spec, parts: parts };
    });

    function build(entry) {
      if (built[entry.spec.id]) return;
      built[entry.spec.id] = true;
      var ctx = {
        root: entry.parts.section,
        left: entry.parts.left,
        stage: entry.parts.stage,
        pulseGrid: function () { ChipViz.pulseGrid(); }
      };
      try {
        entry.spec.build(ctx);
        ChipViz.pulseGrid(); // signature pulse on first activation
      } catch (err) {
        console.error('[ChipViz] build failed for section "' + entry.spec.id + '"', err);
      }
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var entry = pending.filter(function (p) { return p.parts.section === e.target; })[0];
          if (entry) { build(entry); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
      pending.forEach(function (p) { io.observe(p.parts.section); });
    } else {
      // no IO support: build everything immediately
      pending.forEach(build);
    }

    if (!specs.length) {
      app.appendChild(ChipViz.el('div', { className: 'panel', style: { margin: '4rem auto', maxWidth: '40rem' },
        html: '<strong>No sections registered yet.</strong> Section files will appear here as each agent’s PR lands.' }));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.ChipViz);
