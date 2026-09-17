/* Distribución Engine consolidado · geometría/mesas/asientos/riesgos · memory-only */

/* ===== pruebas/distribucion/engine/geometry.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;

  const metersToPx = (meters, scale) => Math.max(0, Number(meters) || 0) * Math.max(0, Number(scale) || 0);
  const pxToMeters = (pixels, scale) => (Number(pixels) || 0) / Math.max(1e-9, Number(scale) || 0);
  const degToRad = (degrees) => (Number(degrees) || 0) * Math.PI / 180;

  function rotatePoint(point, degrees) {
    const angle = degToRad(degrees);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = Number(point?.x) || 0;
    const y = Number(point?.y) || 0;
    return { x: x * cos - y * sin, y: x * sin + y * cos };
  }

  function rotatedRectHalfExtents(item, scale) {
    const halfW = Math.max(0.1, Number(item?.widthM) || 0.1) * scale / 2;
    const halfH = Math.max(0.1, Number(item?.heightM) || 0.1) * scale / 2;
    const angle = degToRad(item?.rotation);
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    return { x: cos * halfW + sin * halfH, y: sin * halfW + cos * halfH };
  }

  function tentHalfExtents(item, scale) {
    const points = Array.isArray(item?.pointsM) ? item.pointsM : [];
    if (!points.length) return rotatedRectHalfExtents(item, scale);
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    points.forEach((point) => {
      const rotated = rotatePoint({ x: (Number(point.x) || 0) * scale, y: (Number(point.y) || 0) * scale }, item.rotation);
      minX = Math.min(minX, rotated.x); maxX = Math.max(maxX, rotated.x);
      minY = Math.min(minY, rotated.y); maxY = Math.max(maxY, rotated.y);
    });
    return { x: Math.max(Math.abs(minX), Math.abs(maxX)), y: Math.max(Math.abs(minY), Math.abs(maxY)) };
  }

  function itemHalfExtents(item, scale) {
    if (item?.type === 'tent') return tentHalfExtents(item, scale);
    if (item?.shape === 'table' || item?.shape === 'circle') {
      const radius = Math.max(0.1, Number(item?.widthM) || 0.1) * scale / 2;
      return { x: radius, y: radius };
    }
    return rotatedRectHalfExtents(item, scale);
  }

  function clampItemToCanvas(item, scale, width = CANVAS_W, height = CANVAS_H) {
    if (!item) return false;
    const half = itemHalfExtents(item, scale);
    const minX = Math.min(width / 2, half.x);
    const minY = Math.min(height / 2, half.y);
    const maxX = Math.max(width / 2, width - half.x);
    const maxY = Math.max(height / 2, height - half.y);
    const nextX = Math.max(minX, Math.min(maxX, Number(item.x) || 0));
    const nextY = Math.max(minY, Math.min(maxY, Number(item.y) || 0));
    const changed = nextX !== item.x || nextY !== item.y;
    item.x = nextX;
    item.y = nextY;
    return changed;
  }

  root.geometry = Object.freeze({ CANVAS_W, CANVAS_H, metersToPx, pxToMeters, degToRad, rotatePoint, rotatedRectHalfExtents, tentHalfExtents, itemHalfExtents, clampItemToCanvas });
})();

/* ===== pruebas/distribucion/engine/collisions.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const geometry = root.geometry;
  if (!geometry) throw new Error('geometry.js debe cargarse antes de collisions.js');

  const LEGACY_SCALE = 32;
  const TOLERANCES_M = Object.freeze({ sat: 3 / LEGACY_SCALE, circle: 5 / LEGACY_SCALE, circlePolygon: 3 / LEGACY_SCALE });

  function axes(poly) {
    return poly.map((point, index) => {
      const next = poly[(index + 1) % poly.length];
      const edgeX = next.x - point.x;
      const edgeY = next.y - point.y;
      const length = Math.hypot(edgeX, edgeY) || 1;
      return { x: -edgeY / length, y: edgeX / length };
    });
  }

  function project(poly, axis) {
    const values = poly.map((point) => point.x * axis.x + point.y * axis.y);
    return { min: Math.min(...values), max: Math.max(...values) };
  }

  function satIntersects(a, b, scale) {
    const tolerance = geometry.metersToPx(TOLERANCES_M.sat, scale);
    for (const axis of [...axes(a), ...axes(b)]) {
      const A = project(a, axis);
      const B = project(b, axis);
      if (A.max <= B.min + tolerance || B.max <= A.min + tolerance) return false;
    }
    return true;
  }

  function circleCircleIntersects(a, b, scale) {
    const tolerance = geometry.metersToPx(TOLERANCES_M.circle, scale);
    return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - tolerance;
  }

  function circlePolygonIntersects(circle, poly, scale, pointInPolygon, pointSegmentDistance) {
    if (pointInPolygon(circle, poly)) return true;
    const tolerance = geometry.metersToPx(TOLERANCES_M.circlePolygon, scale);
    for (let index = 0; index < poly.length; index++) {
      if (pointSegmentDistance(circle, poly[index], poly[(index + 1) % poly.length]) < circle.r - tolerance) return true;
    }
    return false;
  }

  root.collisions = Object.freeze({ TOLERANCES_M, axes, project, satIntersects, circleCircleIntersects, circlePolygonIntersects });
})();

/* ===== pruebas/distribucion/engine/clearance.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const TABLE_CLEARANCE_MARGIN_M = 0.60;
  const HIDDEN_LAYER_POLICY = Object.freeze({ visualOnly: true, keepsCapacity: true, keepsAssignments: true, participatesInConflicts: false, participatesInProximity: false });

  function minimumCenterDistanceM(a, b, marginM = TABLE_CLEARANCE_MARGIN_M) {
    return ((Number(a?.widthM) || 0) + (Number(b?.widthM) || 0)) / 2 + marginM;
  }

  function isTooClose(a, b, scale, marginM = TABLE_CLEARANCE_MARGIN_M) {
    const minimum = minimumCenterDistanceM(a, b, marginM) * scale;
    const actual = Math.hypot((Number(a?.x) || 0) - (Number(b?.x) || 0), (Number(a?.y) || 0) - (Number(b?.y) || 0));
    return actual < minimum && actual > 5;
  }

  root.clearance = Object.freeze({ TABLE_CLEARANCE_MARGIN_M, HIDDEN_LAYER_POLICY, minimumCenterDistanceM, isTooClose });
})();

/* ===== pruebas/distribucion/engine/round-table-contract.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};

  const ROUND_TABLE_CONTRACT = Object.freeze({
    id: 'round-current-v1',
    shape: 'round',
    capacity: 10,
    tabletopRadiusM: 0.915,
    tabletopDiameterM: 1.83,
    clearanceDiameterM: 3.40,
    clearanceRadiusM: 1.70,
    chairOrbitFactor: 1.33,
    labelOrbitFactor: 2.18,
    seatStartAngleRad: -Math.PI / 2,
    chairMinRadiusPx: 7,
    chairRadiusFactor: 0.12,
    labelMaxChars: 18,
    labelFontSizePx: 9.5,
    conflictColor: '#c84242',
    selectedColor: '#d59b3c',
    tabletopStroke: '#755e43',
    chairFill: '#fffdf9',
    chairStroke: '#6d655a'
  });

  function dimensionsAtScale(scale) {
    const s = Number(scale) || 32;
    const tabletopRadiusPx = ROUND_TABLE_CONTRACT.tabletopRadiusM * s;
    return Object.freeze({
      scale: s,
      tabletopRadiusPx,
      tabletopDiameterPx: tabletopRadiusPx * 2,
      clearanceRadiusPx: ROUND_TABLE_CONTRACT.clearanceRadiusM * s,
      chairOrbitPx: tabletopRadiusPx * ROUND_TABLE_CONTRACT.chairOrbitFactor,
      labelOrbitPx: tabletopRadiusPx * ROUND_TABLE_CONTRACT.labelOrbitFactor,
      chairRadiusPx: Math.max(ROUND_TABLE_CONTRACT.chairMinRadiusPx, tabletopRadiusPx * ROUND_TABLE_CONTRACT.chairRadiusFactor)
    });
  }

  function seatAngle(index, capacity = ROUND_TABLE_CONTRACT.capacity) {
    return ROUND_TABLE_CONTRACT.seatStartAngleRad + Math.PI * 2 * Number(index) / Number(capacity || ROUND_TABLE_CONTRACT.capacity);
  }

  function normalizeCurrentRoundTable(table) {
    if (!table) return table;
    table.type = 'table';
    table.tableShape = 'round';
    table.shape = 'table';
    table.capacity = ROUND_TABLE_CONTRACT.capacity;
    table.tabletopWidthM = ROUND_TABLE_CONTRACT.tabletopRadiusM * 2;
    table.tabletopHeightM = ROUND_TABLE_CONTRACT.tabletopRadiusM * 2;
    table.widthM = ROUND_TABLE_CONTRACT.clearanceDiameterM;
    table.heightM = ROUND_TABLE_CONTRACT.clearanceDiameterM;
    return table;
  }

  root.roundTableContract = Object.freeze({ ROUND_TABLE_CONTRACT, dimensionsAtScale, seatAngle, normalizeCurrentRoundTable });
})();

/* ===== pruebas/distribucion/engine/square-table-contract.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};

  const SQUARE_TABLE_CONTRACT = Object.freeze({
    id: 'square-v1-cap10',
    shape: 'square',
    capacity: 10,
    tabletopSideM: 1.80,
    clearanceWidthM: 3.40,
    clearanceHeightM: 3.40,
    chairOffsetM: 0.38,
    labelOffsetM: 0.72,
    chairMinRadiusPx: 7,
    chairRadiusFactor: 0.12,
    labelMaxChars: 18,
    labelFontSizePx: 9.5,
    conflictColor: '#c84242',
    selectedColor: '#d59b3c',
    tabletopStroke: '#755e43',
    chairFill: '#fffdf9',
    chairStroke: '#6d655a'
  });

  function dimensionsAtScale(scale = 32) {
    const s = Number(scale) || 32;
    const tabletopSidePx = SQUARE_TABLE_CONTRACT.tabletopSideM * s;
    return Object.freeze({
      scale: s,
      tabletopSidePx,
      tabletopHalfPx: tabletopSidePx / 2,
      clearanceWidthPx: SQUARE_TABLE_CONTRACT.clearanceWidthM * s,
      clearanceHeightPx: SQUARE_TABLE_CONTRACT.clearanceHeightM * s,
      chairRadiusPx: Math.max(SQUARE_TABLE_CONTRACT.chairMinRadiusPx, tabletopSidePx * SQUARE_TABLE_CONTRACT.chairRadiusFactor / 2)
    });
  }

  function perimeterSeatPosition(index, scale = 32) {
    const s = Number(scale) || 32;
    const half = SQUARE_TABLE_CONTRACT.tabletopSideM * s / 2;
    const orbit = half + SQUARE_TABLE_CONTRACT.chairOffsetM * s;
    const positions = [
      { x: -orbit * 0.5, y: -orbit, side: 'top' },
      { x:  orbit * 0.5, y: -orbit, side: 'top' },
      { x:  orbit, y: -orbit * 0.5, side: 'right' },
      { x:  orbit, y: 0, side: 'right' },
      { x:  orbit, y: orbit * 0.5, side: 'right' },
      { x:  orbit * 0.5, y: orbit, side: 'bottom' },
      { x: -orbit * 0.5, y: orbit, side: 'bottom' },
      { x: -orbit, y: orbit * 0.5, side: 'left' },
      { x: -orbit, y: 0, side: 'left' },
      { x: -orbit, y: -orbit * 0.5, side: 'left' }
    ];
    return Object.freeze({ ...positions[Math.max(0, Math.min(9, Number(index) || 0))] });
  }

  function labelPosition(index, scale = 32) {
    const seat = perimeterSeatPosition(index, scale);
    const extra = SQUARE_TABLE_CONTRACT.labelOffsetM * (Number(scale) || 32);
    if (seat.side === 'top') return Object.freeze({ x: seat.x, y: seat.y - extra, anchor: 'middle' });
    if (seat.side === 'bottom') return Object.freeze({ x: seat.x, y: seat.y + extra, anchor: 'middle' });
    if (seat.side === 'right') return Object.freeze({ x: seat.x + extra, y: seat.y, anchor: 'start' });
    return Object.freeze({ x: seat.x - extra, y: seat.y, anchor: 'end' });
  }

  function normalizeSquareTable(table) {
    if (!table) return table;
    table.type = 'table';
    table.tableShape = 'square';
    table.shape = 'rect';
    table.capacity = SQUARE_TABLE_CONTRACT.capacity;
    table.tabletopWidthM = SQUARE_TABLE_CONTRACT.tabletopSideM;
    table.tabletopHeightM = SQUARE_TABLE_CONTRACT.tabletopSideM;
    table.widthM = SQUARE_TABLE_CONTRACT.clearanceWidthM;
    table.heightM = SQUARE_TABLE_CONTRACT.clearanceHeightM;
    return table;
  }

  root.squareTableContract = Object.freeze({ SQUARE_TABLE_CONTRACT, dimensionsAtScale, perimeterSeatPosition, labelPosition, normalizeSquareTable });
})();

/* ===== pruebas/distribucion/engine/rectangular-table-contract.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};

  const RECTANGULAR_TABLE_CONTRACT = Object.freeze({
    id: 'rectangular-v1-cap10',
    shape: 'rectangular',
    capacity: 10,
    tabletopWidthM: 2.40,
    tabletopHeightM: 0.75,
    clearanceWidthM: 4.00,
    clearanceHeightM: 2.35,
    chairOffsetM: 0.38,
    labelOffsetM: 0.72,
    chairMinRadiusPx: 7,
    chairRadiusFactor: 0.12,
    labelMaxChars: 18,
    labelFontSizePx: 9.5,
    conflictColor: '#c84242',
    selectedColor: '#d59b3c',
    tabletopStroke: '#755e43',
    chairFill: '#fffdf9',
    chairStroke: '#6d655a'
  });

  function dimensionsAtScale(scale = 32) {
    const s = Number(scale) || 32;
    const tabletopWidthPx = RECTANGULAR_TABLE_CONTRACT.tabletopWidthM * s;
    const tabletopHeightPx = RECTANGULAR_TABLE_CONTRACT.tabletopHeightM * s;
    return Object.freeze({
      scale: s,
      tabletopWidthPx,
      tabletopHeightPx,
      tabletopHalfWidthPx: tabletopWidthPx / 2,
      tabletopHalfHeightPx: tabletopHeightPx / 2,
      clearanceWidthPx: RECTANGULAR_TABLE_CONTRACT.clearanceWidthM * s,
      clearanceHeightPx: RECTANGULAR_TABLE_CONTRACT.clearanceHeightM * s,
      chairRadiusPx: Math.max(RECTANGULAR_TABLE_CONTRACT.chairMinRadiusPx, tabletopHeightPx * RECTANGULAR_TABLE_CONTRACT.chairRadiusFactor)
    });
  }

  function perimeterSeatPosition(index, scale = 32) {
    const s = Number(scale) || 32;
    const halfW = RECTANGULAR_TABLE_CONTRACT.tabletopWidthM * s / 2;
    const halfH = RECTANGULAR_TABLE_CONTRACT.tabletopHeightM * s / 2;
    const xOrbit = halfW + RECTANGULAR_TABLE_CONTRACT.chairOffsetM * s;
    const yOrbit = halfH + RECTANGULAR_TABLE_CONTRACT.chairOffsetM * s;
    const x1 = halfW * 0.72;
    const x2 = halfW * 0.24;
    const positions = [
      { x: -x1, y: -yOrbit, side: 'top' },
      { x: -x2, y: -yOrbit, side: 'top' },
      { x:  x2, y: -yOrbit, side: 'top' },
      { x:  x1, y: -yOrbit, side: 'top' },
      { x:  xOrbit, y: 0, side: 'right' },
      { x:  x1, y: yOrbit, side: 'bottom' },
      { x:  x2, y: yOrbit, side: 'bottom' },
      { x: -x2, y: yOrbit, side: 'bottom' },
      { x: -x1, y: yOrbit, side: 'bottom' },
      { x: -xOrbit, y: 0, side: 'left' }
    ];
    return Object.freeze({ ...positions[Math.max(0, Math.min(9, Number(index) || 0))] });
  }

  function labelPosition(index, scale = 32) {
    const seat = perimeterSeatPosition(index, scale);
    const extra = RECTANGULAR_TABLE_CONTRACT.labelOffsetM * (Number(scale) || 32);
    if (seat.side === 'top') return Object.freeze({ x: seat.x, y: seat.y - extra, anchor: 'middle' });
    if (seat.side === 'bottom') return Object.freeze({ x: seat.x, y: seat.y + extra, anchor: 'middle' });
    if (seat.side === 'right') return Object.freeze({ x: seat.x + extra, y: seat.y, anchor: 'start' });
    return Object.freeze({ x: seat.x - extra, y: seat.y, anchor: 'end' });
  }

  function normalizeRectangularTable(table) {
    if (!table) return table;
    table.type = 'table';
    table.tableShape = 'rectangular';
    table.shape = 'rect';
    table.capacity = RECTANGULAR_TABLE_CONTRACT.capacity;
    table.tabletopWidthM = RECTANGULAR_TABLE_CONTRACT.tabletopWidthM;
    table.tabletopHeightM = RECTANGULAR_TABLE_CONTRACT.tabletopHeightM;
    table.widthM = RECTANGULAR_TABLE_CONTRACT.clearanceWidthM;
    table.heightM = RECTANGULAR_TABLE_CONTRACT.clearanceHeightM;
    return table;
  }

  root.rectangularTableContract = Object.freeze({ RECTANGULAR_TABLE_CONTRACT, dimensionsAtScale, perimeterSeatPosition, labelPosition, normalizeRectangularTable });
})();

/* ===== pruebas/distribucion/engine/tables.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const round = root.roundTableContract;
  if (!round) throw new Error('round-table-contract.js debe cargar antes de tables.js');

  const contract = round.ROUND_TABLE_CONTRACT;
  const TABLETOP_RADIUS_M = contract.tabletopRadiusM;
  const DEFAULT_CLEARANCE_DIAMETER_M = contract.clearanceDiameterM;
  const CHAIR_ORBIT_FACTOR = contract.chairOrbitFactor;
  const LABEL_ORBIT_FACTOR = contract.labelOrbitFactor;
  const DEFAULT_CAPACITY = contract.capacity;

  function normalizeTable(table) {
    return round.normalizeCurrentRoundTable(table);
  }

  function tabletopRadiusPx(scale) { return round.dimensionsAtScale(scale).tabletopRadiusPx; }
  function chairOrbitPx(scale) { return round.dimensionsAtScale(scale).chairOrbitPx; }
  function labelOrbitPx(scale) { return round.dimensionsAtScale(scale).labelOrbitPx; }

  root.tables = Object.freeze({
    TABLETOP_RADIUS_M,
    DEFAULT_CLEARANCE_DIAMETER_M,
    CHAIR_ORBIT_FACTOR,
    LABEL_ORBIT_FACTOR,
    DEFAULT_CAPACITY,
    contract,
    normalizeTable,
    tabletopRadiusPx,
    chairOrbitPx,
    labelOrbitPx,
    seatAngle: round.seatAngle
  });
})();

/* ===== pruebas/distribucion/engine/seats.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const SUPPORTED_CAPACITIES = Object.freeze([4, 6, 8, 10, 12, 14, 16]);

  function isSupportedCapacity(value) {
    return SUPPORTED_CAPACITIES.includes(Number(value));
  }

  function normalizeCapacity(value, fallback = 10) {
    const numeric = Number(value);
    return isSupportedCapacity(numeric) ? numeric : fallback;
  }

  function ensureSeatArray(table, capacity = Number(table?.capacity) || 10) {
    const target = normalizeCapacity(capacity, 10);
    const source = Array.isArray(table?.seats) ? table.seats : [];
    const current = source.slice(0, target);
    while (current.length < target) current.push(null);
    if (table) {
      table.capacity = target;
      table.seats = current;
    }
    return current;
  }

  function occupiedSeatCount(table) {
    const source = Array.isArray(table?.seats) ? table.seats : [];
    return source.filter(Boolean).length;
  }

  function occupiedBeyondCapacity(table, nextCapacity) {
    const target = Number(nextCapacity);
    if (!Number.isInteger(target) || target < 0) return [];
    const source = Array.isArray(table?.seats) ? table.seats : [];
    return source.slice(target).map((guestId, offset) => guestId ? Object.freeze({ seatNumber: target + offset + 1, guestId }) : null).filter(Boolean);
  }

  function canReduceCapacity(table, nextCapacity) {
    if (!isSupportedCapacity(nextCapacity)) return false;
    const target = Number(nextCapacity);
    const current = normalizeCapacity(table?.capacity, 10);
    if (target >= current) return true;
    return occupiedBeyondCapacity(table, target).length === 0;
  }

  function resizeCapacity(table, nextCapacity) {
    if (!table) return Object.freeze({ ok: false, reason: 'missing-table' });
    if (!isSupportedCapacity(nextCapacity)) return Object.freeze({ ok: false, reason: 'unsupported-capacity' });
    const target = Number(nextCapacity);
    const blocked = occupiedBeyondCapacity(table, target);
    if (blocked.length) return Object.freeze({ ok: false, reason: 'occupied-seats', blocked });
    const previousCapacity = normalizeCapacity(table.capacity, 10);
    ensureSeatArray(table, target);
    return Object.freeze({ ok: true, previousCapacity, capacity: target, blocked: Object.freeze([]) });
  }

  root.seats = Object.freeze({ SUPPORTED_CAPACITIES, isSupportedCapacity, normalizeCapacity, ensureSeatArray, occupiedSeatCount, occupiedBeyondCapacity, canReduceCapacity, resizeCapacity });
})();

/* ===== pruebas/distribucion/engine/physical-dimensions.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const SUPPORTED_CAPACITIES = Object.freeze([4, 6, 8, 10, 12, 14, 16]);
  const CLEARANCE_MARGIN_M = 0.80;
  const CHAIR_OFFSET_M = 0.38;
  const LABEL_OFFSET_M = 0.72;
  const DEFAULT_TABLETOP_M = Object.freeze({
    round:Object.freeze([1.50,1.50]),
    square:Object.freeze([1.80,1.80]),
    rectangular:Object.freeze([2.40,0.75])
  });

  // Estos valores se conservan únicamente como referencia histórica/sugerida,
  // pero la capacidad NUNCA define el tamaño de una mesa existente. Nunca vuelven a
  // recalcular el tablero cuando cambia la cantidad de sillas.
  const ROUND_DIAMETER_M = Object.freeze({ 4:0.90, 6:1.20, 8:1.50, 10:1.50, 12:1.80, 14:2.10, 16:2.40 });
  const SQUARE_SIDE_M = Object.freeze({ 4:0.90, 6:1.20, 8:1.50, 10:1.80, 12:2.00, 14:2.20, 16:2.40 });
  const RECTANGULAR_M = Object.freeze({
    4:Object.freeze([1.20,0.75]), 6:Object.freeze([1.80,0.75]), 8:Object.freeze([1.80,0.75]),
    10:Object.freeze([2.40,0.75]), 12:Object.freeze([2.40,1.00]), 14:Object.freeze([3.00,1.00]), 16:Object.freeze([3.60,1.00])
  });

  function capacity(value) {
    const numeric = Number(value);
    if (!SUPPORTED_CAPACITIES.includes(numeric)) throw new Error(`Capacidad física no soportada: ${value}`);
    return numeric;
  }

  function normalizeShape(value) {
    return value === 'square' || value === 'rectangular' ? value : 'round';
  }

  function suggestedDimensionsFor(shapeValue, capacityValue) {
    const shape = normalizeShape(shapeValue);
    const seats = capacity(capacityValue);
    let tabletopWidthM, tabletopHeightM;
    if (shape === 'round') tabletopWidthM = tabletopHeightM = ROUND_DIAMETER_M[seats];
    else if (shape === 'square') tabletopWidthM = tabletopHeightM = SQUARE_SIDE_M[seats];
    else [tabletopWidthM, tabletopHeightM] = RECTANGULAR_M[seats];
    return Object.freeze({ shape, capacity:seats, tabletopWidthM, tabletopHeightM });
  }

  function clampTabletop(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0.20, Math.min(20, numeric)) : fallback;
  }

  function ensureTabletopDimensions(table) {
    if (!table || table.type !== 'table') return null;
    const shape = normalizeShape(table.tableShape);
    const seats = root.seats?.normalizeCapacity
      ? root.seats.normalizeCapacity(table.capacity, 10)
      : (SUPPORTED_CAPACITIES.includes(Number(table.capacity)) ? Number(table.capacity) : 10);

    const defaults = DEFAULT_TABLETOP_M[shape];
    let tabletopWidthM = clampTabletop(table.tabletopWidthM, defaults[0]);
    let tabletopHeightM = clampTabletop(table.tabletopHeightM, defaults[1]);

    // Redonda y cuadrada conservan una sola medida física.
    if (shape === 'round' || shape === 'square') {
      const canonical = clampTabletop(table.tabletopWidthM ?? table.tabletopHeightM, defaults[0]);
      tabletopWidthM = canonical;
      tabletopHeightM = canonical;
    }

    table.tabletopWidthM = tabletopWidthM;
    table.tabletopHeightM = tabletopHeightM;
    return Object.freeze({ shape, capacity:seats, tabletopWidthM, tabletopHeightM });
  }

  // Compatibilidad: dimensionsFor sigue devolviendo la sugerencia histórica,
  // pero ya no debe usarse como fuente de verdad para una mesa existente.
  function dimensionsFor(shapeValue, capacityValue) {
    const base = suggestedDimensionsFor(shapeValue, capacityValue);
    const clearanceWidthM = base.tabletopWidthM + CLEARANCE_MARGIN_M * 2;
    const clearanceHeightM = base.tabletopHeightM + CLEARANCE_MARGIN_M * 2;
    return Object.freeze({
      ...base,
      clearanceWidthM,
      clearanceHeightM,
      chairOffsetM:CHAIR_OFFSET_M,
      labelOffsetM:LABEL_OFFSET_M
    });
  }

  function dimensionsForTable(table) {
    const base = ensureTabletopDimensions(table);
    if (!base) return null;
    const clearanceWidthM = base.tabletopWidthM + CLEARANCE_MARGIN_M * 2;
    const clearanceHeightM = base.tabletopHeightM + CLEARANCE_MARGIN_M * 2;
    return Object.freeze({
      ...base,
      clearanceWidthM,
      clearanceHeightM,
      chairOffsetM:CHAIR_OFFSET_M,
      labelOffsetM:LABEL_OFFSET_M
    });
  }

  function dimensionsAtScale(shape, seats, scale = 32) {
    const meters = dimensionsFor(shape, seats);
    const s = Number(scale) || 32;
    return Object.freeze({
      ...meters,
      scale:s,
      tabletopWidthPx:meters.tabletopWidthM*s,
      tabletopHeightPx:meters.tabletopHeightM*s,
      clearanceWidthPx:meters.clearanceWidthM*s,
      clearanceHeightPx:meters.clearanceHeightM*s,
      chairOffsetPx:CHAIR_OFFSET_M*s,
      labelOffsetPx:LABEL_OFFSET_M*s
    });
  }

  function dimensionsAtScaleForTable(table, scale = 32) {
    const meters = dimensionsForTable(table);
    if (!meters) return null;
    const s = Number(scale) || 32;
    return Object.freeze({
      ...meters,
      scale:s,
      tabletopWidthPx:meters.tabletopWidthM*s,
      tabletopHeightPx:meters.tabletopHeightM*s,
      clearanceWidthPx:meters.clearanceWidthM*s,
      clearanceHeightPx:meters.clearanceHeightM*s,
      chairOffsetPx:CHAIR_OFFSET_M*s,
      labelOffsetPx:LABEL_OFFSET_M*s
    });
  }

  function setTabletopDimensions(table, widthM, heightM = widthM) {
    if (!table || table.type !== 'table') return table;
    const shape = normalizeShape(table.tableShape);
    const current = ensureTabletopDimensions(table);
    let width = clampTabletop(widthM, current.tabletopWidthM);
    let height = clampTabletop(heightM, current.tabletopHeightM);
    if (shape === 'round' || shape === 'square') height = width;
    table.tabletopWidthM = width;
    table.tabletopHeightM = height;
    return applyToTable(table);
  }

  function applyToTable(table) {
    if (!table || table.type !== 'table') return table;
    const dims = dimensionsForTable(table);
    table.tableShape = dims.shape;
    table.capacity = dims.capacity;
    table.shape = dims.shape === 'round' ? 'table' : 'rect';

    // widthM/heightM siguen representando geometría funcional para límites y
    // colisiones; el tablero real vive en tabletopWidthM/tabletopHeightM.
    table.widthM = dims.clearanceWidthM;
    table.heightM = dims.clearanceHeightM;
    return table;
  }

  root.physicalDimensions = Object.freeze({
    SUPPORTED_CAPACITIES,
    CLEARANCE_MARGIN_M,
    CHAIR_OFFSET_M,
    LABEL_OFFSET_M,
    ROUND_DIAMETER_M,
    SQUARE_SIDE_M,
    RECTANGULAR_M,
    DEFAULT_TABLETOP_M,
    suggestedDimensionsFor,
    dimensionsFor,
    dimensionsForTable,
    dimensionsAtScale,
    dimensionsAtScaleForTable,
    ensureTabletopDimensions,
    setTabletopDimensions,
    applyToTable
  });
})();

/* ===== pruebas/distribucion/engine/table-transition.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const seats = root.seats;
  const physical = root.physicalDimensions;
  if (!seats || !physical) throw new Error('table-transition requiere seats y physicalDimensions');

  const SUPPORTED_SHAPES = Object.freeze(['round', 'square', 'rectangular']);

  function normalizeShape(value, fallback = 'round') {
    return SUPPORTED_SHAPES.includes(value) ? value : fallback;
  }

  function snapshot(table) {
    return Object.freeze({
      id: table.id,
      x: table.x,
      y: table.y,
      rotation: table.rotation,
      label: table.label,
      color: table.color,
      locked: table.locked,
      layerId: table.layerId,
      capacity: seats.normalizeCapacity(table.capacity, 10),
      tableShape: normalizeShape(table.tableShape),
      tabletopWidthM: Number(table.tabletopWidthM),
      tabletopHeightM: Number(table.tabletopHeightM),
      seats: Object.freeze((Array.isArray(table.seats) ? table.seats : []).slice())
    });
  }

  function plan(table, request = {}) {
    if (!table || table.type !== 'table') return Object.freeze({ ok:false, reason:'missing-table' });
    const before = snapshot(table);
    const shape = normalizeShape(request.shape, before.tableShape);
    const capacity = seats.normalizeCapacity(request.capacity, before.capacity);
    const blocked = capacity < before.capacity ? seats.occupiedBeyondCapacity(table, capacity) : [];
    if (blocked.length) return Object.freeze({ ok:false, reason:'occupied-seats', blocked:Object.freeze(Array.from(blocked)), before, shape, capacity });
    const nextSeats = before.seats.slice(0, capacity);
    while (nextSeats.length < capacity) nextSeats.push(null);
    return Object.freeze({ ok:true, before, shape, capacity, seats:Object.freeze(nextSeats) });
  }

  function transition(table, request = {}) {
    const prepared = plan(table, request);
    if (!prepared.ok) return prepared;

    const shapeChanged = prepared.shape !== prepared.before.tableShape;
    table.tableShape = prepared.shape;
    table.capacity = prepared.capacity;
    table.seats = Array.from(prepared.seats);

    // Cambiar TIPO adopta el tamaño por defecto de ese tipo.
    // Cambiar CAPACIDAD conserva siempre las dimensiones físicas existentes.
    if (shapeChanged) {
      const defaults = physical.DEFAULT_TABLETOP_M[prepared.shape];
      table.tabletopWidthM = defaults[0];
      table.tabletopHeightM = defaults[1];
    } else {
      table.tabletopWidthM = prepared.before.tabletopWidthM;
      table.tabletopHeightM = prepared.before.tabletopHeightM;
    }
    physical.applyToTable(table);

    return Object.freeze({
      ok:true,
      before:prepared.before,
      shape:table.tableShape,
      capacity:table.capacity,
      seats:Object.freeze(table.seats.slice()),
      widthM:table.widthM,
      heightM:table.heightM,
      identityPreserved:table.id === prepared.before.id,
      positionPreserved:table.x === prepared.before.x && table.y === prepared.before.y,
      rotationPreserved:table.rotation === prepared.before.rotation,
      shapeChanged,
      tabletopWidthM:table.tabletopWidthM,
      tabletopHeightM:table.tabletopHeightM
    });
  }

  root.tableTransition = Object.freeze({ SUPPORTED_SHAPES, normalizeShape, snapshot, plan, transition });
})();

/* ===== pruebas/distribucion/engine/capacity-layout.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const supported = root.seats?.SUPPORTED_CAPACITIES || Object.freeze([4,6,8,10,12,14,16]);

  const ROUND_VARIANTS = Object.freeze({
    default:Object.freeze({ id:'default', label:'Radial · silla arriba', phase:'north' }),
    offset:Object.freeze({ id:'offset', label:'Radial · giro medio paso', phase:'half-step' })
  });

  const SQUARE_MATRIX = Object.freeze({
    4:Object.freeze([Object.freeze({id:'balanced',label:'1 · 1 · 1 · 1',counts:Object.freeze([1,1,1,1])})]),
    6:Object.freeze([
      Object.freeze({id:'horizontal',label:'2 · 1 · 2 · 1',counts:Object.freeze([2,1,2,1])}),
      Object.freeze({id:'vertical',label:'1 · 2 · 1 · 2',counts:Object.freeze([1,2,1,2])})
    ]),
    8:Object.freeze([Object.freeze({id:'balanced',label:'2 · 2 · 2 · 2',counts:Object.freeze([2,2,2,2])})]),
    10:Object.freeze([
      Object.freeze({id:'legacy',label:'2 · 3 · 2 · 3',counts:Object.freeze([2,3,2,3])}),
      Object.freeze({id:'rotated',label:'3 · 2 · 3 · 2',counts:Object.freeze([3,2,3,2])})
    ]),
    12:Object.freeze([Object.freeze({id:'balanced',label:'3 · 3 · 3 · 3',counts:Object.freeze([3,3,3,3])})]),
    14:Object.freeze([
      Object.freeze({id:'horizontal',label:'4 · 3 · 4 · 3',counts:Object.freeze([4,3,4,3])}),
      Object.freeze({id:'vertical',label:'3 · 4 · 3 · 4',counts:Object.freeze([3,4,3,4])})
    ]),
    16:Object.freeze([Object.freeze({id:'balanced',label:'4 · 4 · 4 · 4',counts:Object.freeze([4,4,4,4])})])
  });

  const RECTANGULAR_MATRIX = Object.freeze({
    4:Object.freeze([
      Object.freeze({id:'long-sides',label:'2 · 0 · 2 · 0',counts:Object.freeze([2,0,2,0])}),
      Object.freeze({id:'all-sides',label:'1 · 1 · 1 · 1',counts:Object.freeze([1,1,1,1])})
    ]),
    6:Object.freeze([
      Object.freeze({id:'ends',label:'2 · 1 · 2 · 1',counts:Object.freeze([2,1,2,1])}),
      Object.freeze({id:'long-sides',label:'3 · 0 · 3 · 0',counts:Object.freeze([3,0,3,0])})
    ]),
    8:Object.freeze([
      Object.freeze({id:'ends',label:'3 · 1 · 3 · 1',counts:Object.freeze([3,1,3,1])}),
      Object.freeze({id:'long-sides',label:'4 · 0 · 4 · 0',counts:Object.freeze([4,0,4,0])})
    ]),
    10:Object.freeze([
      Object.freeze({id:'legacy',label:'4 · 1 · 4 · 1',counts:Object.freeze([4,1,4,1])}),
      Object.freeze({id:'long-sides',label:'5 · 0 · 5 · 0',counts:Object.freeze([5,0,5,0])})
    ]),
    12:Object.freeze([
      Object.freeze({id:'ends',label:'5 · 1 · 5 · 1',counts:Object.freeze([5,1,5,1])}),
      Object.freeze({id:'double-ends',label:'4 · 2 · 4 · 2',counts:Object.freeze([4,2,4,2])}),
      Object.freeze({id:'long-sides',label:'6 · 0 · 6 · 0',counts:Object.freeze([6,0,6,0])})
    ]),
    14:Object.freeze([
      Object.freeze({id:'ends',label:'6 · 1 · 6 · 1',counts:Object.freeze([6,1,6,1])}),
      Object.freeze({id:'double-ends',label:'5 · 2 · 5 · 2',counts:Object.freeze([5,2,5,2])}),
      Object.freeze({id:'long-sides',label:'7 · 0 · 7 · 0',counts:Object.freeze([7,0,7,0])})
    ]),
    16:Object.freeze([
      Object.freeze({id:'ends',label:'7 · 1 · 7 · 1',counts:Object.freeze([7,1,7,1])}),
      Object.freeze({id:'double-ends',label:'6 · 2 · 6 · 2',counts:Object.freeze([6,2,6,2])}),
      Object.freeze({id:'long-sides',label:'8 · 0 · 8 · 0',counts:Object.freeze([8,0,8,0])})
    ])
  });

  function assertCapacity(capacity) {
    const value = Number(capacity);
    if (!supported.includes(value)) throw new Error(`Capacidad no soportada: ${capacity}`);
    return value;
  }

  function normalizeShape(shape) {
    return shape === 'square' || shape === 'rectangular' ? shape : 'round';
  }

  function layoutVariants(shapeValue, capacityValue) {
    const shape = normalizeShape(shapeValue);
    const capacity = assertCapacity(capacityValue);
    if (shape === 'round') return Object.freeze(Object.values(ROUND_VARIANTS));
    return shape === 'square' ? SQUARE_MATRIX[capacity] : RECTANGULAR_MATRIX[capacity];
  }

  function normalizeVariant(shapeValue, capacityValue, variantValue) {
    const variants = layoutVariants(shapeValue, capacityValue);
    const requested = String(variantValue || '');
    return variants.find((variant) => variant.id === requested)?.id || variants[0].id;
  }

  function variantDefinition(shapeValue, capacityValue, variantValue) {
    const variants = layoutVariants(shapeValue, capacityValue);
    const id = normalizeVariant(shapeValue, capacityValue, variantValue);
    return variants.find((variant) => variant.id === id) || variants[0];
  }

  function roundPositions(capacity, radiusPx, variantValue = 'default') {
    const total = assertCapacity(capacity);
    const variant = variantDefinition('round', total, variantValue);
    const step = Math.PI * 2 / total;
    const phase = variant.phase === 'half-step' ? step / 2 : 0;
    return Object.freeze(Array.from({ length: total }, (_, index) => {
      const angle = step * index - Math.PI / 2 + phase;
      return Object.freeze({ x: Math.cos(angle) * radiusPx, y: Math.sin(angle) * radiusPx, angle, side: 'round' });
    }));
  }

  function balancedSideCounts(capacity, rectangular = false, variantValue = null) {
    const total = assertCapacity(capacity);
    const shape = rectangular ? 'rectangular' : 'square';
    return variantDefinition(shape, total, variantValue).counts;
  }

  function sidePoints(count, side, halfW, halfH, offsetPx) {
    if (!count) return [];
    const points = [];
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1);
      if (side === 'top') points.push({ x: -halfW + t * halfW * 2, y: -(halfH + offsetPx), side });
      if (side === 'right') points.push({ x: halfW + offsetPx, y: -halfH + t * halfH * 2, side });
      if (side === 'bottom') points.push({ x: halfW - t * halfW * 2, y: halfH + offsetPx, side });
      if (side === 'left') points.push({ x: -(halfW + offsetPx), y: halfH - t * halfH * 2, side });
    }
    return points;
  }

  function rectPositions(capacity, widthPx, heightPx, offsetPx, rectangular = false, variantValue = null) {
    const [top,right,bottom,left] = balancedSideCounts(capacity, rectangular, variantValue);
    const halfW = widthPx / 2;
    const halfH = heightPx / 2;
    const points = [
      ...sidePoints(top,'top',halfW,halfH,offsetPx),
      ...sidePoints(right,'right',halfW,halfH,offsetPx),
      ...sidePoints(bottom,'bottom',halfW,halfH,offsetPx),
      ...sidePoints(left,'left',halfW,halfH,offsetPx)
    ];
    if (points.length !== Number(capacity)) throw new Error(`Acomodo inválido: ${points.length}/${capacity}`);
    return Object.freeze(points.map(Object.freeze));
  }

  function positionsFor(shapeValue, capacityValue, dimensions, variantValue = null) {
    const shape = normalizeShape(shapeValue);
    const capacity = assertCapacity(capacityValue);
    const variant = normalizeVariant(shape, capacity, variantValue);
    if (shape === 'round') return roundPositions(capacity, dimensions.tabletopWidthPx / 2 + dimensions.chairOffsetPx, variant);
    return rectPositions(capacity, dimensions.tabletopWidthPx, dimensions.tabletopHeightPx, dimensions.chairOffsetPx, shape === 'rectangular', variant);
  }

  function labelFromSeat(seat, extraPx) {
    if (seat.side === 'round') return Object.freeze({ x: seat.x * 1.64, y: seat.y * 1.64, anchor: Math.cos(seat.angle) > .28 ? 'start' : Math.cos(seat.angle) < -.28 ? 'end' : 'middle' });
    if (seat.side === 'top') return Object.freeze({ x: seat.x, y: seat.y - extraPx, anchor: 'middle' });
    if (seat.side === 'bottom') return Object.freeze({ x: seat.x, y: seat.y + extraPx, anchor: 'middle' });
    if (seat.side === 'right') return Object.freeze({ x: seat.x + extraPx, y: seat.y, anchor: 'start' });
    return Object.freeze({ x: seat.x - extraPx, y: seat.y, anchor: 'end' });
  }

  root.capacityLayout = Object.freeze({
    assertCapacity, normalizeShape, layoutVariants, normalizeVariant, variantDefinition,
    roundPositions, balancedSideCounts, rectPositions, positionsFor, labelFromSeat,
    ROUND_VARIANTS, SQUARE_MATRIX, RECTANGULAR_MATRIX
  });
})();

/* ===== pruebas/distribucion/engine/measurements.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  function normalizeMeasurement(item) {
    if (!item) return null;
    if (Number.isFinite(item.x1)) return { id: item.id, start: { x: item.x1, y: item.y1 }, end: { x: item.x2, y: item.y2 } };
    if (item.a && item.b) return { id: item.id, start: item.a, end: item.b };
    if (item.start && item.end) return { id: item.id, start: item.start, end: item.end };
    return null;
  }
  function distancePx(item) {
    const normalized = normalizeMeasurement(item);
    if (!normalized) return 0;
    return Math.hypot(normalized.end.x - normalized.start.x, normalized.end.y - normalized.start.y);
  }
  function distanceM(item, scale) { return distancePx(item) / Math.max(1e-9, Number(scale) || 0); }
  root.measurements = Object.freeze({ normalizeMeasurement, distancePx, distanceM });
})();

/* ===== pruebas/distribucion/engine/validation.js ===== */
(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};

  function capacitySummary(tables, guestCount) {
    const capacity = (tables || []).reduce((sum, table) => sum + (Number(table.capacity) || 0), 0);
    const guests = Math.max(0, Number(guestCount) || 0);
    return { capacity, guests, sufficient: capacity >= guests };
  }

  function assignmentAudit(guests, tables) {
    const guestIds = new Set((guests || []).map((guest) => guest?.id).filter(Boolean));
    const assigned = new Map();
    const unknown = [];
    const duplicates = [];
    const beyondCapacity = [];
    (tables || []).forEach((table) => {
      const capacity = Math.max(0, Number(table?.capacity) || 0);
      (Array.isArray(table?.seats) ? table.seats : []).forEach((guestId, index) => {
        if (!guestId) return;
        if (index >= capacity) beyondCapacity.push({ tableId:table.id, seatNumber:index + 1, guestId });
        if (!guestIds.has(guestId)) unknown.push({ tableId:table.id, seatNumber:index + 1, guestId });
        if (assigned.has(guestId)) duplicates.push({ guestId, first:assigned.get(guestId), duplicate:{ tableId:table.id, seatNumber:index + 1 } });
        else assigned.set(guestId, { tableId:table.id, seatNumber:index + 1 });
      });
    });
    return { assigned, unknown, duplicates, beyondCapacity };
  }

  function unassignedGuests(guests, tables) {
    const audit = assignmentAudit(guests, tables);
    return (guests || []).filter((guest) => guest?.id && !audit.assigned.has(guest.id));
  }

  function outOfBounds(elements, scale = 32, canvas = { width:1448, height:1086 }) {
    const geometry = root.geometry;
    if (!geometry?.itemHalfExtents) return [];
    return (elements || []).filter((item) => {
      const half = geometry.itemHalfExtents(item, scale);
      const x = Number(item?.x) || 0, y = Number(item?.y) || 0;
      return x - half.x < 0 || y - half.y < 0 || x + half.x > canvas.width || y + half.y > canvas.height;
    }).map((item) => item.id);
  }

  function proximityPairs(tables, scale = 32) {
    const clearance = root.clearance;
    if (!clearance?.isTooClose) return [];
    const pairs = [];
    for (let i = 0; i < tables.length; i += 1) for (let j = i + 1; j < tables.length; j += 1) {
      if (clearance.isTooClose(tables[i], tables[j], scale)) pairs.push([tables[i].id, tables[j].id]);
    }
    return pairs;
  }

  function evaluate({ elements = [], guests = [], hiddenLayers = {}, lockedLayers = {}, conflictIds = [], scale = 32, canvas = { width:1448, height:1086 } } = {}) {
    const tables = elements.filter((item) => item?.type === 'table');
    const visible = elements.filter((item) => !hiddenLayers[item?.type]);
    const visibleTables = visible.filter((item) => item?.type === 'table');
    const conflicts = Array.from(new Set(conflictIds || []));
    const assignments = assignmentAudit(guests, tables);
    const unassigned = guests.filter((guest) => guest?.id && !assignments.assigned.has(guest.id));
    const capacity = capacitySummary(tables, guests.length);
    const proximity = proximityPairs(visibleTables, scale);
    const outside = outOfBounds(visible, scale, canvas);
    const hiddenCount = elements.length - visible.length;
    const lockedCount = elements.filter((item) => item?.locked || lockedLayers[item?.type]).length;

    const messages = [];
    messages.push(conflicts.length ? { type:'bad', code:'overlap', text:`Hay ${conflicts.length} elemento(s) involucrados en superposición.` } : { type:'good', code:'overlap', text:'No se detectaron superposiciones entre mobiliarios.' });
    messages.push(proximity.length ? { type:'warn', code:'proximity', text:`Se detectaron ${proximity.length} pares de mesas con menos de 60 cm libres entre sus áreas de circulación.` } : { type:'good', code:'proximity', text:'Las mesas visibles respetan la separación adicional de 60 cm.' });
    messages.push(unassigned.length ? { type:'warn', code:'unassigned', text:`Quedan ${unassigned.length} invitado(s) sin asignar.` } : { type:'good', code:'unassigned', text:'Todos los invitados están asignados.' });
    messages.push(capacity.sufficient ? { type:'good', code:'capacity', text:`La capacidad total (${capacity.capacity}) es suficiente para ${capacity.guests} invitado(s).` } : { type:'bad', code:'capacity', text:`La capacidad total (${capacity.capacity}) es menor al número de invitados (${capacity.guests}).` });
    if (assignments.beyondCapacity.length) messages.push({ type:'bad', code:'seat-range', text:`Hay ${assignments.beyondCapacity.length} asignación(es) en asientos fuera de la capacidad de su mesa.` });
    if (assignments.unknown.length) messages.push({ type:'bad', code:'unknown-guests', text:`Hay ${assignments.unknown.length} asiento(s) con invitados que no existen en el maestro de la sesión.` });
    if (assignments.duplicates.length) messages.push({ type:'bad', code:'duplicate-guests', text:`Hay ${assignments.duplicates.length} invitado(s) asignados más de una vez.` });
    if (outside.length) messages.push({ type:'bad', code:'bounds', text:`Hay ${outside.length} elemento(s) fuera de los límites del plano.` });
    if (hiddenCount) messages.push({ type:'good', code:'hidden-layers', text:`${hiddenCount} elemento(s) están ocultos visualmente; conservan capacidad/asignaciones y no participan en conflictos visibles.` });
    if (lockedCount) messages.push({ type:'good', code:'locked', text:`${lockedCount} elemento(s) o capa(s) están bloqueados contra edición.` });

    const blockingCodes = new Set(messages.filter((msg) => msg.type === 'bad').map((msg) => msg.code));
    return Object.freeze({
      valid:blockingCodes.size === 0,
      messages:Object.freeze(messages),
      summary:Object.freeze({ conflicts:conflicts.length, proximityPairs:proximity.length, unassigned:unassigned.length, capacity:capacity.capacity, guests:capacity.guests, beyondCapacity:assignments.beyondCapacity.length, unknownGuests:assignments.unknown.length, duplicateGuests:assignments.duplicates.length, outOfBounds:outside.length, hidden:hiddenCount, locked:lockedCount }),
      details:Object.freeze({ conflicts:Object.freeze(conflicts), proximity:Object.freeze(proximity), unassigned:Object.freeze(unassigned.map((g) => g.id)), outOfBounds:Object.freeze(outside) })
    });
  }

  root.validation = Object.freeze({ capacitySummary, assignmentAudit, unassignedGuests, outOfBounds, proximityPairs, evaluate });
})();

