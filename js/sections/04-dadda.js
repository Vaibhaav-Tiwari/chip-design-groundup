/* ============================================================
   04-dadda.js  —  Section 4: Dadda Multiplier: Building the Adder Tree
   A 4×4 multiplication produces 24 bits (16 partial-product bits
   + 8 accumulator bits). The Dadda adder tree compresses these
   down to 8 bits using 16 adder stages (= p×q), then a final
   ripple-carry add gives the 8-bit result.
   ============================================================ */
(function () {
  'use strict';

  /* ---- Constants ---- */
  var TOTAL_FA   = 16;   /* adder stages shown: matches algebra pq + p+q − (p+q) = pq */
  var START_BITS = 24;   /* pq + (p+q) = 16 + 8 */
  var END_BITS   = 8;    /* p+q = 4+4 (sum of remaining bits after all 16 stages) */

  /* Initial column heights (cols 0–7):
     Partial products (cols 0–6): [1,2,3,4,3,2,1] = 16 bits
     + 1 accumulator bit per column (cols 0–7):     +8 bits
     Result: [2,3,4,5,4,3,2,1] sum = 24 bits                  */
  var INIT_COLS = [2, 3, 4, 5, 4, 3, 2, 1];

  /* Pre-scripted 16-step sequence (column index to reduce each step).
     Steps 1–12: full-adder reductions (source col has ≥3 bits).
     Steps 13–16: half-adder reductions (source col has 2 bits;
     visually identical — decrement by 2, carry +1 to next col).
     Starting: [2,3,4,5,4,3,2,1]
     Ending:   [0,0,0,0,2,2,2,2] sum=8 ✓ all cols ≤ 2 ✓         */
  var SCRIPTED_STEPS = [3,4,2,3,4,5,1,2,3,4,5,6, 0,1,2,3];

  /* ---- SVG geometry ---- */
  var VB_W    = 400;
  var VB_H    = 300;
  var COLS    = 8;
  var COL_W   = 44;
  var COL_GAP = 4;
  var TOTAL_W = COLS * COL_W + (COLS - 1) * COL_GAP; /* 368 */
  var START_X = (VB_W - TOTAL_W) / 2;                /* 16 */
  var CR      = 10;   /* circle radius */
  var SPACING = 24;   /* vertical spacing between circle centres */
  var BASE_Y  = VB_H - 40; /* y of bottom circle */
  var MAX_H   = 5;    /* max circles per column (for rendering) */

  /* x-centre of column i */
  function colCX(i) {
    return START_X + i * (COL_W + COL_GAP) + COL_W / 2;
  }

  /* y-centre of the j-th circle from the bottom (j=0 = bottom) */
  function circleY(j) {
    return BASE_Y - j * SPACING;
  }

  ChipViz.register({
    id: 'dadda',
    order: 4,
    title: 'Dadda Multiplier: Building the Adder Tree',
    subtitle: 'From 24 bits to 8, using 16 adder stages.',
    build: function (ctx) {
      ctx.pulseGrid();

      var el  = ChipViz.el;
      var svg = ChipViz.svg;
      var reduced = ChipViz.prefersReducedMotion();

      /* ---- mutable state ---- */
      var cols;      /* column heights array, mutated each step */
      var faCount;   /* adder stages applied so far (0..16) */

      /* ---- SVG circle nodes: circleEls[col][row] ---- */
      /* Pre-created at MAX_H per column; hidden rows shown by setting r=0 */
      var circleEls = []; /* circleEls[col] = array of MAX_H circle elements */

      /* ---- counter widget ---- */
      var faCounter = ChipViz.counter('Adder stages used');

      /* ---- end-state insight box (hidden until step 16) ---- */
      var endInsight = el('div', {
        className: 'dadda-end-insight callout insight',
        style: { display: 'none' }
      }, [
        el('p', {
          className: 'dadda-end-quote',
          text: 'We started with 24 bits. Ended with 8. Used 16 adder stages (= p×q).'
        }),
        el('p', {
          className: 'dadda-end-formula mono-num',
          html: '16 AND gates + 16 adder stages'
        })
      ]);

      /* ================================================
         LEFT COLUMN
         ================================================ */

      ctx.left.appendChild(el('p', {
        className: 'dadda-explainer',
        text: 'The Dadda multiplier repeatedly applies adder stages to compress columns ' +
              'of partial-product bits, reducing 24 input bits to 8 output bits.'
      }));

      /* 2. Controls: Step + Reset buttons */
      var stepBtn = el('button', {
        className: 'dadda-step-btn',
        type: 'button',
        text: 'Step'
      });
      var resetBtn = el('button', {
        className: 'dadda-reset-btn',
        type: 'button',
        text: 'Reset'
      });

      ctx.left.appendChild(el('div', { className: 'dadda-controls' }, [stepBtn, resetBtn]));

      /* 3. FA counter ("X / 16") */
      var counterWrap = el('div', { className: 'dadda-counter-wrap' }, [
        faCounter.el,
        el('span', { className: 'dadda-counter-denom mono-num', text: ' / ' + TOTAL_FA })
      ]);
      ctx.left.appendChild(counterWrap);

      /* 4. End-state insight (shown when complete) */
      ctx.left.appendChild(endInsight);

      /* 5. Source callout */
      ctx.left.appendChild(el('div', { className: 'callout dadda-callout' }, [
        el('p', {
          text: '"We proceed from the rightmost column toward the left… ' +
                'instead of remembering the carry, we’ll explicitly write it out."'
        }),
        el('p', {
          text: '"keep applying full adders… constantly removing three numbers from a column ' +
                'and writing out two numbers as output… until I eventually get just one single number."'
        }),
        el('p', {
          text: '"This approach is called a Dadda multiplier… area-efficient multipliers."'
        }),
        el('p', {
          className: 'dadda-algebra',
          text: '"24 minus 8, so there were 16 full adders… ' +
                'input bits 24 = p×q + p+q, output bits p+q, so p×q + p+q − (p+q) = p×q."'
        })
      ]));

      /* 6. Live formula side panel */
      ctx.left.appendChild(el('div', { className: 'dadda-formula-panel panel' }, [
        el('div', { className: 'dadda-formula-title', text: 'Live formula' }),
        el('div', { className: 'dadda-formula-live', html:
          '<span class="dadda-fml-andgates">p×q AND gates</span>' +
          ' + ' +
          '<span class="dadda-fml-fagates">p×q adder stages</span>'
        }),
        el('div', { className: 'dadda-formula-expanded mono-num', html:
          '<span class="dadda-fml-and16">16</span> AND gates' +
          ' + ' +
          '<span class="dadda-fml-fa16">16</span> adder stages'
        })
      ]));

      /* ================================================
         RIGHT COLUMN — SVG visualization
         ================================================ */

      var stageSvg = svg('svg', {
        viewBox: '0 0 ' + VB_W + ' ' + VB_H,
        'aria-label': 'Dadda multiplier column compression visualization',
        role: 'img',
        preserveAspectRatio: 'xMidYMid meet',
        class: 'dadda-svg'
      });

      /* Top label */
      stageSvg.appendChild(svg('text', {
        x: VB_W / 2, y: 18,
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)',
        'font-size': '10',
        fill: 'var(--text-muted)',
        text: 'Bit columns — each circle = 1 partial-product bit'
      }));

      /* Separator line above column labels */
      stageSvg.appendChild(svg('line', {
        x1: START_X - 6, y1: VB_H - 30,
        x2: START_X + TOTAL_W + 6, y2: VB_H - 30,
        stroke: 'var(--grid)', 'stroke-width': '1',
        'stroke-dasharray': '2 4'
      }));

      /* Column index labels (0–7) */
      for (var ci = 0; ci < COLS; ci++) {
        stageSvg.appendChild(svg('text', {
          x: colCX(ci),
          y: VB_H - 14,
          'text-anchor': 'middle',
          'font-family': 'var(--font-mono)',
          'font-size': '11',
          fill: 'var(--text-muted)',
          text: String(ci)
        }));
      }

      /* Pre-create circles and cross-lines (MAX_H per column) */
      for (var col = 0; col < COLS; col++) {
        circleEls[col] = [];
        for (var row = 0; row < MAX_H; row++) {
          var cx = colCX(col);
          var cy = circleY(row);

          var c = svg('circle', {
            cx: cx, cy: cy, r: CR,
            fill: 'var(--accent-a20)',
            stroke: 'var(--accent)',
            'stroke-width': '1.5',
            class: 'dadda-bit'
          });
          stageSvg.appendChild(c);

          /* Cross-out line for consumed bits */
          var crossLine = svg('line', {
            x1: cx - CR + 3, y1: cy - CR + 3,
            x2: cx + CR - 3, y2: cy + CR - 3,
            stroke: 'var(--text-muted)',
            'stroke-width': '1.5',
            'stroke-linecap': 'round',
            class: 'dadda-cross'
          });
          crossLine.style.display = 'none';
          stageSvg.appendChild(crossLine);

          /* Attach cross reference to circle */
          c._cross = crossLine;

          circleEls[col][row] = c;
        }
      }

      ctx.stage.appendChild(stageSvg);

      /* ================================================
         RENDERING
         ================================================ */

      /* Paint all columns based on current cols[] state.
         highlightFrom: col index that just had bits consumed (-1 = none)
         highlightTo:   col index that just received a carry  (-1 = none) */
      function renderCircles(highlightFrom, highlightTo) {
        for (var col = 0; col < COLS; col++) {
          var height = cols[col];
          for (var row = 0; row < MAX_H; row++) {
            var c    = circleEls[col][row];
            var xLn  = c._cross;
            var live = (row < height);

            if (!live) {
              /* hide: shrink to r=0 so it's invisible */
              c.setAttribute('r', '0');
              c.setAttribute('fill', 'none');
              c.setAttribute('stroke', 'none');
              xLn.style.display = 'none';
              continue;
            }

            /* restore size */
            c.setAttribute('r', String(CR));
            xLn.style.display = 'none';

            if (col === highlightTo && row === height - 1) {
              /* newest carry bit just placed in this column */
              c.setAttribute('fill', 'var(--carry)');
              c.setAttribute('stroke', 'var(--carry)');
              c.setAttribute('stroke-width', '2');
            } else if (col === highlightFrom && row === height - 1) {
              /* top remaining bit of source col = the sum output, highlight green */
              c.setAttribute('fill', 'var(--highlight)');
              c.setAttribute('stroke', 'var(--highlight)');
              c.setAttribute('stroke-width', '2');
            } else {
              /* normal bit */
              c.setAttribute('fill', 'var(--accent-a20)');
              c.setAttribute('stroke', 'var(--accent)');
              c.setAttribute('stroke-width', '1.5');
            }
          }
        }
      }

      /* Brief activation flash on source column's top bits before step commits */
      function flashSource(fromCol, height) {
        if (reduced) return;
        /* flash up to 3 top circles of fromCol */
        var start = Math.max(0, height - 3);
        for (var r = start; r < Math.min(height, MAX_H); r++) {
          (function (r2) {
            var c = circleEls[fromCol][r2];
            c.setAttribute('fill', 'var(--accent)');
            setTimeout(function () {
              /* renderCircles will overwrite this, but set fallback */
              if (c.getAttribute('r') !== '0') {
                c.setAttribute('fill', 'var(--accent-a20)');
              }
            }, 300);
          })(r);
        }
      }

      /* ================================================
         STATE MANAGEMENT
         ================================================ */

      function initState() {
        cols    = INIT_COLS.slice();
        faCount = 0;
      }

      function doStep() {
        if (faCount >= TOTAL_FA) {
          doReset();
          return;
        }

        var fromCol = SCRIPTED_STEPS[faCount];
        var toCol   = fromCol + 1;
        var prevH   = cols[fromCol];

        flashSource(fromCol, prevH);

        /* Apply adder operation: cols[from] -= 2, cols[to] += 1 */
        cols[fromCol] -= 2;
        if (toCol < cols.length) {
          cols[toCol] += 1;
        }
        faCount += 1;

        faCounter.set(faCount);
        renderCircles(fromCol, toCol < cols.length ? toCol : -1);
        updateStepBtn();

        if (faCount >= TOTAL_FA) {
          endInsight.style.display = '';
        }
      }

      function doReset() {
        initState();
        faCounter.set(0);
        endInsight.style.display = 'none';
        renderCircles(-1, -1);
        updateStepBtn();
      }

      function updateStepBtn() {
        stepBtn.textContent = (faCount >= TOTAL_FA) ? 'Reset' : 'Step';
      }

      /* ---- Wire up buttons ---- */
      stepBtn.addEventListener('click', function () {
        if (faCount >= TOTAL_FA) {
          doReset();
        } else {
          doStep();
        }
      });

      resetBtn.addEventListener('click', doReset);

      /* ---- Initial render ---- */
      initState();
      faCounter.set(0);
      renderCircles(-1, -1);
      updateStepBtn();
    }
  });
})();
