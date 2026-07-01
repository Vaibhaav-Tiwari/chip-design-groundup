/* ============================================================
   03-fulladder.js  —  Section 3: Full Adder: 3→2 Compressor
   A full adder counts how many of its three input bits are 1
   and expresses the result in 2-bit binary (Sum, Cout).
   ============================================================ */
(function () {
  'use strict';

  /* Truth table: all 8 input combos → [A, B, Cin, Sum, Cout] */
  var TRUTH = [
    [0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 1, 1, 0, 1],
    [1, 0, 0, 1, 0],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 1, 1, 1, 1]
  ];

  /* Compute Sum and Cout from three bits */
  function compute(a, b, cin) {
    var total = a + b + cin;
    return { sum: total & 1, cout: (total >> 1) & 1 };
  }

  /* Find truth table row index for current inputs */
  function rowIndex(a, b, cin) {
    return (a << 2) | (b << 1) | cin;
  }

  ChipViz.register({
    id: 'fulladder',
    order: 3,
    title: 'Full Adder: 3→2 Compressor',
    subtitle: 'Adding three bits becomes two.',

    build: function (ctx) {
      ctx.pulseGrid();

      var el  = ChipViz.el;
      var svg = ChipViz.svg;
      var reduced = ChipViz.prefersReducedMotion();

      /* ---- wire refs for SVG pulses ---- */
      var wireA, wireB, wireCin, wireSum, wireCout;
      /* ---- SVG bit-value labels ---- */
      var labelAVal, labelBVal, labelCinVal, labelSumVal, labelCoutVal;
      /* ---- bit-column metaphor nodes (3 input circles → 2 output) ---- */
      var inDots = [], outDots = [];

      /* ================================================
         LEFT COLUMN
         ================================================ */

      /* 1. Explanation paragraph */
      ctx.left.appendChild(el('p', {
        className: 'fa-explainer',
        text: 'A full adder counts how many of its three input bits are 1, ' +
              'and expresses the result in 2-bit binary.'
      }));

      /* 2. Bit toggles — A, B, Cin */
      var toggleA   = ChipViz.bitToggle({ value: 0, label: 'A' });
      var toggleB   = ChipViz.bitToggle({ value: 0, label: 'B' });
      var toggleCin = ChipViz.bitToggle({ value: 0, label: 'Cin' });

      function wrapToggle(toggle, labelText, colorVar) {
        return el('div', { className: 'fa-toggle-wrap' }, [
          el('span', {
            className: 'fa-toggle-label',
            style: { color: colorVar || 'var(--accent)' },
            text: labelText
          }),
          toggle.el
        ]);
      }

      var togglesRow = el('div', { className: 'fa-toggles-row' }, [
        wrapToggle(toggleA,   'A',   'var(--accent)'),
        wrapToggle(toggleB,   'B',   'var(--accent)'),
        wrapToggle(toggleCin, 'Cin', 'var(--accent)')
      ]);
      ctx.left.appendChild(togglesRow);

      /* 3. Output display */
      var sumVal  = el('span', { className: 'fa-out-val fa-sum-val mono-num',  text: '0' });
      var coutVal = el('span', { className: 'fa-out-val fa-cout-val mono-num', text: '0' });

      var outputRow = el('div', { className: 'fa-output-row panel' }, [
        el('div', { className: 'fa-out-item' }, [
          el('span', { className: 'fa-out-label fa-sum-label',  text: 'Sum'  }),
          sumVal
        ]),
        el('div', { className: 'fa-out-item' }, [
          el('span', { className: 'fa-out-label fa-cout-label', text: 'Cout' }),
          coutVal
        ])
      ]);
      ctx.left.appendChild(outputRow);

      /* 4. Truth table */
      var table = ChipViz.truthTable(
        ['A', 'B', 'Cin', 'Sum', 'Cout'],
        TRUTH
      );
      ctx.left.appendChild(table.el);

      /* 5. Step-through button */
      var stepping = false;
      var stepTimer = null;
      var stepIndex = 0;

      var stepBtn = el('button', {
        className: 'fa-step-btn',
        type: 'button',
        text: 'Step through'
      });

      stepBtn.addEventListener('click', function () {
        if (stepping) {
          clearInterval(stepTimer);
          stepping = false;
          stepBtn.textContent = 'Step through';
          return;
        }
        stepping = true;
        stepBtn.textContent = 'Stop';
        stepIndex = 0;

        function doStep() {
          var row = TRUTH[stepIndex % 8];
          toggleA.set(row[0]);
          toggleB.set(row[1]);
          toggleCin.set(row[2]);
          updateAll(true);
          stepIndex++;
          if (stepIndex >= 8) {
            clearInterval(stepTimer);
            stepping = false;
            stepBtn.textContent = 'Step through';
          }
        }

        if (reduced) {
          /* instant: step through synchronously with no delay */
          for (var i = 0; i < 8; i++) {
            (function (idx) {
              var row = TRUTH[idx];
              toggleA.set(row[0]);
              toggleB.set(row[1]);
              toggleCin.set(row[2]);
            })(i);
          }
          /* land on last row */
          var last = TRUTH[7];
          toggleA.set(last[0]);
          toggleB.set(last[1]);
          toggleCin.set(last[2]);
          updateAll(false);
          stepping = false;
          stepBtn.textContent = 'Step through';
        } else {
          stepTimer = setInterval(doStep, 250);
        }
      });

      ctx.left.appendChild(el('div', { className: 'fa-step-wrap' }, [stepBtn]));

      /* 6. Caption callout */
      ctx.left.appendChild(el('div', { className: 'callout insight fa-callout' }, [
        el('p', { text: '"a full adder… just adds three single-bit numbers together… ' +
          'the result can be 0, 1, 2, or 3, so I can express that in binary using just two bits… ' +
          'As input, three bits. As output, two bits."' }),
        el('p', { text: '"This is also known as a 3→2 compressor."' }),
        el('p', { className: 'fa-caption-note',
          text: 'This is just counting how many 1s there are, in binary.' })
      ]));

      /* ================================================
         RIGHT COLUMN — SVG schematic
         ================================================ */

      /*
        SVG layout (viewBox 0 0 360 280):

        Inputs enter from left at y=60 (A), y=120 (B), y=180 (Cin).
        Horizontal wires run to x=160. FA box: x=160,y=80 w=80 h=120.
        Output wires leave from box right? No — Sum exits bottom-left,
        Cout exits bottom-right per spec.
        Actually: wires come from left to box, outputs go down.

        Layout:
          - Wire A:   (20,70) → (160,70) entering box top region
          - Wire B:   (20,140) → (160,140) entering box mid region
          - Wire Cin: (20,210) → (160,210) entering box bottom region
          - FA box:   x=160, y=55, w=80, h=170
          - Wire Sum:  (200,225) → (170,270) going down-left
          - Wire Cout: (200,225) → (230,270) going down-right

        Bit-column metaphor: 3 circles left of box → 2 circles right/below.
      */

      var VB_W = 360, VB_H = 300;

      /* box geometry */
      var BOX_X = 145, BOX_Y = 50, BOX_W = 80, BOX_H = 175;
      var BOX_MX = BOX_X + BOX_W / 2; /* 185 */
      var BOX_BY = BOX_Y + BOX_H;     /* 225 */

      /* input wire y positions */
      var AY = 80, BY = 140, CY = 200;
      var WIRE_START_X = 20;
      var WIRE_END_X   = BOX_X; /* 145 */

      /* output wire endpoints */
      var SUM_END_X  = BOX_MX - 30; /* 155 */
      var COUT_END_X = BOX_MX + 30; /* 215 */
      var OUT_END_Y  = BOX_BY + 55; /* 280 */

      var stageSvg = svg('svg', {
        viewBox: '0 0 ' + VB_W + ' ' + VB_H,
        'aria-label': 'Full adder schematic',
        role: 'img',
        preserveAspectRatio: 'xMidYMid meet'
      });

      /* --- input wires --- */
      wireA = svg('line', {
        x1: WIRE_START_X, y1: AY, x2: WIRE_END_X, y2: AY,
        stroke: 'var(--accent)', 'stroke-width': '2.5',
        'stroke-linecap': 'round', class: 'fa-wire fa-wire-a'
      });
      wireB = svg('line', {
        x1: WIRE_START_X, y1: BY, x2: WIRE_END_X, y2: BY,
        stroke: 'var(--accent)', 'stroke-width': '2.5',
        'stroke-linecap': 'round', class: 'fa-wire fa-wire-b'
      });
      wireCin = svg('line', {
        x1: WIRE_START_X, y1: CY, x2: WIRE_END_X, y2: CY,
        stroke: 'var(--accent)', 'stroke-width': '2.5',
        'stroke-linecap': 'round', class: 'fa-wire fa-wire-cin'
      });

      /* --- output wires --- */
      wireSum = svg('line', {
        x1: BOX_MX - 18, y1: BOX_BY, x2: SUM_END_X, y2: OUT_END_Y,
        stroke: 'var(--highlight)', 'stroke-width': '2.5',
        'stroke-linecap': 'round', class: 'fa-wire fa-wire-sum'
      });
      wireCout = svg('line', {
        x1: BOX_MX + 18, y1: BOX_BY, x2: COUT_END_X, y2: OUT_END_Y,
        stroke: 'var(--carry)', 'stroke-width': '2.5',
        'stroke-linecap': 'round', class: 'fa-wire fa-wire-cout'
      });

      /* --- FA box --- */
      var faRect = svg('rect', {
        x: BOX_X, y: BOX_Y, width: BOX_W, height: BOX_H,
        rx: '8', fill: 'var(--surface)',
        stroke: 'var(--accent)', 'stroke-width': '2',
        class: 'fa-gate-box'
      });
      var faLabel = svg('text', {
        x: BOX_MX, y: BOX_Y + BOX_H / 2 + 6,
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        'font-family': 'var(--font-mono)', 'font-size': '22',
        'font-weight': '700', fill: 'var(--accent)',
        class: 'fa-gate-label',
        text: 'FA'
      });

      /* --- wire labels (static) --- */
      function inputLabel(text, x, y) {
        return svg('text', {
          x: x, y: y - 8,
          'text-anchor': 'start',
          'font-family': 'var(--font-mono)', 'font-size': '12',
          fill: 'var(--text-muted)',
          text: text
        });
      }

      var lblA   = inputLabel('A',   WIRE_START_X + 2, AY);
      var lblB   = inputLabel('B',   WIRE_START_X + 2, BY);
      var lblCin = inputLabel('Cin', WIRE_START_X + 2, CY);

      var lblSum = svg('text', {
        x: SUM_END_X - 4, y: OUT_END_Y + 16,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)', 'font-size': '12',
        fill: 'var(--highlight)',
        text: 'Sum'
      });
      var lblCout = svg('text', {
        x: COUT_END_X + 4, y: OUT_END_Y + 16,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)', 'font-size': '12',
        fill: 'var(--carry)',
        text: 'Cout'
      });

      /* --- live bit-value labels on wire ends --- */
      labelAVal = svg('text', {
        x: WIRE_END_X - 6, y: AY + 4,
        'text-anchor': 'end',
        'font-family': 'var(--font-mono)', 'font-size': '13',
        'font-weight': '700', fill: 'var(--accent)',
        text: '0'
      });
      labelBVal = svg('text', {
        x: WIRE_END_X - 6, y: BY + 4,
        'text-anchor': 'end',
        'font-family': 'var(--font-mono)', 'font-size': '13',
        'font-weight': '700', fill: 'var(--accent)',
        text: '0'
      });
      labelCinVal = svg('text', {
        x: WIRE_END_X - 6, y: CY + 4,
        'text-anchor': 'end',
        'font-family': 'var(--font-mono)', 'font-size': '13',
        'font-weight': '700', fill: 'var(--accent)',
        text: '0'
      });
      labelSumVal = svg('text', {
        x: SUM_END_X, y: OUT_END_Y - 6,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)', 'font-size': '14',
        'font-weight': '700', fill: 'var(--highlight)',
        text: '0'
      });
      labelCoutVal = svg('text', {
        x: COUT_END_X, y: OUT_END_Y - 6,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)', 'font-size': '14',
        'font-weight': '700', fill: 'var(--carry)',
        text: '0'
      });

      /* --- bit-column metaphor: 3 dots (in) → shrinks to 2 dots (out) --- */
      /* "3 bits in" column: 3 small circles above/beside the box */
      var metaY = BOX_Y - 30;
      var metaX = BOX_MX;
      var META_R = 8;

      /* "3 bits in" label */
      var meta3Label = svg('text', {
        x: metaX, y: metaY - 20,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)', 'font-size': '10',
        fill: 'var(--text-muted)',
        text: '3 bits in'
      });

      inDots = [0, 1, 2].map(function (i) {
        var cx = metaX - 20 + i * 20;
        var c = svg('circle', {
          cx: cx, cy: metaY - 6,
          r: META_R,
          fill: 'var(--accent-a20)',
          stroke: 'var(--accent)', 'stroke-width': '1.5',
          class: 'fa-meta-dot fa-meta-in'
        });
        return c;
      });

      /* arrow */
      var metaArrow = svg('text', {
        x: metaX, y: metaY + 14,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)', 'font-size': '12',
        fill: 'var(--text-muted)',
        text: '↓'
      });

      /* "2 bits out" label */
      var meta2Label = svg('text', {
        x: metaX, y: OUT_END_Y + 35,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)', 'font-size': '10',
        fill: 'var(--text-muted)',
        text: '2 bits out'
      });

      outDots = [0, 1].map(function (i) {
        var cx = metaX - 12 + i * 24;
        var c = svg('circle', {
          cx: cx, cy: OUT_END_Y + 4,
          r: META_R,
          fill: 'var(--highlight-a20)',
          stroke: 'var(--highlight)', 'stroke-width': '1.5',
          class: 'fa-meta-dot fa-meta-out'
        });
        return c;
      });

      /* --- tooltip / source quote --- */
      var quoteTip = svg('text', {
        x: VB_W / 2, y: VB_H - 6,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)', 'font-size': '9',
        fill: 'var(--text-muted)',
        text: '"the three inputs are all bits in the same bit position… carry out / sum"'
      });

      /* assemble SVG */
      [
        wireA, wireB, wireCin,
        faRect, faLabel,
        wireSum, wireCout,
        lblA, lblB, lblCin, lblSum, lblCout,
        labelAVal, labelBVal, labelCinVal,
        labelSumVal, labelCoutVal,
        meta3Label,
      ].concat(inDots).concat([
        metaArrow, meta2Label
      ]).concat(outDots).concat([
        quoteTip
      ]).forEach(function (node) {
        stageSvg.appendChild(node);
      });

      ctx.stage.appendChild(stageSvg);

      /* ================================================
         UPDATE LOGIC — called whenever inputs change
         ================================================ */
      function updateAll(animate) {
        var a   = toggleA.get();
        var b   = toggleB.get();
        var cin = toggleCin.get();
        var res = compute(a, b, cin);
        var idx = rowIndex(a, b, cin);

        /* left-column outputs */
        sumVal.textContent  = String(res.sum);
        coutVal.textContent = String(res.cout);

        /* truth table highlight */
        table.highlightRow(idx);

        /* SVG: update wire end values */
        labelAVal.textContent   = String(a);
        labelBVal.textContent   = String(b);
        labelCinVal.textContent = String(cin);
        labelSumVal.textContent  = String(res.sum);
        labelCoutVal.textContent = String(res.cout);

        /* SVG: active-wire dim/bright by bit value */
        [wireA, wireB, wireCin].forEach(function (w, i) {
          var bit = [a, b, cin][i];
          w.style.opacity = bit ? '1' : '0.35';
        });
        wireSum.style.opacity  = res.sum  ? '1' : '0.35';
        wireCout.style.opacity = res.cout ? '1' : '0.35';

        /* meta-dot fill: active when bit=1 */
        inDots.forEach(function (dot, i) {
          var bit = [a, b, cin][i];
          dot.setAttribute('fill', bit ? 'var(--accent)' : 'var(--accent-a20)');
        });
        outDots[0].setAttribute('fill', res.sum  ? 'var(--highlight)' : 'var(--highlight-a20)');
        outDots[1].setAttribute('fill', res.cout ? 'var(--carry)'     : 'var(--carry-a20)');

        /* animate pulses (skipped for reduced motion or non-animate step) */
        if (animate && !reduced) {
          ChipViz.pulse(wireA,   'var(--accent)');
          ChipViz.pulse(wireB,   'var(--accent)');
          ChipViz.pulse(wireCin, 'var(--accent)');
          if (res.sum)  ChipViz.pulse(wireSum,  'var(--highlight)');
          if (res.cout) ChipViz.pulse(wireCout, 'var(--carry)');
        }
      }

      /* Wire up toggles */
      toggleA.el.addEventListener('click',   function () { updateAll(true); });
      toggleB.el.addEventListener('click',   function () { updateAll(true); });
      toggleCin.el.addEventListener('click', function () { updateAll(true); });

      /* Initial render (no animation) */
      updateAll(false);
    }
  });
})();
