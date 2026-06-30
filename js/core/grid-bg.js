/* ============================================================
   grid-bg.js  —  PR #0 FROZEN.  Circuit-board grid background +
   the signature signal-pulse animation. Installs the real
   ChipViz.pulseGrid() (registry.js ships a no-op stub).
   ============================================================ */
(function (ChipViz) {
  'use strict';

  var bg;
  function ensureBg() {
    bg = document.getElementById('grid-bg');
    if (!bg) {
      bg = ChipViz.el('div', { id: 'grid-bg' });
      document.body.insertBefore(bg, document.body.firstChild);
    }
    if (!bg.querySelector('.dots')) {
      bg.appendChild(ChipViz.el('div', { className: 'dots' }));
    }
  }

  /**
   * Emit a few traveling trace-pulses across the background — like
   * electricity flowing through PCB traces. Called on section
   * activation and via ctx.pulseGrid(). No-op under reduced motion.
   */
  function pulseGrid(opts) {
    ensureBg();
    if (ChipViz.prefersReducedMotion()) return;
    opts = opts || {};
    var count = opts.count || 3;
    for (var i = 0; i < count; i++) {
      spawnPulse(i);
    }
  }

  function spawnPulse(i) {
    var horizontal = (i % 2 === 0);
    var line = ChipViz.el('div', { className: 'pulse ' + (horizontal ? 'h' : 'v') });
    // snap onto the 40px grid so pulses ride the visible traces
    var cells = horizontal
      ? Math.floor(window.innerHeight / 40)
      : Math.floor(window.innerWidth / 40);
    var pos = (Math.max(1, Math.floor(cells * ((i + 1) / 4))) ) * 40;
    if (horizontal) line.style.top = pos + 'px';
    else line.style.left = pos + 'px';

    line.style.animation = (horizontal ? 'pulse-h' : 'pulse-v') +
      ' var(--pulse-ms) var(--ease) forwards';
    line.style.animationDelay = (i * 90) + 'ms';
    bg.appendChild(line);
    line.addEventListener('animationend', function () {
      if (line.parentNode) line.parentNode.removeChild(line);
    });
    // safety cleanup
    setTimeout(function () { if (line.parentNode) line.parentNode.removeChild(line); }, 2500);
  }

  ChipViz.pulseGrid = pulseGrid;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureBg);
  } else {
    ensureBg();
  }
})(window.ChipViz);
