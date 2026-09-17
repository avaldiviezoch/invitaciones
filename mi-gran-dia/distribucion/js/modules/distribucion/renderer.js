/* Distribución Renderer/UI consolidado · renderer final e inspector · memory-only */

/* ===== pruebas/distribucion/renderer/tables.js ===== */
(() => {
  function createTableRenderer({ renderTable }) {
    if (typeof renderTable !== 'function') throw new TypeError('renderTable requerido');
    return Object.freeze({ render: (item, scale, conflicts) => renderTable(item, scale, conflicts) });
  }
  window.MiGranDiaDistributionRendererTables = Object.freeze({ createTableRenderer });
})();


/* ===== pruebas/distribucion/renderer/chairs.js ===== */
(() => {
  function chairPosition(index, capacity, distance) {
    const count = Math.max(1, Number(capacity) || 1);
    const angle = -Math.PI / 2 + Math.PI * 2 * Number(index || 0) / count;
    return Object.freeze({ angle, x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
  }
  window.MiGranDiaDistributionRendererChairs = Object.freeze({ chairPosition });
})();


/* ===== pruebas/distribucion/renderer/labels.js ===== */
(() => {
  function guestAnchor(angle) {
    const cosine = Math.cos(angle);
    if (cosine > .28) return 'start';
    if (cosine < -.28) return 'end';
    return 'middle';
  }
  function compactName(name, max = 18) {
    const value = String(name || '').trim();
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
  }
  window.MiGranDiaDistributionRendererLabels = Object.freeze({ guestAnchor, compactName });
})();


/* ===== pruebas/distribucion/renderer/tents.js ===== */
(() => {
  function createTentRenderer({ renderTent }) {
    if (typeof renderTent !== 'function') throw new TypeError('renderTent requerido');
    return Object.freeze({ render: (item) => renderTent(item) });
  }
  window.MiGranDiaDistributionRendererTents = Object.freeze({ createTentRenderer });
})();


/* ===== pruebas/distribucion/ui/planner.js ===== */
(() => {
  function createPlannerUI({ render, setSelection, clearSelection }) {
    if (typeof render !== 'function') throw new TypeError('render requerido');
    return Object.freeze({
      render: () => render(),
      select: (ids, primary) => setSelection?.(ids, primary),
      clearSelection: () => clearSelection?.()
    });
  }
  window.MiGranDiaDistributionUIPlanner = Object.freeze({ createPlannerUI });
})();


/* ===== pruebas/distribucion/ui/inspector.js ===== */
(() => {
  const TABLE_SHAPES = Object.freeze(['round','square','rectangular']);
  const TABLE_CAPACITIES = Object.freeze([4,6,8,10,12,14,16]);

  function tableShape(table) {
    return TABLE_SHAPES.includes(table?.tableShape) ? table.tableShape : 'round';
  }

  function tableCapacity(table) {
    const value = Number(table?.capacity);
    return TABLE_CAPACITIES.includes(value) ? value : 10;
  }

  function tableSeatSummary(table) {
    const capacity = tableCapacity(table);
    const seats = Array.isArray(table?.seats) ? table.seats.slice(0, capacity) : [];
    const occupied = seats.filter(Boolean).length;
    return Object.freeze({ capacity, occupied, free: Math.max(0, capacity - occupied) });
  }

  function tableInspectorModel(table) {
    if (!table || table.type !== 'table') return null;
    const seats = tableSeatSummary(table);
    return Object.freeze({
      id: table.id,
      shape: tableShape(table),
      capacity: tableCapacity(table),
      label: String(table.label || ''),
      color: table.color || '#d8c9a6',
      rotation: Number(table.rotation) || 0,
      locked: Boolean(table.locked),
      seats
    });
  }

  function createInspectorUI({ fillProperties, renderSeatEditor }) {
    if (typeof fillProperties !== 'function') throw new TypeError('fillProperties requerido');
    return Object.freeze({
      render: (item) => fillProperties(item),
      renderSeats: (table) => renderSeatEditor?.(table),
      tableModel: tableInspectorModel
    });
  }

  window.MiGranDiaDistributionUIInspector = Object.freeze({
    TABLE_SHAPES,
    TABLE_CAPACITIES,
    tableShape,
    tableCapacity,
    tableSeatSummary,
    tableInspectorModel,
    createInspectorUI
  });
})();


/* ===== pruebas/distribucion/ui/layers.js ===== */
(() => {
  function createLayersUI({ renderLayerList }) {
    if (typeof renderLayerList !== 'function') throw new TypeError('renderLayerList requerido');
    return Object.freeze({ render: () => renderLayerList() });
  }
  window.MiGranDiaDistributionUILayers = Object.freeze({ createLayersUI });
})();


/* ===== pruebas/distribucion/ui/risks.js ===== */
(() => {
  function createRisksUI({ renderValidation, validationMessages }) {
    if (typeof renderValidation !== 'function') throw new TypeError('renderValidation requerido');
    return Object.freeze({
      render: () => renderValidation(),
      messages: (conflicts) => typeof validationMessages === 'function' ? validationMessages(conflicts) : []
    });
  }
  window.MiGranDiaDistributionUIRisks = Object.freeze({ createRisksUI });
})();


/* ===== pruebas/distribucion/ui/proposals.js ===== */
(() => {
  function createProposalsUI({ renderProposalList, open, close }) {
    if (typeof renderProposalList !== 'function') throw new TypeError('renderProposalList requerido');
    return Object.freeze({
      render: () => renderProposalList(),
      open: () => { renderProposalList(); return open?.(); },
      close: () => close?.()
    });
  }
  window.MiGranDiaDistributionUIProposals = Object.freeze({ createProposalsUI });
})();


/* ===== pruebas/distribucion/ui/mobile.js ===== */
(() => {
  function createMobileUI({ closePanels, repositionFab, updateMenuDirection }) {
    return Object.freeze({
      close: () => closePanels?.(),
      repositionFab: (panel) => repositionFab?.(panel),
      updateMenuDirection: () => updateMenuDirection?.()
    });
  }
  window.MiGranDiaDistributionUIMobile = Object.freeze({ createMobileUI });
})();


/* ===== pruebas/distribucion/phase2-renderer-ui-bridge.js ===== */
(() => {
  if (document.documentElement.dataset.phase2RendererUiBridge === 'ready') return;

  const required = [
    'MiGranDiaDistributionRendererTables','MiGranDiaDistributionRendererChairs','MiGranDiaDistributionRendererLabels','MiGranDiaDistributionRendererTents',
    'MiGranDiaDistributionUIPlanner','MiGranDiaDistributionUIInspector','MiGranDiaDistributionUILayers','MiGranDiaDistributionUIRisks','MiGranDiaDistributionUIProposals','MiGranDiaDistributionUIMobile'
  ];
  if (required.some((key) => !window[key])) throw new Error('Renderer/UI modular incompleto');

  const legacy = Object.freeze({
    renderTable,
    renderTent,
    render,
    setSelection,
    clearSelection,
    fillProperties,
    renderSeatEditor,
    renderLayerList,
    renderValidation,
    validationMessages,
    renderProposalList
  });

  const tables = window.MiGranDiaDistributionRendererTables.createTableRenderer({ renderTable: legacy.renderTable });
  const tents = window.MiGranDiaDistributionRendererTents.createTentRenderer({ renderTent: legacy.renderTent });
  const labels = window.MiGranDiaDistributionRendererLabels;
  const chairs = window.MiGranDiaDistributionRendererChairs;

  const plannerUi = window.MiGranDiaDistributionUIPlanner.createPlannerUI({
    render: legacy.render,
    setSelection: legacy.setSelection,
    clearSelection: legacy.clearSelection
  });
  const inspectorUi = window.MiGranDiaDistributionUIInspector.createInspectorUI({
    fillProperties: legacy.fillProperties,
    renderSeatEditor: legacy.renderSeatEditor
  });
  const layersUi = window.MiGranDiaDistributionUILayers.createLayersUI({ renderLayerList: legacy.renderLayerList });
  const risksUi = window.MiGranDiaDistributionUIRisks.createRisksUI({
    renderValidation: legacy.renderValidation,
    validationMessages: legacy.validationMessages
  });
  const proposalModal = document.getElementById('proposalModal');
  const proposalsUi = window.MiGranDiaDistributionUIProposals.createProposalsUI({
    renderProposalList: legacy.renderProposalList,
    open: () => { if (proposalModal) proposalModal.hidden = false; },
    close: () => { if (proposalModal) proposalModal.hidden = true; }
  });
  const mobileLegacy = window.MiGranDiaDistributionPhase2Close || {};
  const mobileUi = window.MiGranDiaDistributionUIMobile.createMobileUI({
    closePanels: mobileLegacy.closeMobileUi,
    repositionFab: mobileLegacy.positionFabAboveSheet,
    updateMenuDirection: mobileLegacy.updateFabMenuDirection
  });

  // Seams de compatibilidad: el runtime actual continúa llamando los mismos nombres,
  // pero éstos ya delegan a módulos con contratos explícitos.
  renderTable = (item, scale, conflicts) => tables.render(item, scale, conflicts);
  renderTent = (item) => tents.render(item);
  guestAnchor = (angle) => labels.guestAnchor(angle);
  compactName = (name, max = 18) => labels.compactName(name, max);
  renderLayerList = () => layersUi.render();
  renderValidation = () => risksUi.render();
  fillProperties = (item) => inspectorUi.render(item);
  renderSeatEditor = (table) => inspectorUi.renderSeats(table);
  renderProposalList = () => proposalsUi.render();

  document.documentElement.dataset.phase2RendererUiBridge = 'ready';
  window.MiGranDiaDistributionRendererUI = Object.freeze({
    status: 'ready',
    compatibilityMode: true,
    noVisualChange: true,
    renderer: Object.freeze({ tables, chairs, labels, tents }),
    ui: Object.freeze({ planner: plannerUi, inspector: inspectorUi, layers: layersUi, risks: risksUi, proposals: proposalsUi, mobile: mobileUi })
  });
})();


/* ===== pruebas/distribucion/phase2-square.js ===== */
(() => {
  if (document.documentElement.dataset.phase2Square === 'ready') return;
  const contractApi = window.MiGranDiaDistributionEngine?.squareTableContract;
  if (!contractApi) throw new Error('Contrato de mesa cuadrada no disponible');
  const C = contractApi.SQUARE_TABLE_CONTRACT;
  const legacyRenderTable = renderTable;

  function isSquareTable(item) {
    return Boolean(item && item.type === 'table' && (item.tableShape === 'square' || (!item.tableShape && item.shape === 'rect')));
  }

  function renderSquareGuestLabel(group, guestName, seatNumber, index, scale, rotation) {
    if (!showNames.checked || !guestName) return;
    const pos = contractApi.labelPosition(index, scale);
    const wrapper = svgEl('g', {
      transform: `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) rotate(${-(Number(rotation) || 0)})`,
      class: 'guest-tag',
      'pointer-events': 'none'
    });
    const title = svgEl('title');
    title.textContent = `Asiento ${seatNumber}: ${guestName}`;
    wrapper.appendChild(title);
    const text = svgEl('text', {
      x: pos.anchor === 'start' ? 4 : pos.anchor === 'end' ? -4 : 0,
      y: 3,
      'text-anchor': pos.anchor,
      'font-size': C.labelFontSizePx,
      'font-weight': 800,
      fill: '#2d2924',
      stroke: '#ffffff',
      'stroke-width': 4,
      'paint-order': 'stroke'
    });
    text.textContent = compactName(guestName, C.labelMaxChars);
    wrapper.appendChild(text);
    group.appendChild(wrapper);
  }

  function renderSquareTable(item, scale, conflicts) {
    ensureTableSeats(item);
    const dims = contractApi.dimensionsAtScale(scale);
    const danger = conflicts.has(item.id);
    const selectedState = isSelected(item.id);
    const stroke = danger ? C.conflictColor : selectedState ? C.selectedColor : item.color;
    const strokeW = danger || selectedState ? 5 : 2;
    const group = svgEl('g', {
      transform: `translate(${item.x} ${item.y}) rotate(${item.rotation || 0})`,
      class: `draggable table-hit${selectedState ? ' table-selected' : ''}${danger ? ' has-conflict' : ''}`,
      'data-id': item.id,
      'data-table-shape': 'square'
    });

    group.appendChild(svgEl('rect', {
      x: -dims.clearanceWidthPx / 2,
      y: -dims.clearanceHeightPx / 2,
      width: dims.clearanceWidthPx,
      height: dims.clearanceHeightPx,
      rx: 8,
      fill: item.color,
      'fill-opacity': 0.16,
      stroke,
      'stroke-width': strokeW,
      'stroke-dasharray': showClearance.checked ? '9 7' : '0',
      class: 'clearance'
    }));

    for (let index = 0; index < C.capacity; index++) {
      const pos = contractApi.perimeterSeatPosition(index, scale);
      if (showClearance.checked) {
        const chair = svgEl('g', { transform: `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)})`, class: 'chair-wrap' });
        chair.appendChild(svgEl('circle', {
          r: dims.chairRadiusPx.toFixed(2),
          class: 'chair',
          fill: C.chairFill,
          stroke: C.chairStroke,
          'stroke-width': 1.5
        }));
        const number = svgEl('text', {
          x: 0,
          y: 3.2,
          'text-anchor': 'middle',
          'font-size': Math.max(7, dims.chairRadiusPx * 0.88).toFixed(1),
          'font-weight': 800,
          fill: '#5b554d',
          'pointer-events': 'none'
        });
        number.textContent = String(index + 1);
        chair.appendChild(number);
        group.appendChild(chair);
      }
      const guest = guestById(item.seats[index]);
      if (guest) renderSquareGuestLabel(group, guest.name, index + 1, index, scale, item.rotation || 0);
    }

    group.appendChild(svgEl('rect', {
      x: -dims.tabletopHalfPx,
      y: -dims.tabletopHalfPx,
      width: dims.tabletopSidePx,
      height: dims.tabletopSidePx,
      rx: 5,
      class: 'tabletop',
      fill: item.color,
      stroke: danger ? C.conflictColor : C.tabletopStroke,
      'stroke-width': danger ? 5 : 3,
      filter: 'url(#softShadow)'
    }));
    group.appendChild(svgEl('rect', {
      x: -dims.tabletopSidePx * 0.275,
      y: -dims.tabletopSidePx * 0.275,
      width: dims.tabletopSidePx * 0.55,
      height: dims.tabletopSidePx * 0.55,
      rx: 3,
      fill: 'none',
      stroke: '#fff',
      'stroke-opacity': 0.55,
      'stroke-width': 2,
      'pointer-events': 'none'
    }));

    if (showLabels.checked) {
      const title = svgEl('text', { x: 0, y: 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 900, fill: '#473d31', 'pointer-events': 'none' });
      title.textContent = item.label;
      group.appendChild(title);
    }
    return group;
  }

  renderTable = function phase2SquareAwareRenderTable(item, scale, conflicts) {
    return isSquareTable(item) ? renderSquareTable(item, scale, conflicts) : legacyRenderTable(item, scale, conflicts);
  };

  function convertTable(item, shape) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return false;
    const identity = { id: item.id, x: item.x, y: item.y, rotation: item.rotation, seats: item.seats.slice(), label: item.label, color: item.color };
    if (shape === 'square') contractApi.normalizeSquareTable(item);
    else {
      const round = window.MiGranDiaDistributionEngine?.roundTableContract;
      if (!round) return false;
      round.normalizeCurrentRoundTable(item);
      item.tableShape = 'round';
    }
    item.id = identity.id;
    item.x = identity.x;
    item.y = identity.y;
    item.rotation = identity.rotation;
    item.seats = identity.seats;
    item.label = identity.label;
    item.color = identity.color;
    commitMutation();
    return true;
  }

  function addSquareTable() {
    const item = addElement('table', { record: false, assignGuests: false });
    if (!item) return null;
    contractApi.normalizeSquareTable(item);
    item.label = `Mesa cuadrada ${elements.filter((entry) => entry.type === 'table' && isSquareTable(entry)).length}`;
    commitMutation();
    return item;
  }

  function installToolButton() {
    const circular = document.querySelector('[data-add="table"]');
    if (!circular || document.getElementById('btnAddSquareTable')) return;
    const button = circular.cloneNode(true);
    button.id = 'btnAddSquareTable';
    button.removeAttribute('data-add');
    button.querySelector('strong').textContent = '□';
    button.querySelector('span').innerHTML = 'Mesa cuadrada<small>10 personas · 1.80 m</small>';
    button.addEventListener('click', (event) => { event.preventDefault(); event.stopImmediatePropagation(); addSquareTable(); }, true);
    circular.insertAdjacentElement('afterend', button);
  }

  function installShapeControls() {
    if (document.getElementById('phase2TableShapeControls')) return;
    const firstSection = selectionForm?.querySelector('.panel-section');
    if (!firstSection) return;
    const wrap = document.createElement('div');
    wrap.id = 'phase2TableShapeControls';
    wrap.className = 'action-grid';
    wrap.innerHTML = '<button type="button" data-shape="round">Mesa redonda</button><button type="button" data-shape="square">Mesa cuadrada</button>';
    wrap.addEventListener('click', (event) => {
      const button = event.target.closest('[data-shape]');
      if (!button) return;
      event.preventDefault();
      if (button.dataset.shape === 'rectangular') return;
      convertTable(selected(), button.dataset.shape);
    });
    firstSection.appendChild(wrap);
  }

  installToolButton();
  installShapeControls();
  document.documentElement.dataset.phase2Square = 'ready';
  window.MiGranDiaDistributionSquareV1 = Object.freeze({
    status: 'ready',
    capacity: C.capacity,
    tabletopSideM: C.tabletopSideM,
    preservesIdentity: true,
    addSquareTable,
    convertTable,
    isSquareTable,
    renderSquareTable
  });
  render();
})();

/* ===== pruebas/distribucion/phase2-rectangular.js ===== */
(() => {
  if (document.documentElement.dataset.phase2Rectangular === 'ready') return;
  const contractApi = window.MiGranDiaDistributionEngine?.rectangularTableContract;
  if (!contractApi) throw new Error('Contrato de mesa rectangular no disponible');
  const C = contractApi.RECTANGULAR_TABLE_CONTRACT;
  const legacyRenderTable = renderTable;
  const legacySanitizeState = typeof sanitizeState === 'function' ? sanitizeState : null;

  function isRectangularTable(item) {
    return Boolean(item && item.type === 'table' && item.tableShape === 'rectangular');
  }

  function renderRectangularGuestLabel(group, guestName, seatNumber, index, scale, rotation) {
    if (!showNames.checked || !guestName) return;
    const pos = contractApi.labelPosition(index, scale);
    const wrapper = svgEl('g', {
      transform: `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) rotate(${-(Number(rotation) || 0)})`,
      class: 'guest-tag',
      'pointer-events': 'none'
    });
    const title = svgEl('title');
    title.textContent = `Asiento ${seatNumber}: ${guestName}`;
    wrapper.appendChild(title);
    const text = svgEl('text', {
      x: pos.anchor === 'start' ? 4 : pos.anchor === 'end' ? -4 : 0,
      y: 3,
      'text-anchor': pos.anchor,
      'font-size': C.labelFontSizePx,
      'font-weight': 800,
      fill: '#2d2924',
      stroke: '#ffffff',
      'stroke-width': 4,
      'paint-order': 'stroke'
    });
    text.textContent = compactName(guestName, C.labelMaxChars);
    wrapper.appendChild(text);
    group.appendChild(wrapper);
  }

  function renderRectangularTable(item, scale, conflicts) {
    ensureTableSeats(item);
    const dims = contractApi.dimensionsAtScale(scale);
    const danger = conflicts.has(item.id);
    const selectedState = isSelected(item.id);
    const stroke = danger ? C.conflictColor : selectedState ? C.selectedColor : item.color;
    const strokeW = danger || selectedState ? 5 : 2;
    const group = svgEl('g', {
      transform: `translate(${item.x} ${item.y}) rotate(${item.rotation || 0})`,
      class: `draggable table-hit${selectedState ? ' table-selected' : ''}${danger ? ' has-conflict' : ''}`,
      'data-id': item.id,
      'data-table-shape': 'rectangular'
    });

    group.appendChild(svgEl('rect', {
      x: -dims.clearanceWidthPx / 2,
      y: -dims.clearanceHeightPx / 2,
      width: dims.clearanceWidthPx,
      height: dims.clearanceHeightPx,
      rx: 8,
      fill: item.color,
      'fill-opacity': 0.16,
      stroke,
      'stroke-width': strokeW,
      'stroke-dasharray': showClearance.checked ? '9 7' : '0',
      class: 'clearance'
    }));

    for (let index = 0; index < C.capacity; index++) {
      const pos = contractApi.perimeterSeatPosition(index, scale);
      if (showClearance.checked) {
        const chair = svgEl('g', { transform: `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)})`, class: 'chair-wrap' });
        chair.appendChild(svgEl('circle', {
          r: dims.chairRadiusPx.toFixed(2),
          class: 'chair',
          fill: C.chairFill,
          stroke: C.chairStroke,
          'stroke-width': 1.5
        }));
        const number = svgEl('text', {
          x: 0,
          y: 3.2,
          'text-anchor': 'middle',
          'font-size': Math.max(7, dims.chairRadiusPx * 0.88).toFixed(1),
          'font-weight': 800,
          fill: '#5b554d',
          'pointer-events': 'none'
        });
        number.textContent = String(index + 1);
        chair.appendChild(number);
        group.appendChild(chair);
      }
      const guest = guestById(item.seats[index]);
      if (guest) renderRectangularGuestLabel(group, guest.name, index + 1, index, scale, item.rotation || 0);
    }

    group.appendChild(svgEl('rect', {
      x: -dims.tabletopHalfWidthPx,
      y: -dims.tabletopHalfHeightPx,
      width: dims.tabletopWidthPx,
      height: dims.tabletopHeightPx,
      rx: 4,
      class: 'tabletop',
      fill: item.color,
      stroke: danger ? C.conflictColor : C.tabletopStroke,
      'stroke-width': danger ? 5 : 3,
      filter: 'url(#softShadow)'
    }));
    group.appendChild(svgEl('rect', {
      x: -dims.tabletopWidthPx * 0.275,
      y: -dims.tabletopHeightPx * 0.275,
      width: dims.tabletopWidthPx * 0.55,
      height: dims.tabletopHeightPx * 0.55,
      rx: 2,
      fill: 'none',
      stroke: '#fff',
      'stroke-opacity': 0.55,
      'stroke-width': 2,
      'pointer-events': 'none'
    }));

    if (showLabels.checked) {
      const title = svgEl('text', { x: 0, y: 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 900, fill: '#473d31', 'pointer-events': 'none' });
      title.textContent = item.label;
      group.appendChild(title);
    }
    return group;
  }

  renderTable = function phase2RectangularAwareRenderTable(item, scale, conflicts) {
    return isRectangularTable(item) ? renderRectangularTable(item, scale, conflicts) : legacyRenderTable(item, scale, conflicts);
  };

  function convertTable(item, shape) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return false;
    const identity = { id: item.id, x: item.x, y: item.y, rotation: item.rotation, seats: item.seats.slice(), label: item.label, color: item.color };
    if (shape === 'rectangular') contractApi.normalizeRectangularTable(item);
    else if (shape === 'square') {
      const square = window.MiGranDiaDistributionEngine?.squareTableContract;
      if (!square) return false;
      square.normalizeSquareTable(item);
    } else {
      const round = window.MiGranDiaDistributionEngine?.roundTableContract;
      if (!round) return false;
      round.normalizeCurrentRoundTable(item);
      item.tableShape = 'round';
    }
    item.id = identity.id;
    item.x = identity.x;
    item.y = identity.y;
    item.rotation = identity.rotation;
    item.seats = identity.seats;
    item.label = identity.label;
    item.color = identity.color;
    commitMutation();
    return true;
  }

  function addRectangularTable() {
    const item = addElement('table', { record: false, assignGuests: false });
    if (!item) return null;
    contractApi.normalizeRectangularTable(item);
    item.label = `Mesa rectangular ${elements.filter((entry) => entry.type === 'table' && isRectangularTable(entry)).length}`;
    commitMutation();
    return item;
  }

  function installToolButton() {
    const square = document.getElementById('btnAddSquareTable');
    const circular = document.querySelector('[data-add="table"]');
    const anchor = square || circular;
    if (!anchor || document.getElementById('btnAddRectangularTable')) return;
    const button = anchor.cloneNode(true);
    button.id = 'btnAddRectangularTable';
    button.removeAttribute('data-add');
    button.querySelector('strong').textContent = '▭';
    button.querySelector('span').innerHTML = 'Mesa rectangular<small>10 personas · 2.40 × 0.75 m</small>';
    button.addEventListener('click', (event) => { event.preventDefault(); event.stopImmediatePropagation(); addRectangularTable(); }, true);
    anchor.insertAdjacentElement('afterend', button);
  }

  function installShapeControl() {
    const wrap = document.getElementById('phase2TableShapeControls');
    if (!wrap || wrap.querySelector('[data-shape="rectangular"]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.shape = 'rectangular';
    button.textContent = 'Mesa rectangular';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      convertTable(selected(), 'rectangular');
    }, true);
    wrap.appendChild(button);
  }

  // P2 sanea el estado antes de restaurarlo. Conservamos tableShape explícito para
  // diferenciar cuadrada y rectangular, que comparten shape='rect' para SAT.
  if (legacySanitizeState) {
    sanitizeState = function phase2ShapeAwareSanitizeState(input) {
      const safe = legacySanitizeState(input);
      const rawElements = Array.isArray(input?.elements) ? input.elements : [];
      safe.elements.forEach((item, index) => {
        if (item.type !== 'table') return;
        const raw = rawElements[index] || rawElements.find((entry) => String(entry?.id || '') === item.id);
        const requested = raw?.tableShape;
        if (requested === 'rectangular') {
          contractApi.normalizeRectangularTable(item);
        } else if (requested === 'square') {
          window.MiGranDiaDistributionEngine?.squareTableContract?.normalizeSquareTable(item);
        } else {
          window.MiGranDiaDistributionEngine?.roundTableContract?.normalizeCurrentRoundTable(item);
          item.tableShape = 'round';
        }
      });
      return safe;
    };
  }

  installToolButton();
  installShapeControl();
  document.documentElement.dataset.phase2Rectangular = 'ready';
  window.MiGranDiaDistributionRectangularV1 = Object.freeze({
    status: 'ready',
    capacity: C.capacity,
    tabletopWidthM: C.tabletopWidthM,
    tabletopHeightM: C.tabletopHeightM,
    preservesIdentity: true,
    addRectangularTable,
    convertTable,
    isRectangularTable,
    renderRectangularTable
  });
  render();
})();

