/* ============================================================
   11-thread.js — The Throughput vs Latency Thread.
   One trade-off, seen at six different levels of the stack.
   ============================================================ */
ChipViz.register({
  id: 'thread',
  order: 11,
  title: 'The Throughput vs Latency Thread',
  subtitle: 'The same tension repeats from inference batches to memory policy.',

  build: function (ctx) {
    var el = ChipViz.el;
    var reduced = ChipViz.prefersReducedMotion();

    ctx.left.appendChild(el('p', {
      text: 'At every level of a chip, getting more work done per second usually ' +
            'means accepting a different latency, area, or flexibility cost. ' +
            'Follow the thread below, then jump back to the section where each ' +
            'trade-off is explored.'
    }));
    ctx.left.appendChild(el('div', {
      className: 'callout insight',
      html: '<strong>Read the arrows:</strong> choose the left side for lower response ' +
            'time, or the right side when sustained throughput matters more.'
    }));

    var levels = [
      { label: '01', title: 'Batch size for inference',
        tradeoff: 'throughput ↕ latency', detail: 'Larger batches keep hardware busy; smaller batches answer sooner.', target: 'gputpu', tone: 'accent' },
      { label: '02', title: 'GPU SM count vs SM size',
        tradeoff: 'parallelism ↕ flexibility', detail: 'Many small SMs handle varied work; larger units favor dense work.', target: 'gputpu', tone: 'violet' },
      { label: '03', title: 'Systolic array size',
        tradeoff: 'compute ↕ register bandwidth', detail: 'A larger array reuses more data, but demands more coordinated feeding.', target: 'systolic', tone: 'green' },
      { label: '04', title: 'Pipeline depth',
        tradeoff: 'clock speed ↕ area', detail: 'More stages raise frequency and throughput, at the cost of registers.', target: 'pipeline', tone: 'amber' },
      { label: '05', title: 'Precision: FP4 vs FP8',
        tradeoff: 'speed (quadratic!) ↕ accuracy', detail: 'Fewer bits reduce compute cost; more bits preserve numerical detail.', target: 'mac', tone: 'accent' },
      { label: '06', title: 'Cache vs scratchpad',
        tradeoff: 'flexibility ↕ determinism', detail: 'Caches are convenient but variable; scratchpads make timing explicit.', target: 'memory', tone: 'violet' }
    ];

    var diagram = el('div', {
      className: 'thread-diagram',
      role: 'list',
      'aria-label': 'Six levels of the throughput versus latency trade-off'
    });

    levels.forEach(function (level, index) {
      var row = el('button', {
        type: 'button',
        className: 'thread-row thread-row--' + level.tone + (reduced ? '' : ' thread-row--enter'),
        role: 'listitem',
        'aria-label': level.title + ': ' + level.tradeoff + '. Go to related section.'
      }, [
        el('span', { className: 'thread-row__number mono-num', text: level.label }),
        el('span', { className: 'thread-row__main' }, [
          el('strong', { className: 'thread-row__title', text: level.title }),
          el('span', { className: 'thread-row__detail', text: level.detail })
        ]),
        el('span', { className: 'thread-row__tradeoff mono-num', text: level.tradeoff }),
        el('span', { className: 'thread-row__jump', 'aria-hidden': 'true', text: '↗' })
      ]);

      if (!reduced) row.style.animationDelay = (index * 70) + 'ms';
      row.addEventListener('click', function () {
        ChipViz.scrollTo(level.target);
        if (!reduced) ctx.pulseGrid();
      });
      diagram.appendChild(row);
    });

    ctx.stage.appendChild(diagram);
    ctx.stage.appendChild(el('p', {
      className: 'thread-hint mono-num',
      text: 'SELECT A LEVEL TO REVISIT ITS INTERACTIVE EXPLANATION'
    }));
  }
});
