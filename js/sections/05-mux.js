/* ============================================================
   05-mux.js  —  Section 5: Register File & The Mux Tax
   A register file of n slots requires 3 × n × p AND gates
   just to read 3 operands (A, B, Acc) for the MAC unit.
   With p=4, q=4, n=8: 96 mux gates vs 16 MAC gates = 6:1.
   ============================================================ */
(function () {
  'use strict';

  /* ---- Fixed constants (p=4, q=4) ---- */
  var P = 4;   /* bit width */
  var Q = 4;   /* MAC operand width */
  var N_STEPS = [4, 8, 16, 32]; /* slider discrete values */
  var N_DEFAULT = 8;

  /* SVG layout constants */
  var VB_W = 420;
  var VB_H = 320;

  /* Register file block */
  var RF_X = 16;
  var RF_Y = 30;
  var RF_W = 90;
  var RF_H = 256;

  /* Mux block */
  var MUX_X = 180;
  var MUX_Y = 100;
  var MUX_W = 60;
  var MUX_H = 120;

  /* MAC block */
  var MAC_X = 292;
  var MAC_Y = 130;
  var MAC_W = 60;
  var MAC_H = 60;

  /* Number of register slots always drawn = 8 (max) */
  var SLOTS = 8;

  /* Gate math */
  function muxGates(n) { return 3 * n * P; }
  function macGates()  { return P * Q; }
  function totalGates(n) { return muxGates(n) + macGates(); }
  function pct(n) { return Math.round(100 * muxGates(n) / totalGates(n)); }
  function ratio(n) { return Math.round(muxGates(n) / macGates()); }

  /* y-center of slot i within the register file (i = 0..SLOTS-1) */
  function slotCY(i) {
    var inner_h = RF_H - 24;
    var step = inner_h / SLOTS;
    return RF_Y + 14 + step * i + step / 2;
  }

  ChipViz.register({
    id: 'mux',
    order: 5,
    title: 'Register File & The Mux Tax',
    subtitle: 'Why reading registers costs 6× more than the multiply itself.',

    build: function (ctx) {
      ctx.pulseGrid();

      var el  = ChipViz.el;
      var svg = ChipViz.svg;
      var reduced = ChipViz.prefersReducedMotion();

      /* ---- mutable state ---- */
      var nSlots = N_DEFAULT;
      var selRegs = [0, 1, 2]; /* [A-reg, B-reg, Acc-reg] */

      /* ---- SVG wire elements (assigned during SVG build) ---- */
      var wireA, wireB, wireAcc, wireMuxMac, wireMacWb;

      /* ---- SVG slot rect elements ---- */
      var slotEls = [];

      /* ---- Gate counter DOM spans ---- */
      var spanMuxCount, spanMacCount, spanPct, spanRatio;

      /* ================================================
         LEFT COLUMN
         ================================================ */

      /* 1. Explanation paragraph */
      ctx.left.appendChild(el('p', {
        className: 'mux-explainer',
        text: 'A register file stores operands for the MAC unit. Reading 3 registers ' +
              'requires mux gates to select each one — and those muxes dominate the gate count.'
      }));

      /* 2. Register selectors (A, B, Acc) */
      var regOptions = [];
      for (var ri = 0; ri < SLOTS; ri++) {
        regOptions.push({ label: 'Reg ' + ri, value: ri });
      }

      function makeRegSelect(labelText, defaultIdx, onChange) {
        var select = el('select', { className: 'mux-reg-select', 'aria-label': labelText });
        regOptions.forEach(function (opt) {
          var option = el('option', {
            value: String(opt.value),
            text: opt.label
          });
          if (opt.value === defaultIdx) option.selected = true;
          select.appendChild(option);
        });
        select.addEventListener('change', function () {
          onChange(parseInt(select.value, 10));
        });
        return el('div', { className: 'mux-reg-row' }, [
          el('label', { className: 'mux-reg-label', text: labelText }),
          select
        ]);
      }

      var selectA   = makeRegSelect('A   (Reg):', 0, function (v) { selRegs[0] = v; updateAll(); });
      var selectB   = makeRegSelect('B   (Reg):', 1, function (v) { selRegs[1] = v; updateAll(); });
      var selectAcc = makeRegSelect('Acc (Reg):', 2, function (v) { selRegs[2] = v; updateAll(); });

      ctx.left.appendChild(el('div', { className: 'mux-selects' }, [selectA, selectB, selectAcc]));

      /* 3. Run button */
      var runBtn = el('button', {
        className: 'mux-run-btn',
        type: 'button',
        text: 'Run'
      });
      ctx.left.appendChild(el('div', { className: 'mux-run-wrap' }, [runBtn]));

      /* 4. Gate counter panel */
      spanMuxCount = el('span', { className: 'mux-count-val mono-num', text: String(muxGates(nSlots)) });
      spanMacCount = el('span', { className: 'mux-count-val mono-num', text: String(macGates()) });
      spanPct      = el('span', { className: 'mux-count-val mono-num', text: String(pct(nSlots)) + '%' });
      spanRatio    = el('span', { className: 'mux-count-val mono-num', text: String(ratio(nSlots)) + ':1' });

      ctx.left.appendChild(el('div', { className: 'mux-gate-panel panel' }, [
        el('div', { className: 'mux-gate-title', text: 'Gate Count' }),

        el('div', { className: 'mux-gate-row' }, [
          el('span', { className: 'mux-gate-label', html: 'Mux AND gates: <span class="mux-formula">3 &times; n &times; p</span> =' }),
          spanMuxCount
        ]),
        el('div', { className: 'mux-gate-row' }, [
          el('span', { className: 'mux-gate-label', html: 'MAC AND gates: <span class="mux-formula">p &times; q</span> =' }),
          spanMacCount
        ]),
        el('div', { className: 'mux-gate-row mux-gate-row--pct' }, [
          el('span', { className: 'mux-gate-label', text: 'Data movement:' }),
          spanPct,
          el('span', { className: 'mux-gate-suffix', text: 'of total gates' })
        ]),
        el('div', { className: 'mux-gate-row' }, [
          el('span', { className: 'mux-gate-label', text: 'Overhead ratio:' }),
          spanRatio
        ])
      ]));

      /* 5. Register file size slider (n = 4 / 8 / 16 / 32) */
      var sliderLabel = el('span', { className: 'mux-slider-label mono-num', text: 'n = 8' });

      var slider = el('input', {
        type: 'range',
        className: 'mux-slider',
        min: '0',
        max: String(N_STEPS.length - 1),
        step: '1',
        value: '1',  /* index 1 = n=8 */
        'aria-label': 'Register file size (n slots)'
      });

      slider.addEventListener('input', function () {
        nSlots = N_STEPS[parseInt(slider.value, 10)];
        sliderLabel.textContent = 'n = ' + nSlots;
        updateGateCounters();
      });

      ctx.left.appendChild(el('div', { className: 'mux-slider-wrap' }, [
        el('span', { className: 'mux-slider-title', text: 'Register file: ' }),
        sliderLabel,
        slider,
        el('div', { className: 'mux-slider-ticks' },
          N_STEPS.map(function (v) {
            return el('span', { className: 'mux-slider-tick mono-num', text: String(v) });
          })
        )
      ]));

      /* 6. Insight callout */
      ctx.left.appendChild(el('div', { className: 'callout warn mux-insight' }, [
        el('p', {
          text: 'With n=8, p=4, q=4: 96 gates on moving data, 16 on actual multiply. ' +
                '6:1 overhead. This is the problem Tensor Cores solved.'
        })
      ]));

      /* 7. Source callout */
      ctx.left.appendChild(el('div', { className: 'callout mux-sources' }, [
        el('p', {
          className: 'mux-quote',
          text: '"take three arbitrary registers from this register file, perform the multiply-accumulate, and then write back."'
        }),
        el('p', {
          className: 'mux-quote',
          text: '"We form a mask… AND every single entry with 1 or 0… then OR all of them together… n×p many AND gates… (n−1)×p many OR gates."'
        }),
        el('p', {
          className: 'mux-quote',
          text: '"3 × n × p AND gates… compared to p × q gates in the actual circuit."'
        }),
        el('p', {
          className: 'mux-quote mux-quote--highlight',
          text: '"almost all of the cost, seven-eighths of the cost, is in reading and writing the register file."'
        }),
        el('p', {
          className: 'mux-quote',
          text: '"This problem statement is what motivated the introduction of Tensor Cores, which are more generically called systolic arrays."'
        })
      ]));

      /* ================================================
         RIGHT COLUMN — SVG visualization
         ================================================ */

      var stageSvg = svg('svg', {
        viewBox: '0 0 ' + VB_W + ' ' + VB_H,
        'aria-label': 'Register file, mux, and MAC unit diagram',
        role: 'img',
        preserveAspectRatio: 'xMidYMid meet',
        class: 'mux-svg'
      });

      /* ---- Background grid / connector lines (decorative) ---- */

      /* Register file block */
      var rfRect = svg('rect', {
        x: RF_X, y: RF_Y,
        width: RF_W, height: RF_H,
        rx: '6',
        fill: 'var(--surface)',
        stroke: 'var(--accent)',
        'stroke-width': '1.5',
        class: 'mux-block mux-rf-block'
      });
      stageSvg.appendChild(rfRect);

      var rfLabel = svg('text', {
        x: RF_X + RF_W / 2,
        y: RF_Y - 8,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)',
        'font-size': '9',
        fill: 'var(--text-muted)',
        text: 'Register File (n slots)'
      });
      stageSvg.appendChild(rfLabel);

      /* Register slots */
      for (var si = 0; si < SLOTS; si++) {
        var scy = slotCY(si);
        var inner_h = RF_H - 24;
        var step = inner_h / SLOTS;
        var slotH = step - 4;

        var slotRect = svg('rect', {
          x: RF_X + 6,
          y: scy - slotH / 2,
          width: RF_W - 12,
          height: slotH,
          rx: '3',
          fill: 'var(--surface-2)',
          stroke: 'var(--grid)',
          'stroke-width': '1',
          class: 'mux-slot'
        });
        stageSvg.appendChild(slotRect);

        var slotLbl = svg('text', {
          x: RF_X + 12,
          y: scy + 4,
          'font-family': 'var(--font-mono)',
          'font-size': '9',
          fill: 'var(--text-muted)',
          class: 'mux-slot-label',
          text: 'R' + si
        });
        stageSvg.appendChild(slotLbl);

        slotEls.push({ rect: slotRect, label: slotLbl });
      }

      /* ---- Wire A: selected Reg → Mux ---- */
      wireA = svg('line', {
        x1: RF_X + RF_W, y1: slotCY(selRegs[0]),
        x2: MUX_X, y2: MUX_Y + 30,
        stroke: 'var(--accent)',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        class: 'mux-wire mux-wire-a'
      });
      stageSvg.appendChild(wireA);

      /* ---- Wire B: selected Reg → Mux ---- */
      wireB = svg('line', {
        x1: RF_X + RF_W, y1: slotCY(selRegs[1]),
        x2: MUX_X, y2: MUX_Y + MUX_H / 2,
        stroke: 'var(--accent)',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        class: 'mux-wire mux-wire-b'
      });
      stageSvg.appendChild(wireB);

      /* ---- Wire Acc: selected Reg → Mux ---- */
      wireAcc = svg('line', {
        x1: RF_X + RF_W, y1: slotCY(selRegs[2]),
        x2: MUX_X, y2: MUX_Y + MUX_H - 30,
        stroke: 'var(--accent)',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        class: 'mux-wire mux-wire-acc'
      });
      stageSvg.appendChild(wireAcc);

      /* ---- Mux block ---- */
      var muxRect = svg('rect', {
        x: MUX_X, y: MUX_Y,
        width: MUX_W, height: MUX_H,
        rx: '6',
        fill: 'var(--surface)',
        stroke: 'var(--accent)',
        'stroke-width': '1.5',
        class: 'mux-block'
      });
      stageSvg.appendChild(muxRect);

      var muxLabel = svg('text', {
        x: MUX_X + MUX_W / 2,
        y: MUX_Y + MUX_H / 2 - 8,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-family': 'var(--font-mono)',
        'font-size': '14',
        'font-weight': '700',
        fill: 'var(--accent)',
        text: 'MUX'
      });
      stageSvg.appendChild(muxLabel);

      var muxGateLabel = svg('text', {
        x: MUX_X + MUX_W / 2,
        y: MUX_Y + MUX_H - 10,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)',
        'font-size': '8',
        fill: 'var(--text-muted)',
        text: '3 × n × p gates'
      });
      stageSvg.appendChild(muxGateLabel);

      /* ---- Wire Mux → MAC ---- */
      wireMuxMac = svg('line', {
        x1: MUX_X + MUX_W,
        y1: MUX_Y + MUX_H / 2,
        x2: MAC_X,
        y2: MAC_Y + MAC_H / 2,
        stroke: 'var(--accent)',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        class: 'mux-wire mux-wire-muxmac'
      });
      stageSvg.appendChild(wireMuxMac);

      /* ---- MAC block ---- */
      var macRect = svg('rect', {
        x: MAC_X, y: MAC_Y,
        width: MAC_W, height: MAC_H,
        rx: '6',
        fill: 'var(--surface)',
        stroke: 'var(--highlight)',
        'stroke-width': '1.5',
        class: 'mux-block mux-mac-block'
      });
      stageSvg.appendChild(macRect);

      var macLabel = svg('text', {
        x: MAC_X + MAC_W / 2,
        y: MAC_Y + MAC_H / 2 - 6,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-family': 'var(--font-mono)',
        'font-size': '14',
        'font-weight': '700',
        fill: 'var(--highlight)',
        text: 'MAC'
      });
      stageSvg.appendChild(macLabel);

      var macGateLabel = svg('text', {
        x: MAC_X + MAC_W / 2,
        y: MAC_Y + MAC_H - 8,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)',
        'font-size': '8',
        fill: 'var(--text-muted)',
        text: 'p × q gates'
      });
      stageSvg.appendChild(macGateLabel);

      /* ---- Wire MAC output → write-back to register file ---- */
      /* Path: from MAC right edge, arc down and back left to RF right edge */
      var wbPath =
        'M ' + (MAC_X + MAC_W) + ' ' + (MAC_Y + MAC_H / 2) +
        ' C ' + (MAC_X + MAC_W + 28) + ' ' + (MAC_Y + MAC_H / 2) + ',' +
               (RF_X + RF_W + 28) + ' ' + (RF_Y + RF_H + 24) + ',' +
               (RF_X + RF_W) + ' ' + (RF_Y + RF_H - 14);

      wireMacWb = svg('path', {
        d: wbPath,
        fill: 'none',
        stroke: 'var(--highlight)',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-dasharray': 'none',
        class: 'mux-wire mux-wire-wb'
      });
      stageSvg.appendChild(wireMacWb);

      /* Write-back arrow head */
      var wbArrow = svg('polygon', {
        points: (RF_X + RF_W) + ',' + (RF_Y + RF_H - 14) + ' ' +
                (RF_X + RF_W - 6) + ',' + (RF_Y + RF_H - 22) + ' ' +
                (RF_X + RF_W + 6) + ',' + (RF_Y + RF_H - 22),
        fill: 'var(--highlight)',
        class: 'mux-wb-arrow'
      });
      stageSvg.appendChild(wbArrow);

      /* Write-back label */
      var wbLabel = svg('text', {
        x: RF_X + RF_W + 14,
        y: RF_Y + RF_H + 20,
        'font-family': 'var(--font-mono)',
        'font-size': '8',
        fill: 'var(--highlight)',
        text: 'write-back'
      });
      stageSvg.appendChild(wbLabel);

      /* ---- Wire labels ---- */
      var wireALabel = svg('text', {
        x: RF_X + RF_W + 6,
        y: slotCY(selRegs[0]) - 3,
        'font-family': 'var(--font-mono)',
        'font-size': '8',
        fill: 'var(--accent)',
        class: 'mux-wire-alabel',
        text: 'A'
      });
      stageSvg.appendChild(wireALabel);

      var wireBLabel = svg('text', {
        x: RF_X + RF_W + 6,
        y: slotCY(selRegs[1]) - 3,
        'font-family': 'var(--font-mono)',
        'font-size': '8',
        fill: 'var(--accent)',
        class: 'mux-wire-blabel',
        text: 'B'
      });
      stageSvg.appendChild(wireBLabel);

      var wireAccLabel = svg('text', {
        x: RF_X + RF_W + 6,
        y: slotCY(selRegs[2]) - 3,
        'font-family': 'var(--font-mono)',
        'font-size': '8',
        fill: 'var(--accent)',
        class: 'mux-wire-acclabel',
        text: 'Acc'
      });
      stageSvg.appendChild(wireAccLabel);

      ctx.stage.appendChild(stageSvg);

      /* ================================================
         UPDATE LOGIC
         ================================================ */

      function updateSlotHighlights() {
        var activeSet = {};
        selRegs.forEach(function (r) { activeSet[r] = true; });

        for (var i = 0; i < SLOTS; i++) {
          var s = slotEls[i];
          if (activeSet[i]) {
            s.rect.setAttribute('fill', 'var(--accent-a20)');
            s.rect.setAttribute('stroke', 'var(--accent)');
            s.rect.setAttribute('stroke-width', '1.5');
            s.label.setAttribute('fill', 'var(--accent)');
          } else {
            s.rect.setAttribute('fill', 'var(--surface-2)');
            s.rect.setAttribute('stroke', 'var(--grid)');
            s.rect.setAttribute('stroke-width', '1');
            s.label.setAttribute('fill', 'var(--text-muted)');
          }
        }
      }

      function updateWirePositions() {
        wireA.setAttribute('y1',  String(slotCY(selRegs[0])));
        wireA.setAttribute('y2',  String(MUX_Y + 30));
        wireB.setAttribute('y1',  String(slotCY(selRegs[1])));
        wireB.setAttribute('y2',  String(MUX_Y + MUX_H / 2));
        wireAcc.setAttribute('y1', String(slotCY(selRegs[2])));
        wireAcc.setAttribute('y2', String(MUX_Y + MUX_H - 30));

        wireALabel.setAttribute('y',  String(slotCY(selRegs[0]) - 3));
        wireBLabel.setAttribute('y',  String(slotCY(selRegs[1]) - 3));
        wireAccLabel.setAttribute('y', String(slotCY(selRegs[2]) - 3));
      }

      function updateGateCounters() {
        spanMuxCount.textContent = String(muxGates(nSlots));
        spanMacCount.textContent = String(macGates());
        spanPct.textContent      = String(pct(nSlots)) + '%';
        spanRatio.textContent    = String(ratio(nSlots)) + ':1';
      }

      function updateAll() {
        updateSlotHighlights();
        updateWirePositions();
        updateGateCounters();
      }

      /* Run animation */
      runBtn.addEventListener('click', function () {
        runBtn.disabled = true;

        function finish() {
          runBtn.disabled = false;
        }

        if (reduced) {
          /* instant highlights only */
          updateSlotHighlights();
          finish();
          return;
        }

        /* sequence: wireA → wireB → wireAcc → wireMuxMac → wireMacWb */
        var delay = 0;
        var STEP = 300;

        setTimeout(function () { ChipViz.pulse(wireA, 'var(--accent)'); }, delay);
        delay += STEP;
        setTimeout(function () { ChipViz.pulse(wireB, 'var(--accent)'); }, delay);
        delay += STEP;
        setTimeout(function () { ChipViz.pulse(wireAcc, 'var(--accent)'); }, delay);
        delay += STEP;
        setTimeout(function () { ChipViz.pulse(wireMuxMac, 'var(--accent)'); }, delay);
        delay += STEP;
        setTimeout(function () { ChipViz.pulse(wireMacWb, 'var(--highlight)'); }, delay);
        delay += 700;  /* let wb pulse finish */
        setTimeout(finish, delay);
      });

      /* ---- Initial render ---- */
      updateAll();
    }
  });
})();