/* ===== pruebas/distribucion/phase2-capacity.js ===== */
(() => {
  if (document.documentElement.dataset.phase2Capacity === 'ready') return;
  const engine = window.MiGranDiaDistributionEngine || {};
  const seatsApi = engine.seats;
  const layout = engine.capacityLayout;
  const physical = engine.physicalDimensions;
  const transitionApi = engine.tableTransition;
  const round = engine.roundTableContract;
  const square = engine.squareTableContract;
  const rectangular = engine.rectangularTableContract;
  if (!seatsApi || !layout || !physical || !transitionApi || !round || !square || !rectangular) throw new Error('Motor de capacidad/transición incompleto');

  const legacySanitizeState = typeof sanitizeState === 'function' ? sanitizeState : null;
  const capacities = seatsApi.SUPPORTED_CAPACITIES;

  function tableShape(item) {
    return transitionApi.normalizeShape(item?.tableShape, 'round');
  }

  function styleContract(shape) {
    if (shape === 'square') return square.SQUARE_TABLE_CONTRACT;
    if (shape === 'rectangular') return rectangular.RECTANGULAR_TABLE_CONTRACT;
    return round.ROUND_TABLE_CONTRACT;
  }

  function physicalAtScale(item, scale) {
    return physical.dimensionsAtScaleForTable(item, scale);
  }

  function applyPhysicalGeometry(item) {
    physical.applyToTable(item);
    return item;
  }

  function normalizeSeatLayout(item) {
    if (!item || item.type !== 'table') return 'default';
    item.seatLayoutVariant = layout.normalizeVariant(tableShape(item), seatsApi.normalizeCapacity(item.capacity, 10), item.seatLayoutVariant);
    return item.seatLayoutVariant;
  }

  function seatLayoutVariants(item) {
    if (!item || item.type !== 'table') return Object.freeze([]);
    return layout.layoutVariants(tableShape(item), seatsApi.normalizeCapacity(item.capacity, 10));
  }

  function seatPositions(item, scale) {
    const shape = tableShape(item);
    const capacity = seatsApi.normalizeCapacity(item.capacity, 10);
    const dims = physicalAtScale(item, scale);
    const variant = normalizeSeatLayout(item);
    const positions = layout.positionsFor(shape, capacity, dims, variant);
    if (positions.length !== capacity) throw new Error(`Layout inválido: capacidad ${capacity}, sillas ${positions.length}`);
    return positions;
  }

  function uprightAnchor(item, x, y) {
    const angle = (Number(item?.rotation) || 0) * Math.PI / 180;
    const worldX = x * Math.cos(angle) - y * Math.sin(angle);
    if (worldX > 8) return 'start';
    if (worldX < -8) return 'end';
    return 'middle';
  }

  function renderGuestLabel(group, item, seat, guestName, seatNumber, scale) {
    if (!showNames.checked || !guestName) return;
    const C = styleContract(tableShape(item));
    const local = layout.labelFromSeat(seat, physicalAtScale(item, scale).labelOffsetPx);
    const rotation = Number(item.rotation) || 0;
    const anchor = uprightAnchor(item, local.x, local.y);
    const wrapper = svgEl('g', {
      transform:`translate(${local.x.toFixed(1)} ${local.y.toFixed(1)}) rotate(${-rotation})`,
      class:'guest-tag',
      'data-upright-text':'true',
      'pointer-events':'none'
    });
    const title = svgEl('title');
    title.textContent = `Asiento ${seatNumber}: ${guestName}`;
    wrapper.appendChild(title);
    const text = svgEl('text', {
      x:anchor==='start'?4:anchor==='end'?-4:0,
      y:3,
      'text-anchor':anchor,
      'font-size':C.labelFontSizePx||9.5,
      'font-weight':800,
      fill:'#2d2924',
      stroke:'#ffffff',
      'stroke-width':4,
      'paint-order':'stroke'
    });
    text.textContent = compactName(guestName, C.labelMaxChars || 18);
    wrapper.appendChild(text);
    group.appendChild(wrapper);
  }

  function appendTabletop(group, item, shape, C, d, danger) {
    if (shape === 'round') {
      group.appendChild(svgEl('circle', {
        r:d.tabletopWidthPx/2,
        class:'tabletop',
        fill:item.color,
        stroke:danger?C.conflictColor:C.tabletopStroke,
        'stroke-width':danger?5:3,
        filter:'url(#softShadow)'
      }));
      group.appendChild(svgEl('circle', {
        r:d.tabletopWidthPx*.275,
        fill:'none', stroke:'#fff', 'stroke-opacity':.55, 'stroke-width':2,
        'pointer-events':'none'
      }));
      return;
    }
    group.appendChild(svgEl('rect', {
      x:-d.tabletopWidthPx/2,
      y:-d.tabletopHeightPx/2,
      width:d.tabletopWidthPx,
      height:d.tabletopHeightPx,
      rx:shape==='square'?5:4,
      class:'tabletop',
      fill:item.color,
      stroke:danger?C.conflictColor:C.tabletopStroke,
      'stroke-width':danger?5:3,
      filter:'url(#softShadow)'
    }));
    group.appendChild(svgEl('rect', {
      x:-d.tabletopWidthPx*.275,
      y:-d.tabletopHeightPx*.275,
      width:d.tabletopWidthPx*.55,
      height:d.tabletopHeightPx*.55,
      rx:3,
      fill:'none', stroke:'#fff', 'stroke-opacity':.55, 'stroke-width':2,
      'pointer-events':'none'
    }));
  }

  function appendTableLabels(group, item, capacity) {
    if (!showLabels.checked) return;
    const rotation = Number(item.rotation) || 0;
    const title = svgEl('text', {
      x:0, y:-3, 'text-anchor':'middle', class:'table-title',
      'font-size':12, 'font-weight':900, fill:'#473d31',
      transform:`rotate(${-rotation})`, 'data-upright-text':'true', 'pointer-events':'none'
    });
    title.textContent = item.label;
    group.appendChild(title);
    const meta = svgEl('text', {
      x:0, y:12, 'text-anchor':'middle', class:'table-meta',
      'font-size':8.5, 'font-weight':700, fill:'#5b5145',
      transform:`rotate(${-rotation})`, 'data-upright-text':'true', 'pointer-events':'none'
    });
    meta.textContent = `${capacity} personas`;
    group.appendChild(meta);
  }

  function appendChair(group, item, position, seatNumber, chairRadius, C, rotation) {
    const seatIndex = seatNumber - 1;
    const guestId = Array.isArray(item.seats) ? (item.seats[seatIndex] || '') : '';
    const chair = svgEl('g', {
      transform:`translate(${position.x.toFixed(1)} ${position.y.toFixed(1)})`,
      class:`chair-wrap seat-drop-target${guestId?' is-occupied':''}`,
      'data-seat-number':String(seatNumber),
      'data-seat-index':String(seatIndex),
      'data-table-id':String(item.id),
      'data-guest-id':String(guestId)
    });
    chair.appendChild(svgEl('circle', {
      r:chairRadius.toFixed(2), class:'chair', fill:C.chairFill,
      stroke:C.chairStroke, 'stroke-width':1.5
    }));
    const number = svgEl('text', {
      x:0, y:3.2, 'text-anchor':'middle',
      'font-size':Math.max(7,chairRadius*.88).toFixed(1),
      'font-weight':800, fill:'#5b554d',
      transform:`rotate(${-rotation})`, 'data-upright-text':'true', 'pointer-events':'none'
    });
    number.textContent = String(seatNumber);
    chair.appendChild(number);
    group.appendChild(chair);
  }

  function renderDynamicTable(item, scale, conflicts) {
    applyPhysicalGeometry(item);
    normalizeSeatLayout(item);
    const shape = tableShape(item);
    const C = styleContract(shape);
    const capacity = seatsApi.normalizeCapacity(item.capacity, 10);
    const d = physicalAtScale(item, scale);
    seatsApi.ensureSeatArray(item, capacity);
    const positions = seatPositions(item, scale);
    const danger = conflicts.has(item.id);
    const selectedState = isSelected(item.id);
    const stroke = danger ? C.conflictColor : selectedState ? C.selectedColor : item.color;
    const strokeW = danger || selectedState ? 5 : 2;
    const rotation = Number(item.rotation) || 0;
    const group = svgEl('g', {
      transform:`translate(${item.x} ${item.y}) rotate(${rotation})`,
      class:`draggable table-hit${selectedState?' table-selected':''}${danger?' has-conflict':''}`,
      'data-id':item.id,
      'data-table-shape':shape,
      'data-capacity':String(capacity),
      'data-chair-count':String(positions.length),
      'data-seat-layout':item.seatLayoutVariant
    });
    const chairRadius = Math.max(7, Math.min(d.tabletopWidthPx, d.tabletopHeightPx) * 0.06);

    if (showClearance.checked) {
      if (shape === 'round') {
        group.appendChild(svgEl('circle', {
          r:d.clearanceWidthPx/2, fill:item.color, 'fill-opacity':.16, stroke,
          'stroke-width':strokeW, 'stroke-dasharray':'9 7', class:'clearance'
        }));
      } else {
        group.appendChild(svgEl('rect', {
          x:-d.clearanceWidthPx/2, y:-d.clearanceHeightPx/2,
          width:d.clearanceWidthPx, height:d.clearanceHeightPx, rx:8,
          fill:item.color, 'fill-opacity':.16, stroke,
          'stroke-width':strokeW, 'stroke-dasharray':'9 7', class:'clearance'
        }));
      }
    }

    positions.forEach((pos, index) => {
      appendChair(group, item, pos, index + 1, chairRadius, C, rotation);
      const guest = guestById(item.seats[index]);
      if (guest) renderGuestLabel(group, item, pos, guest.name, index + 1, scale);
    });

    appendTabletop(group, item, shape, C, d, danger);
    appendTableLabels(group, item, capacity);
    appendRotateHandle(group, item);
    return group;
  }

  renderTable = function phase2PhysicalDimensionAwareRenderTable(item, scale, conflicts) {
    return item?.type === 'table' ? renderDynamicTable(item, scale, conflicts) : null;
  };

  function blockedSeatsForCapacity(item, nextCapacity) {
    if (!item || item.type !== 'table') return [];
    const next = seatsApi.normalizeCapacity(nextCapacity, item.capacity || 10);
    return next < Number(item.capacity || 10) ? Array.from(seatsApi.occupiedBeyondCapacity(item, next)) : [];
  }

  function transitionTable(item, request) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return Object.freeze({ ok:false, reason:'unavailable' });

    const capacityOnly = Object.prototype.hasOwnProperty.call(request || {}, 'capacity')
      && !Object.prototype.hasOwnProperty.call(request || {}, 'shape');
    const physicalBefore = capacityOnly ? {
      tabletopWidthM:Number(item.tabletopWidthM),
      tabletopHeightM:Number(item.tabletopHeightM)
    } : null;

    const result = transitionApi.transition(item, request);
    if (!result.ok) {
      if (result.reason === 'occupied-seats') {
        const blockedSeats = result.blocked.map((entry) => entry.seatNumber).join(', ');
        if (typeof toast === 'function') toast(`No se puede reducir: mueve o libera los asientos ${blockedSeats}.`, true);
      }
      return result;
    }

    // INVARIANTE DURO: cambiar sillas jamás cambia el tablero físico.
    if (capacityOnly && physicalBefore) {
      item.tabletopWidthM = physicalBefore.tabletopWidthM;
      item.tabletopHeightM = physicalBefore.tabletopHeightM;
    }

    applyPhysicalGeometry(item);
    normalizeSeatLayout(item);

    if (capacityOnly && physicalBefore &&
        (Number(item.tabletopWidthM) !== physicalBefore.tabletopWidthM ||
         Number(item.tabletopHeightM) !== physicalBefore.tabletopHeightM)) {
      throw new Error('Contrato roto: cambiar sillas modificó el tamaño físico de la mesa.');
    }

    commitMutation();
    return result;
  }

  function setCapacity(item, nextCapacity) {
    return transitionTable(item, { capacity:nextCapacity });
  }

  function convertShapePreservingCapacity(item, shape) {
    return transitionTable(item, { shape });
  }

  function setSeatLayoutVariant(item, variant) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return Object.freeze({ ok:false, reason:'unavailable' });
    const next = layout.normalizeVariant(tableShape(item), seatsApi.normalizeCapacity(item.capacity, 10), variant);
    const previous = normalizeSeatLayout(item);
    if (previous === next) return Object.freeze({ ok:true, changed:false, variant:next });
    item.seatLayoutVariant = next;
    commitMutation();
    return Object.freeze({ ok:true, changed:true, variant:next });
  }

  function setTabletopSize(item, widthM, heightM = widthM) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return Object.freeze({ ok:false, reason:'unavailable' });
    const before = {
      widthM:item.tabletopWidthM,
      heightM:item.tabletopHeightM
    };
    physical.setTabletopDimensions(item, widthM, heightM);
    commitMutation();
    return Object.freeze({
      ok:true,
      before,
      tabletopWidthM:item.tabletopWidthM,
      tabletopHeightM:item.tabletopHeightM
    });
  }

  function syncTableDimensionInputs(item) {
    if (!item || item.type !== 'table') return;
    physical.ensureTabletopDimensions(item);
    if (typeof selW !== 'undefined' && selW) selW.value = Number(item.tabletopWidthM).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
    if (typeof selH !== 'undefined' && selH) selH.value = Number(item.tabletopHeightM).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
    if (typeof dimensionLimitNote !== 'undefined' && dimensionLimitNote) {
      dimensionLimitNote.textContent = tableShape(item) === 'round'
        ? 'Diámetro físico de la mesa. Cambiar sillas no modifica esta medida.'
        : tableShape(item) === 'square'
          ? 'Lado físico de la mesa. Cambiar sillas no modifica esta medida.'
          : 'Medidas físicas del tablero. Cambiar sillas no modifica estas medidas.';
    }
  }

  function installTableDimensionControls() {
    if (document.documentElement.dataset.phase2TableDimensions === 'ready') return;
    document.documentElement.dataset.phase2TableDimensions = 'ready';

    const handle = (axis, event) => {
      const item = selected();
      if (!item || item.type !== 'table') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      physical.ensureTabletopDimensions(item);
      const width = axis === 'w' ? Number(selW.value) : item.tabletopWidthM;
      const height = axis === 'h' ? Number(selH.value) : item.tabletopHeightM;
      if (tableShape(item) === 'round' || tableShape(item) === 'square') {
        const size = axis === 'w' ? width : height;
        setTabletopSize(item, size, size);
      } else {
        setTabletopSize(item, width, height);
      }
      syncTableDimensionInputs(item);
    };

    selW?.addEventListener('change', (event) => handle('w', event), true);
    selH?.addEventListener('change', (event) => handle('h', event), true);

    if (typeof fillProperties === 'function') {
      const legacyFillProperties = fillProperties;
      fillProperties = function phase2PhysicalTableFillProperties(item) {
        const value = legacyFillProperties(item);
        if (item?.type === 'table') syncTableDimensionInputs(item);
        return value;
      };
    }
  }

  function installCapacityControls() {
    if (document.getElementById('phase2CapacityControls')) return;
    const shapeControls = document.getElementById('phase2TableShapeControls');
    if (!shapeControls) return;
    const wrap = document.createElement('div');
    wrap.id = 'phase2CapacityControls';
    wrap.className = 'action-grid';
    capacities.forEach((capacity) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.capacity = String(capacity);
      button.textContent = `${capacity} personas`;
      button.addEventListener('click', (event) => {
        event.preventDefault(); event.stopImmediatePropagation();
        setCapacity(selected(), capacity);
      }, true);
      wrap.appendChild(button);
    });
    shapeControls.insertAdjacentElement('afterend', wrap);
    shapeControls.addEventListener('click', (event) => {
      const button = event.target.closest('[data-shape]');
      if (!button) return;
      event.preventDefault(); event.stopImmediatePropagation();
      convertShapePreservingCapacity(selected(), button.dataset.shape);
    }, true);
  }

  if (legacySanitizeState) {
    sanitizeState = function phase2PhysicalDimensionAwareSanitizeState(input) {
      const safe = legacySanitizeState(input);
      const rawElements = Array.isArray(input?.elements) ? input.elements : [];
      const guestIds = new Set((safe.guests || []).map((guest) => guest.id));
      safe.elements.forEach((item, index) => {
        if (item.type !== 'table') return;
        const raw = rawElements.find((entry) => String(entry?.id || '') === item.id) || rawElements[index] || {};
        item.tableShape = transitionApi.normalizeShape(raw.tableShape, 'round');
        const capacity = seatsApi.normalizeCapacity(raw.capacity, 10);
        item.capacity = capacity;
        const rawSeats = Array.isArray(raw.seats) ? raw.seats : [];
        item.seats = rawSeats.slice(0, capacity).map((guestId) => {
          if (!guestId) return null;
          const safeId = String(guestId).slice(0,160);
          return guestIds.has(safeId) ? safeId : null;
        });
        while (item.seats.length < capacity) item.seats.push(null);
        item.seatLayoutVariant = layout.normalizeVariant(item.tableShape, capacity, raw.seatLayoutVariant);
        if (Number.isFinite(Number(raw.tabletopWidthM))) item.tabletopWidthM = Number(raw.tabletopWidthM);
        if (Number.isFinite(Number(raw.tabletopHeightM))) item.tabletopHeightM = Number(raw.tabletopHeightM);
        applyPhysicalGeometry(item);
      });
      return safe;
    };
  }

  elements.filter((item) => item.type === 'table').forEach((item) => { applyPhysicalGeometry(item); normalizeSeatLayout(item); });
  installCapacityControls();
  installTableDimensionControls();
  document.documentElement.dataset.phase2Capacity = 'ready';
  window.MiGranDiaDistributionCapacityV1 = Object.freeze({
    status:'ready', capacities, transitionTable, setCapacity, convertShapePreservingCapacity,
    setSeatLayoutVariant, seatLayoutVariants, normalizeSeatLayout,
    seatPositions, renderDynamicTable, applyPhysicalGeometry, blockedSeatsForCapacity, setTabletopSize,
    protectsOccupiedSeats:true, dimensionsStillFixed:true, physicalDimensionsByCapacity:false,
    unifiedTransition:true, jsonSupports16:true, uprightTextNative:true,
    rotationHandleNative:true, authoritativeTableRenderer:true, exactChairCountInvariant:true,
    chairsIndependentFromClearance:true, explicitSeatLayoutMatrix:true
  });
  render();
})();

