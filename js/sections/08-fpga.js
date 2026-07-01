/* ============================================================
   08-fpga.js  —  Agent C lane. FPGA vs ASIC: Lookup Tables.
   Source: "A lookup table has four bits of input and one bit of output."
           "the lookup table itself you can think of as being a big mux…
            np = 16 AND gates and 16 ORs."
           "a four-way AND… in an ASIC directly using three AND gates…
            Using a LUT… 32 gates instead of three."
           "The orange is what has been programmed in the field,
            whereas the white is all the wires that must exist."
           "first FPGA costs $10,000, whereas the first ASIC… $30 million"
   ============================================================ */
ChipViz.register({
  id: 'fpga',
  order: 8,
  title: 'FPGA vs ASIC: Lookup Tables',
  subtitle: 'How field-programmability trades gate efficiency for flexibility.',

  build: function (ctx) {
    var el = ChipViz.el, sv = ChipViz.svg;
    var rm = ChipViz.prefersReducedMotion();

    /* ── LEFT ── */
    ctx.left.appendChild(el('p', {
      text: 'A lookup table has four bits of input and one bit of output. ' +
            'How many possible input combinations of four bits? 16.'
    }));

    /* Part A: 4 input toggles */
    var inputLabels = ['A', 'B', 'C', 'D'];
    var inputs = inputLabels.map(function (lbl) {
      return ChipViz.bitToggle({ label: lbl, value: 0, onChange: recompute });
    });

    var toggleRow = el('div', { className: 'panel',
      style: { display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' } });
    inputLabels.forEach(function (lbl, i) {
      toggleRow.appendChild(el('span', { className: 'mono-num', text: lbl }));
      toggleRow.appendChild(inputs[i].el);
    });
    ctx.left.appendChild(toggleRow);

    /* Part B: function dropdown */
    var FN_DEFS = {
      'AND (A,B,C,D)': { asicGates: 3, compute: function (v) { return v[0] & v[1] & v[2] & v[3]; } },
      'OR (A,B,C,D)':  { asicGates: 3, compute: function (v) { return v[0] | v[1] | v[2] | v[3]; } },
      'XOR (A,B)':     { asicGates: 3, compute: function (v) { return v[0] ^ v[1]; } },
      'Majority (A,B,C)': { asicGates: 6, compute: function (v) {
        var s = v[0] + v[1] + v[2]; return s >= 2 ? 1 : 0;
      }},
      'Custom truth table': { asicGates: null, compute: null }
    };

    var fnSelect = el('select', { className: 'cv-select', 'aria-label': 'Function to implement', style: { marginTop: '1rem' } });
    Object.keys(FN_DEFS).forEach(function (name) {
      fnSelect.appendChild(el('option', { value: name, text: name }));
    });
    ctx.left.appendChild(el('div', { style: { marginTop: '0.75rem' } }, [
      el('label', { text: 'Function: ' }), fnSelect
    ]));

    /* comparison panel */
    var cmpPanel = el('div', { className: 'panel', style: { marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' } });
    ctx.left.appendChild(cmpPanel);

    ctx.left.appendChild(el('div', { className: 'callout warn', style: { marginTop: '1rem' },
      html: '<strong>ASIC vs FPGA cost:</strong> A four-way AND uses 3 gates in an ASIC.' +
            ' A LUT always costs 16 AND + 16 OR = <strong>32 gates</strong> regardless of function — ' +
            '10× overhead here.' +
            '<br><br>First FPGA: ~$10,000. First ASIC tape-out: ~$30,000,000.' }));

    /* Part C: programmability note */
    ctx.left.appendChild(el('div', { className: 'callout insight', style: { marginTop: '1rem' },
      html: 'The orange wires are what\'s been <strong>programmed in the field</strong>. ' +
            'The white wires must always exist — you pay for all of them, whether used or not.' }));

    /* ── STAGE: LUT visualizer ── */
    var W = 480, H = 340;
    var stage = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', 'aria-label': 'LUT schematic' });
    ctx.stage.appendChild(stage);

    /* 16-row truth table display (right panel of stage) */
    var tableWrap = el('div', { style: { marginTop: '1rem', overflowY: 'auto', maxHeight: '200px' } });
    ctx.stage.appendChild(tableWrap);

    /* output display */
    var outDisplay = el('div', { className: 'mono-num',
      style: { textAlign: 'center', fontSize: '1.4rem', marginTop: '0.5rem' } });
    ctx.stage.appendChild(outDisplay);

    /* custom truth table state (16 bits) */
    var customTable = new Array(16).fill(0);

    /* ── state ── */
    var currentFn = 'AND (A,B,C,D)';

    function getInputIdx() {
      /* ABCD as 4-bit index */
      return (inputs[0].value << 3) | (inputs[1].value << 2) | (inputs[2].value << 1) | inputs[3].value;
    }

    function getFnOutput(idx) {
      var fn = FN_DEFS[currentFn];
      if (!fn.compute) return customTable[idx];
      var bits = [(idx >> 3) & 1, (idx >> 2) & 1, (idx >> 1) & 1, idx & 1];
      return fn.compute(bits);
    }

    function buildFullTable() {
      var tbl = [];
      for (var i = 0; i < 16; i++) tbl.push(getFnOutput(i));
      return tbl;
    }

    function renderLUT(activeIdx, tableData) {
      while (stage.firstChild) stage.removeChild(stage.firstChild);

      /* title */
      stage.appendChild(sv('text', { x: W / 2, y: 18, 'text-anchor': 'middle',
        fill: 'var(--text-muted)', 'font-family': 'var(--font-mono)', 'font-size': '11',
        text: 'LUT structure: 16-way mux selecting from 16 stored bits' }));

      /* draw 16 memory cells in a 4×4 grid */
      var cellW = 32, cellH = 22, cols = 4;
      var startX = 40, startY = 30;
      for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 4; col++) {
          var idx2 = row * 4 + col;
          var isActive = idx2 === activeIdx;
          var val = tableData[idx2];
          var cellX = startX + col * (cellW + 4);
          var cellY = startY + row * (cellH + 4);
          stage.appendChild(sv('rect', {
            x: cellX, y: cellY, width: cellW, height: cellH, rx: 3,
            fill: isActive ? (val ? 'var(--highlight)' : 'var(--carry)') : 'var(--surface-2)',
            stroke: isActive ? 'var(--accent)' : 'var(--grid)', 'stroke-width': isActive ? 2 : 1
          }));
          stage.appendChild(sv('text', {
            x: cellX + cellW / 2, y: cellY + cellH / 2 + 4,
            'text-anchor': 'middle', fill: isActive ? 'var(--text)' : 'var(--text-muted)',
            'font-family': 'var(--font-mono)', 'font-size': '11', text: String(val)
          }));
        }
      }

      /* mux symbol */
      var muxX = 200, muxY = 50, muxW = 60, muxH = 110;
      stage.appendChild(sv('polygon', {
        points: muxX + ',' + muxY + ' ' + (muxX + muxW) + ',' + (muxY + 20) + ' ' +
                (muxX + muxW) + ',' + (muxY + muxH - 20) + ' ' + muxX + ',' + (muxY + muxH),
        fill: 'var(--surface)', stroke: 'var(--accent-2)', 'stroke-width': '2'
      }));
      stage.appendChild(sv('text', { x: muxX + muxW / 2, y: muxY + muxH / 2 + 4,
        'text-anchor': 'middle', fill: 'var(--accent-2)',
        'font-family': 'var(--font-mono)', 'font-size': '10', text: '16:1\nMUX' }));

      /* input lines to mux */
      var inputNames = ['A', 'B', 'C', 'D'];
      for (var i = 0; i < 4; i++) {
        var sel = (activeIdx >> (3 - i)) & 1;
        var wireY = muxY + muxH + 20 + i * 18;
        var wireColor = sel ? 'var(--accent)' : 'var(--grid)';
        stage.appendChild(sv('line', { x1: muxX + 15 + i * 8, y1: muxY + muxH,
          x2: muxX + 15 + i * 8, y2: wireY, stroke: wireColor, 'stroke-width': '1.5' }));
        stage.appendChild(sv('text', { x: muxX + 15 + i * 8, y: wireY + 12,
          'text-anchor': 'middle', fill: wireColor,
          'font-family': 'var(--font-mono)', 'font-size': '9', text: inputNames[i] }));
      }

      /* output wire */
      var outX = muxX + muxW, outY = muxY + muxH / 2;
      var outputVal = tableData[activeIdx];
      var outColor = outputVal ? 'var(--highlight)' : 'var(--text-muted)';
      var outLine = sv('line', { x1: outX, y1: outY, x2: outX + 80, y2: outY,
        stroke: outColor, 'stroke-width': '2.5' });
      stage.appendChild(outLine);
      stage.appendChild(sv('text', { x: outX + 90, y: outY + 5,
        'text-anchor': 'start', fill: outColor,
        'font-family': 'var(--font-mono)', 'font-size': '14', text: 'OUT=' + outputVal }));

      /* gate cost annotation */
      stage.appendChild(sv('text', { x: W / 2, y: H - 30, 'text-anchor': 'middle',
        fill: 'var(--text-muted)', 'font-family': 'var(--font-mono)', 'font-size': '10',
        text: 'LUT gate cost: 16 AND + 16 OR = 32 gates (always)' }));

      var fn = FN_DEFS[currentFn];
      var asicCost = fn.asicGates != null ? String(fn.asicGates) + ' gates' : 'varies';
      var ratio = fn.asicGates != null ? (32 / fn.asicGates).toFixed(1) + '×' : 'N/A';
      stage.appendChild(sv('text', { x: W / 2, y: H - 14, 'text-anchor': 'middle',
        fill: 'var(--carry)', 'font-family': 'var(--font-mono)', 'font-size': '10',
        text: 'ASIC cost: ' + asicCost + '  →  FPGA costs ' + ratio + ' more gates' }));

      if (!rm) {
        setTimeout(function () { ChipViz.pulse(outLine); }, 60);
      }
    }

    function buildTableEl(tableData, activeIdx) {
      while (tableWrap.firstChild) tableWrap.removeChild(tableWrap.firstChild);
      var tbl = ChipViz.truthTable(
        ['ABCD (bin)', 'OUT'],
        tableData.map(function (val, i) {
          var bits = ((i >> 3) & 1) + '' + ((i >> 2) & 1) + '' + ((i >> 1) & 1) + '' + (i & 1);
          return [bits, String(val)];
        })
      );
      tableWrap.appendChild(tbl.el);
      tbl.highlightRow(activeIdx);
    }

    function updateComparison(tableData, activeIdx) {
      var fn = FN_DEFS[currentFn];
      var asicTxt = fn.asicGates != null ? fn.asicGates + ' AND/OR gates' : 'custom';
      cmpPanel.innerHTML = '<strong>ASIC:</strong> ' + asicTxt +
        ' &nbsp;|&nbsp; <strong>LUT:</strong> 32 gates (16 AND + 16 OR)' +
        (fn.asicGates ? '<br>FPGA costs <strong>' + (32 / fn.asicGates).toFixed(1) + '×</strong> more gates for this function.' : '');
    }

    function recompute() {
      var idx = getInputIdx();
      var fn = FN_DEFS[currentFn];
      /* populate table */
      var tableData;
      if (fn.compute) {
        tableData = [];
        for (var i = 0; i < 16; i++) {
          var bits = [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1];
          tableData.push(fn.compute(bits));
        }
      } else {
        tableData = customTable.slice();
      }
      renderLUT(idx, tableData);
      buildTableEl(tableData, idx);
      updateComparison(tableData, idx);
      outDisplay.textContent = 'Output: ' + tableData[idx];
      outDisplay.style.color = tableData[idx] ? 'var(--highlight)' : 'var(--text-muted)';
      ctx.pulseGrid();
    }

    fnSelect.addEventListener('change', function () {
      currentFn = fnSelect.value;
      recompute();
    });

    recompute();
  }
});
