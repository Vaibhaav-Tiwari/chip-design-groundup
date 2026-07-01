/* ============================================================
   06-systolic.js  —  Section 6: Systolic Array: Tensor Cores & TPU MXU
   Three phases:
     Phase 1 — Matrix-Vector Multiply (step-by-step animation)
     Phase 2 — Trickle-Load (clock-by-clock weight loading)
     Phase 3 — Size Scaler (N vs N² efficiency chart)
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     SHARED LAYOUT CONSTANTS
     ============================================================ */

  /* 2×2 MAC cell grid layout (used in Phase 1 and Phase 2) */
  var CELL_SIZE = 70;     /* px in viewBox units */
  var CELL_GAP  = 30;     /* gap between cell centers minus cell size */
  var CELL_STEP = CELL_SIZE + CELL_GAP; /* 100 */

  /* Cell center for (row, col) as per spec:
     cx = 60 + col*100,  cy = 60 + row*100  */
  function cellCX(col) { return 60 + col * CELL_STEP; }
  function cellCY(row) { return 60 + row * CELL_STEP; }

  /* ============================================================
     Phase 1 helpers — matrix-vector multiply
     ============================================================ */

  function parseNum(s) {
    var v = parseFloat(s);
    return isNaN(v) ? 0 : v;
  }

  function fmtNum(v) {
    /* 2 decimal places, strip trailing zeros */
    var s = v.toFixed(2).replace(/\.?0+$/, '');
    return s === '' ? '0' : s;
  }

  /* ============================================================
     REGISTRATION
     ============================================================ */

  ChipViz.register({
    id: 'systolic',
    order: 6,
    title: 'Systolic Array: Tensor Cores & TPU MXU',
    subtitle: 'The most efficient circuit for matrix multiply.',

    build: function (ctx) {
      ctx.pulseGrid();

      var el      = ChipViz.el;
      var svg     = ChipViz.svg;
      var reduced = ChipViz.prefersReducedMotion();

      /* ============================================================
         STATE
         ============================================================ */
      var activePhase = 1;   /* 1 / 2 / 3 */

      /* Phase 1 state */
      var p1Step     = 0;    /* 0..4 */
      var p1Timer    = null;
      /* partial sums for 2×2 grid — indexed [row][col] */
      var p1Partials = [[0, 0], [0, 0]];
      /* output sums */
      var p1Outputs  = [0, 0];

      /* Phase 2 state */
      var p2Clock = 0;  /* 0..4 */

      /* Phase 3 state */
      var p3N = 2;  /* 2 / 4 / 8 */

      /* ============================================================
         PHASE TABS — placed in LEFT column
         ============================================================ */

      var tabDefs = [
        { phase: 1, label: 'Phase 1: Matrix×Vector' },
        { phase: 2, label: 'Phase 2: Trickle-Load'  },
        { phase: 3, label: 'Phase 3: Scaling'        }
      ];

      var tabBtns = [];
      var tabWrap = el('div', { className: 'sys-tabs' });

      tabDefs.forEach(function (td) {
        var btn = el('button', {
          type: 'button',
          className: 'sys-tab-btn',
          text: td.label,
          'data-phase': String(td.phase)
        });
        btn.addEventListener('click', function () {
          showPhase(td.phase);
        });
        tabBtns.push(btn);
        tabWrap.appendChild(btn);
      });

      ctx.left.appendChild(tabWrap);

      /* ============================================================
         LEFT COLUMN — phase panels
         ============================================================ */

      /* ---------- Phase 1 left panel ---------- */
      var p1LeftPanel = el('div', { className: 'sys-phase-left' });

      p1LeftPanel.appendChild(el('p', {
        className: 'sys-desc',
        text: 'Each cell in the systolic array is one MAC unit. Weights stay fixed in ' +
              'the registers. Only inputs flow through.'
      }));

      /* Weight matrix 2×2 */
      p1LeftPanel.appendChild(el('div', { className: 'sys-matrix-label sys-weight-label', text: 'Weight Matrix W' }));

      var weightInputs = [[null, null], [null, null]];
      var weightGrid   = el('div', { className: 'sys-matrix-grid' });

      [[1, 2], [3, 4]].forEach(function (rowVals, r) {
        rowVals.forEach(function (val, c) {
          var inp = el('input', {
            type: 'number',
            className: 'sys-matrix-input sys-weight-input',
            value: String(val),
            'aria-label': 'W' + r + c,
            step: 'any'
          });
          weightInputs[r][c] = inp;
          var wrap = el('div', { className: 'sys-matrix-cell-wrap' }, [
            el('span', { className: 'sys-cell-label sys-weight-cell-label', text: 'W' + r + c }),
            inp
          ]);
          weightGrid.appendChild(wrap);
        });
      });
      p1LeftPanel.appendChild(weightGrid);

      /* Input vector */
      p1LeftPanel.appendChild(el('div', { className: 'sys-matrix-label sys-input-label', text: 'Input Vector I' }));

      var inputInputs = [null, null];
      var inputGrid   = el('div', { className: 'sys-input-grid' });

      [1, 2].forEach(function (val, i) {
        var inp = el('input', {
          type: 'number',
          className: 'sys-matrix-input sys-input-input',
          value: String(val),
          'aria-label': 'I' + i,
          step: 'any'
        });
        inputInputs[i] = inp;
        var wrap = el('div', { className: 'sys-matrix-cell-wrap' }, [
          el('span', { className: 'sys-cell-label sys-input-cell-label', text: 'I' + i }),
          inp
        ]);
        inputGrid.appendChild(wrap);
      });
      p1LeftPanel.appendChild(inputGrid);

      /* Step / Run buttons */
      var p1StepBtn = el('button', { type: 'button', className: 'sys-btn sys-step-btn', text: 'Step ▶' });
      var p1RunBtn  = el('button', { type: 'button', className: 'sys-btn sys-run-btn',  text: 'Run ▶▶' });
      var p1ResetBtn = el('button', { type: 'button', className: 'sys-btn sys-reset-btn', text: 'Reset' });

      p1LeftPanel.appendChild(el('div', { className: 'sys-btn-row' }, [p1StepBtn, p1RunBtn, p1ResetBtn]));

      /* Step counter display */
      var p1StepDisplay = el('div', { className: 'sys-step-display mono-num', text: 'Clock: 0 / 4' });
      p1LeftPanel.appendChild(p1StepDisplay);

      /* Source callout */
      p1LeftPanel.appendChild(el('div', { className: 'callout sys-callout' }, [
        el('p', { className: 'sys-quote',
          text: '"this matrix is going to stay fixed for a long period of time… ' +
                'store these numbers… in a gate called a register… reuse them over and over ' +
                'for a large number of different vectors."'
        }),
        el('p', { className: 'sys-quote',
          text: '"we feed in 0s at the top of a column, and coming out the bottom we get ' +
                'results… a dot product summed vertically."'
        })
      ]));

      ctx.left.appendChild(p1LeftPanel);

      /* ---------- Phase 2 left panel ---------- */
      var p2LeftPanel = el('div', { className: 'sys-phase-left', style: { display: 'none' } });

      p2LeftPanel.appendChild(el('p', { className: 'sys-desc',
        text: 'Weights load one row at a time, staggered by 1 clock cycle. ' +
              'This keeps register-file bandwidth linear in N, not N².'
      }));

      var p2ClockDisplay = el('div', { className: 'sys-step-display mono-num', text: 'Clock: 0 / 4' });
      p2LeftPanel.appendChild(p2ClockDisplay);

      var p2TickBtn  = el('button', { type: 'button', className: 'sys-btn sys-step-btn', text: 'Tick ▶' });
      var p2ResetBtn = el('button', { type: 'button', className: 'sys-btn sys-reset-btn', text: 'Reset' });
      p2LeftPanel.appendChild(el('div', { className: 'sys-btn-row' }, [p2TickBtn, p2ResetBtn]));

      p2LeftPanel.appendChild(el('div', { className: 'callout insight sys-callout' }, [
        el('p', { className: 'sys-quote',
          text: '"we just do it very slowly… daisy chain: feed a number in here, and on the next ' +
                'clock cycle it moves down… keeps the wiring… down to a factor of x rather than xy."'
        })
      ]));

      p2LeftPanel.appendChild(el('p', { className: 'sys-annotation sys-bw-annotation',
        text: 'Bandwidth from register file: only N values per clock, not N².'
      }));

      p2LeftPanel.appendChild(el('div', { className: 'callout sys-callout' }, [
        el('p', { className: 'sys-quote',
          text: '"older TPUs were described as 128×128 of this circuit… the most efficient known ' +
                'circuit for implementing a matrix multiply."'
        })
      ]));

      ctx.left.appendChild(p2LeftPanel);

      /* ---------- Phase 3 left panel ---------- */
      var p3LeftPanel = el('div', { className: 'sys-phase-left', style: { display: 'none' } });

      p3LeftPanel.appendChild(el('p', { className: 'sys-desc',
        text: 'As N grows, compute scales as N² but register-file bandwidth stays N. ' +
              'Bigger arrays are more efficient.'
      }));

      var p3SliderLabel = el('span', { className: 'sys-slider-label mono-num', text: 'N = 2' });
      var p3Slider = el('input', {
        type: 'range',
        className: 'sys-slider',
        min: '0', max: '2', step: '1', value: '0',
        'aria-label': 'Systolic array size N'
      });

      p3LeftPanel.appendChild(el('div', { className: 'sys-slider-wrap' }, [
        el('span', { className: 'sys-slider-title', text: 'Array size: ' }),
        p3SliderLabel,
        p3Slider,
        el('div', { className: 'sys-slider-ticks' }, [
          el('span', { className: 'mono-num sys-tick', text: '2' }),
          el('span', { className: 'mono-num sys-tick', text: '4' }),
          el('span', { className: 'mono-num sys-tick', text: '8' })
        ])
      ]));

      var p3ComputeLabel = el('div', { className: 'sys-stat-row' }, [
        el('span', { className: 'sys-stat-label', text: 'Compute: N² MACs =' }),
        el('span', { className: 'sys-stat-val mono-num sys-compute-val', text: '4' })
      ]);
      var p3BwLabel = el('div', { className: 'sys-stat-row' }, [
        el('span', { className: 'sys-stat-label', text: 'Reg-file bandwidth: N values/clock =' }),
        el('span', { className: 'sys-stat-val mono-num sys-bw-val', text: '2' })
      ]);
      p3LeftPanel.appendChild(p3ComputeLabel);
      p3LeftPanel.appendChild(p3BwLabel);

      p3LeftPanel.appendChild(el('div', { className: 'callout insight sys-callout' }, [
        el('p', { className: 'sys-insight-text',
          text: 'As N grows, compute scales as N² but bandwidth stays N. Bigger arrays are more efficient.'
        })
      ]));

      p3LeftPanel.appendChild(el('div', { className: 'callout sys-callout' }, [
        el('p', { className: 'sys-quote',
          text: '"set a budget for what percentage of chip area you want to spend on data movement… ' +
                '10%… and the systolic array 90%."'
        })
      ]));

      ctx.left.appendChild(p3LeftPanel);

      /* ============================================================
         COLOR LEGEND (bottom of left column)
         ============================================================ */
      ctx.left.appendChild(el('div', { className: 'sys-legend' }, [
        el('div', { className: 'sys-legend-row' }, [
          el('span', { className: 'sys-legend-swatch sys-swatch-weight' }),
          el('span', { className: 'sys-legend-label', text: 'Weight loading' })
        ]),
        el('div', { className: 'sys-legend-row' }, [
          el('span', { className: 'sys-legend-swatch sys-swatch-input' }),
          el('span', { className: 'sys-legend-label', text: 'Input streaming' })
        ]),
        el('div', { className: 'sys-legend-row' }, [
          el('span', { className: 'sys-legend-swatch sys-swatch-output' }),
          el('span', { className: 'sys-legend-label', text: 'Output collecting' })
        ])
      ]));

      /* ============================================================
         RIGHT COLUMN (stage) — phase panels
         ============================================================ */

      /* ---------- Phase 1 SVG stage ---------- */
      var p1Stage = el('div', { className: 'sys-stage-panel' });

      /* SVG elements we need to update */
      var p1WeightTexts = [[null, null], [null, null]];
      var p1PartialTexts = [[null, null], [null, null]];
      var p1InputLabels  = [null, null];
      var p1OutputLabels = [null, null];
      var p1InputLines   = [null, null];
      var p1OutputLines  = [null, null];

      var p1Svg = svg('svg', {
        viewBox: '0 0 380 320',
        'aria-label': '2×2 systolic array diagram',
        role: 'img',
        preserveAspectRatio: 'xMidYMid meet',
        class: 'sys-svg'
      });

      /* Draw input arrows and labels (rows 0 and 1) */
      for (var row = 0; row < 2; row++) {
        var cy = cellCY(row);
        /* Horizontal arrow line from x=10 to cell left edge (60 - cellSize/2 = 25) */
        var arrowLine = svg('line', {
          x1: '10', y1: String(cy),
          x2: String(cellCX(0) - CELL_SIZE / 2), y2: String(cy),
          stroke: 'var(--accent)',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          class: 'sys-input-arrow'
        });
        p1Svg.appendChild(arrowLine);
        p1InputLines[row] = arrowLine;

        /* Arrow head */
        var ax = cellCX(0) - CELL_SIZE / 2;
        p1Svg.appendChild(svg('polygon', {
          points: ax + ',' + cy + ' ' + (ax - 8) + ',' + (cy - 5) + ' ' + (ax - 8) + ',' + (cy + 5),
          fill: 'var(--accent)',
          class: 'sys-input-arrowhead'
        }));

        /* Input label */
        var iLabel = svg('text', {
          x: '12', y: String(cy - 6),
          'font-family': 'var(--font-mono)',
          'font-size': '11',
          fill: 'var(--accent)',
          class: 'sys-input-label',
          text: 'I' + row + ' = 0'
        });
        p1Svg.appendChild(iLabel);
        p1InputLabels[row] = iLabel;
      }

      /* Draw 2×2 MAC cells */
      for (var r = 0; r < 2; r++) {
        for (var c = 0; c < 2; c++) {
          var cx = cellCX(c);
          var cy2 = cellCY(r);

          /* Cell rect */
          p1Svg.appendChild(svg('rect', {
            x: String(cx - CELL_SIZE / 2),
            y: String(cy2 - CELL_SIZE / 2),
            width: String(CELL_SIZE),
            height: String(CELL_SIZE),
            rx: '6',
            fill: 'var(--surface)',
            stroke: 'var(--accent-2)',
            'stroke-width': '1.5',
            class: 'sys-cell-rect'
          }));

          /* MAC label */
          p1Svg.appendChild(svg('text', {
            x: String(cx),
            y: String(cy2 - 14),
            'text-anchor': 'middle',
            'font-family': 'var(--font-mono)',
            'font-size': '9',
            fill: 'var(--text-muted)',
            text: 'MAC'
          }));

          /* Weight text */
          var wTxt = svg('text', {
            x: String(cx),
            y: String(cy2 + 2),
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-family': 'var(--font-mono)',
            'font-size': '14',
            'font-weight': '700',
            fill: 'var(--accent-2)',
            class: 'sys-weight-text',
            text: 'W' + r + c
          });
          p1Svg.appendChild(wTxt);
          p1WeightTexts[r][c] = wTxt;

          /* Weight subscript label */
          p1Svg.appendChild(svg('text', {
            x: String(cx),
            y: String(cy2 + 18),
            'text-anchor': 'middle',
            'font-family': 'var(--font-mono)',
            'font-size': '9',
            fill: 'var(--accent-2)',
            text: 'W' + r + c
          }));

          /* Partial sum below cell */
          var pTxt = svg('text', {
            x: String(cx),
            y: String(cy2 + CELL_SIZE / 2 + 16),
            'text-anchor': 'middle',
            'font-family': 'var(--font-mono)',
            'font-size': '11',
            fill: 'var(--highlight)',
            class: 'sys-partial-text',
            text: 'Σ=0'
          });
          p1Svg.appendChild(pTxt);
          p1PartialTexts[r][c] = pTxt;

          /* Horizontal pass-through arrow for col 0 → col 1 (row=r) */
          if (c === 0) {
            var x1pass = cx + CELL_SIZE / 2;
            var x2pass = cellCX(1) - CELL_SIZE / 2;
            var passLine = svg('line', {
              x1: String(x1pass), y1: String(cy2),
              x2: String(x2pass), y2: String(cy2),
              stroke: 'var(--accent)',
              'stroke-width': '1.5',
              'stroke-dasharray': '4 3',
              'stroke-linecap': 'round',
              class: 'sys-pass-line'
            });
            p1Svg.appendChild(passLine);
          }
        }
      }

      /* Output arrows (bottom of columns) */
      for (var col = 0; col < 2; col++) {
        var ox = cellCX(col);
        var oy1 = cellCY(1) + CELL_SIZE / 2 + 20;
        var oy2 = oy1 + 24;

        var outLine = svg('line', {
          x1: String(ox), y1: String(oy1),
          x2: String(ox), y2: String(oy2),
          stroke: 'var(--highlight)',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          class: 'sys-output-arrow'
        });
        p1Svg.appendChild(outLine);
        p1OutputLines[col] = outLine;

        /* Arrow head pointing down */
        p1Svg.appendChild(svg('polygon', {
          points: ox + ',' + oy2 + ' ' + (ox - 5) + ',' + (oy2 - 7) + ' ' + (ox + 5) + ',' + (oy2 - 7),
          fill: 'var(--highlight)'
        }));

        var oLabel = svg('text', {
          x: String(ox),
          y: String(oy2 + 14),
          'text-anchor': 'middle',
          'font-family': 'var(--font-mono)',
          'font-size': '11',
          fill: 'var(--highlight)',
          class: 'sys-output-label',
          text: 'Out' + col + '=0'
        });
        p1Svg.appendChild(oLabel);
        p1OutputLabels[col] = oLabel;
      }

      /* Annotation text */
      p1Svg.appendChild(svg('text', {
        x: '190', y: '312',
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)',
        'font-size': '9',
        fill: 'var(--text-muted)',
        'font-style': 'italic',
        text: 'Each cell is one MAC unit. The weight stays fixed. Only the input moves.'
      }));

      p1Stage.appendChild(p1Svg);
      ctx.stage.appendChild(p1Stage);

      /* ---------- Phase 2 SVG stage ---------- */
      var p2Stage = el('div', { className: 'sys-stage-panel', style: { display: 'none' } });

      /* bandwidth bar */
      var p2BwBar = el('div', { className: 'sys-bw-bar-wrap' }, [
        el('div', { className: 'sys-bw-bar-label',
          text: 'Bandwidth: N = 2 values/clock (not N² = 4)' }),
        el('div', { className: 'sys-bw-bar-track' }, [
          el('div', { className: 'sys-bw-bar-fill', id: 'sys-bw-fill' })
        ])
      ]);
      p2Stage.appendChild(p2BwBar);

      var p2WeightCellTexts = [[null, null], [null, null]];

      /* weight feed-in lines (from top) */
      var p2FeedLines = [null, null];

      var p2Svg = svg('svg', {
        viewBox: '0 0 380 280',
        'aria-label': '2×2 systolic array trickle-load diagram',
        role: 'img',
        preserveAspectRatio: 'xMidYMid meet',
        class: 'sys-svg'
      });

      /* Weight feed-in dashed arrows (from top of each column) */
      for (var fc = 0; fc < 2; fc++) {
        var fcx = cellCX(fc);
        var feedLine = svg('line', {
          x1: String(fcx), y1: '5',
          x2: String(fcx), y2: String(cellCY(0) - CELL_SIZE / 2),
          stroke: 'var(--accent-2)',
          'stroke-width': '2',
          'stroke-dasharray': '5 3',
          'stroke-linecap': 'round',
          class: 'sys-feed-line'
        });
        p2Svg.appendChild(feedLine);
        p2FeedLines[fc] = feedLine;

        /* Arrow head */
        var fay = cellCY(0) - CELL_SIZE / 2;
        p2Svg.appendChild(svg('polygon', {
          points: fcx + ',' + fay + ' ' + (fcx - 5) + ',' + (fay - 7) + ' ' + (fcx + 5) + ',' + (fay - 7),
          fill: 'var(--accent-2)'
        }));

        p2Svg.appendChild(svg('text', {
          x: String(fcx),
          y: '14',
          'text-anchor': 'middle',
          'font-family': 'var(--font-mono)',
          'font-size': '9',
          fill: 'var(--accent-2)',
          text: 'Weight feed'
        }));
      }

      /* 2×2 cells for Phase 2 */
      for (var p2r = 0; p2r < 2; p2r++) {
        for (var p2c = 0; p2c < 2; p2c++) {
          var p2cx = cellCX(p2c);
          var p2cy = cellCY(p2r);

          p2Svg.appendChild(svg('rect', {
            x: String(p2cx - CELL_SIZE / 2),
            y: String(p2cy - CELL_SIZE / 2),
            width: String(CELL_SIZE),
            height: String(CELL_SIZE),
            rx: '6',
            fill: 'var(--surface)',
            stroke: 'var(--accent-2)',
            'stroke-width': '1.5',
            class: 'sys-cell-rect'
          }));

          var p2wTxt = svg('text', {
            x: String(p2cx),
            y: String(p2cy + 6),
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-family': 'var(--font-mono)',
            'font-size': '18',
            'font-weight': '700',
            fill: 'var(--text-muted)',
            class: 'sys-p2-weight-text',
            text: '?'
          });
          p2Svg.appendChild(p2wTxt);
          p2WeightCellTexts[p2r][p2c] = p2wTxt;

          /* Row / col label */
          p2Svg.appendChild(svg('text', {
            x: String(p2cx - CELL_SIZE / 2 + 5),
            y: String(p2cy - CELL_SIZE / 2 + 13),
            'font-family': 'var(--font-mono)',
            'font-size': '8',
            fill: 'var(--text-muted)',
            text: 'W' + p2r + p2c
          }));
        }
      }

      /* Vertical inter-cell arrows (col 0: row0→row1, col 1: row0→row1) */
      for (var vc = 0; vc < 2; vc++) {
        var vcx = cellCX(vc);
        var vy1 = cellCY(0) + CELL_SIZE / 2;
        var vy2 = cellCY(1) - CELL_SIZE / 2;
        p2Svg.appendChild(svg('line', {
          x1: String(vcx), y1: String(vy1),
          x2: String(vcx), y2: String(vy2),
          stroke: 'var(--accent-2)',
          'stroke-width': '1.5',
          'stroke-dasharray': '4 3',
          'stroke-linecap': 'round'
        }));
        p2Svg.appendChild(svg('polygon', {
          points: vcx + ',' + vy2 + ' ' + (vcx - 4) + ',' + (vy2 - 6) + ' ' + (vcx + 4) + ',' + (vy2 - 6),
          fill: 'var(--accent-2)'
        }));
      }

      /* Annotation */
      p2Svg.appendChild(svg('text', {
        x: '190', y: '275',
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)',
        'font-size': '9',
        fill: 'var(--text-muted)',
        'font-style': 'italic',
        text: 'Staggered loading: only N values move per clock cycle.'
      }));

      p2Stage.appendChild(p2Svg);
      ctx.stage.appendChild(p2Stage);

      /* ---------- Phase 3 SVG stage (bar chart) ---------- */
      var p3Stage = el('div', { className: 'sys-stage-panel', style: { display: 'none' } });

      var p3Svg = svg('svg', {
        viewBox: '0 0 380 280',
        'aria-label': 'Efficiency scaling chart',
        role: 'img',
        preserveAspectRatio: 'xMidYMid meet',
        class: 'sys-svg'
      });

      /* Chart constants */
      var CHART_L = 50, CHART_T = 20, CHART_W = 300, CHART_H = 200;
      var CHART_B = CHART_T + CHART_H;

      /* Axes */
      p3Svg.appendChild(svg('line', {
        x1: String(CHART_L), y1: String(CHART_T),
        x2: String(CHART_L), y2: String(CHART_B),
        stroke: 'var(--grid)', 'stroke-width': '1.5'
      }));
      p3Svg.appendChild(svg('line', {
        x1: String(CHART_L), y1: String(CHART_B),
        x2: String(CHART_L + CHART_W), y2: String(CHART_B),
        stroke: 'var(--grid)', 'stroke-width': '1.5'
      }));

      /* Y axis label */
      p3Svg.appendChild(svg('text', {
        x: '10', y: String(CHART_T + CHART_H / 2),
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        transform: 'rotate(-90, 10, ' + (CHART_T + CHART_H / 2) + ')',
        'font-family': 'var(--font-mono)',
        'font-size': '9',
        fill: 'var(--text-muted)',
        text: 'Count'
      }));

      /* Title */
      p3Svg.appendChild(svg('text', {
        x: String(CHART_L + CHART_W / 2), y: String(CHART_T - 8),
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)',
        'font-size': '10',
        fill: 'var(--text-muted)',
        text: 'Compute (N²) vs Bandwidth (N) per array size'
      }));

      /* Bar chart groups: N=2, N=4, N=8 */
      var barNs = [2, 4, 8];
      var barGroupW = CHART_W / barNs.length;
      var barW = barGroupW * 0.3;
      var barGap = barGroupW * 0.06;

      /* We store rect elements to update heights later */
      var p3ComputeBars = [];
      var p3BwBars = [];
      var p3ComputeValTexts = [];
      var p3BwValTexts = [];

      /* Max compute for scale: 8² = 64 */
      var p3MaxVal = 64;

      barNs.forEach(function (n, i) {
        var groupCX = CHART_L + (i + 0.5) * barGroupW;
        var computeVal = n * n;
        var bwVal = n;

        /* Compute bar (--accent-2) */
        var compH = (computeVal / p3MaxVal) * CHART_H;
        var compRect = svg('rect', {
          x: String(groupCX - barW - barGap / 2),
          y: String(CHART_B - compH),
          width: String(barW),
          height: String(compH),
          rx: '3',
          fill: 'var(--accent-2)',
          class: 'sys-bar-compute'
        });
        p3Svg.appendChild(compRect);
        p3ComputeBars.push(compRect);

        /* Compute value */
        var compValTxt = svg('text', {
          x: String(groupCX - barW / 2 - barGap / 2),
          y: String(CHART_B - compH - 4),
          'text-anchor': 'middle',
          'font-family': 'var(--font-mono)',
          'font-size': '10',
          'font-weight': '700',
          fill: 'var(--accent-2)',
          text: String(computeVal)
        });
        p3Svg.appendChild(compValTxt);
        p3ComputeValTexts.push(compValTxt);

        /* Bandwidth bar (--accent) */
        var bwH = (bwVal / p3MaxVal) * CHART_H;
        var bwRect = svg('rect', {
          x: String(groupCX + barGap / 2),
          y: String(CHART_B - bwH),
          width: String(barW),
          height: String(bwH),
          rx: '3',
          fill: 'var(--accent)',
          class: 'sys-bar-bw'
        });
        p3Svg.appendChild(bwRect);
        p3BwBars.push(bwRect);

        /* BW value */
        var bwValTxt = svg('text', {
          x: String(groupCX + barW / 2 + barGap / 2),
          y: String(CHART_B - bwH - 4),
          'text-anchor': 'middle',
          'font-family': 'var(--font-mono)',
          'font-size': '10',
          'font-weight': '700',
          fill: 'var(--accent)',
          text: String(bwVal)
        });
        p3Svg.appendChild(bwValTxt);
        p3BwValTexts.push(bwValTxt);

        /* N label */
        p3Svg.appendChild(svg('text', {
          x: String(groupCX),
          y: String(CHART_B + 14),
          'text-anchor': 'middle',
          'font-family': 'var(--font-mono)',
          'font-size': '11',
          fill: 'var(--text)',
          text: 'N=' + n
        }));
      });

      /* Chart legend */
      p3Svg.appendChild(svg('rect', { x: '188', y: '238', width: '12', height: '10', rx: '2',
        fill: 'var(--accent-2)' }));
      p3Svg.appendChild(svg('text', { x: '204', y: '247',
        'font-family': 'var(--font-mono)', 'font-size': '9', fill: 'var(--accent-2)',
        text: 'N² compute' }));
      p3Svg.appendChild(svg('rect', { x: '188', y: '254', width: '12', height: '10', rx: '2',
        fill: 'var(--accent)' }));
      p3Svg.appendChild(svg('text', { x: '204', y: '263',
        'font-family': 'var(--font-mono)', 'font-size': '9', fill: 'var(--accent)',
        text: 'N bandwidth' }));

      /* Annotation */
      p3Svg.appendChild(svg('text', {
        x: '190', y: '276',
        'text-anchor': 'middle',
        'font-family': 'var(--font-mono)',
        'font-size': '9',
        fill: 'var(--text-muted)',
        'font-style': 'italic',
        text: 'This is why bigger systolic arrays are more efficient.'
      }));

      p3Stage.appendChild(p3Svg);
      ctx.stage.appendChild(p3Stage);

      /* ============================================================
         PHASE SWITCHING
         ============================================================ */

      var leftPanels  = [p1LeftPanel, p2LeftPanel, p3LeftPanel];
      var stagePanels = [p1Stage, p2Stage, p3Stage];

      function showPhase(phase) {
        var prevPhase = activePhase;
        if (prevPhase === 1 && phase !== 1) {
          p1StopTimer();
          p1UpdateBtnState();
        }
        activePhase = phase;
        tabBtns.forEach(function (btn, i) {
          btn.dataset.active = (i + 1 === phase) ? '1' : '0';
        });
        leftPanels.forEach(function (panel, i) {
          panel.style.display = (i + 1 === phase) ? '' : 'none';
        });
        stagePanels.forEach(function (panel, i) {
          panel.style.display = (i + 1 === phase) ? '' : 'none';
        });
      }

      /* ============================================================
         PHASE 1 — ANIMATION LOGIC
         ============================================================ */

      function getWeights() {
        return [
          [parseNum(weightInputs[0][0].value), parseNum(weightInputs[0][1].value)],
          [parseNum(weightInputs[1][0].value), parseNum(weightInputs[1][1].value)]
        ];
      }

      function getInputs() {
        return [parseNum(inputInputs[0].value), parseNum(inputInputs[1].value)];
      }

      function p1Reset(updateDisplay) {
        p1Step = 0;
        p1Partials = [[0, 0], [0, 0]];
        p1Outputs  = [0, 0];
        if (updateDisplay !== false) {
          p1UpdateDisplay();
        }
      }

      function p1UpdateDisplay() {
        var W = getWeights();
        var I = getInputs();

        /* Update weight texts */
        p1WeightTexts[0][0].textContent = fmtNum(W[0][0]);
        p1WeightTexts[0][1].textContent = fmtNum(W[0][1]);
        p1WeightTexts[1][0].textContent = fmtNum(W[1][0]);
        p1WeightTexts[1][1].textContent = fmtNum(W[1][1]);

        /* Step display */
        p1StepDisplay.textContent = 'Clock: ' + p1Step + ' / 4';

        /* Input labels */
        p1InputLabels[0].textContent = 'I0 = ' + fmtNum(I[0]);
        p1InputLabels[1].textContent = 'I1 = ' + fmtNum(I[1]);

        /* Partial sums */
        p1PartialTexts[0][0].textContent = 'Σ=' + fmtNum(p1Partials[0][0]);
        p1PartialTexts[0][1].textContent = 'Σ=' + fmtNum(p1Partials[0][1]);
        p1PartialTexts[1][0].textContent = 'Σ=' + fmtNum(p1Partials[1][0]);
        p1PartialTexts[1][1].textContent = 'Σ=' + fmtNum(p1Partials[1][1]);

        /* Outputs */
        p1OutputLabels[0].textContent = 'Out0=' + fmtNum(p1Outputs[0]);
        p1OutputLabels[1].textContent = 'Out1=' + fmtNum(p1Outputs[1]);
      }

      /*
        Clock cycle semantics for 2×2 array:
        Step 0: reset, show initial
        Step 1: cell(0,0): accum I0 * W00; partial[0][0] += I0*W00
        Step 2: cell(0,1): accum I0 * W01; partial[0][1] += I0*W01
                cell(1,0): accum I1 * W10; partial[1][0] += I1*W10
        Step 3: cell(1,1): accum I1 * W11; partial[1][1] += I1*W11
        Step 4: collect outputs:
                Out[0] = partial[0][0] + partial[1][0] = I0*W00 + I1*W10
                Out[1] = partial[0][1] + partial[1][1] = I0*W01 + I1*W11
      */
      function p1DoStep() {
        var W = getWeights();
        var I = getInputs();

        if (p1Step >= 4) return;
        p1Step++;

        if (p1Step === 1) {
          p1Partials[0][0] += I[0] * W[0][0];
          if (!reduced) { ChipViz.pulse(p1InputLines[0], 'var(--accent)'); }
        } else if (p1Step === 2) {
          p1Partials[0][1] += I[0] * W[0][1];
          p1Partials[1][0] += I[1] * W[1][0];
          if (!reduced) {
            ChipViz.pulse(p1InputLines[1], 'var(--accent)');
          }
        } else if (p1Step === 3) {
          p1Partials[1][1] += I[1] * W[1][1];
        } else if (p1Step === 4) {
          p1Outputs[0] = p1Partials[0][0] + p1Partials[1][0];
          p1Outputs[1] = p1Partials[0][1] + p1Partials[1][1];
          if (!reduced) {
            ChipViz.pulse(p1OutputLines[0], 'var(--highlight)');
            ChipViz.pulse(p1OutputLines[1], 'var(--highlight)');
          }
        }

        p1UpdateDisplay();
      }

      function p1StopTimer() {
        if (p1Timer !== null) {
          clearInterval(p1Timer);
          p1Timer = null;
        }
      }

      p1StepBtn.addEventListener('click', function () {
        p1StopTimer();
        if (reduced) {
          /* complete instantly */
          while (p1Step < 4) { p1DoStep(); }
        } else {
          p1DoStep();
        }
        p1UpdateBtnState();
      });

      p1RunBtn.addEventListener('click', function () {
        p1StopTimer();
        if (reduced) {
          while (p1Step < 4) { p1DoStep(); }
          p1UpdateBtnState();
          return;
        }
        p1RunBtn.disabled = true;
        p1StepBtn.disabled = true;
        p1Timer = setInterval(function () {
          if (p1Step >= 4) {
            p1StopTimer();
            p1UpdateBtnState();
            return;
          }
          p1DoStep();
        }, 600);
      });

      p1ResetBtn.addEventListener('click', function () {
        p1StopTimer();
        p1Reset();
        p1UpdateBtnState();
      });

      function p1UpdateBtnState() {
        var done = p1Step >= 4;
        p1RunBtn.disabled  = done || p1Timer !== null;
        p1StepBtn.disabled = done || p1Timer !== null;
      }

      /* Re-render when weight or input values change */
      function onInputChange() {
        p1StopTimer();
        p1Reset();
        p1UpdateBtnState();
      }

      for (var wi = 0; wi < 2; wi++) {
        for (var wj = 0; wj < 2; wj++) {
          weightInputs[wi][wj].addEventListener('input', onInputChange);
        }
        inputInputs[wi].addEventListener('input', onInputChange);
      }

      /* ============================================================
         PHASE 2 — TRICKLE-LOAD LOGIC
         ============================================================ */

      /*
        Phase 2 weight loading schedule:
        Clock 0: all cells show "?"  (nothing loaded)
        Clock 1: col0 feed active; W00, W01 traveling (show "▼" at top)
        Clock 2: W00 arrives at cell(0,0); W01 arrives at cell(0,1);
                 W10, W11 start loading (show "▼" in col0)
        Clock 3: W10 arrives at cell(1,0); W11 starts its second hop
        Clock 4: W11 arrives at cell(1,1). All weights loaded.
      */
      var p2Schedule = [
        /* clock 0 */ [['?','?'],['?','?']],
        /* clock 1 */ [['…','…'],['?','?']],
        /* clock 2 */ [['W00','W01'],['…','…']],
        /* clock 3 */ [['W00','W01'],['W10','…']],
        /* clock 4 */ [['W00','W01'],['W10','W11']]
      ];

      function p2UpdateDisplay() {
        p2ClockDisplay.textContent = 'Clock: ' + p2Clock + ' / 4';
        var state = p2Schedule[p2Clock];
        for (var pr = 0; pr < 2; pr++) {
          for (var pc = 0; pc < 2; pc++) {
            var txt = state[pr][pc];
            var el2 = p2WeightCellTexts[pr][pc];
            var isLoaded = (txt !== '?' && txt !== '…');
            el2.textContent = txt;
            el2.setAttribute('fill', isLoaded ? 'var(--accent-2)' : 'var(--text-muted)');
            el2.setAttribute('font-size', isLoaded ? '14' : '18');
          }
        }
        /* Pulse feed lines when loading */
        if (p2Clock > 0 && p2Clock < 4 && !reduced) {
          ChipViz.pulse(p2FeedLines[0], 'var(--accent-2)');
          if (p2Clock > 1) {
            ChipViz.pulse(p2FeedLines[1], 'var(--accent-2)');
          }
        }
      }

      p2TickBtn.addEventListener('click', function () {
        if (p2Clock < 4) {
          p2Clock++;
          p2UpdateDisplay();
        }
        p2TickBtn.disabled = p2Clock >= 4;
      });

      p2ResetBtn.addEventListener('click', function () {
        p2Clock = 0;
        p2TickBtn.disabled = false;
        p2UpdateDisplay();
      });

      /* ============================================================
         PHASE 3 — SCALING LOGIC
         ============================================================ */

      var p3NSizes = [2, 4, 8];

      var p3ComputeSpan = p3ComputeLabel.querySelector('.sys-compute-val');
      var p3BwSpan      = p3BwLabel.querySelector('.sys-bw-val');

      function p3UpdateDisplay() {
        var n = p3N;
        p3SliderLabel.textContent = 'N = ' + n;
        p3ComputeSpan.textContent = String(n * n);
        p3BwSpan.textContent = String(n);

        /* Highlight active column bars */
        barNs.forEach(function (bn, i) {
          var active = (bn === n);
          p3ComputeBars[i].setAttribute('opacity', active ? '1' : '0.4');
          p3BwBars[i].setAttribute('opacity', active ? '1' : '0.4');
        });
      }

      p3Slider.addEventListener('input', function () {
        var idx = parseInt(p3Slider.value, 10);
        p3N = p3NSizes[idx];
        p3UpdateDisplay();
      });

      /* ============================================================
         INITIAL RENDER
         ============================================================ */
      showPhase(1);
      p1Reset();
      p1UpdateDisplay();
      p1UpdateBtnState();
      p2UpdateDisplay();
      p3UpdateDisplay();
    }
  });
})();
