/* ============================================================
   10-gputpu.js  —  Agent C lane. GPU vs TPU: Architecture Comparison.
   Source: "the GPU is mostly a bunch of almost-identical units,
            which are the SMs… a fairly regular grid of cores."
           "a TPU… just a few matrix units… a vector unit in the middle."
           "the GPU has a lot of tiny TPUs tiled across the whole chip."
           bandwidth: "you need to move a lot of data from the vector
            unit to the matrix units, through just two lines of perimeter…
            in a GPU… 16 lines of wiring."
           branch predictor: "the thing that does not have an equivalent
            in a GPU is the branch predictor."
   ============================================================ */
ChipViz.register({
  id: 'gputpu',
  order: 10,
  title: 'GPU vs TPU: Architecture Comparison',
  subtitle: 'Flexible parallelism vs. extreme matrix throughput — and the perimeter bandwidth constraint.',

  build: function (ctx) {
    var el = ChipViz.el, sv = ChipViz.svg;
    var rm = ChipViz.prefersReducedMotion();

    /* ── LEFT: explanation + workload slider ── */
    ctx.left.appendChild(el('p', {
      text: 'The GPU is mostly a bunch of almost-identical units — the SMs — arranged ' +
            'in a fairly regular grid of cores. The GPU has a lot of tiny TPUs tiled across the whole chip.'
    }));

    ctx.left.appendChild(el('p', {
      text: 'A TPU has just a few large matrix units and a vector unit in the middle. ' +
            'Moving data from the vector unit to the matrix units goes through just 2 lines of perimeter. ' +
            'A GPU uses 16 lines of wiring for that.'
    }));

    ctx.left.appendChild(el('div', { className: 'callout warn', style: { marginTop: '1rem' },
      html: '<strong>Perimeter-bandwidth constraint:</strong> The more wiring you need across the chip edge, ' +
            'the more chip area is consumed by routing. TPU concentrates all data into 2 lanes — ' +
            'highly efficient for huge matrix multiplies, but inflexible for irregular workloads.' }));

    ctx.left.appendChild(el('div', { className: 'callout', style: { marginTop: '1rem' },
      html: '<strong>Branch predictor:</strong> A GPU has no equivalent — its SMs handle branching ' +
            'differently (warp divergence). The branch predictor is a CPU/TPU scalar-core concept.' }));

    /* workload slider */
    var wlSlider = el('input', {
      type: 'range', min: '0', max: '100', value: '50',
      className: 'cv-slider',
      'aria-label': 'Workload type: 0 = irregular mixed, 100 = huge matrix multiply'
    });
    var wlLabel = el('div', { className: 'cv-slider-label mono-num' });
    var wlInsight = el('div', { className: 'callout insight', style: { marginTop: '0.5rem' } });

    ctx.left.appendChild(el('div', { className: 'panel', style: { marginTop: '1rem' } }, [
      el('label', { text: 'Workload type:' }),
      wlSlider,
      wlLabel,
      wlInsight
    ]));

    /* click detail readout */
    var detailBox = el('div', { className: 'panel', style: { marginTop: '1rem', display: 'none' } });
    ctx.left.appendChild(detailBox);

    /* ── STAGE: split GPU | TPU schematic ── */
    var W = 480, H = 380;
    var stage = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', 'aria-label': 'GPU vs TPU die comparison' });
    ctx.stage.appendChild(stage);

    /* bandwidth comparison bar */
    var bwWrap = el('div', { style: { marginTop: '1rem' } });
    ctx.stage.appendChild(bwWrap);
    var bwChart = ChipViz.barChart([
      { label: 'GPU lanes', value: 16, color: 'var(--accent)' },
      { label: 'TPU lanes', value: 2, color: 'var(--accent-2)' }
    ]);
    bwWrap.appendChild(el('div', { className: 'mono-num', style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' } },
      ['Perimeter wiring lanes (GPU: 16 vs TPU: 2):']));
    bwWrap.appendChild(bwChart.el);

    /* ── state ── */
    var workload = 50; /* 0 = mixed/irregular, 100 = huge matrix */
    var selected = null; /* 'gpu-sm-N' or 'tpu-mxu-N' */

    /* GPU: 16 SMs in a 4×4 grid */
    var GPU_SM_COUNT = 16;
    /* TPU: 2 large MXUs + 1 vector unit */
    var TPU_MXU_COUNT = 2;

    function gpuBrightness() {
      /* GPU shines more for mixed/irregular workloads (low workload value) */
      return 1 - workload / 100;
    }

    function tpuBrightness() {
      return workload / 100;
    }

    function smColor(brightness, isSelected) {
      if (isSelected) return 'var(--highlight)';
      var alpha = 0.2 + brightness * 0.8;
      return 'rgba(56,189,248,' + alpha.toFixed(2) + ')';
    }

    function mxuColor(brightness, isSelected) {
      if (isSelected) return 'var(--highlight)';
      var alpha = 0.2 + brightness * 0.8;
      return 'rgba(167,139,250,' + alpha.toFixed(2) + ')';
    }

    function render() {
      while (stage.firstChild) stage.removeChild(stage.firstChild);

      var gpuBr = gpuBrightness();
      var tpuBr = tpuBrightness();

      /* divider */
      stage.appendChild(sv('line', { x1: W / 2, y1: 0, x2: W / 2, y2: H,
        stroke: 'var(--grid)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));

      /* ── GPU half (left) ── */
      var gpuX = 10, gpuW = W / 2 - 20;

      /* GPU die outline */
      stage.appendChild(sv('rect', { x: gpuX, y: 28, width: gpuW, height: H - 60,
        rx: 8, fill: 'var(--surface-2)', stroke: 'var(--accent)', 'stroke-width': '2',
        opacity: 0.2 + gpuBr * 0.8 }));

      stage.appendChild(sv('text', { x: gpuX + gpuW / 2, y: 20,
        'text-anchor': 'middle', fill: 'var(--accent)',
        'font-family': 'var(--font-mono)', 'font-size': '13', text: 'GPU' }));

      /* 16 SMs in 4×4 */
      var smCols = 4, smRows = 4;
      var smW = (gpuW - 20) / smCols - 6, smH = (H - 80) / smRows - 6;
      for (var row = 0; row < smRows; row++) {
        for (var col = 0; col < smCols; col++) {
          var smIdx = row * smCols + col;
          var sx = gpuX + 10 + col * (smW + 6);
          var sy = 36 + row * (smH + 6);
          var isSel = selected === ('gpu-sm-' + smIdx);
          var smFill = smColor(gpuBr, isSel);
          var smStroke = isSel ? 'var(--highlight)' : 'var(--accent)';

          var smRect = (function (si, rx, ry, rw, rh) {
            var r = sv('rect', { x: rx, y: ry, width: rw, height: rh,
              rx: 4, fill: smFill, stroke: smStroke, 'stroke-width': isSel ? 2 : 1,
              cursor: 'pointer', style: 'cursor:pointer' });
            r.addEventListener('click', function () {
              selected = (selected === 'gpu-sm-' + si) ? null : 'gpu-sm-' + si;
              showDetail('GPU SM #' + si,
                'Streaming Multiprocessor (SM) — contains a mini tensor core, register file, ' +
                'warp scheduler, and branch-prediction logic. One of 16 SMs tiled across the die. ' +
                '"The GPU has a lot of tiny TPUs tiled across the whole chip."');
              render();
              ctx.pulseGrid();
            });
            return r;
          })(smIdx, sx, sy, smW, smH);
          stage.appendChild(smRect);

          /* mini label inside SM */
          stage.appendChild(sv('text', { x: sx + smW / 2, y: sy + smH / 2 - 3,
            'text-anchor': 'middle', fill: 'var(--text-muted)',
            'font-family': 'var(--font-mono)', 'font-size': '7', text: 'SM' }));
          stage.appendChild(sv('text', { x: sx + smW / 2, y: sy + smH / 2 + 7,
            'text-anchor': 'middle', fill: 'var(--text-muted)',
            'font-family': 'var(--font-mono)', 'font-size': '6', text: String(smIdx) }));
        }
      }

      /* GPU wiring lanes: 16 */
      var gpuLaneY = H - 28;
      for (var li = 0; li < 16; li++) {
        var lx = gpuX + 5 + li * (gpuW / 17);
        stage.appendChild(sv('line', { x1: lx, y1: gpuLaneY - 8, x2: lx, y2: gpuLaneY + 8,
          stroke: 'var(--accent)', 'stroke-width': '1.5', opacity: 0.6 + gpuBr * 0.4 }));
      }
      stage.appendChild(sv('text', { x: gpuX + gpuW / 2, y: H - 8,
        'text-anchor': 'middle', fill: 'var(--accent)',
        'font-family': 'var(--font-mono)', 'font-size': '9', text: '16 perimeter lanes' }));

      /* ── TPU half (right) ── */
      var tpuX = W / 2 + 10, tpuW = W / 2 - 20;

      stage.appendChild(sv('rect', { x: tpuX, y: 28, width: tpuW, height: H - 60,
        rx: 8, fill: 'var(--surface-2)', stroke: 'var(--accent-2)', 'stroke-width': '2',
        opacity: 0.2 + tpuBr * 0.8 }));

      stage.appendChild(sv('text', { x: tpuX + tpuW / 2, y: 20,
        'text-anchor': 'middle', fill: 'var(--accent-2)',
        'font-family': 'var(--font-mono)', 'font-size': '13', text: 'TPU' }));

      /* 2 large MXUs */
      var mxuH = (H - 120) / 3;
      for (var mi = 0; mi < TPU_MXU_COUNT; mi++) {
        var mx = tpuX + 14;
        var my = 36 + mi * (mxuH + 8);
        var mxW = tpuW - 28;
        var isMxuSel = selected === ('tpu-mxu-' + mi);
        var mxuFill = mxuColor(tpuBr, isMxuSel);
        var mxuStroke = isMxuSel ? 'var(--highlight)' : 'var(--accent-2)';

        var mxuRect = (function (mi2, rx2, ry2, rw2, rh2) {
          var r = sv('rect', { x: rx2, y: ry2, width: rw2, height: rh2,
            rx: 6, fill: mxuFill, stroke: mxuStroke, 'stroke-width': isMxuSel ? 2 : 1.5,
            cursor: 'pointer', style: 'cursor:pointer' });
          r.addEventListener('click', function () {
            selected = (selected === 'tpu-mxu-' + mi2) ? null : 'tpu-mxu-' + mi2;
            showDetail('TPU MXU #' + mi2,
              'Matrix Multiply Unit — a large systolic array. Data enters as a stream; ' +
              'weights are loaded once and reused. "Older TPUs were described as 128×128 of this circuit." ' +
              'All I/O passes through just 2 perimeter lanes (vs. 16 in a GPU).');
            render();
            ctx.pulseGrid();
          });
          return r;
        })(mi, mx, my, mxW, mxuH);
        stage.appendChild(mxuRect);

        stage.appendChild(sv('text', { x: mx + mxW / 2, y: my + mxuH / 2 - 5,
          'text-anchor': 'middle', fill: 'var(--text)',
          'font-family': 'var(--font-mono)', 'font-size': '11', text: 'MXU (Systolic Array)' }));
        stage.appendChild(sv('text', { x: mx + mxW / 2, y: my + mxuH / 2 + 10,
          'text-anchor': 'middle', fill: 'var(--text-muted)',
          'font-family': 'var(--font-mono)', 'font-size': '8', text: 'Matrix Unit ' + mi }));
      }

      /* Vector unit in the center */
      var vuY = 36 + TPU_MXU_COUNT * (mxuH + 8);
      var vuX = tpuX + 14, vuW = tpuW - 28;
      stage.appendChild(sv('rect', { x: vuX, y: vuY, width: vuW, height: mxuH * 0.8,
        rx: 5, fill: 'var(--surface)', stroke: 'var(--highlight)', 'stroke-width': '1.5' }));
      stage.appendChild(sv('text', { x: vuX + vuW / 2, y: vuY + mxuH * 0.4 - 3,
        'text-anchor': 'middle', fill: 'var(--highlight)',
        'font-family': 'var(--font-mono)', 'font-size': '10', text: 'Vector Unit' }));
      stage.appendChild(sv('text', { x: vuX + vuW / 2, y: vuY + mxuH * 0.4 + 11,
        'text-anchor': 'middle', fill: 'var(--text-muted)',
        'font-family': 'var(--font-mono)', 'font-size': '8', text: '(shared; central)' }));

      /* TPU wiring: 2 lanes */
      var tpuLaneY = H - 28;
      var lane1X = tpuX + tpuW / 3, lane2X = tpuX + 2 * tpuW / 3;
      stage.appendChild(sv('line', { x1: lane1X, y1: tpuLaneY - 10, x2: lane1X, y2: tpuLaneY + 10,
        stroke: 'var(--accent-2)', 'stroke-width': '2', opacity: 0.6 + tpuBr * 0.4 }));
      stage.appendChild(sv('line', { x1: lane2X, y1: tpuLaneY - 10, x2: lane2X, y2: tpuLaneY + 10,
        stroke: 'var(--accent-2)', 'stroke-width': '2', opacity: 0.6 + tpuBr * 0.4 }));
      stage.appendChild(sv('text', { x: tpuX + tpuW / 2, y: H - 8,
        'text-anchor': 'middle', fill: 'var(--accent-2)',
        'font-family': 'var(--font-mono)', 'font-size': '9', text: '2 perimeter lanes' }));

      /* animate a pulse if not reduced motion */
      if (!rm) {
        setTimeout(function () {
          var lines = stage.querySelectorAll('line');
          if (lines.length) ChipViz.pulse(lines[0], workload > 50 ? 'var(--accent-2)' : 'var(--accent)');
        }, 60);
      }
    }

    function showDetail(title, body) {
      if (!selected) {
        detailBox.style.display = 'none';
        return;
      }
      detailBox.style.display = '';
      detailBox.innerHTML = '<strong>' + title + '</strong><br>' + body;
    }

    wlSlider.addEventListener('input', function () {
      workload = parseInt(wlSlider.value, 10);
      updateWorkloadLabel();
      render();
      ctx.pulseGrid();
    });

    function updateWorkloadLabel() {
      wlLabel.textContent = workload < 30 ? 'Mixed / irregular (' + workload + ')'
        : workload > 70 ? 'Huge matrix multiply (' + workload + ')'
        : 'Balanced (' + workload + ')';
      wlInsight.textContent = workload >= 70
        ? 'TPU shines — giant systolic array amortizes register costs.'
        : workload <= 30
          ? 'GPU shines — many independent SMs, more routing flexibility.'
          : 'Balanced workload — both architectures perform comparably.';
    }

    updateWorkloadLabel();
    render();
    ctx.pulseGrid();
  }
});
