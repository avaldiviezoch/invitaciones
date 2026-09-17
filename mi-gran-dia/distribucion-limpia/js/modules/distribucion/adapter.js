/* Distribución · adapter de laboratorio
   REGLA PRINCIPAL: STORAGE NO SE TOCA.
   Esta frontera es exclusivamente memory-only. */
(() => {
  const root = window.MiGranDiaDistributionAdapters ||= {};
  function createMockAppLuAdapter(seed = {}) {
    const guests = Array.isArray(seed.guests) ? seed.guests.map((item) => ({ ...item })) : [];
    const tables = Array.isArray(seed.tables) ? seed.tables.map((item) => ({ ...item, seats: Array.isArray(item.seats) ? [...item.seats] : [] })) : [];
    return Object.freeze({
      getGuests() { return guests.map((item) => ({ ...item })); },
      getTables() { return tables.map((item) => ({ ...item, seats: [...item.seats] })); },
      mode: 'memory-only'
    });
  }
  root.createMockAppLuAdapter = createMockAppLuAdapter;
})();

window.MiGranDiaDistributionAdapter = Object.freeze({
  mode:'memory-only',
  storageWrites:false,
  firebase:false,
  firestore:false,
  readGuests(){
    return typeof guests !== 'undefined' ? structuredClone(guests) : [];
  },
  readTables(){
    return typeof elements !== 'undefined'
      ? structuredClone(elements.filter((item)=>item?.type === 'table'))
      : [];
  }
});

/* Margen libre editable por eje para mesas rectangulares.
   Redonda/cuadrada conservan un único margen simétrico. Memory-only. */