/* ===== pruebas/distribucion/phase2-inspector.js ===== */
(() => {
  if (document.documentElement.dataset.phase2TableInspector === 'ready') return;

  const inspectorApi = window.MiGranDiaDistributionUIInspector;
  const capacityApi = window.MiGranDiaDistributionCapacityV1;
  if (!inspectorApi || !capacityApi?.transitionTable) throw new Error('Inspector de mesa requiere UI inspector y transición unificada');

  const form = document.getElementById('selectionForm');
  const firstSection = form?.querySelector('.panel-section.first-section');
  const seatWrap = document.getElementById('seatEditorWrap');
  if (!form || !firstSection || !seatWrap) return;

  const section = document.createElement('section');
  section.id = 'phase2TableInspector';
  section.className = 'panel-section';
  section.hidden = true;
  section.innerHTML = `
    <div class="section-title-row"><div><h3>Mesa seleccionada</h3><p>Forma, sillas, acomodo y estado en un solo inspector.</p></div><span class="count-chip" id="tableInspectorSeatBadge">0/0</span></div>
    <div class="two-col">
      <label class="field"><span>Forma</span><select id="tableInspectorShape"><option value="round">Redonda</option><option value="square">Cuadrada</option><option value="rectangular">Rectangular</option></select></label>
      <label class="field"><span>Número de sillas</span><select id="tableInspectorCapacity">${inspectorApi.TABLE_CAPACITIES.map((n)=>`<option value="${n}">${n} sillas</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Acomodo de sillas</span><select id="tableInspectorSeatLayout"></select></label>
    <div class="action-grid" id="tableInspectorChairStepper">
      <button type="button" id="tableInspectorSeatMinus">− Menos sillas</button>
      <button type="button" id="tableInspectorSeatCount" disabled>10 sillas</button>
      <button type="button" id="tableInspectorSeatPlus">+ Más sillas</button>
    </div>
    <p class="field-note" id="tableInspectorCapacityNote"></p>
    <div class="summary-list" id="tableInspectorSeatSummary">
      <div><dt>Asignados</dt><dd id="tableInspectorOccupied">0</dd></div>
      <div><dt>Libres</dt><dd id="tableInspectorFree">0</dd></div>
    </div>
    <div id="tableInspectorCoreFields"></div>
  `;
  seatWrap.insertAdjacentElement('beforebegin', section);

  const core = section.querySelector('#tableInspectorCoreFields');
  const movedControls = [];

  function registerMovable(node, key) {
    if (!node?.parentNode) return;
    const placeholder = document.createComment(`phase2-inspector-${key}`);
    node.parentNode.insertBefore(placeholder, node);
    movedControls.push({ node, placeholder });
  }

  ['selLabel','selRot','selColor'].forEach((id) => {
    const input = document.getElementById(id);
    registerMovable(input?.closest('.field'), id);
  });

  const lockButton = document.getElementById('btnToggleLock');
  registerMovable(lockButton, 'btnToggleLock');
  const lockWrap = document.createElement('div');
  lockWrap.className = 'action-grid';
  core.appendChild(lockWrap);

  function moveCoreIntoTableInspector() {
    movedControls.forEach(({ node }) => {
      if (node === lockButton) lockWrap.appendChild(node);
      else core.insertBefore(node, lockWrap);
    });
  }

  function restoreCoreControls() {
    movedControls.forEach(({ node, placeholder }) => {
      if (placeholder.parentNode && node.parentNode !== placeholder.parentNode) {
        placeholder.parentNode.insertBefore(node, placeholder.nextSibling);
      }
    });
  }

  const legacyShape = document.getElementById('phase2TableShapeControls');
  const legacyCapacity = document.getElementById('phase2CapacityControls');
  if (legacyShape) legacyShape.hidden = true;
  if (legacyCapacity) legacyCapacity.hidden = true;

  const shapeSelect = section.querySelector('#tableInspectorShape');
  const capacitySelect = section.querySelector('#tableInspectorCapacity');
  const seatLayoutSelect = section.querySelector('#tableInspectorSeatLayout');
  const capacityNote = section.querySelector('#tableInspectorCapacityNote');
  const seatMinus = section.querySelector('#tableInspectorSeatMinus');
  const seatPlus = section.querySelector('#tableInspectorSeatPlus');
  const seatCountButton = section.querySelector('#tableInspectorSeatCount');
  const badge = section.querySelector('#tableInspectorSeatBadge');
  const occupiedEl = section.querySelector('#tableInspectorOccupied');
  const freeEl = section.querySelector('#tableInspectorFree');
  const capacities = Array.from(inspectorApi.TABLE_CAPACITIES);

  function currentTable() {
    const item = typeof selected === 'function' ? selected() : null;
    return item?.type === 'table' ? item : null;
  }

  function capacityIndex(value) {
    return capacities.indexOf(Number(value));
  }

  function neighborCapacity(value, direction) {
    const index = capacityIndex(value);
    if (index < 0) return null;
    const next = index + direction;
    return next >= 0 && next < capacities.length ? capacities[next] : null;
  }

  function updateSeatLayoutOptions(table) {
    const variants = capacityApi.seatLayoutVariants?.(table) || [];
    const active = capacityApi.normalizeSeatLayout?.(table) || variants[0]?.id || 'default';
    seatLayoutSelect.replaceChildren(...variants.map((variant) => {
      const option = document.createElement('option');
      option.value = variant.id;
      option.textContent = variant.label;
      return option;
    }));
    seatLayoutSelect.value = active;
    seatLayoutSelect.disabled = variants.length <= 1 || Boolean(table?.locked);
  }

  function updateCapacityAvailability(table, model) {
    let firstBlocked = null;
    Array.from(capacitySelect.options).forEach((option) => {
      const capacity = Number(option.value);
      const blocked = capacityApi.blockedSeatsForCapacity?.(table, capacity) || [];
      option.disabled = blocked.length > 0;
      if (!firstBlocked && blocked.length) firstBlocked = blocked;
    });

    const lower = neighborCapacity(model.capacity, -1);
    const upper = neighborCapacity(model.capacity, 1);
    const lowerBlocked = lower == null ? [] : (capacityApi.blockedSeatsForCapacity?.(table, lower) || []);
    seatMinus.disabled = lower == null || lowerBlocked.length > 0 || model.locked;
    seatPlus.disabled = upper == null || model.locked;
    seatCountButton.textContent = `${model.capacity} sillas`;

    if (firstBlocked?.length) {
      const seats = firstBlocked.map((entry) => entry.seatNumber).join(', ');
      capacityNote.textContent = `Puedes agregar sillas libremente. Para reducir, mueve o libera primero los asientos ${seats}.`;
    } else if (model.seats.occupied) {
      capacityNote.textContent = 'Usa − / + para cambiar sillas y “Acomodo” para elegir su distribución sin perder invitados.';
    } else {
      capacityNote.textContent = 'Sillas disponibles: 4, 6, 8, 10, 12, 14 y 16. El acomodo depende de la forma y cantidad.';
    }
  }

  function refresh() {
    const table = currentTable();
    const model = inspectorApi.tableInspectorModel(table);
    if (!model) {
      section.hidden = true;
      restoreCoreControls();
      return;
    }
    moveCoreIntoTableInspector();
    section.hidden = false;
    shapeSelect.value = model.shape;
    capacitySelect.value = String(model.capacity);
    updateSeatLayoutOptions(table);
    updateCapacityAvailability(table, model);
    badge.textContent = `${model.seats.occupied}/${model.seats.capacity}`;
    occupiedEl.textContent = String(model.seats.occupied);
    freeEl.textContent = String(model.seats.free);
    const lock = document.getElementById('btnToggleLock');
    if (lock) lock.textContent = model.locked ? '🔓 Desbloquear' : '🔒 Bloquear';
  }

  function applyTransition(request) {
    const table = currentTable();
    if (!table) return Object.freeze({ ok:false, reason:'missing-table' });
    const result = capacityApi.transitionTable(table, request);
    refresh();
    return result;
  }

  function stepSeats(direction) {
    const table = currentTable();
    if (!table) return Object.freeze({ ok:false, reason:'missing-table' });
    const next = neighborCapacity(table.capacity, direction);
    if (next == null) return Object.freeze({ ok:false, reason:'limit' });
    return applyTransition({ capacity:next });
  }

  shapeSelect.addEventListener('change', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    applyTransition({ shape: shapeSelect.value });
  }, true);

  capacitySelect.addEventListener('change', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    applyTransition({ capacity: Number(capacitySelect.value) });
  }, true);

  seatLayoutSelect.addEventListener('change', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const table = currentTable();
    if (table) capacityApi.setSeatLayoutVariant?.(table, seatLayoutSelect.value);
    refresh();
  }, true);

  seatMinus.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    stepSeats(-1);
  }, true);

  seatPlus.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    stepSeats(1);
  }, true);

  const legacyRender = render;
  render = function phase2InspectorAwareRender() {
    const value = legacyRender();
    refresh();
    return value;
  };

  document.documentElement.dataset.phase2TableInspector = 'ready';
  window.MiGranDiaDistributionTableInspectorV1 = Object.freeze({
    status:'ready', refresh, applyTransition, stepSeats, neighborCapacity, updateSeatLayoutOptions,
    moveCoreIntoTableInspector, restoreCoreControls,
    unifiedTransition:true, memoryOnly:true, preservesNonTableInspector:true,
    captureOwnedControls:true, explainsBlockedCapacity:true,
    explicitChairStepper:true, explicitSeatLayoutSelector:true
  });
  refresh();
})();

/* ===== pruebas/distribucion/phase2-validation.js ===== */
(() => {
  if (document.documentElement.dataset.phase2FinalValidation === 'ready') return;
  const validationApi = window.MiGranDiaDistributionEngine?.validation;
  if (!validationApi?.evaluate) throw new Error('Fase H requiere engine.validation.evaluate');

  const legacyValidationMessages = validationMessages;

  function finalValidationResult() {
    const conflicts = typeof conflictIds === 'function' ? Array.from(conflictIds()) : [];
    return validationApi.evaluate({
      elements,
      guests,
      hiddenLayers,
      lockedLayers,
      conflictIds:conflicts,
      scale:typeof currentScale === 'function' ? currentScale() : 32,
      canvas:{ width:1448, height:1086 }
    });
  }

  validationMessages = function phase2FinalValidationMessages() {
    return finalValidationResult().messages;
  };

  window.MiGranDiaDistributionFinalValidationV1 = Object.freeze({
    status:'ready',
    evaluate:finalValidationResult,
    legacyAvailable:typeof legacyValidationMessages === 'function',
    memoryOnly:true,
    canvas:Object.freeze({ width:1448, height:1086 })
  });
  document.documentElement.dataset.phase2FinalValidation = 'ready';
  renderValidation();
})();
