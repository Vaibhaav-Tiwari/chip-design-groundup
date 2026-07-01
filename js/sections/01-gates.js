/* ============================================================
   01-gates.js  —  S1 Logic Gates: The Primitives
   Registers the Logic Gates section with three interactive
   SVG gates (AND, OR, NOT), bit toggles, live truth tables,
   and pulse animations on each input toggle.

   Source anchors (verbatim):
   "AND is almost the simplest logic gate that exists on a chip…
    the very largest logic gate you'll typically use is something
    called a full adder."
   "This number is 1 if both this bit is 1 and this bit is 1.
    If either of them is 0, then 0 times anything is 0."
   — Reiner Pope, CEO of MatX (via Dwarkesh Podcast)
   ============================================================ */

(function (ChipViz) {
  'use strict';

  /* ---- gate logic functions ---- */
  function andGate(a, b) { return (a & b) ? 1 : 0; }
  function orGate(a, b)  { return (a | b) ? 1 : 0; }
  function notGate(a)    { return a ? 0 : 1; }

  /* ---- truth table data ---- */
  var AND_ROWS = [[0,0,0],[0,1,0],[1,0,0],[1,1,1]];
  var OR_ROWS  = [[0,0,0],[0,1,1],[1,0,1],[1,1,1]];
  var NOT_ROWS = [[0,1],[1,0]];

  /* ---- find row index matching inputs ---- */
  function findRow2(rows, a, b) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === a && rows[i][1] === b) return i;
    }
    return -1;
  }
  function findRow1(rows, a) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === a) return i;
    }
    return -1;
  }

  /* ---- SVG gate shape builders ---- */
  /* viewBox: "0 0 200 80"
     Input stubs: left side at x=10, output: right side at x=190
     Gate body: x=60..150, y=15..65 */

  function buildAndGateSvg() {
    /* AND gate: flat left + D-shaped right (rect + arc) */
    var s = ChipViz.svg('svg', {
      viewBox: '0 0 200 80',
      class: 'gate-svg',
      'aria-hidden': 'true',
      width: '100%'
    });

    /* Gate body: flat rect + semicircle arc on right */
    var bodyPath = ChipViz.svg('path', {
      d: 'M 60 15 L 60 65 L 120 65 A 25 25 0 0 0 120 15 Z',
      fill: 'var(--surface-2)',
      stroke: 'var(--accent)',
      'stroke-width': '2'
    });

    /* Input wires — A (top) and B (bottom) */
    var wireA = ChipViz.svg('line', {
      class: 'gate-wire gate-wire-in',
      x1: '10', y1: '28', x2: '60', y2: '28',
      stroke: 'var(--text-muted)',
      'stroke-width': '2'
    });
    var wireB = ChipViz.svg('line', {
      class: 'gate-wire gate-wire-in',
      x1: '10', y1: '52', x2: '60', y2: '52',
      stroke: 'var(--text-muted)',
      'stroke-width': '2'
    });

    /* Output wire */
    var wireOut = ChipViz.svg('line', {
      class: 'gate-wire gate-wire-out',
      x1: '145', y1: '40', x2: '190', y2: '40',
      stroke: 'var(--text-muted)',
      'stroke-width': '2'
    });

    /* Input labels */
    var labelA = ChipViz.svg('text', {
      x: '14', y: '25',
      fill: 'var(--text-muted)',
      'font-size': '10',
      'font-family': 'var(--font-mono)',
      text: 'A'
    });
    var labelB = ChipViz.svg('text', {
      x: '14', y: '49',
      fill: 'var(--text-muted)',
      'font-size': '10',
      'font-family': 'var(--font-mono)',
      text: 'B'
    });

    s.appendChild(wireA);
    s.appendChild(wireB);
    s.appendChild(bodyPath);
    s.appendChild(wireOut);
    s.appendChild(labelA);
    s.appendChild(labelB);

    return { el: s, wireOut: wireOut, wireA: wireA, wireB: wireB };
  }

  function buildOrGateSvg() {
    /* OR gate: curved body (classic IEEE symbol) */
    var s = ChipViz.svg('svg', {
      viewBox: '0 0 200 80',
      class: 'gate-svg',
      'aria-hidden': 'true',
      width: '100%'
    });

    /* OR gate body: curved shape
       Back curve: concave arc from (60,15) to (60,65)
       Top/bottom: straight lines to point ~(145,40)
       Front: convex arc meeting at output point */
    var bodyPath = ChipViz.svg('path', {
      d: 'M 60 15 Q 85 40 60 65 Q 100 65 130 40 Q 100 15 60 15 Z',
      fill: 'var(--surface-2)',
      stroke: 'var(--accent)',
      'stroke-width': '2'
    });

    /* Input wires — A (top) and B (bottom)
       Wire endpoints adjusted slightly for the curved left edge */
    var wireA = ChipViz.svg('line', {
      class: 'gate-wire gate-wire-in',
      x1: '10', y1: '28', x2: '67', y2: '28',
      stroke: 'var(--text-muted)',
      'stroke-width': '2'
    });
    var wireB = ChipViz.svg('line', {
      class: 'gate-wire gate-wire-in',
      x1: '10', y1: '52', x2: '67', y2: '52',
      stroke: 'var(--text-muted)',
      'stroke-width': '2'
    });

    /* Output wire */
    var wireOut = ChipViz.svg('line', {
      class: 'gate-wire gate-wire-out',
      x1: '130', y1: '40', x2: '190', y2: '40',
      stroke: 'var(--text-muted)',
      'stroke-width': '2'
    });

    /* Input labels */
    var labelA = ChipViz.svg('text', {
      x: '14', y: '25',
      fill: 'var(--text-muted)',
      'font-size': '10',
      'font-family': 'var(--font-mono)',
      text: 'A'
    });
    var labelB = ChipViz.svg('text', {
      x: '14', y: '49',
      fill: 'var(--text-muted)',
      'font-size': '10',
      'font-family': 'var(--font-mono)',
      text: 'B'
    });

    s.appendChild(wireA);
    s.appendChild(wireB);
    s.appendChild(bodyPath);
    s.appendChild(wireOut);
    s.appendChild(labelA);
    s.appendChild(labelB);

    return { el: s, wireOut: wireOut, wireA: wireA, wireB: wireB };
  }

  function buildNotGateSvg() {
    /* NOT gate: triangle + bubble at output */
    var s = ChipViz.svg('svg', {
      viewBox: '0 0 200 80',
      class: 'gate-svg',
      'aria-hidden': 'true',
      width: '100%'
    });

    /* Triangle body: from (60,15) to (60,65) to (140,40) */
    var bodyPath = ChipViz.svg('path', {
      d: 'M 60 15 L 60 65 L 140 40 Z',
      fill: 'var(--surface-2)',
      stroke: 'var(--accent)',
      'stroke-width': '2'
    });

    /* Bubble (inversion circle) at output */
    var bubble = ChipViz.svg('circle', {
      cx: '146', cy: '40', r: '6',
      fill: 'var(--surface-2)',
      stroke: 'var(--accent)',
      'stroke-width': '2'
    });

    /* Input wire — single input A */
    var wireA = ChipViz.svg('line', {
      class: 'gate-wire gate-wire-in',
      x1: '10', y1: '40', x2: '60', y2: '40',
      stroke: 'var(--text-muted)',
      'stroke-width': '2'
    });

    /* Output wire — starts after the bubble */
    var wireOut = ChipViz.svg('line', {
      class: 'gate-wire gate-wire-out',
      x1: '152', y1: '40', x2: '190', y2: '40',
      stroke: 'var(--text-muted)',
      'stroke-width': '2'
    });

    /* Input label */
    var labelA = ChipViz.svg('text', {
      x: '14', y: '37',
      fill: 'var(--text-muted)',
      'font-size': '10',
      'font-family': 'var(--font-mono)',
      text: 'A'
    });

    s.appendChild(wireA);
    s.appendChild(bodyPath);
    s.appendChild(bubble);
    s.appendChild(wireOut);
    s.appendChild(labelA);

    return { el: s, wireOut: wireOut, wireA: wireA };
  }

  /* ---- build a single gate panel ---- */
  function buildGatePanel(opts) {
    /* opts = { name, buildSvg, computeFn, table, findRow, labelA, labelB? } */
    var svgParts = opts.buildSvg();
    var wireOut  = svgParts.wireOut;

    /* Output state display */
    var outDisplay = ChipViz.el('span', {
      className: 'gate-output-display',
      text: '→ 0'
    });

    /* Truth table */
    var table = ChipViz.truthTable(opts.tableCols, opts.tableRows);

    function updateOutput() {
      var a = toggleA.get();
      var b = (toggleB ? toggleB.get() : 0);
      var out = opts.computeFn(a, b);
      var color = out ? 'var(--highlight)' : 'var(--text-muted)';

      /* Update output wire color */
      wireOut.setAttribute('stroke', color);
      outDisplay.textContent = '→ ' + out;
      outDisplay.dataset.on = out ? '1' : '0';

      /* Pulse the output wire */
      ChipViz.pulse(wireOut, color);

      /* Highlight matching truth table row */
      var rowIdx = opts.findRow(opts.tableRows, a, b);
      table.highlightRow(rowIdx);

      /* Notify external observer (e.g. left-column truth table) */
      if (opts.onUpdate) opts.onUpdate(a, b, rowIdx);

      return out;
    }

    /* Input toggles */
    var toggleA = ChipViz.bitToggle({
      value: 0,
      label: 'A',
      onChange: function () { updateOutput(); }
    });
      /* aria-label is managed by ChipViz.bitToggle() to include current state */

    var toggleB = null;
    if (opts.hasB) {
      toggleB = ChipViz.bitToggle({
        value: 0,
        label: 'B',
        onChange: function () { updateOutput(); }
      });
      /* aria-label is managed by ChipViz.bitToggle() to include current state */
    }

    /* Initial state — compute actual output for initial inputs (0,0) */
    (function () {
      var a = toggleA.get();
      var b = toggleB ? toggleB.get() : 0;
      var out = opts.computeFn(a, b);
      var color = out ? 'var(--highlight)' : 'var(--text-muted)';
      wireOut.setAttribute('stroke', color);
      outDisplay.textContent = '→ ' + out;
      outDisplay.dataset.on = out ? '1' : '0';
      var rowIdx = opts.findRow(opts.tableRows, a, b);
      table.highlightRow(rowIdx);
      if (opts.onUpdate) opts.onUpdate(a, b, rowIdx);
    }());

    /* Layout: inputs column | SVG | output column */
    var inputsCol = ChipViz.el('div', { className: 'gate-inputs-col' }, [
      ChipViz.el('div', { className: 'gate-input-row' }, [
        ChipViz.el('span', { className: 'gate-input-label', text: 'A' }),
        toggleA.el
      ]),
      opts.hasB ? ChipViz.el('div', { className: 'gate-input-row' }, [
        ChipViz.el('span', { className: 'gate-input-label', text: 'B' }),
        toggleB.el
      ]) : null
    ]);

    var svgCol = ChipViz.el('div', { className: 'gate-svg-col' }, [svgParts.el]);

    var outputCol = ChipViz.el('div', { className: 'gate-output-col' }, [outDisplay]);

    var panelHeader = ChipViz.el('div', { className: 'gate-panel-header' }, [
      ChipViz.el('span', { className: 'gate-panel-name', text: opts.name })
    ]);

    var panelBody = ChipViz.el('div', { className: 'gate-panel-body' }, [
      inputsCol, svgCol, outputCol
    ]);

    var panelTable = ChipViz.el('div', { className: 'gate-panel-table' }, [table.el]);

    var panel = ChipViz.el('div', { className: 'gate-panel' }, [
      panelHeader, panelBody, panelTable
    ]);

    return panel;
  }

  /* ---- register section ---- */
  ChipViz.register({
    id: 'gates',
    order: 1,
    title: 'Logic Gates: The Primitives',
    subtitle: 'AND, OR, NOT — the atomic units of every chip.',

    build: function (ctx) {
      /* ---- left column: explanation + AND truth table ---- */
      var explanation = ChipViz.el('p', {
        className: 'gates-explanation',
        text: 'Every computation in this chip is built from these three primitives. ' +
              'AND: output is 1 only if BOTH inputs are 1. ' +
              'This is how we compute a single partial product in multiplication.'
      });

      var callout = ChipViz.el('div', { className: 'callout insight gates-callout' }, [
        ChipViz.el('strong', { text: 'Try it: ' }),
        document.createTextNode('Click the 0/1 buttons below each gate to toggle inputs and watch the output wire change color.')
      ]);

      /* AND truth table for left column */
      var andTableLeft = ChipViz.truthTable(
        ['A', 'B', 'A AND B'],
        AND_ROWS
      );
      andTableLeft.highlightRow(0);

      var tableLabel = ChipViz.el('p', {
        className: 'gates-table-label',
        text: 'AND Gate — live truth table:'
      });

      ctx.left.appendChild(explanation);
      ctx.left.appendChild(callout);
      ctx.left.appendChild(tableLabel);
      ctx.left.appendChild(andTableLeft.el);

      /* ---- stage: three gate panels ---- */

      /* AND gate panel */
      var andPanel = buildGatePanel({
        name: 'AND',
        buildSvg: buildAndGateSvg,
        computeFn: andGate,
        tableCols: ['A', 'B', 'OUT'],
        tableRows: AND_ROWS,
        findRow: findRow2,
        hasB: true,
        onUpdate: function (a, b, rowIdx) {
          andTableLeft.highlightRow(rowIdx);
        }
      });

      /* OR gate panel */
      var orPanel = buildGatePanel({
        name: 'OR',
        buildSvg: buildOrGateSvg,
        computeFn: orGate,
        tableCols: ['A', 'B', 'OUT'],
        tableRows: OR_ROWS,
        findRow: findRow2,
        hasB: true
      });

      /* NOT gate panel — computeFn takes only one arg */
      var notPanel = buildGatePanel({
        name: 'NOT',
        buildSvg: buildNotGateSvg,
        computeFn: function (a) { return notGate(a); },
        tableCols: ['A', 'NOT A'],
        tableRows: NOT_ROWS,
        findRow: findRow1,
        hasB: false
      });

      /* Wrap all three panels */
      var gatesContainer = ChipViz.el('div', { className: 'gates-container' }, [
        andPanel, orPanel, notPanel
      ]);

      ctx.stage.appendChild(gatesContainer);

      /* Signature pulse */
      ctx.pulseGrid();
    }
  });

})(window.ChipViz);
