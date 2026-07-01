/* ============================================================
   02-mac.js  —  S2 Multiply-Accumulate: The AI Primitive
   Registers the MAC section with 4-bit×4-bit partial-product
   grid, live bit toggles, AND gate counter, precision tabs,
   and FP4 vs FP8 gate-cost bar chart.

   Source anchors (verbatim):
   "a multiply of these two terms, and then we're going to add in an eight-bit number"
   "multiply this four-bit number by every single bit position in the other four-bit number"
   "To produce all of this, we ended up consuming 16 AND gates… p times q many ANDs"
   "the precision will almost always be higher in the accumulation step than in the multiplication step… errors accumulate"
   "the amount of area it takes… is quadratic with the bit length… Nvidia… B300… FP4 is three times faster than the FP8. Though it should be 4x."
   — Reiner Pope, CEO of MatX (via Dwarkesh Podcast)
   ============================================================ */

(function (ChipViz) {
  'use strict';

  /* ---- precision chart data ---- */
  var PRECISION_DATA = {
    4: [
      { label: 'FP4', value: 16, color: 'var(--accent)' },
      { label: 'FP8', value: 64, color: 'var(--accent-2)' }
    ],
    8: [
      { label: 'FP4', value: 16, color: 'var(--accent)' },
      { label: 'FP8', value: 64, color: 'var(--accent-2)' }
    ]
  };

  ChipViz.register({
    id: 'mac',
    order: 2,
    title: 'Multiply-Accumulate: The AI Primitive',
    subtitle: 'The fundamental operation of every neural network.',

    build: function (ctx) {
      var reduced = ChipViz.prefersReducedMotion();

      /* ============================================================
         LEFT COLUMN: Explanation + callout + counter + tabs + chart
         ============================================================ */

      /* Brief explanation */
      var explanation = ChipViz.el('p', {
        className: 'mac-explanation',
        text: 'Every neural network layer is dominated by one operation: ' +
              'multiply-accumulate (MAC). For each output element, we multiply ' +
              'two inputs and add the result into an accumulator. ' +
              'This is the core of matrix multiplication.'
      });

      /* Key insight callout: matrix multiply formula */
      var callout = ChipViz.el('div', { className: 'callout insight mac-callout' }, [
        ChipViz.el('strong', { text: 'This is exactly what happens at every step of a matrix multiply: ' }),
        ChipViz.el('code', {
          className: 'mac-formula',
          text: 'output[i][k] += input[i][j] × input[j][k]'
        })
      ]);

      /* AND gate counter: shows X / 16 for 4-bit */
      var gateCounter = ChipViz.counter('AND gates required (p×q)');
      gateCounter.set(16);
      var gateCounterWrap = ChipViz.el('div', { className: 'mac-counter-wrap' }, [
        gateCounter.el,
        ChipViz.el('span', { className: 'mac-counter-denom', text: ' / 16 (4-bit)' })
      ]);
      var counterDenom = gateCounterWrap.querySelector('.mac-counter-denom');

      /* Precision tab controls */
      var tab4 = ChipViz.el('button', {
        className: 'mac-tab mac-tab--active',
        type: 'button',
        text: '4-bit',
        dataset: { bits: '4' }
      });
      var tab8 = ChipViz.el('button', {
        className: 'mac-tab',
        type: 'button',
        text: '8-bit',
        dataset: { bits: '8' }
      });
      var tabsRow = ChipViz.el('div', { className: 'mac-tabs' }, [tab4, tab8]);

      /* Bar chart: gate-cost scaling */
      var chart = ChipViz.barChart(PRECISION_DATA[4]);
      var chartWrap = ChipViz.el('div', { className: 'mac-chart-wrap' }, [
        ChipViz.el('p', {
          className: 'mac-chart-label',
          text: 'AND gate count by precision:'
        }),
        chart.el,
        ChipViz.el('p', {
          className: 'mac-chart-note',
          text: 'FP4 is ~4× fewer gates than FP8 (quadratic!)'
        }),
        ChipViz.el('p', {
          className: 'mac-chart-note mac-chart-note--carry',
          text: 'Nvidia B300: FP4 is 3× faster than FP8. Though it should be 4×.'
        })
      ]);

      /* Tab switching handler */
      function switchTab(bits) {
        tab4.classList.toggle('mac-tab--active', bits === 4);
        tab8.classList.toggle('mac-tab--active', bits === 8);
        var gates = bits === 4 ? 16 : 64;
        var total = bits * bits;
        gateCounter.set(gates);
        counterDenom.textContent = ' / ' + total + ' (' + bits + '-bit)';
        chart.update(PRECISION_DATA[bits]);
      }

      tab4.addEventListener('click', function () { switchTab(4); });
      tab8.addEventListener('click', function () { switchTab(8); });

      ctx.left.appendChild(explanation);
      ctx.left.appendChild(callout);
      ctx.left.appendChild(gateCounterWrap);
      ctx.left.appendChild(tabsRow);
      ctx.left.appendChild(chartWrap);

      /* ============================================================
         STAGE COLUMN: Inputs, partial-product grid, result, accumulator
         ============================================================ */

      /* --- Input A: 4 bit toggles (MSB at index 0 = bit3, LSB at index 3 = bit0) --- */
      /* A[0]=bit3, A[1]=bit2, A[2]=bit1, A[3]=bit0  */
      var togglesA = [0, 1, 2, 3].map(function (i) {
        return ChipViz.bitToggle({ value: 0, label: 'A' + (3 - i), onChange: onInputChange });
      });
      /* B[0]=bit3, B[1]=bit2, B[2]=bit1, B[3]=bit0 */
      var togglesB = [0, 1, 2, 3].map(function (i) {
        return ChipViz.bitToggle({ value: 0, label: 'B' + (3 - i), onChange: onInputChange });
      });

      /* Input row builder */
      function makeInputRow(label, toggles) {
        var bits = toggles.map(function (t) {
          return ChipViz.el('div', { className: 'mac-input-cell' }, [t.el]);
        });
        return ChipViz.el('div', { className: 'mac-input-row' }, [
          ChipViz.el('span', { className: 'mac-input-label', text: label }),
          ChipViz.el('div', { className: 'mac-input-bits' }, bits)
        ]);
      }

      var inputA = makeInputRow('A', togglesA);
      var inputB = makeInputRow('B', togglesB);

      /* --- Partial product grid ---
         Grid has 4 rows (one per B bit) × 8 columns (0..7 bit positions).
         Row j corresponds to B[j] (where j=0 is LSB of B, j=3 is MSB of B).
         But we display rows from j=3 (top) to j=0 (bottom) for readability
         matching how long multiplication is written (MSB row first).

         Layout for 4-bit × 4-bit (8-wide grid):
         Col:  7    6    5    4    3    2    1    0
         Row3: B3∧A3 B3∧A2 B3∧A1 B3∧A0  _    _    _    _
         Row2:  _   B2∧A3 B2∧A2 B2∧A1 B2∧A0  _    _    _
         Row1:  _    _   B1∧A3 B1∧A2 B1∧A1 B1∧A0  _    _
         Row0:  _    _    _   B0∧A3 B0∧A2 B0∧A1 B0∧A0  _  -- wait, let me recalc

         Row j (Bj × A): partial product starts at bit position j.
         Cells at column positions: j, j+1, j+2, j+3  (for A bits 0..3)
         In an 8-wide grid (col 0=LSB, col 7=MSB):
           Row j=0: cols 0,1,2,3  → A0∧B0, A1∧B0, A2∧B0, A3∧B0
           Row j=1: cols 1,2,3,4  → A0∧B1, A1∧B1, A2∧B1, A3∧B1
           Row j=2: cols 2,3,4,5  → A0∧B2, A1∧B2, A2∧B2, A3∧B2
           Row j=3: cols 3,4,5,6  → A0∧B3, A1∧B3, A2∧B3, A3∧B3

         Display order: row j=3 at top, j=0 at bottom.
         Column display: col 7 at left, col 0 at right (MSB-first).
      */

      /* Build the grid cells: cells[j][i] = cell for B[j] AND A[i] */
      var ppCells = []; // ppCells[j][i]: row j (B bit index 0..3), col i (A bit index 0..3)
      var ppLabels = []; // label spans beside cells

      var gridRows = []; // 4 rows, displayed j=3 first (top) to j=0 (bottom)

      for (var jj = 3; jj >= 0; jj--) {
        ppCells[jj] = [];
        ppLabels[jj] = [];
        var rowCells = [];

        for (var col = 7; col >= 0; col--) {
          /* Which A bit corresponds to this column for row jj?
             Column col carries product bit: bit_position = col
             For row j, the A bits occupy columns j..j+3.
             So for column col in row jj: A_bit_index = col - jj  (0..3)
          */
          var aBitIndex = col - jj;
          var isActive = (aBitIndex >= 0 && aBitIndex <= 3);

          var cell;
          if (isActive) {
            var labelEl = ChipViz.el('span', { className: 'mac-pp-label' });
            ppLabels[jj][aBitIndex] = labelEl;
            cell = ChipViz.el('td', {
              className: 'mac-pp-cell mac-pp-cell--active',
              dataset: { row: String(jj), col: String(aBitIndex), active: '0' }
            }, [labelEl]);
            ppCells[jj][aBitIndex] = cell;
          } else {
            cell = ChipViz.el('td', { className: 'mac-pp-cell mac-pp-cell--empty', text: ' ' });
          }
          rowCells.push(cell);
        }

        /* Row label: "B[j] × A" */
        var rowLabel = ChipViz.el('th', {
          className: 'mac-pp-row-label',
          text: '×B' + jj
        });

        var tr = ChipViz.el('tr', { className: 'mac-pp-row' },
          [rowLabel].concat(rowCells)
        );
        gridRows.push(tr);
      }

      /* Column headers (bit position numbers, MSB first) */
      var headerCells = [ChipViz.el('th', { className: 'mac-pp-corner', text: '' })];
      for (var hCol = 7; hCol >= 0; hCol--) {
        headerCells.push(ChipViz.el('th', {
          className: 'mac-pp-col-header',
          text: String(hCol)
        }));
      }
      var headerRow = ChipViz.el('tr', null, headerCells);

      /* Result row: 8-bit binary result */
      var resultCells = [ChipViz.el('th', { className: 'mac-result-label', text: 'Result' })];
      var resultBitEls = [];
      for (var rb = 7; rb >= 0; rb--) {
        var rCell = ChipViz.el('td', {
          className: 'mac-result-cell',
          dataset: { bit: String(rb) },
          text: '0'
        });
        resultBitEls[rb] = rCell;
        resultCells.push(rCell);
      }
      var resultRow = ChipViz.el('tr', { className: 'mac-result-row' }, resultCells);

      /* Decimal result display */
      var decimalDisplay = ChipViz.el('div', { className: 'mac-decimal-row' }, [
        ChipViz.el('span', { className: 'mac-decimal-label', text: 'A × B = ' }),
        ChipViz.el('span', { className: 'mac-decimal-val', text: '0', id: 'mac-decimal-val' })
      ]);

      /* Accumulator row */
      var accumVal = 0;
      var accumBitEls = [];
      var accumCells = [ChipViz.el('th', { className: 'mac-accum-label', text: '+Accum' })];
      for (var ab = 7; ab >= 0; ab--) {
        var aCell = ChipViz.el('td', {
          className: 'mac-accum-cell',
          dataset: { bit: String(ab) },
          text: '0'
        });
        accumBitEls[ab] = aCell;
        accumCells.push(aCell);
      }
      var accumRow = ChipViz.el('tr', { className: 'mac-accum-row' }, accumCells);
      var accumBtn = ChipViz.el('button', {
        className: 'mac-accum-btn',
        type: 'button',
        text: 'Accumulate result →'
      });

      /* Accumulated total display */
      var accumTotalEl = ChipViz.el('span', { className: 'mac-accum-total', text: '0' });
      var accumNote = ChipViz.el('div', { className: 'mac-accum-note' }, [
        ChipViz.el('span', { className: 'mac-accum-note-label', text: 'Accumulated: ' }),
        accumTotalEl
      ]);

      /* Gate count callout in stage */
      var stageCounter = ChipViz.counter('AND gates used (FP4 demo)');
      stageCounter.set(16);
      var stageCounterWrap = ChipViz.el('div', { className: 'mac-stage-counter' }, [
        stageCounter.el,
        ChipViz.el('span', { className: 'mac-stage-counter-denom', text: ' / 16' })
      ]);

      /* Assemble the grid table */
      var ppTable = ChipViz.el('table', { className: 'mac-pp-table' }, [
        ChipViz.el('thead', null, [headerRow]),
        ChipViz.el('tbody', null, gridRows.concat([resultRow, accumRow]))
      ]);

      /* ---- Update function: recompute partial products + result ---- */
      function getABits() {
        /* Returns array [a3, a2, a1, a0] where a3 is MSB */
        return togglesA.map(function (t) { return t.get(); });
      }
      function getBBits() {
        return togglesB.map(function (t) { return t.get(); });
      }

      function bitsToInt(bits) {
        /* bits[0] = MSB (bit3), bits[3] = LSB (bit0) */
        var val = 0;
        for (var k = 0; k < 4; k++) {
          val |= (bits[k] << (3 - k));
        }
        return val;
      }

      function updateAll() {
        var aBits = getABits(); /* [a3,a2,a1,a0] — togglesA[0]=a3, togglesA[3]=a0 */
        var bBits = getBBits();

        /* aBitVal[i]: value of A bit at position i (i=0 means bit0=LSB) */
        /* togglesA[3] = a0 (bit0), togglesA[2] = a1 (bit1), etc.
           So aBitVal[i] = aBits[3-i] */
        function getABit(i) { return aBits[3 - i]; }
        function getBBit(j) { return bBits[3 - j]; }

        /* Update partial product cells */
        for (var j = 0; j <= 3; j++) {
          for (var i = 0; i <= 3; i++) {
            var pp = getABit(i) & getBBit(j); /* AND gate output */
            var cell = ppCells[j][i];
            if (!cell) continue;
            cell.dataset.active = pp ? '1' : '0';

            /* Label: show bit value */
            var lbl = ppLabels[j][i];
            if (lbl) {
              lbl.textContent = String(pp);
            }
          }
        }

        /* Compute integer result */
        var aInt = bitsToInt(aBits);
        var bInt = bitsToInt(bBits);
        var product = aInt * bInt; /* 0..225 (fits in 8 bits) */

        /* Update result row bits */
        for (var rb2 = 0; rb2 < 8; rb2++) {
          var bit = (product >> rb2) & 1;
          resultBitEls[rb2].textContent = String(bit);
          resultBitEls[rb2].dataset.active = bit ? '1' : '0';
        }

        /* Decimal display */
        var decEl = decimalDisplay.querySelector('#mac-decimal-val');
        if (decEl) decEl.textContent = String(product) + ' (' + aInt + ' × ' + bInt + ')';

        /* AND gate count for 4-bit is always 16 */
        stageCounter.set(16);
      }

      function onInputChange() {
        updateAll();
        if (!reduced) ctx.pulseGrid();
      }

      /* Accumulate button handler */
      accumBtn.addEventListener('click', function () {
        var aBits = getABits();
        var bBits = getBBits();
        var aInt = bitsToInt(aBits);
        var bInt = bitsToInt(bBits);
        var product = aInt * bInt;
        accumVal = (accumVal + product) & 0xFF; /* keep in 8-bit range */
        accumTotalEl.textContent = String(accumVal);

        /* Update accumulator bits display */
        for (var ab2 = 0; ab2 < 8; ab2++) {
          var bit = (accumVal >> ab2) & 1;
          accumBitEls[ab2].textContent = String(bit);
          accumBitEls[ab2].dataset.active = bit ? '1' : '0';
        }
      });

      /* Reset accumulator */
      var accumResetBtn = ChipViz.el('button', {
        className: 'mac-accum-reset-btn',
        type: 'button',
        text: 'Reset accumulator'
      });
      accumResetBtn.addEventListener('click', function () {
        accumVal = 0;
        accumTotalEl.textContent = '0';
        for (var ab3 = 0; ab3 < 8; ab3++) {
          accumBitEls[ab3].textContent = '0';
          accumBitEls[ab3].dataset.active = '0';
        }
      });

      /* ---- Assemble stage ---- */
      var inputsWrap = ChipViz.el('div', { className: 'mac-inputs-wrap' }, [
        ChipViz.el('p', { className: 'mac-inputs-heading', text: '4-bit Inputs' }),
        inputA,
        inputB
      ]);

      var gridHeading = ChipViz.el('p', {
        className: 'mac-grid-heading',
        text: 'Partial Products (4×4 = 16 AND gates):'
      });

      var accumControls = ChipViz.el('div', { className: 'mac-accum-controls' }, [
        accumBtn, accumResetBtn, accumNote
      ]);

      var accumCallout = ChipViz.el('div', { className: 'callout mac-accum-callout' }, [
        ChipViz.el('span', {
          text: 'AND gates used: 16 / 16 — each partial product cell uses exactly 1 AND gate, ' +
                'regardless of output value. 4-bit × 4-bit = p × q = 4 × 4 = 16 AND gates total.'
        })
      ]);

      ctx.stage.appendChild(inputsWrap);
      ctx.stage.appendChild(gridHeading);
      ctx.stage.appendChild(ppTable);
      ctx.stage.appendChild(decimalDisplay);
      ctx.stage.appendChild(accumControls);
      ctx.stage.appendChild(accumCallout);
      ctx.stage.appendChild(stageCounterWrap);

      /* Initial computation */
      updateAll();

      /* Signature pulse */
      ctx.pulseGrid();
    }
  });

})(window.ChipViz);