/* ===== pruebas/distribucion/state/memory-store.js ===== */
(() => {
  const root = window.MiGranDiaDistributionState ||= {};
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function createMemoryStore(initialState = {}) {
    let state = clone(initialState);
    const listeners = new Set();
    return Object.freeze({
      getState() { return clone(state); },
      replace(nextState) { state = clone(nextState || {}); listeners.forEach((fn) => fn(clone(state))); },
      update(mutator) { const draft = clone(state); mutator(draft); state = draft; listeners.forEach((fn) => fn(clone(state))); },
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    });
  }
  root.createMemoryStore = createMemoryStore;
})();

/* ===== pruebas/distribucion/phase2-sanitize.js ===== */
(() => {
  if (document.documentElement.dataset.phase2Sanitize === 'ready') return;
  document.documentElement.dataset.phase2Sanitize = 'ready';

  const engine = window.MiGranDiaDistributionEngine;
  if (!engine?.geometry || !engine?.collisions || !engine?.clearance) {
    throw new Error('El engine modular de Distribución no está disponible.');
  }

  const { geometry, collisions, clearance } = engine;
  const { CANVAS_W, CANVAS_H, metersToPx, itemHalfExtents, clampItemToCanvas } = geometry;
  const { TOLERANCES_M, satIntersects, circleCircleIntersects, circlePolygonIntersects } = collisions;
  const { HIDDEN_LAYER_POLICY } = clearance;

  polygonIntersectsPolygon = function modularPolygonIntersectsPolygon(a, b) {
    return satIntersects(a, b, currentScale());
  };

  intersects = function modularIntersects(a, b) {
    const aCircle = a.shape === 'table' || a.shape === 'circle';
    const bCircle = b.shape === 'table' || b.shape === 'circle';
    const scale = currentScale();
    if (aCircle && bCircle) return circleCircleIntersects(circleGeom(a), circleGeom(b), scale);
    if (!aCircle && !bCircle) return satIntersects(rectPolygon(a), rectPolygon(b), scale);
    const circle = aCircle ? circleGeom(a) : circleGeom(b);
    const poly = aCircle ? rectPolygon(b) : rectPolygon(a);
    return circlePolygonIntersects(circle, poly, scale, pointInPolygon, pointSegmentDistance);
  };

  function clampAllToCanvas() {
    let changed = false;
    elements.forEach((item) => {
      if (clampItemToCanvas(item, currentScale(), CANVAS_W, CANVAS_H)) changed = true;
    });
    return changed;
  }

  const originalCommitMutation = commitMutation;
  commitMutation = function modularCommitMutation() {
    clampAllToCanvas();
    originalCommitMutation();
  };

  const originalRestoreState = restoreState;
  restoreState = function modularRestoreState(state) {
    originalRestoreState(state);
    const validIds = new Set(elements.map((item) => item.id));
    selectedIds = selectedIds.filter((id) => validIds.has(id) && !hiddenLayers[getItem(id)?.type]);
    selectedId = selectedIds.includes(selectedId) ? selectedId : (selectedIds[0] || '');
    measureDraft = null;
    drawingTent = false;
    tentDraft = [];
    tentHoverPoint = null;
    guideLines = { vertical: null, horizontal: null };
    drawLayer?.replaceChildren();
    guideLayer?.replaceChildren();
    if (clampAllToCanvas()) render();
  };

  planner.addEventListener('pointermove', () => {
    if (clampAllToCanvas()) render();
  });

  const canvasWrap = document.getElementById('canvasWrap');
  const touchFocus = new Map();
  let pinchViewport = null;

  function touchMidpoint() {
    const points = [...touchFocus.values()];
    if (points.length < 2) return null;
    return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
  }

  function beginFocusedPinch() {
    if (!canvasWrap || touchFocus.size !== 2) return;
    const midpoint = touchMidpoint();
    const rect = canvasWrap.getBoundingClientRect();
    pinchViewport = {
      localX: midpoint.x - rect.left,
      localY: midpoint.y - rect.top,
      contentX: (canvasWrap.scrollLeft + midpoint.x - rect.left) / (Number(zoom) || 1),
      contentY: (canvasWrap.scrollTop + midpoint.y - rect.top) / (Number(zoom) || 1)
    };
  }

  function keepPinchFocus() {
    if (!canvasWrap || !pinchViewport || touchFocus.size < 2) return;
    requestAnimationFrame(() => {
      const nextZoom = Number(zoom) || 1;
      canvasWrap.scrollLeft = Math.max(0, pinchViewport.contentX * nextZoom - pinchViewport.localX);
      canvasWrap.scrollTop = Math.max(0, pinchViewport.contentY * nextZoom - pinchViewport.localY);
    });
  }

  if (canvasWrap) {
    canvasWrap.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') return;
      touchFocus.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchFocus.size === 2) beginFocusedPinch();
    }, { capture: true, passive: false });
    canvasWrap.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'touch' || !touchFocus.has(event.pointerId)) return;
      touchFocus.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchFocus.size >= 2) keepPinchFocus();
    }, { capture: true, passive: false });
    const endTouch = (event) => {
      if (event.pointerType !== 'touch') return;
      touchFocus.delete(event.pointerId);
      if (touchFocus.size < 2) pinchViewport = null;
    };
    canvasWrap.addEventListener('pointerup', endTouch, { capture: true, passive: false });
    canvasWrap.addEventListener('pointercancel', endTouch, { capture: true, passive: false });
  }

  window.MiGranDiaDistributionSanitization = Object.freeze({
    status: 'ready',
    engineModular: true,
    tolerancesMeters: TOLERANCES_M,
    hiddenLayerPolicy: HIDDEN_LAYER_POLICY,
    metersToPx,
    satIntersects,
    circlePolygonIntersects: (circle, poly, scale) => circlePolygonIntersects(circle, poly, scale, pointInPolygon, pointSegmentDistance),
    itemHalfExtents,
    clampItemToCanvas,
    clampAllToCanvas,
    touchFocusPreserved: true,
    historyTransientsClearedOnRestore: true
  });
})();
