/* ============================================================
   00-hero.js  —  S0 Hero Section
   Registers the full-screen hero with title, subtitle, attribution,
   and a CTA button that scrolls to the gates section.

   Source anchors (verbatim):
   "I'll start with the smallest fundamental unit of chip design,
    and we'll build up to what an actual production chip is."
   "the primitives we work with are logic gates, very simple things
    like AND, OR, and NOT… connected together by wires… laid out
    physically as metal traces on a chip."
   — Reiner Pope, CEO of MatX (via Dwarkesh Podcast)
   ============================================================ */

(function (ChipViz) {
  'use strict';

  ChipViz.register({
    id: 'hero',
    order: 0,
    title: 'How does a chip actually work?',
    subtitle: 'From a single AND gate to a full AI accelerator. Interactive.',

    build: function (ctx) {
      /* ---- left column: hero content ---- */
      var reduced = ChipViz.prefersReducedMotion();

      /* Title — large monospace, fade-in unless reduced motion */
      var title = ChipViz.el('h1', {
        className: 'hero-title' + (reduced ? '' : ' hero-fade-in'),
        text: 'How does a chip actually work?'
      });

      /* Subtitle */
      var subtitle = ChipViz.el('p', {
        className: 'hero-subtitle' + (reduced ? '' : ' hero-fade-in hero-fade-in--delay-1'),
        text: 'From a single AND gate to a full AI accelerator. Interactive.'
      });

      /* Attribution */
      var attribution = ChipViz.el('p', {
        className: 'hero-attribution' + (reduced ? '' : ' hero-fade-in hero-fade-in--delay-2'),
        text: '— Reiner Pope, CEO of MatX'
      });

      /* CTA button */
      var cta = ChipViz.el('button', {
        className: 'hero-cta' + (reduced ? '' : ' hero-fade-in hero-fade-in--delay-3'),
        type: 'button',
        text: '→ Start from the bottom',
        onClick: function () {
          ChipViz.scrollTo('gates');
          ctx.pulseGrid();
        }
      });

      ctx.left.appendChild(title);
      ctx.left.appendChild(subtitle);
      ctx.left.appendChild(attribution);
      ctx.left.appendChild(cta);

      /* ---- stage column: decorative PCB trace hint ---- */
      var traceSvg = ChipViz.svg('svg', {
        class: 'hero-trace-svg',
        viewBox: '0 0 200 300',
        width: '100%',
        height: '100%',
        'aria-hidden': 'true'
      });

      /* Decorative PCB-style trace paths */
      var traces = [
        'M 20 40  H 100  V 100  H 160  V 200',
        'M 60 10  V 80   H 140  V 140  H 180  V 260',
        'M 10 150 H 70   V 220  H 120  V 280',
        'M 100 0  V 50   H 40   V 120  H 90',
        'M 150 80 H 190  V 180  H 110  V 240  H 170'
      ];

      var junctionCoords = [
        [100, 40], [100, 100], [160, 100], [160, 200],
        [140, 80], [140, 140], [180, 140],
        [70, 150], [70, 220], [120, 220]
      ];

      traces.forEach(function (d, i) {
        var opacity = 0.15 + (i % 3) * 0.08;
        traceSvg.appendChild(ChipViz.svg('path', {
          d: d,
          stroke: 'var(--grid)',
          'stroke-width': '2',
          fill: 'none',
          opacity: String(opacity)
        }));
      });

      /* Junction dots */
      junctionCoords.forEach(function (xy) {
        traceSvg.appendChild(ChipViz.svg('circle', {
          cx: String(xy[0]),
          cy: String(xy[1]),
          r: '3',
          fill: 'var(--accent)',
          opacity: '0.25'
        }));
      });

      ctx.stage.appendChild(traceSvg);

      /* Power-on signature pulse */
      ctx.pulseGrid();
    }
  });

})(window.ChipViz);
