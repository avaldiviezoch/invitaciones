(() => {
  'use strict';

  const VERSION = '20260918-tables-distribution-sync1';
  let applyingRemote = false;
  let publishTimer = 0;
  let lastRemoteStamp = '';

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const finite = (value) => Number.isFinite(Number(value));
  const normalizeShape = (value) => {
    const clean = String(value || '').toLowerCase();
    if (['rect', 'rectangle', 'rectangular'].includes(clean)) return 'rectangular';
    if (['square', 'cuadrada', 'cuadrado'].includes(clean)) return 'square';
    return 'round';
  };
  const normalizeCapacity = (value) => {
    const numeric = Number(value);
    return [4, 6, 8, 10, 12, 14, 16].includes(numeric) ? numeric : 10;
  };

  function tablePayload(item) {
    return {
      id: String(item.id),
      label: String(item.label || 'Mesa'),
      name: String(item.label || 'Mesa'),
      tableShape: normalizeShape(item.tableShape || item.shape),
      capacity: normalizeCapacity(item.capacity),
      seats: Array.isArray(item.seats) ? item.seats.slice(0, normalizeCapacity(item.capacity)) : [],
      x: Number(item.x),
      y: Number(item.y),
      rotation: Number(item.rotation || 0),
      tabletopWidthM: Number(item.tabletopWidthM),
      tabletopHeightM: Number(item.tabletopHeightM),
      clearanceMarginM: Number(item.clearanceMarginM),
      clearanceMarginXM: Number(item.clearanceMarginXM),
      clearanceMarginYM: Number(item.clearanceMarginYM),
      seatLayoutVariant: item.seatLayoutVariant || ''
    };
  }

  function publish(reason = 'mutation') {
    if (applyingRemote || window.parent === window) return;
    clearTimeout(publishTimer);
    publishTimer = setTimeout(() => {
      try {
        window.parent.postMessage({
          type: 'MIGRANDIA_DISTRIBUTION_COMMIT',
          reason,
          payload: {
            version: 1,
            updatedAt: new Date().toISOString(),
            guests: typeof guests !== 'undefined' ? clone(guests) : [],
            tables: typeof elements !== 'undefined'
              ? elements.filter((item) => item?.type === 'table').map(tablePayload)
              : []
          }
        }, '*');
      } catch (_) {}
    }, 35);
  }

  function buildTable(source, previous, index) {
    const capacity = normalizeCapacity(source.capacity);
    const tableShape = normalizeShape(source.tableShape || source.type);
    const fallback = typeof TYPE_DEFAULTS !== 'undefined' ? TYPE_DEFAULTS.table : {
      widthM: 3.4, heightM: 3.4, color: '#d9b978'
    };
    const position = typeof nextPosition === 'function' ? nextPosition(index) : { x: 724, y: 543 };
    const table = {
      ...(previous || {}),
      id: String(source.id),
      type: 'table',
      shape: tableShape === 'round' ? 'table' : 'rect',
      tableShape,
      label: String(source.label || source.name || previous?.label || `Mesa ${index + 1}`),
      x: finite(source.x) ? Number(source.x) : (finite(previous?.x) ? Number(previous.x) : position.x),
      y: finite(source.y) ? Number(source.y) : (finite(previous?.y) ? Number(previous.y) : position.y),
      widthM: Number(previous?.widthM || fallback.widthM || 3.4),
      heightM: Number(previous?.heightM || fallback.heightM || 3.4),
      rotation: finite(source.rotation) ? Number(source.rotation) : Number(previous?.rotation || 0),
      color: previous?.color || fallback.color || '#d9b978',
      locked: Boolean(previous?.locked),
      capacity,
      seats: Array.from({ length: capacity }, (_, seatIndex) => {
        const value = Array.isArray(source.seats) ? source.seats[seatIndex] : null;
        return value ? String(value) : null;
      })
    };

    if (finite(source.tabletopWidthM)) table.tabletopWidthM = Number(source.tabletopWidthM);
    if (finite(source.tabletopHeightM)) table.tabletopHeightM = Number(source.tabletopHeightM);
    if (finite(source.clearanceMarginM)) table.clearanceMarginM = Number(source.clearanceMarginM);
    if (finite(source.clearanceMarginXM)) table.clearanceMarginXM = Number(source.clearanceMarginXM);
    if (finite(source.clearanceMarginYM)) table.clearanceMarginYM = Number(source.clearanceMarginYM);
    if (source.seatLayoutVariant) table.seatLayoutVariant = source.seatLayoutVariant;

    try {
      window.MiGranDiaDistributionEngine?.physicalDimensions?.applyToTable?.(table);
    } catch (_) {}
    if (typeof ensureTableSeats === 'function') ensureTableSeats(table);
    return table;
  }

  function applySnapshot(payload = {}) {
    if (!Array.isArray(payload.tables) || !Array.isArray(payload.guests)) return;
    if (payload.updatedAt && payload.updatedAt === lastRemoteStamp) return;
    lastRemoteStamp = payload.updatedAt || '';

    applyingRemote = true;
    try {
      const previousTables = new Map(
        (typeof elements !== 'undefined' ? elements : [])
          .filter((item) => item?.type === 'table')
          .map((item) => [String(item.id), item])
      );
      const nonTables = (typeof elements !== 'undefined' ? elements : []).filter((item) => item?.type !== 'table');
      const nextTables = payload.tables.map((table, index) =>
        buildTable(table, previousTables.get(String(table.id)), index)
      );

      elements = [...nonTables, ...nextTables];
      guests = payload.guests
        .filter((guest) => guest?.id)
        .map((guest) => ({ ...guest, id: String(guest.id), name: String(guest.name || '') }));

      const numericIds = guests.map((guest) => Number(String(guest.id).match(/(\d+)$/)?.[1] || 0));
      guestUid = Math.max(1, ...numericIds) + 1;

      if (typeof selectedIds !== 'undefined') {
        selectedIds = selectedIds.filter((id) => elements.some((item) => String(item.id) === String(id)));
      }
      if (typeof selectedId !== 'undefined' && selectedId && !elements.some((item) => String(item.id) === String(selectedId))) {
        selectedId = selectedIds?.[0] || '';
      }

      if (typeof render === 'function') render();
      if (typeof saveCurrentProposalSnapshot === 'function') saveCurrentProposalSnapshot();
    } finally {
      applyingRemote = false;
    }
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const message = event.data || {};
    if (message.type === 'MIGRANDIA_TABLES_STATE') applySnapshot(message.payload || {});
  });

  if (typeof commitMutation === 'function') {
    const originalCommitMutation = commitMutation;
    commitMutation = function syncedCommitMutation(...args) {
      const result = originalCommitMutation.apply(this, args);
      publish('commitMutation');
      return result;
    };
  }

  if (typeof undoHistory === 'function') {
    const originalUndo = undoHistory;
    undoHistory = function syncedUndoHistory(...args) {
      const result = originalUndo.apply(this, args);
      publish('undo');
      return result;
    };
  }

  if (typeof redoHistory === 'function') {
    const originalRedo = redoHistory;
    redoHistory = function syncedRedoHistory(...args) {
      const result = originalRedo.apply(this, args);
      publish('redo');
      return result;
    };
  }

  // Los movimientos y algunas ediciones continuas no siempre pasan por commitMutation.
  // Sincronizamos al finalizar la interacción, con debounce, sin tocar storage aquí.
  document.addEventListener('pointerup', () => publish('pointerup'), true);
  document.addEventListener('change', () => publish('change'), true);
  document.addEventListener('keyup', (event) => {
    if (['Delete', 'Backspace', 'Enter'].includes(event.key) || event.ctrlKey || event.metaKey) publish('keyboard');
  }, true);

  function requestSnapshot(reason = 'ready') {
    if (window.parent === window) return;
    try {
      window.parent.postMessage({ type: 'MIGRANDIA_TABLES_REQUEST', reason }, '*');
    } catch (_) {}
  }

  window.MiGranDiaDistributionSync = Object.freeze({
    version: VERSION,
    publish,
    requestSnapshot
  });

  requestSnapshot('bridge-ready');
  window.addEventListener('focus', () => requestSnapshot('focus'));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) requestSnapshot('visibility');
  });
})();
