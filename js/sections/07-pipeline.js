/* ============================================================
   07-pipeline.js  —  Agent C lane. Clock Cycles & Pipelining.
   Source: "Every nanosecond or so… the clock cycle."
           "split it in the middle… twice the clock frequency… extra register."
           "pipeline register insertion… trade-off between clock speed and area."
           feedback: "running sum of the even numbers and a running sum of the odd numbers."
   ============================================================ */
ChipViz.register({
  id: 'pipeline',
  order: 7,
  title: 'Clock Cycles & Pipelining',
  subtitle: 'How timing constrains computation — and how to double your clock speed.',

  build: function (ctx) {
    var el = ChipViz.el, sv = ChipViz.svg;
    var rm = ChipViz.prefersReducedMotion();

    /* ── LEFT: controls + explanation ── */
    ctx.left.appendChild(el('p', {
      text: 'Every nanosecond or so, all circuitry in the chip will pause for a moment ' +
            'and synchronize. That is the clock cycle.'
    }));

    /* Part A: logic depth slider */
    var depthLabel = el('div', { className: 'cv-slider-label mono-num' });
    var freqDisplay = el('div', { className: 'callout', style: { marginTop: '0.5rem' } });

    var depthSlider = el('input', {
      type: 'range', min: '1', max: '8', value: '4',
      className: 'cv-slider',
      'aria-label': 'Logic depth (gate stages in critical path)'
    });

    ctx.left.appendChild(el('div', { className: 'panel', style: { marginTop: '1rem' } }, [
      el('label', { text: 'Logic depth (gate stages):' }),
      depthSlider,
      depthLabel,
      freqDisplay
    ]));

    /* Part B: pipeline toggle */
    var pipeBtn = el('button', {
      type: 'button',
      className: 'cv-btn',
      text: 'Insert pipeline register',
      'aria-pressed': 'false'
    });
    var pipeLabel = el('div', { className: 'callout insight', style: { marginTop: '0.5rem' } });

    ctx.left.appendChild(el('div', { style: { marginTop: '1rem' } }, [pipeBtn, pipeLabel]));

    ctx.left.appendChild(el('div', { className: 'callout', style: { marginTop: '1rem' },
      html: '<strong>Pipeline register insertion</strong> — a pure trade-off between clock speed and area.' +
            ' Split the critical path in the middle: frequency doubles, but area rises (one extra register).' }));

    /* Part C: feedback toggle */
    var feedbackBtn = el('button', {
      type: 'button',
      className: 'cv-btn',
      style: { marginTop: '1rem' },
      text: 'Enable feedback (running sum)',
      'aria-pressed': 'false'
    });
    var feedbackWarn = el('div', {
      className: 'callout warn',
      style: { marginTop: '0.5rem', display: 'none' },
      html: '<strong>Feedback breaks pipelining.</strong> Adding a pipeline register in the middle ' +
            'splits the loop: you get a running sum of the even numbers and a running sum of the ' +
            'odd numbers — not one correct result.'
    });

    ctx.left.appendChild(feedbackBtn);
    ctx.left.appendChild(feedbackWarn);

    /* ── STAGE: SVG pipeline diagram ── */
    var W = 480, H = 280;
    var stage = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', 'aria-label': 'Pipeline diagram' });
    ctx.stage.appendChild(stage);

    /* throughput-vs-latency mini chart */
    var chartWrap = el('div', { style: { marginTop: '1rem' } });
    ctx.stage.appendChild(chartWrap);
    var chart = ChipViz.barChart([
      { label: 'Freq', value: 1, color: 'var(--accent)' },
      { label: 'Area', value: 1, color: 'var(--carry)' }
    ]);
    chartWrap.appendChild(el('div', { className: 'mono-num', style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }, text: 'Relative freq vs area cost:' }));
    chartWrap.appendChild(chart.el);

    /* ── state ── */
    var pipelined = false;
    var feedbackOn = false;
    var depth = 4;

    /* ── rendering helpers ── */
    function clrStage() {
      while (stage.firstChild) stage.removeChild(stage.firstChild);
    }

    function drawReg(x, y, label) {
      var g = sv('g', {});
      g.appendChild(sv('rect', { x: x - 14, y: y - 22, width: 28, height: 44,
        rx: 3, fill: 'var(--surface-2)', stroke: 'var(--accent-2)', 'stroke-width': '2' }));
      g.appendChild(sv('text', { x: x, y: y + 5, 'text-anchor': 'middle', fill: 'var(--accent-2)',
        'font-family': 'var(--font-mono)', 'font-size': '9', text: label }));
      return g;
    }

    function drawCloud(x, y, w, h, label, gateCount) {
      var g = sv('g', {});
      /* cloud body */
      g.appendChild(sv('rect', { x: x, y: y, width: w, height: h, rx: 16,
        fill: 'var(--surface)', stroke: 'var(--grid)', 'stroke-width': '1.5', 'stroke-dasharray': '6 3' }));
      g.appendChild(sv('text', { x: x + w / 2, y: y + h / 2 - 6, 'text-anchor': 'middle',
        fill: 'var(--text-muted)', 'font-family': 'var(--font-mono)', 'font-size': '11', text: label }));
      g.appendChild(sv('text', { x: x + w / 2, y: y + h / 2 + 10, 'text-anchor': 'middle',
        fill: 'var(--text-muted)', 'font-family': 'var(--font-mono)', 'font-size': '9',
        text: gateCount + ' gate delays' }));
      return g;
    }

    function drawWire(x1, y1, x2, y2, color) {
      return sv('line', { x1: x1, y1: y1, x2: x2, y2: y2,
        stroke: color || 'var(--accent)', 'stroke-width': '2' });
    }

    function drawArrow(x, y) {
      return sv('polygon', {
        points: (x) + ',' + (y - 5) + ' ' + (x + 10) + ',' + y + ' ' + x + ',' + (y + 5),
        fill: 'var(--accent)'
      });
    }

    function freqGHz(d, piped) {
      /* base: 1 GHz at depth 4; scales inversely with depth (half the path = double freq) */
      var base = 4 / d;
      return piped ? (base * 2).toFixed(2) : base.toFixed(2);
    }

    function areaUnits(piped) { return piped ? 2 : 1; }

    function render() {
      clrStage();
      var d = depth;
      var half = Math.ceil(d / 2);

      /* clock period warning */
      var warn = sv('text', { x: W / 2, y: 18, 'text-anchor': 'middle',
        fill: 'var(--carry)', 'font-family': 'var(--font-mono)', 'font-size': '10',
        text: 'Clock period must be ≥ gate delay × ' + (pipelined ? half : d) });
      stage.appendChild(warn);

      var freq = freqGHz(d, pipelined);
      var area = areaUnits(pipelined);

      /* registers */
      var r1x = 60, ry = 140;
      stage.appendChild(drawReg(r1x, ry, 'REG'));

      if (pipelined) {
        /* two cloud halves with mid register */
        var midX = 240;
        stage.appendChild(drawCloud(90, 90, 120, 100, 'Logic A', half));
        stage.appendChild(drawCloud(270, 90, 120, 100, 'Logic B', d - half));
        stage.appendChild(drawWire(r1x + 14, ry, 90, ry));
        stage.appendChild(drawArrow(83, ry));
        stage.appendChild(drawWire(210, ry, midX - 14, ry));
        stage.appendChild(drawArrow(228, ry));
        /* mid register */
        var midReg = drawReg(midX, ry, 'REG');
        stage.appendChild(midReg);
        stage.appendChild(drawWire(midX + 14, ry, 270, ry));
        stage.appendChild(drawArrow(263, ry));
        stage.appendChild(drawWire(390, ry, 420, ry));
        stage.appendChild(drawArrow(413, ry));
        stage.appendChild(drawReg(434, ry, 'REG'));
      } else {
        /* single cloud */
        stage.appendChild(drawCloud(90, 90, 280, 100, 'Logic cloud', d));
        stage.appendChild(drawWire(r1x + 14, ry, 90, ry));
        stage.appendChild(drawArrow(83, ry));
        stage.appendChild(drawWire(370, ry, 420, ry));
        stage.appendChild(drawArrow(413, ry));
        stage.appendChild(drawReg(434, ry, 'REG'));
      }

      /* feedback arc if enabled */
      if (feedbackOn) {
        var fb = sv('path', {
          d: 'M 434,' + (ry + 25) + ' C 434,240 60,240 ' + r1x + ',' + (ry + 25),
          fill: 'none', stroke: 'var(--carry)', 'stroke-width': '2', 'stroke-dasharray': '5 3'
        });
        stage.appendChild(fb);
        stage.appendChild(sv('text', { x: W / 2, y: 255, 'text-anchor': 'middle',
          fill: 'var(--carry)', 'font-family': 'var(--font-mono)', 'font-size': '9',
          text: pipelined ? 'Even-sum / Odd-sum split — WRONG!' : 'Feedback loop (cannot pipeline this)' }));
      }

      /* frequency label */
      stage.appendChild(sv('text', { x: W / 2, y: H - 10, 'text-anchor': 'middle',
        fill: 'var(--highlight)', 'font-family': 'var(--font-mono)', 'font-size': '14',
        text: 'Max frequency: ' + freq + ' GHz  |  Area: ' + area + 'x registers' }));

      /* update labels */
      depthLabel.textContent = 'Depth: ' + d + ' gate stages';
      freqDisplay.textContent = 'Max frequency: ' + freq + ' GHz';
      freqDisplay.className = 'callout' + (d > 5 ? ' warn' : ' insight');

      pipeLabel.textContent = pipelined
        ? 'Pipelined: frequency ×2, area cost +1 register. Latency = 2 cycles, throughput = 1 result/cycle.'
        : 'Unpipelined: full logic depth limits clock speed.';

      chart.update([
        { label: 'Freq', value: parseFloat(freq), color: 'var(--accent)' },
        { label: 'Area', value: area, color: 'var(--carry)' }
      ]);

      /* animate a pulse along the first wire if not reduced motion */
      if (!rm) {
        setTimeout(function () {
          var wires = stage.querySelectorAll('line');
          if (wires.length) ChipViz.pulse(wires[0]);
        }, 50);
      }

      ctx.pulseGrid();
    }

    /* ── event wiring ── */
    depthSlider.addEventListener('input', function () {
      depth = parseInt(depthSlider.value, 10);
      render();
    });

    pipeBtn.addEventListener('click', function () {
      pipelined = !pipelined;
      pipeBtn.setAttribute('aria-pressed', pipelined ? 'true' : 'false');
      pipeBtn.textContent = pipelined ? 'Remove pipeline register' : 'Insert pipeline register';
      render();
    });

    feedbackBtn.addEventListener('click', function () {
      feedbackOn = !feedbackOn;
      feedbackBtn.setAttribute('aria-pressed', feedbackOn ? 'true' : 'false');
      feedbackBtn.textContent = feedbackOn ? 'Disable feedback' : 'Enable feedback (running sum)';
      feedbackWarn.style.display = feedbackOn ? '' : 'none';
      render();
    });

    render();
  }
});