(() => {
  const engine = window.MiGranDiaDistributionEngine;
  const physical = engine?.physicalDimensions;
  if (!engine || !physical || document.documentElement.dataset.rectClearanceAxes === 'ready') return;

  const DEFAULT_MARGIN = Number(physical.CLEARANCE_MARGIN_M) || 0.80;
  const clampMargin = (value, fallback = DEFAULT_MARGIN) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : fallback;
  };
  const shapeOf = (table) => table?.tableShape === 'square' || table?.tableShape === 'rectangular' ? table.tableShape : 'round';

  function marginsForTable(table) {
    const shape = shapeOf(table);
    if (shape === 'rectangular') {
      return Object.freeze({
        x: clampMargin(table.clearanceMarginXM, DEFAULT_MARGIN),
        y: clampMargin(table.clearanceMarginYM, DEFAULT_MARGIN)
      });
    }
    const margin = clampMargin(table.clearanceMarginM ?? table.clearanceMarginXM ?? table.clearanceMarginYM, DEFAULT_MARGIN);
    return Object.freeze({ x: margin, y: margin });
  }

  function dimensionsForTable(table) {
    const base = physical.ensureTabletopDimensions(table);
    if (!base) return null;
    const margins = marginsForTable(table);
    return Object.freeze({
      ...base,
      clearanceMarginXM: margins.x,
      clearanceMarginYM: margins.y,
      clearanceWidthM: base.tabletopWidthM + margins.x * 2,
      clearanceHeightM: base.tabletopHeightM + margins.y * 2,
      chairOffsetM: physical.CHAIR_OFFSET_M,
      labelOffsetM: physical.LABEL_OFFSET_M
    });
  }

  function dimensionsAtScaleForTable(table, scale = 32) {
    const meters = dimensionsForTable(table);
    if (!meters) return null;
    const s = Number(scale) || 32;
    return Object.freeze({
      ...meters,
      scale: s,
      tabletopWidthPx: meters.tabletopWidthM * s,
      tabletopHeightPx: meters.tabletopHeightM * s,
      clearanceWidthPx: meters.clearanceWidthM * s,
      clearanceHeightPx: meters.clearanceHeightM * s,
      chairOffsetPx: physical.CHAIR_OFFSET_M * s,
      labelOffsetPx: physical.LABEL_OFFSET_M * s
    });
  }

  function applyToTable(table) {
    if (!table || table.type !== 'table') return table;
    const dims = dimensionsForTable(table);
    table.tableShape = dims.shape;
    table.capacity = dims.capacity;
    table.shape = dims.shape === 'round' ? 'table' : 'rect';
    table.widthM = dims.clearanceWidthM;
    table.heightM = dims.clearanceHeightM;
    return table;
  }

  function setClearanceMargins(table, horizontalM, verticalM = horizontalM) {
    if (!table || table.type !== 'table') return table;
    const shape = shapeOf(table);
    if (shape === 'rectangular') {
      table.clearanceMarginXM = clampMargin(horizontalM, marginsForTable(table).x);
      table.clearanceMarginYM = clampMargin(verticalM, marginsForTable(table).y);
      delete table.clearanceMarginM;
    } else {
      const margin = clampMargin(horizontalM, marginsForTable(table).x);
      table.clearanceMarginM = margin;
      table.clearanceMarginXM = margin;
      table.clearanceMarginYM = margin;
    }
    return applyToTable(table);
  }

  engine.physicalDimensions = Object.freeze({
    ...physical,
    dimensionsForTable,
    dimensionsAtScaleForTable,
    applyToTable,
    marginsForTable,
    setClearanceMargins
  });

  function installControls() {
    if (document.getElementById('tableClearanceControls')) return;
    const form = document.getElementById('selectionForm');
    const section = form?.querySelector('.panel-section');
    if (!section) return;

    const wrap = document.createElement('div');
    wrap.id = 'tableClearanceControls';
    wrap.className = 'field-grid';
    wrap.hidden = true;
    wrap.innerHTML = `
      <label class="field" id="clearanceSingleField"><span>Margen libre</span><input id="selClearance" type="number" min="0" max="5" step="0.05" inputmode="decimal"><small>m por lado</small></label>
      <label class="field" id="clearanceXField"><span>Margen libre · ancho</span><input id="selClearanceX" type="number" min="0" max="5" step="0.05" inputmode="decimal"><small>m por lado</small></label>
      <label class="field" id="clearanceYField"><span>Margen libre · alto</span><input id="selClearanceY" type="number" min="0" max="5" step="0.05" inputmode="decimal"><small>m por lado</small></label>`;
    section.appendChild(wrap);

    const singleField = wrap.querySelector('#clearanceSingleField');
    const xField = wrap.querySelector('#clearanceXField');
    const yField = wrap.querySelector('#clearanceYField');
    const single = wrap.querySelector('#selClearance');
    const xInput = wrap.querySelector('#selClearanceX');
    const yInput = wrap.querySelector('#selClearanceY');
    const fmt = (n) => Number(n).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');

    function currentTable() {
      try { return typeof selected === 'function' ? selected() : null; } catch { return null; }
    }

    function sync() {
      const table = currentTable();
      if (!table || table.type !== 'table') { wrap.hidden = true; return; }
      wrap.hidden = false;
      const rectangular = shapeOf(table) === 'rectangular';
      singleField.hidden = rectangular;
      xField.hidden = !rectangular;
      yField.hidden = !rectangular;
      const margins = engine.physicalDimensions.marginsForTable(table);
      single.value = fmt(margins.x);
      xInput.value = fmt(margins.x);
      yInput.value = fmt(margins.y);
    }

    function save() {
      const table = currentTable();
      if (!table || table.type !== 'table' || (typeof isItemLocked === 'function' && isItemLocked(table))) return;
      if (shapeOf(table) === 'rectangular') {
        engine.physicalDimensions.setClearanceMargins(table, xInput.value, yInput.value);
      } else {
        engine.physicalDimensions.setClearanceMargins(table, single.value, single.value);
      }
      if (typeof commitMutation === 'function') commitMutation();
      else if (typeof render === 'function') render();
      sync();
    }

    single.addEventListener('change', save);
    xInput.addEventListener('change', save);
    yInput.addEventListener('change', save);
    document.addEventListener('click', () => requestAnimationFrame(sync), true);
    document.addEventListener('pointerup', () => requestAnimationFrame(sync), true);
    document.addEventListener('change', (event) => {
      if (!wrap.contains(event.target)) requestAnimationFrame(sync);
    }, true);
    sync();
  }

  window.addEventListener('load', installControls, { once:true });
  document.documentElement.dataset.rectClearanceAxes = 'ready';
})();
