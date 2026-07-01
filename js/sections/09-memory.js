/* ============================================================
   09-memory.js  —  Agent C lane. Memory: Cache vs Scratchpad.
   Source: "whether or not you get a cache hit depends on the ambient
            environment… a big source of non-determinism."
           "The cache is two orders of magnitude faster than the DDR."
           scratchpad: "one kind of instruction that says read or write
            scratchpad, and a totally different instruction that says
            read or write HBM."
           "You see this in TPUs… HBM… rather than DDR."
   ============================================================ */
ChipViz.register({
  id: 'memory',
  order: 9,
  title: 'Memory: Cache vs Scratchpad',
  subtitle: 'Non-deterministic caches vs. explicit scratchpad memory.',

  build: function (ctx) {
    var el = ChipViz.el, sv = ChipViz.svg;
    var rm = ChipViz.prefersReducedMotion();

    /* ── LEFT: explanation + controls ── */
    ctx.left.appendChild(el('p', {
      text: 'Whether or not you get a cache hit depends on the ambient environment — ' +
            'what else is running and what data was recently touched/evicted. ' +
            'That is a big source of non-determinism.'
    }));

    /* hit rate slider */
    var hitRateSlider = el('input', {
      type: 'range', min: '50', max: '95', value: '80', step: '5',
      className: 'cv-slider',
      'aria-label': 'Cache hit rate percentage'
    });
    var hitRateLabel = el('div', { className: 'cv-slider-label mono-num' });

    ctx.left.appendChild(el('div', { className: 'panel', style: { marginTop: '1rem' } }, [
      el('label', { text: 'Cache hit rate:' }),
      hitRateSlider,
      hitRateLabel
    ]));

    ctx.left.appendChild(el('div', { className: 'callout warn', style: { marginTop: '1rem' },
      html: '<strong>Cache:</strong> ~100× faster than DDR on a hit. ' +
            'On a miss, all bets are off — full DDR latency.' +
            '<br><br><strong>The cache is two orders of magnitude faster than the DDR.</strong>' }));

    ctx.left.appendChild(el('div', { className: 'callout insight', style: { marginTop: '1rem' },
      html: '<strong>TPU Scratchpad:</strong> one instruction for scratchpad, one for HBM. ' +
            'No randomness — color always matches the chosen instruction. Flat, predictable latency.' +
            '<br><br>For HFT or AI inference, you want to know exactly how long something takes.' }));

    /* access type selector for scratchpad column */
    var scratchpadSelect = el('select', { className: 'cv-select', 'aria-label': 'Scratchpad instruction type', style: { marginTop: '1rem' } });
    scratchpadSelect.appendChild(el('option', { value: 'scratchpad', text: 'Read Scratchpad (fast)' }));
    scratchpadSelect.appendChild(el('option', { value: 'hbm', text: 'Read HBM (slow)' }));
    ctx.left.appendChild(el('div', { style: { marginTop: '0.75rem' } }, [
      el('label', { text: 'TPU instruction: ' }), scratchpadSelect
    ]));

    /* ── STAGE: dual-column latency visualization ── */
    var W = 480, H = 300;
    var stage = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', 'aria-label': 'Cache vs scratchpad latency comparison' });
    ctx.stage.appendChild(stage);

    /* latency history bars */
    var historyCache = [];
    var historyTPU = [];
    var maxHistory = 20;

    /* simulation timer */
    var simTimer = null;
    var hitRate = 80;
    var tpuMode = 'scratchpad';

    /* simple deterministic pseudo-random for reproducible animation */
    var seed = 42;
    function lcg() {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return ((seed >>> 0) / 0xffffffff);
    }

    function isHit() {
      return lcg() * 100 < hitRate;
    }

    function cacheTick() {
      var hit = isHit();
      var latency = hit ? 1 : 20; /* 1 = cache, 20 = DDR (100x) */
      historyCache.push({ latency: latency, hit: hit });
      if (historyCache.length > maxHistory) historyCache.shift();
    }

    function tpuTick() {
      var latency = tpuMode === 'scratchpad' ? 1 : 10; /* scratchpad = 1, HBM = 10 */
      historyTPU.push({ latency: latency, fast: tpuMode === 'scratchpad' });
      if (historyTPU.length > maxHistory) historyTPU.shift();
    }

    function renderDiagram() {
      while (stage.firstChild) stage.removeChild(stage.firstChild);

      var colW = W / 2 - 10;
      var barAreaH = H - 90;
      var maxLat = 22;

      /* column labels */
      stage.appendChild(sv('text', { x: colW / 2 + 5, y: 18,
        'text-anchor': 'middle', fill: 'var(--text)',
        'font-family': 'var(--font-mono)', 'font-size': '12', text: 'CPU Cache' }));
      stage.appendChild(sv('text', { x: colW + 10 + colW / 2, y: 18,
        'text-anchor': 'middle', fill: 'var(--text)',
        'font-family': 'var(--font-mono)', 'font-size': '12', text: 'TPU Scratchpad' }));

      /* separator */
      stage.appendChild(sv('line', { x1: W / 2, y1: 24, x2: W / 2, y2: H - 20,
        stroke: 'var(--grid)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));

      /* draw latency bars for each column */
      function drawBars(history, offsetX) {
        var barW = (colW - 20) / maxHistory;
        history.forEach(function (item, i) {
          var barH = (item.latency / maxLat) * barAreaH;
          var x = offsetX + 10 + i * barW;
          var y = 28 + barAreaH - barH;
          var color = item.hit !== undefined
            ? (item.hit ? 'var(--highlight)' : 'var(--carry)')
            : (item.fast ? 'var(--highlight)' : 'var(--accent-2)');
          stage.appendChild(sv('rect', { x: x, y: y, width: Math.max(1, barW - 1), height: barH,
            rx: 1, fill: color }));
        });
      }

      drawBars(historyCache, 5);
      drawBars(historyTPU, W / 2 + 5);

      /* latency scale labels */
      stage.appendChild(sv('text', { x: 5, y: 30 + 8,
        fill: 'var(--text-muted)', 'font-family': 'var(--font-mono)', 'font-size': '8', text: 'DDR' }));
      stage.appendChild(sv('text', { x: 5, y: 28 + barAreaH,
        fill: 'var(--text-muted)', 'font-family': 'var(--font-mono)', 'font-size': '8', text: 'Cache' }));

      /* legends */
      stage.appendChild(sv('rect', { x: 10, y: H - 58, width: 10, height: 10, fill: 'var(--highlight)' }));
      stage.appendChild(sv('text', { x: 24, y: H - 49,
        fill: 'var(--text-muted)', 'font-family': 'var(--font-mono)', 'font-size': '9', text: 'Hit (fast)' }));
      stage.appendChild(sv('rect', { x: 10, y: H - 44, width: 10, height: 10, fill: 'var(--carry)' }));
      stage.appendChild(sv('text', { x: 24, y: H - 35,
        fill: 'var(--text-muted)', 'font-family': 'var(--font-mono)', 'font-size': '9', text: 'Miss (DDR, slow)' }));

      /* TPU legend */
      stage.appendChild(sv('rect', { x: W / 2 + 10, y: H - 58, width: 10, height: 10, fill: 'var(--highlight)' }));
      stage.appendChild(sv('text', { x: W / 2 + 24, y: H - 49,
        fill: 'var(--text-muted)', 'font-family': 'var(--font-mono)', 'font-size': '9', text: 'Scratchpad (1 cycle)' }));
      stage.appendChild(sv('rect', { x: W / 2 + 10, y: H - 44, width: 10, height: 10, fill: 'var(--accent-2)' }));
      stage.appendChild(sv('text', { x: W / 2 + 24, y: H - 35,
        fill: 'var(--text-muted)', 'font-family': 'var(--font-mono)', 'font-size': '9', text: 'HBM (10 cycles)' }));

      /* non-determinism label */
      stage.appendChild(sv('text', { x: colW / 2 + 5, y: H - 10,
        'text-anchor': 'middle', fill: 'var(--carry)',
        'font-family': 'var(--font-mono)', 'font-size': '9', text: '⚡ Non-deterministic latency' }));
      stage.appendChild(sv('text', { x: colW + 10 + colW / 2, y: H - 10,
        'text-anchor': 'middle', fill: 'var(--highlight)',
        'font-family': 'var(--font-mono)', 'font-size': '9', text: '✓ Deterministic latency' }));
    }

    function tick() {
      cacheTick();
      tpuTick();
      renderDiagram();
    }

    function startSim() {
      if (simTimer) return;
      if (rm) {
        /* reduced motion: just run a few ticks immediately, no animation */
        for (var i = 0; i < maxHistory; i++) tick();
        return;
      }
      simTimer = setInterval(tick, 400);
    }

    function stopSim() {
      if (simTimer) { clearInterval(simTimer); simTimer = null; }
    }

    /* ── controls ── */
    var runBtn = el('button', { type: 'button', className: 'cv-btn', style: { marginTop: '1rem' },
      text: 'Start simulation', 'aria-pressed': 'false' });
    ctx.stage.appendChild(runBtn);

    runBtn.addEventListener('click', function () {
      if (simTimer) {
        stopSim();
        runBtn.textContent = 'Start simulation';
        runBtn.setAttribute('aria-pressed', 'false');
      } else {
        startSim();
        runBtn.textContent = 'Pause simulation';
        runBtn.setAttribute('aria-pressed', 'true');
      }
    });

    hitRateSlider.addEventListener('input', function () {
      hitRate = parseInt(hitRateSlider.value, 10);
      hitRateLabel.textContent = 'Hit rate: ' + hitRate + '%';
      seed = 42; /* reset seed for consistent comparison */
      historyCache = [];
      renderDiagram();
      ctx.pulseGrid();
    });

    scratchpadSelect.addEventListener('change', function () {
      tpuMode = scratchpadSelect.value;
      historyTPU = [];
      renderDiagram();
      ctx.pulseGrid();
    });

    hitRate = parseInt(hitRateSlider.value, 10);
    hitRateLabel.textContent = 'Hit rate: ' + hitRate + '%';

    /* pre-fill some history for immediate visual */
    for (var i = 0; i < 10; i++) tick();

    renderDiagram();
    ctx.pulseGrid();
  }
});
