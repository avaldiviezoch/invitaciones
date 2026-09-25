import { GUEST_STORAGE_KEY, loadInvitadosSnapshot, saveInvitadosSnapshot } from '../invitados/invitados-data.js?v=5';
import {
  MIN_TABLE_METERS,
  MAX_TABLE_METERS,
  createTableDimensions,
  normalizeTableMeters,
  normalizeTableShape,
  standardTablePhysicalDimensions,
  tablePhysicalDimensions
} from '../invitados/table-geometry.js?v=5';
import { readPlannerStorageKey, subscribePlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js?v=6';
import { weddingCapabilities } from '../../core/app/permissions.js';
import { setupDistributionCamera } from './camera.js?v=9';
import {
  DEFAULT_BACKGROUND_ID,
  addDistributionBackground,
  listDistributionBackgrounds,
  loadDistributionBackground,
  readDistributionBackgroundPreference,
  removeDistributionBackground,
  writeDistributionBackgroundPreference
} from './background-catalog.js?v=3';

const TEMPLATE_URL = new URL('./index.html?v=54', import.meta.url);
const DISTRIBUTION_STORAGE_KEY = 'planificador_bodas_distribucion_v1';
const DEFAULT_PROPOSAL_ID = 'proposal_main';
const ROTATION_STEP = 1;
const KEYBOARD_MOVE_STEP = 10;
const KEYBOARD_MOVE_FINE_STEP = 1;
const WORLD_PADDING = 90;
const PLAN_WIDTH = 1448;
const PLAN_HEIGHT = 1086;
const PLAN_SCALE = Object.freeze({
  pixelsPerMeter: 32,
  metersToPixels: (meters) => meters * 32,
  pixelsToMeters: (pixels) => pixels / 32
});
const PIXELS_PER_METER = PLAN_SCALE.pixelsPerMeter;
const TABLE_FRAME = Object.freeze({ width: 300, height: 316, centerX: 150, centerY: 158 });
const TABLE_CLEARANCE_MARGIN_METERS = 0.8;
const TABLE_CHAIR_OFFSET_METERS = 0.38;
const TABLE_LABEL_OFFSET_METERS = 0.72;
const PROXIMITY_OPTIONS_METERS = Object.freeze([0.6, 1, 1.5, 2]);
const MIN_ELEMENT_METERS = 0.5;
const MAX_ELEMENT_METERS = 30;
const HISTORY_LIMIT = 50;
const EDIT_CAPABILITIES = Object.freeze({
  table: Object.freeze({ movable: true, rotatable: true, resizable: false, copyable: false, deletable: false, layerable: false, lockable: false }),
  physical: Object.freeze({ movable: true, rotatable: true, resizable: true, copyable: true, deletable: true, layerable: true, lockable: true })
});

const SPATIAL_INTERACTIONS = Object.freeze({
  obstacle: Object.freeze({ table: 'conflict', obstacle: 'conflict', reserved: 'warning', container: 'allow', circulation: 'conflict', restricted: 'conflict', informative: 'allow' }),
  reserved: Object.freeze({ table: 'conflict', obstacle: 'warning', reserved: 'warning', container: 'allow', circulation: 'warning', restricted: 'conflict', informative: 'allow' }),
  container: Object.freeze({ table: 'allow', obstacle: 'allow', reserved: 'allow', container: 'allow', circulation: 'allow', restricted: 'allow', informative: 'allow' }),
  circulation: Object.freeze({ table: 'conflict', obstacle: 'conflict', reserved: 'warning', container: 'allow', circulation: 'allow', restricted: 'conflict', informative: 'allow' }),
  restricted: Object.freeze({ table: 'conflict', obstacle: 'conflict', reserved: 'conflict', container: 'allow', circulation: 'conflict', restricted: 'conflict', informative: 'allow' }),
  informative: Object.freeze({ table: 'allow', obstacle: 'allow', reserved: 'allow', container: 'allow', circulation: 'allow', restricted: 'allow', informative: 'allow' })
});

function physicalType(label, widthMeters, heightMeters, options = {}) {
  const spatialFamily = options.spatialFamily || 'obstacle';
  if (!SPATIAL_INTERACTIONS[spatialFamily]) throw new Error(`Familia espacial no reconocida: ${spatialFamily}`);
  return Object.freeze({
    label,
    widthMeters,
    heightMeters,
    width: PLAN_SCALE.metersToPixels(widthMeters),
    height: PLAN_SCALE.metersToPixels(heightMeters),
    capabilities: options.capabilities || EDIT_CAPABILITIES.physical,
    spatialFamily,
    visual: Object.freeze({
      fit: options.visualFit || 'contain',
      paddingRatio: Math.max(0, Math.min(0.35, Number(options.visualPaddingRatio ?? 0.08))),
      anchor: options.visualAnchor || 'center'
    })
  });
}

const PHYSICAL_ELEMENT_TYPES = Object.freeze({
  dance: physicalType('Pista de baile', 5, 5, { spatialFamily: 'reserved' }),
  bar: physicalType('Barra', 4, 1.2),
  dj: physicalType('DJ / sonido', 3, 2),
  stage: physicalType('Escenario', 4, 2.5),
  column: physicalType('Columna', 0.5, 0.5),
  canopy: physicalType('Toldo / cobertura', 6, 6, { spatialFamily: 'container' }),
  circulation: physicalType('Circulación', 4, 1.2, { spatialFamily: 'circulation' }),
  restricted: physicalType('Zona restringida', 3, 3, { spatialFamily: 'restricted' }),
  entrance: physicalType('Entrada / salida', 2, 1.2, { spatialFamily: 'circulation' }),
  plant: physicalType('Planta mediana', 0.8, 0.8, { spatialFamily: 'obstacle', visualFit: 'contain', visualPaddingRatio: 0.05 }),
  plantSmall: physicalType('Planta pequeña', 0.5, 0.5, { spatialFamily: 'obstacle', visualFit: 'contain', visualPaddingRatio: 0.04 }),
  tree: physicalType('Árbol / macetero grande', 1.2, 1.2, { spatialFamily: 'obstacle', visualFit: 'contain', visualPaddingRatio: 0.04 }),
  planter: physicalType('Jardinera', 1.5, 0.6, { spatialFamily: 'obstacle', visualFit: 'contain', visualPaddingRatio: 0.05 }),
  buffet: physicalType('Buffet', 3, 0.9),
  drinks: physicalType('Bebidas', 2, 0.8),
  desserts: physicalType('Postres', 2.4, 0.8),
  cake: physicalType('Torta', 1.8, 1.8),
  gifts: physicalType('Regalos', 1.8, 0.75),
  welcome: physicalType('Bienvenida', 1.8, 0.75),
  booth360: physicalType('Cabina 360°', 2.5, 2.5, { spatialFamily: 'reserved' }),
  photo: physicalType('Zona de fotos', 3, 2, { spatialFamily: 'reserved' }),
  screen: physicalType('Pantalla', 2.5, 0.5),
  altar: physicalType('Altar', 4, 2, { spatialFamily: 'reserved' }),
  arch: physicalType('Arco decorativo', 2.4, 0.8),
  restroom: physicalType('Baños', 2.5, 2),
  kitchen: physicalType('Cocina / apoyo', 3, 2.5, { spatialFamily: 'restricted' }),
  technical: physicalType('Zona técnica', 2, 1.5, { spatialFamily: 'restricted' }),
  extinguisher: physicalType('Extintor', 0.5, 0.5),
  zone: physicalType('Zona / área', 4, 3, { spatialFamily: 'informative' })
});

function elementCapabilities(element) {
  return PHYSICAL_ELEMENT_TYPES[element?.type]?.capabilities || EDIT_CAPABILITIES.physical;
}

function rotateLocalPoint(point, rotation) {
  const angle = normalizeRotation(rotation) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos };
}

function rectanglePolygon(x, y, width, height, rotation = 0) {
  const center = { x: x + width / 2, y: y + height / 2 };
  return [
    { x: -width / 2, y: -height / 2 },
    { x: width / 2, y: -height / 2 },
    { x: width / 2, y: height / 2 },
    { x: -width / 2, y: height / 2 }
  ].map((point) => {
    const rotated = rotateLocalPoint(point, rotation);
    return { x: center.x + rotated.x, y: center.y + rotated.y };
  });
}

function polygonAxes(points) {
  return points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    const dx = next.x - point.x;
    const dy = next.y - point.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: -dy / length, y: dx / length };
  });
}

function polygonsIntersect(a, b) {
  return [...polygonAxes(a), ...polygonAxes(b)].every((axis) => {
    const projection = (points) => {
      const values = points.map((point) => point.x * axis.x + point.y * axis.y);
      return { min: Math.min(...values), max: Math.max(...values) };
    };
    const A = projection(a);
    const B = projection(b);
    return A.max > B.min && B.max > A.min;
  });
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses = ((a.y > point.y) !== (b.y > point.y))
      && point.x < ((b.x - a.x) * (point.y - a.y) / ((b.y - a.y) || 1e-9) + a.x);
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointSegmentDistance(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function circlePolygonIntersects(circle, polygon) {
  if (pointInPolygon({ x: circle.x, y: circle.y }, polygon)) return true;
  return polygon.some((point, index) => pointSegmentDistance(
    { x: circle.x, y: circle.y },
    point,
    polygon[(index + 1) % polygon.length]
  ) < circle.radius);
}

function spatialShapeForElement(element) {
  const definition = PHYSICAL_ELEMENT_TYPES[element.type];
  if (!definition) return null;
  if (Array.isArray(element.points)) {
    const center = { x: element.x + element.width / 2, y: element.y + element.height / 2 };
    const points = element.points.map((point) => {
      const local = { x: point.x - element.width / 2, y: point.y - element.height / 2 };
      const rotated = rotateLocalPoint(local, element.rotation);
      return { x: center.x + rotated.x, y: center.y + rotated.y };
    });
    return { kind: 'polygon', points, spatialFamily: definition.spatialFamily };
  }
  return {
    kind: 'polygon',
    points: rectanglePolygon(element.x, element.y, element.width, element.height, element.rotation),
    spatialFamily: definition.spatialFamily
  };
}

function spatialShapeForTable(table, placement, geometry) {
  const shape = normalizeTableShape(table?.type || table?.shape);
  const width = geometry.clearance.width;
  const height = geometry.clearance.height;
  const centerX = placement.x + geometry.visualWidth / 2;
  const centerY = placement.y + geometry.visualHeight / 2;
  if (shape === 'round') {
    return { kind: 'circle', x: centerX, y: centerY, radius: width / 2 };
  }
  return {
    kind: 'polygon',
    points: rectanglePolygon(centerX - width / 2, centerY - height / 2, width, height, placement.rotation)
  };
}

function spatialFamilyFor(element) {
  return PHYSICAL_ELEMENT_TYPES[element?.type]?.spatialFamily || 'informative';
}

function spatialRuleFor(element, target) {
  const family = spatialFamilyFor(element);
  const targetFamily = target === 'table' ? 'table' : spatialFamilyFor(target);
  return SPATIAL_INTERACTIONS[family]?.[targetFamily] || 'allow';
}

function spatialShapesIntersect(a, b) {
  if (!a || !b) return false;
  if (a.kind === 'circle' && b.kind === 'circle') {
    return Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius;
  }
  if (a.kind === 'circle' && b.kind === 'polygon') return circlePolygonIntersects(a, b.points);
  if (a.kind === 'polygon' && b.kind === 'circle') return circlePolygonIntersects(b, a.points);
  return polygonsIntersect(a.points, b.points);
}

function shapeBoundaryDistance(a, b) {
  if (!a || !b || spatialShapesIntersect(a, b)) return 0;
  if (a.kind === 'circle' && b.kind === 'circle') {
    return Math.max(0, Math.hypot(a.x - b.x, a.y - b.y) - a.radius - b.radius);
  }
  const polygonDistance = (polyA, polyB) => Math.min(...polyA.flatMap((point) => polyB.map((next, index) => pointSegmentDistance(point, next, polyB[(index + 1) % polyB.length]))));
  if (a.kind === 'circle' && b.kind === 'polygon') {
    return Math.max(0, Math.min(...b.points.map((point, index) => pointSegmentDistance({ x: a.x, y: a.y }, point, b.points[(index + 1) % b.points.length]))) - a.radius);
  }
  if (a.kind === 'polygon' && b.kind === 'circle') return shapeBoundaryDistance(b, a);
  return Math.min(polygonDistance(a.points, b.points), polygonDistance(b.points, a.points));
}

let templatePromise = null;
let mountEpoch = 0;
let activeDistributionCleanup = null;

function template() {
  if (!templatePromise) templatePromise = fetch(TEMPLATE_URL, { cache: 'no-store' }).then((response) => {
    if (!response.ok) throw new Error('No se pudo cargar la vista de Distribución.');
    return response.text();
  });
  return templatePromise;
}

function escapeText(value) {
  return String(value ?? '').trim();
}

function compactGuestName(value, maxLength = 18) {
  const text = escapeText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeRotation(value) {
  const number = finiteNumber(value) ?? 0;
  return ((number % 360) + 360) % 360;
}

function polygonArea(points) {
  if (!Array.isArray(points) || points.length < 3) return 0;
  const twiceArea = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  return Math.abs(twiceArea) / 2;
}

function segmentsIntersect(a, b, c, d) {
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  return abC * abD < 0 && cdA * cdB < 0;
}

function polygonSelfIntersects(points) {
  if (!Array.isArray(points) || points.length < 4) return false;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    for (let j = i + 1; j < points.length; j += 1) {
      if (j === i || j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      const c = points[j];
      const d = points[(j + 1) % points.length];
      if (segmentsIntersect(a, b, c, d)) return true;
    }
  }
  return false;
}

function capacityOf(table) {
  const seats = Array.isArray(table?.seats) ? table.seats.length : 0;
  const declared = Number(table?.capacity || 0);
  return Math.max(seats, Number.isFinite(declared) ? declared : 0, 0);
}

function tableName(table, index) {
  return escapeText(table?.name) || `Mesa ${index + 1}`;
}

function validateCanonicalIntegrity(tables, guests) {
  const tableIds = new Set();
  const seatIds = new Set();
  const occupied = new Set();

  tables.forEach((table) => {
    const tableId = escapeText(table?.id);
    if (!tableId || tableIds.has(tableId)) {
      throw new Error('Mesas contiene identificadores vacíos o duplicados. Distribución se abrió en modo seguro sin modificar datos.');
    }
    tableIds.add(tableId);
    const seats = Array.isArray(table?.seats) ? table.seats : [];
    seats.forEach((seat) => {
      const seatId = escapeText(seat?.id);
      if (!seatId) return;
      if (seatIds.has(seatId)) {
        throw new Error('Mesas contiene identificadores de silla duplicados. Distribución no modificó ningún dato.');
      }
      seatIds.add(seatId);
    });
  });

  guests.forEach((guest) => {
    const tableId = escapeText(guest?.tableId);
    if (!tableId) return;
    if (!tableIds.has(tableId)) {
      throw new Error('Existe un invitado asignado a una mesa inexistente. Corrige la asignación en Mesas antes de editar Distribución.');
    }
    const table = tables.find((item) => escapeText(item?.id) === tableId);
    const seatNumber = Number(guest?.seatNumber);
    const seats = Array.isArray(table?.seats) ? table.seats : [];
    const capacity = capacityOf(table);
    if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > capacity) {
      throw new Error('Existe un invitado con una silla fuera de rango. Corrige la asignación en Mesas antes de editar Distribución.');
    }
    const seatId = escapeText(guest?.seatId);
    const canonicalSeatId = escapeText(seats[seatNumber - 1]?.id);
    if (seatId && canonicalSeatId && seatId !== canonicalSeatId) {
      throw new Error('Existe una asignación de silla inconsistente. Corrígela en Mesas antes de editar Distribución.');
    }
    const occupancyKey = `${tableId}::${seatNumber}`;
    if (occupied.has(occupancyKey)) {
      throw new Error('Hay dos invitados asignados a la misma silla. Corrige la asignación en Mesas antes de editar Distribución.');
    }
    occupied.add(occupancyKey);
  });
}

function buildGuestIndex(guests) {
  const bySeat = new Map();
  guests.forEach((guest) => {
    const tableId = escapeText(guest?.tableId);
    const seatId = escapeText(guest?.seatId);
    const seatNumber = Number(guest?.seatNumber);
    if (!tableId) return;
    if (seatId) bySeat.set(`${tableId}::id::${seatId}`, guest);
    if (Number.isFinite(seatNumber)) bySeat.set(`${tableId}::number::${seatNumber}`, guest);
  });
  return bySeat;
}

function guestForSeat(index, tableId, seat, seatIndex) {
  const seatId = escapeText(seat?.id);
  if (seatId && index.has(`${tableId}::id::${seatId}`)) return index.get(`${tableId}::id::${seatId}`);
  return index.get(`${tableId}::number::${seatIndex + 1}`) || null;
}

function rectangularPerimeterPositions(count, width, height, centerX, centerY) {
  const positions = [];
  const perimeter = 2 * (width + height);
  for (let index = 0; index < count; index += 1) {
    let distance = (perimeter * index / count + width / 2) % perimeter;
    let x;
    let y;
    if (distance < width) {
      x = centerX - width / 2 + distance;
      y = centerY - height / 2;
    } else if ((distance -= width) < height) {
      x = centerX + width / 2;
      y = centerY - height / 2 + distance;
    } else if ((distance -= height) < width) {
      x = centerX + width / 2 - distance;
      y = centerY + height / 2;
    } else {
      distance -= width;
      x = centerX - width / 2;
      y = centerY + height / 2 - distance;
    }
    positions.push({ x, y });
  }
  return positions;
}

function tablePhysicalGeometry(tableSource, capacity) {
  const source = tableSource && typeof tableSource === 'object' ? tableSource : { type: tableSource };
  const physical = tablePhysicalDimensions(source);
  const shape = physical.shape;
  const count = Math.max(1, Number(capacity) || 1);
  const table = {
    width: PLAN_SCALE.metersToPixels(physical.width),
    height: PLAN_SCALE.metersToPixels(physical.height)
  };
  const clearance = {
    width: PLAN_SCALE.metersToPixels(physical.width + TABLE_CLEARANCE_MARGIN_METERS * 2),
    height: PLAN_SCALE.metersToPixels(physical.height + TABLE_CLEARANCE_MARGIN_METERS * 2)
  };
  const { width: visualWidth, height: visualHeight, centerX, centerY } = TABLE_FRAME;
  const positions = [];
  if (shape === 'round') {
    const tableRadius = table.width / 2;
    const chairOrbit = tableRadius + PLAN_SCALE.metersToPixels(TABLE_CHAIR_OFFSET_METERS);
    const labelOrbit = tableRadius + PLAN_SCALE.metersToPixels(TABLE_LABEL_OFFSET_METERS);
    for (let index = 0; index < count; index += 1) {
      const angle = -Math.PI / 2 + Math.PI * 2 * index / count;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      positions.push({ x:centerX + cos*chairOrbit, y:centerY + sin*chairOrbit, labelX:centerX + cos*labelOrbit, labelY:centerY + sin*labelOrbit, labelAlign:cos>.28?'left':cos<-.28?'right':'center' });
    }
    return { shape, table, clearance, visualWidth, visualHeight, centerX, centerY, positions };
  }
  const chairOffset = PLAN_SCALE.metersToPixels(TABLE_CHAIR_OFFSET_METERS);
  const labelOffset = PLAN_SCALE.metersToPixels(TABLE_LABEL_OFFSET_METERS);
  rectangularPerimeterPositions(count, table.width + chairOffset*2, table.height + chairOffset*2, centerX, centerY).forEach((point) => {
    const dx=point.x-centerX, dy=point.y-centerY, length=Math.hypot(dx,dy)||1, ux=dx/length, uy=dy/length;
    positions.push({ x:point.x, y:point.y, labelX:point.x+ux*labelOffset, labelY:point.y+uy*labelOffset, labelAlign:ux>.32?'left':ux<-.32?'right':'center' });
  });
  return { shape, table, clearance, visualWidth, visualHeight, centerX, centerY, positions };
}

function projectedLayout(tables) {
  const items = tables.map((table,index) => {
    const capacity=capacityOf(table);
    return { table,index,capacity,geometry:tablePhysicalGeometry(table,capacity || 4) };
  });
  const usableWidth=Math.max(1,PLAN_WIDTH-WORLD_PADDING*2), cellWidth=190, cellHeight=190;
  const columns=Math.max(1,Math.floor(usableWidth/cellWidth));
  items.forEach((item,index)=>{
    const centerX=WORLD_PADDING+cellWidth/2+(index%columns)*cellWidth;
    const centerY=WORLD_PADDING+cellHeight/2+Math.floor(index/columns)*cellHeight;
    item.x=centerX-item.geometry.centerX; item.y=centerY-item.geometry.centerY;
  });
  return { items, width: PLAN_WIDTH, height: PLAN_HEIGHT };
}

function parseDistributionState(value) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value) || Number(value.version) !== 1) {
    throw new Error('La distribución guardada tiene un formato no reconocido. No se modificó ningún dato.');
  }
  if (!Array.isArray(value.proposals)) {
    throw new Error('La distribución guardada no contiene propuestas reconocibles. No se modificó ningún dato.');
  }
  const proposals = value.proposals.map((proposal) => {
    if (!proposal || typeof proposal !== 'object' || !escapeText(proposal.id) || !Array.isArray(proposal.placements)) {
      throw new Error('La distribución guardada contiene una propuesta no válida. No se modificó ningún dato.');
    }
    const seen = new Set();
    const placements = proposal.placements.map((placement) => {
      const tableId = escapeText(placement?.tableId);
      const x = finiteNumber(placement?.x);
      const y = finiteNumber(placement?.y);
      const rotation = finiteNumber(placement?.rotation);
      if (!tableId || x === null || y === null || rotation === null || seen.has(tableId)) {
        throw new Error('La distribución guardada contiene posiciones no válidas. No se modificó ningún dato.');
      }
      seen.add(tableId);
      return { tableId, x, y, rotation: normalizeRotation(rotation) };
    });
    const seenElements = new Set();
    const elements = Array.isArray(proposal.elements) ? proposal.elements.map((element) => {
      const id = escapeText(element?.id);
      const type = escapeText(element?.type);
      const x = finiteNumber(element?.x);
      const y = finiteNumber(element?.y);
      const rotation = finiteNumber(element?.rotation);
      const layer = finiteNumber(element?.layer) ?? 0;
      const width = finiteNumber(element?.width) ?? PHYSICAL_ELEMENT_TYPES[type]?.width;
      const height = finiteNumber(element?.height) ?? PHYSICAL_ELEMENT_TYPES[type]?.height;
      const locked = element?.locked === true;
      const points = Array.isArray(element?.points)
        ? element.points.map((point) => ({ x: finiteNumber(point?.x), y: finiteNumber(point?.y) }))
        : null;
      const validPoints = points === null || (
        points.length >= 3
        && points.every((point) => point.x !== null && point.y !== null)
        && polygonArea(points) >= 1
        && !polygonSelfIntersects(points)
      );
      if (!id || seenElements.has(id) || !PHYSICAL_ELEMENT_TYPES[type] || x === null || y === null || rotation === null || width === null || height === null || width < PIXELS_PER_METER * MIN_ELEMENT_METERS || height < PIXELS_PER_METER * MIN_ELEMENT_METERS || width > PIXELS_PER_METER * MAX_ELEMENT_METERS || height > PIXELS_PER_METER * MAX_ELEMENT_METERS || !validPoints) {
        throw new Error('La distribución guardada contiene elementos físicos no válidos. No se modificó ningún dato.');
      }
      seenElements.add(id);
      return { id, type, x, y, rotation: normalizeRotation(rotation), layer, locked, width, height, points };
    }) : [];
    return {
      id: escapeText(proposal.id),
      name: escapeText(proposal.name) || 'Propuesta',
      placements,
      elements
    };
  });
  const proposalIds = new Set();
  proposals.forEach((proposal) => {
    if (proposalIds.has(proposal.id)) {
      throw new Error('La distribución guardada contiene propuestas con identificadores duplicados. No se modificó ningún dato.');
    }
    proposalIds.add(proposal.id);
  });
  const activeProposalId = escapeText(value.activeProposalId);
  if (proposals.length && activeProposalId && !proposalIds.has(activeProposalId)) {
    throw new Error('La distribución guardada referencia una propuesta activa inexistente. No se modificó ningún dato.');
  }
  return { version: 1, activeProposalId, proposals };
}

function activeProposalOf(state) {
  if (!state?.proposals?.length) return null;
  if (!state.activeProposalId) return state.proposals[0];
  return state.proposals.find((proposal) => proposal.id === state.activeProposalId) || null;
}

function placementMapFor(layout, storedState) {
  const stored = new Map((activeProposalOf(storedState)?.placements || []).map((placement) => [placement.tableId, placement]));
  return new Map(layout.items.map((item) => {
    const tableId = escapeText(item.table?.id);
    const placement = stored.get(tableId);
    return [tableId, placement
      ? { x: placement.x, y: placement.y, rotation: placement.rotation }
      : { x: item.x, y: item.y, rotation: 0 }];
  }));
}

function serializeProposal(id, name, placementState, tableIds, elements) {
  return {
    id,
    name,
    placements: tableIds.map((tableId) => {
      const placement = placementState.get(tableId);
      return { tableId, x: Math.round(placement.x * 100) / 100, y: Math.round(placement.y * 100) / 100, rotation: normalizeRotation(placement.rotation) };
    }),
    elements: elements.map((element) => ({
      id: element.id, type: element.type,
      x: Math.round(element.x * 100) / 100, y: Math.round(element.y * 100) / 100,
      rotation: normalizeRotation(element.rotation), layer: Number(element.layer || 0), locked: element.locked === true,
      width: Math.round(element.width * 100) / 100, height: Math.round(element.height * 100) / 100,
      ...(Array.isArray(element.points) ? { points: element.points.map((point) => ({ x: Math.round(point.x * 100) / 100, y: Math.round(point.y * 100) / 100 })) } : {})
    }))
  };
}

function serializeDistribution(proposals, activeProposalId) {
  return { version: 1, activeProposalId, proposals };
}

function applyPlacement(node, placement) {
  const rotation = normalizeRotation(placement.rotation);
  node.style.left = `${placement.x}px`;
  node.style.top = `${placement.y}px`;
  node.style.setProperty('--table-rotation', `${rotation}deg`);
  node.style.setProperty('--counter-rotation', `${-rotation}deg`);
  const angle = node.querySelector('[data-distribution-table-rotation-angle]');
  if (angle) angle.textContent = `${Math.round(rotation)}°`;
}

function renderTable(item, guestIndex, placement) {
  const { table, index, capacity, geometry } = item;
  const tableId = escapeText(table?.id);
  const seats = Array.isArray(table?.seats) ? table.seats : [];
  const node = document.createElement('article');
  node.className = 'distribution-table';
  node.dataset.tableId = tableId;
  node.tabIndex = 0;
  node.setAttribute('role', 'button');
  node.setAttribute('aria-label', tableName(table, index));
  node.style.width = `${geometry.visualWidth}px`;
  node.style.height = `${geometry.visualHeight}px`;
  applyPlacement(node, placement);

  const clearance = document.createElement('div');
  clearance.className = `distribution-table-clearance is-${geometry.shape}`;
  clearance.style.width = `${geometry.clearance.width}px`;
  clearance.style.height = `${geometry.clearance.height}px`;
  node.append(clearance);

  const surface = document.createElement('div');
  surface.className = `distribution-tabletop is-${geometry.shape}`;
  surface.style.width = `${geometry.table.width}px`;
  surface.style.height = `${geometry.table.height}px`;
  surface.innerHTML = `<strong></strong><span>${capacity} sillas</span>`;
  surface.querySelector('strong').textContent = tableName(table, index);
  node.append(surface);

  const rotationGuide = document.createElement('div');
  rotationGuide.className = 'distribution-table-rotation-guide';
  rotationGuide.style.width = `${Math.min(geometry.visualWidth - 28, Math.max(96, geometry.table.width + 54))}px`;
  rotationGuide.style.height = `${Math.min(geometry.visualHeight - 34, Math.max(96, geometry.table.height + 54))}px`;
  rotationGuide.setAttribute('aria-hidden', 'true');

  const rotationStem = document.createElement('span');
  rotationStem.className = 'distribution-table-rotation-stem';

  const rotationHandle = document.createElement('span');
  rotationHandle.className = 'distribution-table-rotation-handle';
  rotationHandle.dataset.distributionTableRotationHandle = 'true';

  const rotationAngle = document.createElement('span');
  rotationAngle.className = 'distribution-table-rotation-angle';
  rotationAngle.dataset.distributionTableRotationAngle = 'true';
  rotationAngle.textContent = `${Math.round(normalizeRotation(placement.rotation))}°`;

  rotationGuide.append(rotationStem, rotationHandle, rotationAngle);
  node.append(rotationGuide);

  geometry.positions.slice(0, capacity).forEach((position, seatIndex) => {
    const seat = seats[seatIndex] || {};
    const guest = guestForSeat(guestIndex, tableId, seat, seatIndex);
    const chair = document.createElement('span');
    chair.className = `distribution-chair${guest ? ' is-occupied' : ''}`;
    chair.dataset.tableId = tableId;
    chair.dataset.seatIndex = String(seatIndex);
    chair.dataset.seatId = escapeText(seat?.id);
    if (guest) {
      chair.dataset.guestId = escapeText(guest.id);
    }
    chair.style.left = `${position.x}px`;
    chair.style.top = `${position.y}px`;
    chair.title = guest ? escapeText(guest.name) : `Silla ${seatIndex + 1}`;
    node.append(chair);

    if (guest) {
      const label = document.createElement('span');
      label.className = 'distribution-seat-label';
      label.style.left = `${position.labelX}px`;
      label.style.top = `${position.labelY}px`;
      label.dataset.align = position.labelAlign;
      label.dataset.guestId = escapeText(guest.id);
      label.dataset.tableId = tableId;
      label.dataset.seatIndex = String(seatIndex);
      const guestName = escapeText(guest.name) || 'Invitado';
      label.textContent = compactGuestName(guestName);
      label.title = guestName;
      node.append(label);
    }
  });
  return node;
}

function applyElementVisualContract(node, definition) {
  const visual = definition.visual;
  node.style.setProperty('--element-visual-padding', `${visual.paddingRatio * 100}%`);
  node.dataset.visualFit = visual.fit;
  node.dataset.visualAnchor = visual.anchor;
}

function renderPhysicalElement(element) {
  const definition = PHYSICAL_ELEMENT_TYPES[element.type];
  const node = document.createElement('article');
  node.className = `distribution-element is-${element.type}`;
  node.dataset.elementId = element.id;
  node.tabIndex = 0;
  node.setAttribute('role', 'button');
  node.setAttribute('aria-label', definition.label);
  applyElementVisualContract(node, definition);
  node.classList.toggle('is-locked', element.locked === true);
  node.style.zIndex = String(10 + Number(element.layer || 0));
  node.style.left = `${element.x}px`;
  node.style.top = `${element.y}px`;
  node.style.width = `${element.width}px`;
  node.style.height = `${element.height}px`;
  node.style.transform = `rotate(${normalizeRotation(element.rotation)}deg)`;
  if (Array.isArray(element.points)) {
    const svgNs = 'http://www.w3.org/2000/svg';
    const polygon = document.createElementNS(svgNs, 'svg');
    polygon.classList.add('distribution-area-shape');
    polygon.setAttribute('viewBox', `0 0 ${element.width} ${element.height}`);
    const shape = document.createElementNS(svgNs, 'polygon');
    shape.setAttribute('points', element.points.map((point) => `${point.x},${point.y}`).join(' '));
    polygon.append(shape);
    node.append(polygon);
  }
  const visual = document.createElement('span');
  visual.className = 'distribution-element-visual';
  visual.setAttribute('aria-hidden', 'true');
  node.append(visual);
  const label = document.createElement('strong');
  label.textContent = definition.label;
  node.append(label);

  if (elementCapabilities(element).resizable) {
    [
      ['nw', -1, -1],
      ['ne', 1, -1],
      ['se', 1, 1],
      ['sw', -1, 1]
    ].forEach(([corner, xSign, ySign]) => {
      const handle = document.createElement('span');
      handle.className = `distribution-resize-handle is-${corner}`;
      handle.dataset.distributionResizeHandle = corner;
      handle.dataset.resizeX = String(xSign);
      handle.dataset.resizeY = String(ySign);
      handle.setAttribute('aria-hidden', 'true');
      node.append(handle);
    });
  }
  return node;
}

function applyElementPlacement(node, element) {
  node.classList.toggle('is-locked', element.locked === true);
  node.style.zIndex = String(10 + Number(element.layer || 0));
  node.style.left = `${element.x}px`;
  node.style.top = `${element.y}px`;
  node.style.width = `${element.width}px`;
  node.style.height = `${element.height}px`;
  node.style.transform = `rotate(${normalizeRotation(element.rotation)}deg)`;
}

function refreshElementGeometryNode(node, element) {
  applyElementPlacement(node, element);
  if (!Array.isArray(element.points)) return;
  const svg = node.querySelector('.distribution-area-shape');
  const polygon = svg?.querySelector('polygon');
  if (!svg || !polygon) return;
  svg.setAttribute('viewBox', `0 0 ${element.width} ${element.height}`);
  polygon.setAttribute('points', element.points.map((point) => `${point.x},${point.y}`).join(' '));
}

function renderElementInspector(root, element) {
  const definition = PHYSICAL_ELEMENT_TYPES[element.type];
  root.querySelector('[data-distribution-selection-empty]').hidden = true;
  root.querySelector('[data-distribution-selection]').hidden = false;
  root.querySelector('[data-distribution-selected-name]').textContent = definition.label;
  const widthMeters = element.width / PIXELS_PER_METER;
  const heightMeters = element.height / PIXELS_PER_METER;
  const areaMeters = Array.isArray(element.points) ? polygonArea(element.points) / (PIXELS_PER_METER ** 2) : null;
  root.querySelector('[data-distribution-selected-meta]').textContent = areaMeters === null
    ? `${widthMeters.toFixed(2)} × ${heightMeters.toFixed(2)} m`
    : `${widthMeters.toFixed(2)} × ${heightMeters.toFixed(2)} m · ${areaMeters.toFixed(2)} m²`;
  const rotationOutput = root.querySelector('[data-distribution-selected-rotation]');
  rotationOutput.value = `${normalizeRotation(element.rotation)}°`;
  rotationOutput.textContent = rotationOutput.value;
  root.querySelector('[data-distribution-table-stats]').hidden = true;
  root.querySelector('[data-distribution-table-shape-control]').hidden = true;
  root.querySelector('[data-distribution-table-dimensions]').hidden = true;
  root.querySelector('[data-distribution-selected-guests]').hidden = true;
  root.querySelector('[data-distribution-element-note]').hidden = false;
  root.querySelector('[data-distribution-element-actions]').hidden = false;
  const capabilities = elementCapabilities(element);
  root.querySelector('[data-distribution-dimensions]').hidden = !capabilities.resizable;
  root.querySelector('[data-distribution-width]').value = (element.width / PLAN_SCALE.pixelsPerMeter).toFixed(1);
  root.querySelector('[data-distribution-height]').value = (element.height / PLAN_SCALE.pixelsPerMeter).toFixed(1);
  const lockButton = root.querySelector('[data-distribution-toggle-lock]');
  lockButton.hidden = !capabilities.lockable;
  lockButton.textContent = element.locked ? 'Desbloquear' : 'Bloquear';
  root.querySelector('[data-distribution-bring-front]').hidden = !capabilities.layerable;
  root.querySelector('[data-distribution-send-back]').hidden = !capabilities.layerable;
  root.querySelector('[data-distribution-duplicate-element]').hidden = !capabilities.copyable;
  root.querySelector('[data-distribution-delete-element]').hidden = !capabilities.deletable;
}

function renderInspector(root, table, tableIndex, guests, placement) {
  root.querySelector('[data-distribution-selection-empty]').hidden = true;
  root.querySelector('[data-distribution-table-stats]').hidden = false;
  root.querySelector('[data-distribution-selected-guests]').hidden = false;
  root.querySelector('[data-distribution-element-note]').hidden = true;
  root.querySelector('[data-distribution-element-actions]').hidden = true;
  root.querySelector('[data-distribution-dimensions]').hidden = true;
  root.querySelector('[data-distribution-selection]').hidden = false;
  const capacity = capacityOf(table);
  const assigned = guests
    .filter((guest) => escapeText(guest.tableId) === escapeText(table.id))
    .sort((a, b) => Number(a.seatNumber || 999) - Number(b.seatNumber || 999));
  root.querySelector('[data-distribution-selected-name]').textContent = tableName(table, tableIndex);
  root.querySelector('[data-distribution-selected-meta]').textContent = `${normalizeTableShape(table.type)} · ${capacity} sillas`;
  root.querySelector('[data-distribution-table-shape-control]').hidden = false;
  root.querySelector('[data-distribution-table-shape]').value = normalizeTableShape(table.type || table.shape);
  const tabletop = tablePhysicalDimensions(table);
  const tableDimensions = root.querySelector('[data-distribution-table-dimensions]');
  const widthLabel = root.querySelector('[data-distribution-table-width-label]');
  const heightLabel = root.querySelector('[data-distribution-table-height-label]');
  tableDimensions.hidden = false;
  widthLabel.firstChild.textContent = tabletop.shape === 'round'
    ? 'Diámetro (m)'
    : tabletop.shape === 'square'
      ? 'Lado (m)'
      : 'Largo (m)';
  heightLabel.hidden = tabletop.shape !== 'rectangular';
  root.querySelector('[data-distribution-table-width]').value = tabletop.width.toFixed(2);
  root.querySelector('[data-distribution-table-height]').value = tabletop.height.toFixed(2);
  const rotationOutput = root.querySelector('[data-distribution-selected-rotation]');
  rotationOutput.value = `${normalizeRotation(placement.rotation)}°`;
  rotationOutput.textContent = rotationOutput.value;
  root.querySelector('[data-distribution-selected-seated]').textContent = String(assigned.length);
  root.querySelector('[data-distribution-selected-free]').textContent = String(Math.max(0, capacity - assigned.length));
  const list = root.querySelector('[data-distribution-selected-guests]');
  list.replaceChildren();
  if (!assigned.length) {
    const empty = document.createElement('span');
    empty.className = 'distribution-no-guests';
    empty.textContent = 'Sin invitados asignados.';
    list.append(empty);
    return;
  }
  assigned.forEach((guest) => {
    const row = document.createElement('div');
    const seat = document.createElement('span');
    const name = document.createElement('strong');
    seat.textContent = guest.seatNumber ? String(guest.seatNumber) : '•';
    name.textContent = escapeText(guest.name) || 'Invitado';
    row.append(seat, name);
    list.append(row);
  });
}

async function mountDistribucion(context) {
  activeDistributionCleanup?.();
  activeDistributionCleanup = null;
  const epoch = ++mountEpoch;
  const root = document.querySelector('[data-module-view="distribucion"]');
  if (!root) return;
  const templateHtml = await template();
  if (epoch !== mountEpoch || !root.isConnected) return;
  root.innerHTML = templateHtml;
  const status = root.querySelector('[data-distribution-status]');
  const canEdit = weddingCapabilities(context?.role).canEdit;
  status.textContent = 'Cargando mesas y distribución…';

  try {
    const [snapshot, storedValue] = await Promise.all([
      loadInvitadosSnapshot(context),
      readPlannerStorageKey(context, DISTRIBUTION_STORAGE_KEY)
    ]);
    if (epoch !== mountEpoch) return;

    const storedState = parseDistributionState(storedValue);
    const proposalState = storedState?.proposals?.length
      ? storedState.proposals.map((proposal) => ({ ...proposal, placements: proposal.placements.map((placement) => ({ ...placement })), elements: proposal.elements.map((element) => ({ ...element, points: Array.isArray(element.points) ? element.points.map((point) => ({ ...point })) : null })) }))
      : [{ id: DEFAULT_PROPOSAL_ID, name: 'Propuesta principal', placements: [], elements: [] }];
    let activeProposalId = activeProposalOf(storedState)?.id || DEFAULT_PROPOSAL_ID;
    const tables = snapshot.canonical.tables;
    const guests = snapshot.canonical.guests;
    validateCanonicalIntegrity(tables, guests);
    let guestIndex = buildGuestIndex(guests);
    const layout = projectedLayout(tables);
    const placementState = placementMapFor(layout, storedState);
    const physicalElements = (activeProposalOf(storedState)?.elements || []).map((element) => ({ ...element }));
    let elementSequence = physicalElements.reduce((max, element) => {
      const value = Number(String(element.id).match(/(\d+)$/)?.[1] || 0);
      return Math.max(max, value);
    }, 0);
    const tableIds = tables.map((table) => escapeText(table.id)).filter(Boolean);
    const viewport = root.querySelector('[data-distribution-viewport]');
    const world = root.querySelector('[data-distribution-world]');
    const tableById = new Map(tables.map((table, index) => [escapeText(table.id), { table, index }]));
    let selectedTableId = '';
    let selectedElementId = '';
    let dirty = false;
    let saving = false;
    let canonicalRefreshPending = false;
    let hasPersistedState = Boolean(storedState);
    let autosaveTimer = 0;
    let distributionCloudUnsubscribe = null;
    let canonicalCloudUnsubscribe = null;
    let lastPersistedSignature = storedState ? JSON.stringify(storedState) : '';
    let queuedRemoteDistributionSignature = '';
    let lastPersistedState = storedState ? JSON.parse(JSON.stringify(storedState)) : null;
    let pendingRemoteDistributionState = null;
    let pendingLocalDistributionState = null;
    const syncConflict = root.querySelector('[data-distribution-sync-conflict]');
    const undoStack = [];
    const redoStack = [];
    const undoButton = root.querySelector('[data-distribution-undo]');
    const redoButton = root.querySelector('[data-distribution-redo]');
    const proposalSelect = root.querySelector('[data-distribution-proposal]');
    const proposalNew = root.querySelector('[data-distribution-proposal-new]');
    const proposalDuplicate = root.querySelector('[data-distribution-proposal-duplicate]');
    const proposalRename = root.querySelector('[data-distribution-proposal-rename]');
    const mobileHub = root.querySelector('[data-distribution-mobile-hub]');
    const mobileWheel = root.querySelector('[data-distribution-mobile-wheel]');
    const mobileWheelLabel = root.querySelector('[data-distribution-mobile-wheel-label]');
    const mobileSheet = root.querySelector('[data-distribution-mobile-sheet]');
    const mobileSheetBackdrop = root.querySelector('[data-distribution-mobile-sheet-backdrop]');
    const mobileSheetTitle = root.querySelector('[data-distribution-mobile-sheet-title]');
    const mobileSheetBody = root.querySelector('[data-distribution-mobile-sheet-body]');
    const mobileWheelToggle = root.querySelector('[data-distribution-mobile-wheel-toggle]');
    const mobileActions = [...root.querySelectorAll('[data-mobile-action]')];
    const mobileActionOrder = ['add', 'proposal', 'view', 'review', 'settings'];
    const mobileActionLabels = { add: 'Añadir', proposal: 'Propuesta', view: 'Vista', review: 'Revisar', settings: 'Ajustes' };
    let mobileWheelIndex = 0;

    const mobileOnly = () => window.matchMedia('(max-width: 700px)').matches;
    const proxyClick = (selector) => root.querySelector(selector)?.click();
    const closeMobileSheet = () => {
      mobileSheet.hidden = true;
      mobileSheetBackdrop.hidden = true;
      mobileSheetBody.replaceChildren();
    };
    const hasSyncConflict = () => Boolean(pendingRemoteDistributionState && pendingLocalDistributionState);
    const addMobileButton = (label, onClick, className = '') => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      if (className) button.className = className;
      button.addEventListener('click', onClick);
      mobileSheetBody.append(button);
      return button;
    };
    const openMobileSheet = (action) => {
      if (!mobileOnly()) return;
      mobileSheetTitle.textContent = mobileActionLabels[action] || 'Herramientas';
      mobileSheetBody.replaceChildren();

      if (action === 'add') {
        [...root.querySelectorAll('[data-distribution-add-element]')].forEach((sourceButton) => {
          const type = escapeText(sourceButton.dataset.distributionAddElement);
          const definition = PHYSICAL_ELEMENT_TYPES[type];
          if (!definition) return;
          addMobileButton(definition.label, () => {
            sourceButton.click();
            closeMobileSheet();
          });
        });
      } else if (action === 'proposal') {
        const proposalName = proposalSelect?.selectedOptions?.[0]?.textContent || 'Propuesta activa';
        const note = document.createElement('p');
        note.className = 'distribution-mobile-sheet-note';
        note.textContent = `Activa: ${proposalName}`;
        mobileSheetBody.append(note);
        addMobileButton('Nueva', () => proxyClick('[data-distribution-proposal-new]'));
        addMobileButton('Duplicar', () => proxyClick('[data-distribution-proposal-duplicate]'));
        addMobileButton('Renombrar', () => proxyClick('[data-distribution-proposal-rename]'));
        addMobileButton('Eliminar', () => proxyClick('[data-distribution-proposal-delete]'), 'is-danger');
      } else if (action === 'view') {
        addMobileButton('Presentación', () => proxyClick('[data-distribution-presentation]'));
        addMobileButton('Plano limpio', () => proxyClick('[data-distribution-clean-view]'));
        addMobileButton('Imprimir / PDF', () => proxyClick('[data-distribution-print]'), 'is-wide');
      } else if (action === 'review') {
        [
          ['Conflictos', '[data-distribution-validation-conflicts]'],
          ['Alertas', '[data-distribution-validation-warnings]'],
          ['Proximidad', '[data-distribution-validation-proximity]']
        ].forEach(([label, selector]) => {
          const metric = document.createElement('div');
          metric.className = 'distribution-mobile-sheet-metric';
          const value = document.createElement('strong');
          value.textContent = root.querySelector(selector)?.textContent || '0';
          const caption = document.createElement('span');
          caption.textContent = label;
          metric.append(value, caption);
          mobileSheetBody.append(metric);
        });
        const detail = document.createElement('p');
        detail.className = 'distribution-mobile-sheet-note';
        detail.textContent = root.querySelector('[data-distribution-validation-list]')?.innerText?.trim() || 'Plano sin incidencias espaciales.';
        mobileSheetBody.append(detail);
      } else if (action === 'settings') {
        if (selectedTableId) {
          const selectedEntry = tableById.get(selectedTableId);
          const currentShape = normalizeTableShape(selectedEntry?.table?.type || selectedEntry?.table?.shape);
          const shapeNote = document.createElement('p');
          shapeNote.className = 'distribution-mobile-sheet-note';
          shapeNote.textContent = `Tipo de mesa: ${TABLE_SHAPE_LABELS[currentShape] || 'Mesa'}`;
          mobileSheetBody.append(shapeNote);
          [
            ['Redonda', 'round'],
            ['Cuadrada', 'square'],
            ['Rectangular', 'rectangular']
          ].forEach(([label, shape]) => {
            const button = addMobileButton(label, async () => {
              await changeSelectedTableShape(shape);
              closeMobileSheet();
            });
            if (shape === currentShape) button.disabled = true;
          });

          const tabletop = tablePhysicalDimensions(selectedEntry.table);
          const sizeWrap = document.createElement('div');
          sizeWrap.className = 'distribution-mobile-size-editor';
          const widthField = document.createElement('label');
          widthField.textContent = currentShape === 'round' ? 'Diámetro (m)' : currentShape === 'square' ? 'Lado (m)' : 'Largo (m)';
          const widthInput = document.createElement('input');
          widthInput.type = 'number';
          widthInput.min = String(MIN_TABLE_METERS);
          widthInput.max = String(MAX_TABLE_METERS);
          widthInput.step = '0.1';
          widthInput.value = tabletop.width.toFixed(2);
          widthField.append(widthInput);
          sizeWrap.append(widthField);

          let heightInput = null;
          if (currentShape === 'rectangular') {
            const heightField = document.createElement('label');
            heightField.textContent = 'Fondo (m)';
            heightInput = document.createElement('input');
            heightInput.type = 'number';
            heightInput.min = String(MIN_TABLE_METERS);
            heightInput.max = String(MAX_TABLE_METERS);
            heightInput.step = '0.1';
            heightInput.value = tabletop.height.toFixed(2);
            heightField.append(heightInput);
            sizeWrap.append(heightField);
          }
          mobileSheetBody.append(sizeWrap);
          addMobileButton('Aplicar medida', async () => {
            await changeSelectedTableDimensions(widthInput.value, heightInput?.value ?? widthInput.value);
            closeMobileSheet();
          }, 'is-wide');
          addMobileButton('Usar medida estándar', async () => {
            await changeSelectedTableDimensions(null, null, { reset: true });
            closeMobileSheet();
          }, 'is-wide');
        }
        if (selectedElementId) {
          const selectedElement = physicalElements.find((item) => item.id === selectedElementId);
          if (selectedElement && elementCapabilities(selectedElement).resizable) {
            const definition = PHYSICAL_ELEMENT_TYPES[selectedElement.type];
            const sizeNote = document.createElement('p');
            sizeNote.className = 'distribution-mobile-sheet-note';
            sizeNote.textContent = `${definition.label} · ${(selectedElement.width / PIXELS_PER_METER).toFixed(2)} × ${(selectedElement.height / PIXELS_PER_METER).toFixed(2)} m`;
            mobileSheetBody.append(sizeNote);

            const sizeWrap = document.createElement('div');
            sizeWrap.className = 'distribution-mobile-size-editor';
            const widthField = document.createElement('label');
            widthField.textContent = 'Ancho (m)';
            const widthInput = document.createElement('input');
            widthInput.type = 'number';
            widthInput.min = String(MIN_ELEMENT_METERS);
            widthInput.max = String(MAX_ELEMENT_METERS);
            widthInput.step = '0.1';
            widthInput.value = (selectedElement.width / PIXELS_PER_METER).toFixed(2);
            widthField.append(widthInput);

            const heightField = document.createElement('label');
            heightField.textContent = 'Alto (m)';
            const heightInput = document.createElement('input');
            heightInput.type = 'number';
            heightInput.min = String(MIN_ELEMENT_METERS);
            heightInput.max = String(MAX_ELEMENT_METERS);
            heightInput.step = '0.1';
            heightInput.value = (selectedElement.height / PIXELS_PER_METER).toFixed(2);
            heightField.append(heightInput);
            sizeWrap.append(widthField, heightField);
            mobileSheetBody.append(sizeWrap);

            addMobileButton('Aplicar tamaño', () => {
              changeSelectedElementDimensions(widthInput.value, heightInput.value);
              closeMobileSheet();
            }, 'is-wide');
          }
        }
        addMobileButton('Medir distancia', () => proxyClick('[data-distribution-measure]'));
        addMobileButton('Limpiar medida', () => proxyClick('[data-distribution-clear-measure]'));
        const snapSource = root.querySelector('[data-distribution-snap]');
        const snapLabel = document.createElement('label');
        snapLabel.className = 'distribution-mobile-sheet-toggle';
        snapLabel.append(document.createTextNode('Ajustar a cuadrícula'));
        const snap = document.createElement('input');
        snap.type = 'checkbox';
        snap.checked = Boolean(snapSource?.checked);
        snap.addEventListener('change', () => {
          if (!snapSource) return;
          snapSource.checked = snap.checked;
          snapSource.dispatchEvent(new Event('change', { bubbles: true }));
        });
        snapLabel.append(snap);
        mobileSheetBody.append(snapLabel);
      }

      mobileSheet.hidden = false;
      mobileSheetBackdrop.hidden = false;
    };
    const renderMobileWheel = () => {
      const action = mobileActionOrder[mobileWheelIndex];
      const angle = -mobileWheelIndex * 72;
      mobileWheel.style.setProperty('--wheel-angle', `${angle}deg`);
      mobileWheelLabel.textContent = mobileActionLabels[action];
      mobileActions.forEach((button) => button.classList.toggle('is-active', button.dataset.mobileAction === action));
    };
    const stepMobileWheel = (direction) => {
      mobileWheelIndex = (mobileWheelIndex + direction + mobileActionOrder.length) % mobileActionOrder.length;
      renderMobileWheel();
    };
    root.querySelector('[data-distribution-mobile-wheel-prev]').onclick = () => stepMobileWheel(-1);
    root.querySelector('[data-distribution-mobile-wheel-next]').onclick = () => stepMobileWheel(1);
    mobileWheelToggle.onclick = () => {
      const collapsed = mobileHub.classList.toggle('is-collapsed');
      mobileWheelToggle.setAttribute('aria-expanded', String(!collapsed));
      mobileWheelToggle.setAttribute('aria-label', collapsed ? 'Mostrar herramientas' : 'Ocultar herramientas');
    };
    mobileActions.forEach((button) => {
      button.onclick = () => {
        mobileWheelIndex = Number(button.dataset.mobileWheelIndex) || 0;
        renderMobileWheel();
        openMobileSheet(button.dataset.mobileAction);
      };
    });
    root.querySelector('[data-distribution-mobile-sheet-close]').onclick = closeMobileSheet;
    root.querySelector('[data-distribution-mobile-sheet-cancel]').onclick = closeMobileSheet;
    mobileSheetBackdrop.onclick = closeMobileSheet;
    renderMobileWheel();

    const proposalDelete = root.querySelector('[data-distribution-proposal-delete]');
    const toolbarMenus = [...root.querySelectorAll('[data-distribution-menu]')];
    toolbarMenus.forEach((menu) => {
      menu.addEventListener('toggle', () => {
        if (!menu.open) return;
        toolbarMenus.forEach((other) => {
          if (other !== menu) other.removeAttribute('open');
        });
      });
      menu.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', () => menu.removeAttribute('open'));
      });
    });

    const refreshProposalControls = () => {
      proposalSelect.replaceChildren(...proposalState.map((proposal) => {
        const option = document.createElement('option');
        option.value = proposal.id;
        option.textContent = proposal.name;
        option.selected = proposal.id === activeProposalId;
        return option;
      }));
      proposalDelete.disabled = !canEdit || proposalState.length <= 1;
      proposalNew.disabled = !canEdit;
      proposalDuplicate.disabled = !canEdit;
      proposalRename.disabled = !canEdit;
    };
    refreshProposalControls();

    world.style.width = `${layout.width}px`;
    world.style.height = `${layout.height}px`;
    root.querySelector('[data-distribution-table-count]').textContent = String(tables.length);
    root.querySelector('[data-distribution-empty]').hidden = tables.length > 0;

    layout.items.forEach((item) => {
      const tableId = escapeText(item.table?.id);
      if (!tableId) return;
      world.append(renderTable(item, guestIndex, placementState.get(tableId)));
    });
    physicalElements.forEach((element) => world.append(renderPhysicalElement(element)));

    const camera = setupDistributionCamera(root, world, layout);

    const distributionProposalSignature = (proposal) => JSON.stringify(proposal ?? null);

    const mergeDistributionStates = (baseState, localState, remoteState) => {
      if (!baseState || !remoteState) return { state: localState, conflicts: [] };
      const baseById = new Map(baseState.proposals.map((proposal) => [proposal.id, proposal]));
      const localById = new Map(localState.proposals.map((proposal) => [proposal.id, proposal]));
      const remoteById = new Map(remoteState.proposals.map((proposal) => [proposal.id, proposal]));
      const orderedIds = [
        ...localState.proposals.map((proposal) => proposal.id),
        ...remoteState.proposals.map((proposal) => proposal.id).filter((id) => !localById.has(id))
      ];
      const conflicts = [];
      const proposals = [];

      orderedIds.forEach((id) => {
        const baseProposal = baseById.get(id) || null;
        const localProposal = localById.get(id) || null;
        const remoteProposal = remoteById.get(id) || null;
        const baseSignature = distributionProposalSignature(baseProposal);
        const localSignature = distributionProposalSignature(localProposal);
        const remoteSignature = distributionProposalSignature(remoteProposal);
        const localChanged = localSignature !== baseSignature;
        const remoteChanged = remoteSignature !== baseSignature;

        if (localChanged && remoteChanged && localSignature !== remoteSignature) {
          conflicts.push(id);
          return;
        }
        const chosen = remoteChanged ? remoteProposal : localProposal;
        if (chosen) proposals.push(JSON.parse(JSON.stringify(chosen)));
      });

      if (conflicts.length) return { state: null, conflicts };
      const activeId = proposals.some((proposal) => proposal.id === localState.activeProposalId)
        ? localState.activeProposalId
        : proposals[0]?.id || DEFAULT_PROPOSAL_ID;
      return {
        state: { version: 1, activeProposalId: activeId, proposals },
        conflicts: []
      };
    };

    const hideSyncConflict = () => {
      pendingRemoteDistributionState = null;
      pendingLocalDistributionState = null;
      syncConflict.hidden = true;
    };

    const showSyncConflict = (localState, remoteState) => {
      pendingLocalDistributionState = JSON.parse(JSON.stringify(localState));
      pendingRemoteDistributionState = JSON.parse(JSON.stringify(remoteState));
      closeMobileSheet();
      syncConflict.hidden = false;
      status.textContent = 'Conflicto de sincronización · elige qué versión conservar';
    };

    async function persistDistribution({ force = false } = {}) {
      if (!canEdit || !dirty || saving || canonicalRefreshPending || !tables.length) return false;
      saving = true;
      updateSaveState();
      try {
        const activeIndex = proposalState.findIndex((proposal) => proposal.id === activeProposalId);
        const activeName = proposalState[activeIndex]?.name || 'Propuesta';
        proposalState[activeIndex] = serializeProposal(activeProposalId, activeName, placementState, tableIds, physicalElements);
        let payload = serializeDistribution(proposalState, activeProposalId);

        if (!force) {
          const remoteValue = await readPlannerStorageKey(context, DISTRIBUTION_STORAGE_KEY);
          const remoteState = parseDistributionState(remoteValue);
          const remoteSignature = remoteState ? JSON.stringify(remoteState) : '';
          if (remoteSignature && lastPersistedSignature && remoteSignature !== lastPersistedSignature) {
            const merged = mergeDistributionStates(lastPersistedState, payload, remoteState);
            if (merged.conflicts.length) {
              showSyncConflict(payload, remoteState);
              dirty = true;
              return false;
            }
            payload = merged.state;
            proposalState.splice(0, proposalState.length, ...payload.proposals.map((proposal) => ({
              ...proposal,
              placements: proposal.placements.map((placement) => ({ ...placement })),
              elements: proposal.elements.map((element) => ({
                ...element,
                points: Array.isArray(element.points) ? element.points.map((point) => ({ ...point })) : null
              }))
            })));
          }
        }

        await writePlannerStorageKey(context, DISTRIBUTION_STORAGE_KEY, payload);
        lastPersistedSignature = JSON.stringify(payload);
        lastPersistedState = JSON.parse(JSON.stringify(payload));
        hasPersistedState = true;
        hideSyncConflict();

        dirty = false;
        updateHistoryState();
        status.textContent = 'Distribución sincronizada';
        return true;
      } catch (error) {
        console.error('No se pudo sincronizar Distribución:', error);
        status.textContent = error?.message || 'No se pudo sincronizar la distribución.';
        return false;
      } finally {
        saving = false;
        if (
          queuedRemoteDistributionSignature
          && queuedRemoteDistributionSignature !== lastPersistedSignature
          && pendingRemoteDistributionState
          && dirty === false
        ) {
          const activeIndex = proposalState.findIndex((proposal) => proposal.id === activeProposalId);
          const activeName = proposalState[activeIndex]?.name || 'Propuesta';
          proposalState[activeIndex] = serializeProposal(activeProposalId, activeName, placementState, tableIds, physicalElements);
          const currentLocalState = serializeDistribution(proposalState, activeProposalId);
          showSyncConflict(currentLocalState, pendingRemoteDistributionState);
          dirty = true;
        }
        if (queuedRemoteDistributionSignature === lastPersistedSignature) {
          queuedRemoteDistributionSignature = '';
          pendingRemoteDistributionState = null;
        }
        if (canonicalRefreshPending) {
          canonicalRefreshPending = false;
          try {
            await reconcileCanonicalTables();
          } catch (error) {
            console.error('No se pudo reconciliar Invitados/Mesas después de sincronizar Distribución:', error);
            status.textContent = 'No se pudo actualizar Invitados/Mesas en este momento';
          }
        }
        updateSaveState();
      }
    }

    const scheduleAutosave = (delay = 250) => {
      if (!canEdit || saving || canonicalRefreshPending || !dirty || hasSyncConflict()) return;
      if (autosaveTimer) window.clearTimeout(autosaveTimer);
      autosaveTimer = window.setTimeout(() => {
        autosaveTimer = 0;
        if (!dirty || saving || canonicalRefreshPending) return;
        void persistDistribution();
      }, delay);
    };

    const updateSaveState = () => {
      if (!canEdit) status.textContent = 'Solo lectura · la distribución no puede modificarse';
      else if (hasSyncConflict()) status.textContent = 'Conflicto de sincronización · elige qué versión conservar';
      else if (saving) status.textContent = 'Sincronizando distribución…';
      else if (dirty) status.textContent = 'Sincronizando cambios…';
      else status.textContent = hasPersistedState ? 'Distribución sincronizada' : 'Distribución proyectada · sincronización pendiente';
      if (dirty && !saving && !canonicalRefreshPending && !hasSyncConflict()) scheduleAutosave();
    };

    const clearVisualSelection = () => {
      world.querySelectorAll('.distribution-table,.distribution-element').forEach((node) => node.classList.remove('is-selected'));
    };

    const selectTable = (tableId) => {
      const entry = tableById.get(tableId);
      const placement = placementState.get(tableId);
      if (!entry || !placement) return;
      selectedTableId = tableId;
      selectedElementId = '';
      clearVisualSelection();
      world.querySelector(`.distribution-table[data-table-id="${CSS.escape(tableId)}"]`)?.classList.add('is-selected');
      renderInspector(root, entry.table, entry.index, guests, placement);
    };

    const TABLE_SHAPE_LABELS = Object.freeze({
      round: 'Redonda',
      square: 'Cuadrada',
      rectangular: 'Rectangular'
    });

    const syncLayoutTableGeometry = (tableId, table, index, capacity, geometry) => {
      const item = layout.items.find((candidate) => escapeText(candidate?.table?.id) === escapeText(tableId));
      if (!item) return;
      item.table = table;
      item.index = index;
      item.capacity = capacity;
      item.geometry = geometry;
    };

    const redrawTableInPlace = (tableId) => {
      const entry = tableById.get(tableId);
      const table = entry?.table;
      const placement = placementState.get(tableId);
      const currentNode = world.querySelector(`.distribution-table[data-table-id="${CSS.escape(tableId)}"]`);
      if (!entry || !table || !placement || !currentNode) return null;

      const capacity = capacityOf(table);
      const geometry = tablePhysicalGeometry(table, capacity || 4);
      syncLayoutTableGeometry(tableId, table, entry.index, capacity, geometry);
      const replacement = renderTable({
        table,
        index: entry.index,
        capacity,
        geometry
      }, guestIndex, placement);

      currentNode.replaceWith(replacement);
      bindTableInteraction(replacement);
      if (selectedTableId === tableId) replacement.classList.add('is-selected');
      return replacement;
    };

    async function persistCanonicalTableChange(tableId, mutateLatestTable) {
      const latest = await loadInvitadosSnapshot(context);
      const latestTable = latest.canonical.tables.find((item) => escapeText(item?.id) === escapeText(tableId));
      if (!latestTable) throw new Error('La mesa ya no existe en la información actual.');
      mutateLatestTable(latestTable);
      latestTable.updatedAt = new Date().toISOString();
      await saveInvitadosSnapshot(context, latest.canonical);
      return latestTable;
    }

    async function changeSelectedTableDimensions(widthMeters, heightMeters, { reset = false } = {}) {
      if (!canEdit || !selectedTableId || saving || canonicalRefreshPending) return;
      const tableId = selectedTableId;
      const entry = tableById.get(tableId);
      const table = entry?.table;
      if (!table) return;

      if (dirty) {
        if (autosaveTimer) {
          window.clearTimeout(autosaveTimer);
          autosaveTimer = 0;
        }
        const persisted = await persistDistribution();
        if (!persisted && dirty) {
          status.textContent = 'No se pudo sincronizar la posición antes de cambiar la medida de mesa';
          return;
        }
      }

      const previousDimensions = table.dimensions && typeof table.dimensions === 'object'
        ? { ...table.dimensions }
        : null;
      const target = reset
        ? standardTablePhysicalDimensions(table.type || table.shape)
        : {
            ...tablePhysicalDimensions(table),
            width: normalizeTableMeters(widthMeters, tablePhysicalDimensions(table).width),
            height: normalizeTableShape(table.type || table.shape) === 'rectangular'
              ? normalizeTableMeters(heightMeters, tablePhysicalDimensions(table).height)
              : normalizeTableMeters(widthMeters, tablePhysicalDimensions(table).width)
          };

      table.dimensions = reset
        ? undefined
        : createTableDimensions(table.type || table.shape, target.width, target.height, table.dimensions);
      redrawTableInPlace(tableId);
      renderInspector(root, table, entry.index, guests, placementState.get(tableId));
      refreshSpatialConflicts();
      status.textContent = 'Sincronizando medida de mesa…';

      try {
        const latestTable = await persistCanonicalTableChange(tableId, (record) => {
          if (reset) delete record.dimensions;
          else record.dimensions = createTableDimensions(record.type || record.shape, target.width, target.height, record.dimensions);
        });
        if (latestTable.dimensions) table.dimensions = { ...latestTable.dimensions };
        else delete table.dimensions;
        window.dispatchEvent(new CustomEvent('migrandia:datachange', {
          detail: {
            source: 'distribucion',
            module: 'distribucion',
            weddingId: context?.id || '',
            tables: tables.length
          }
        }));
        status.textContent = 'Medida de mesa sincronizada';
      } catch (error) {
        if (previousDimensions) table.dimensions = previousDimensions;
        else delete table.dimensions;
        redrawTableInPlace(tableId);
        renderInspector(root, table, entry.index, guests, placementState.get(tableId));
        refreshSpatialConflicts();
        console.error('No se pudo actualizar la medida de mesa:', error);
        status.textContent = error?.message || 'No se pudo actualizar la medida de mesa.';
      }
    }

    async function changeSelectedTableShape(nextShape) {
      if (!canEdit || !selectedTableId || saving || canonicalRefreshPending) return;
      const tableId = selectedTableId;
      const entry = tableById.get(tableId);
      const table = entry?.table;
      if (!table) return;

      const normalized = normalizeTableShape(nextShape);
      const previousType = normalizeTableShape(table.type || table.shape);
      if (normalized === previousType) return;

      if (dirty) {
        if (autosaveTimer) {
          window.clearTimeout(autosaveTimer);
          autosaveTimer = 0;
        }
        const persisted = await persistDistribution();
        if (!persisted && dirty) {
          status.textContent = 'No se pudo sincronizar la posición antes de cambiar el tipo de mesa';
          root.querySelector('[data-distribution-table-shape]').value = previousType;
          return;
        }
      }

      table.type = normalized;
      table.updatedAt = new Date().toISOString();
      redrawTableInPlace(tableId);
      renderInspector(root, table, entry.index, guests, placementState.get(tableId));
      status.textContent = `Sincronizando mesa ${TABLE_SHAPE_LABELS[normalized]}…`;

      try {
        const latestTable = await persistCanonicalTableChange(tableId, (record) => {
          record.type = normalized;
        });
        table.type = latestTable.type;
        if (latestTable.dimensions) table.dimensions = { ...latestTable.dimensions };
        else delete table.dimensions;
        window.dispatchEvent(new CustomEvent('migrandia:datachange', {
          detail: {
            source: 'distribucion',
            module: 'distribucion',
            weddingId: context?.id || '',
            tables: tables.length
          }
        }));
        status.textContent = `Mesa actualizada a ${TABLE_SHAPE_LABELS[normalized]}`;
        refreshSpatialConflicts();
      } catch (error) {
        table.type = previousType;
        redrawTableInPlace(tableId);
        renderInspector(root, table, entry.index, guests, placementState.get(tableId));
        root.querySelector('[data-distribution-table-shape]').value = previousType;
        console.error('No se pudo actualizar el tipo de mesa:', error);
        status.textContent = error?.message || 'No se pudo actualizar el tipo de mesa.';
      }
    }

    const selectElement = (elementId) => {
      const element = physicalElements.find((item) => item.id === elementId);
      if (!element) return;
      selectedTableId = '';
      selectedElementId = elementId;
      clearVisualSelection();
      world.querySelector(`.distribution-element[data-element-id="${CSS.escape(elementId)}"]`)?.classList.add('is-selected');
      renderElementInspector(root, element);
    };

    const clearSelection = () => {
      selectedTableId = '';
      selectedElementId = '';
      clearVisualSelection();
      root.querySelector('[data-distribution-selection]').hidden = true;
      root.querySelector('[data-distribution-selection-empty]').hidden = false;
    };

    const presentationButton = root.querySelector('[data-distribution-presentation]');
    let presentationMode = false;
    const setPresentationMode = (enabled) => {
      presentationMode = Boolean(enabled);
      root.classList.toggle('is-presentation-mode', presentationMode);
      presentationButton.setAttribute('aria-pressed', String(presentationMode));
      presentationButton.textContent = presentationMode ? 'Volver a editar' : 'Presentación';
      if (presentationMode) {
        clearSelection();
        requestAnimationFrame(() => camera.fit());
      }
    };
    presentationButton.onclick = () => setPresentationMode(!presentationMode);

    const cleanViewButton = root.querySelector('[data-distribution-clean-view]');
    let cleanView = false;
    cleanViewButton.onclick = () => {
      cleanView = !cleanView;
      root.classList.toggle('is-clean-plan', cleanView);
      cleanViewButton.setAttribute('aria-pressed', String(cleanView));
      cleanViewButton.textContent = cleanView ? 'Mostrar cuadrícula' : 'Plano limpio';
    };
    root.querySelector('[data-distribution-print]').onclick = () => {
      if (dirty || saving || canonicalRefreshPending) {
        status.textContent = 'Guarda los cambios antes de imprimir o generar PDF';
        return;
      }
      const wasPresentation = presentationMode;
      const referenceWasHidden = world.classList.contains('hide-reference-image');
      if (world.classList.contains('has-reference-image') && !referenceWasHidden) world.classList.add('print-reference-image');
      if (!wasPresentation) setPresentationMode(true);
      root.classList.add('is-printing-plan');
      requestAnimationFrame(() => {
        camera.fit();
        requestAnimationFrame(() => {
          window.print();
          root.classList.remove('is-printing-plan');
          world.classList.remove('print-reference-image');
          if (!wasPresentation) setPresentationMode(false);
        });
      });
    };

    const persistCurrentProposalInMemory = () => {
      const index = proposalState.findIndex((proposal) => proposal.id === activeProposalId);
      if (index < 0) return;
      proposalState[index] = serializeProposal(activeProposalId, proposalState[index].name, placementState, tableIds, physicalElements);
    };
    const proposalId = () => {
      let id = '';
      do {
        id = `proposal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      } while (proposalState.some((proposal) => proposal.id === id));
      return id;
    };
    const elementIdsForProposal = (proposal) => new Set((proposal?.elements || []).map((element) => escapeText(element.id)).filter(Boolean));
    const duplicateElementId = (sourceId, proposalIdValue, usedIds) => {
      const base = `${escapeText(sourceId) || 'element'}_${proposalIdValue}`;
      let id = base;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `${base}_${suffix}`;
        suffix += 1;
      }
      usedIds.add(id);
      return id;
    };
    const switchProposal = (nextId) => {
      if (dirty || saving || canonicalRefreshPending) {
        proposalSelect.value = activeProposalId;
        status.textContent = 'Guarda los cambios antes de cambiar de propuesta';
        return;
      }
      const next = proposalState.find((proposal) => proposal.id === nextId);
      if (!next) return;
      activeProposalId = next.id;
      const nextState = { version: 1, activeProposalId, proposals: proposalState };
      const nextPlacements = placementMapFor(layout, nextState);
      placementState.clear();
      nextPlacements.forEach((placement, tableId) => placementState.set(tableId, placement));
      physicalElements.splice(0, physicalElements.length, ...next.elements.map((element) => ({ ...element, points: Array.isArray(element.points) ? element.points.map((point) => ({ ...point })) : null })));
      elementSequence = physicalElements.reduce((max, element) => {
        const value = Number(String(element.id).match(/(\d+)$/)?.[1] || 0);
        return Math.max(max, value);
      }, 0);
      world.querySelectorAll('.distribution-table,.distribution-element').forEach((node) => node.remove());
      layout.items.forEach((item) => {
        const tableId = escapeText(item.table?.id);
        if (!tableId) return;
        const node = renderTable(item, guestIndex, placementState.get(tableId));
        world.append(node);
        bindTableInteraction(node);
      });
      physicalElements.forEach((element) => {
        const node = renderPhysicalElement(element);
        world.append(node);
        bindElementInteraction(node, element);
      });
      clearSelection();
      undoStack.length = 0; redoStack.length = 0; updateHistoryState();
      refreshProposalControls();
      refreshSpatialConflicts();
      requestAnimationFrame(() => camera.fit());
      status.textContent = `${next.name} · propuesta activa`;
    };
    proposalSelect.onchange = () => switchProposal(proposalSelect.value);
    proposalNew.onclick = () => {
      if (!canEdit || dirty || saving || canonicalRefreshPending) return;
      persistCurrentProposalInMemory();
      const id = proposalId();
      const name = `Alternativa ${proposalState.length + 1}`;
      const blank = serializeProposal(id, name, placementMapFor(layout, null), tableIds, []);
      proposalState.push(blank);
      activeProposalId = id;
      refreshProposalControls();
      switchProposal(id);
      dirty = true; updateSaveState();
    };
    proposalDuplicate.onclick = () => {
      if (!canEdit || dirty || saving || canonicalRefreshPending) return;
      persistCurrentProposalInMemory();
      const source = proposalState.find((proposal) => proposal.id === activeProposalId);
      if (!source) return;
      const id = proposalId();
      const usedElementIds = elementIdsForProposal(source);
      const copy = { ...source, id, name: `${source.name} · copia`, placements: source.placements.map((placement) => ({ ...placement })), elements: source.elements.map((element) => ({ ...element, id: duplicateElementId(element.id, id, usedElementIds), points: Array.isArray(element.points) ? element.points.map((point) => ({ ...point })) : null })) };
      proposalState.push(copy);
      activeProposalId = id;
      refreshProposalControls();
      switchProposal(id);
      dirty = true; updateSaveState();
    };
    proposalRename.onclick = () => {
      if (!canEdit || saving || canonicalRefreshPending) return;
      const proposal = proposalState.find((item) => item.id === activeProposalId);
      if (!proposal) return;
      const name = window.prompt('Nombre de la propuesta', proposal.name);
      if (name === null) return;
      const clean = escapeText(name);
      if (!clean || clean === proposal.name) return;
      proposal.name = clean;
      dirty = true; refreshProposalControls(); updateSaveState();
    };
    proposalDelete.onclick = () => {
      if (!canEdit || dirty || saving || canonicalRefreshPending || proposalState.length <= 1) return;
      const current = proposalState.find((proposal) => proposal.id === activeProposalId);
      if (!current || !window.confirm(`Eliminar "${current.name}"? Solo se eliminará este plano; mesas e invitados no cambian.`)) return;
      const index = proposalState.findIndex((proposal) => proposal.id === activeProposalId);
      proposalState.splice(index, 1);
      activeProposalId = proposalState[Math.max(0, index - 1)].id;
      refreshProposalControls();
      switchProposal(activeProposalId);
      dirty = true; updateSaveState();
    };

    const editorSnapshot = () => ({
      placements: tableIds.map((tableId) => ({ tableId, ...placementState.get(tableId) })),
      elements: physicalElements.map((element) => ({
        ...element,
        points: Array.isArray(element.points) ? element.points.map((point) => ({ ...point })) : null
      }))
    });

    const updateHistoryState = () => {
      undoButton.disabled = !canEdit || undoStack.length === 0;
      redoButton.disabled = !canEdit || redoStack.length === 0;
    };

    const rememberEdit = () => {
      undoStack.push(editorSnapshot());
      if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
      redoStack.length = 0;
      updateHistoryState();
    };

    const restoreEditorSnapshot = (snapshot) => {
      snapshot.placements.forEach((placement) => {
        const current = placementState.get(placement.tableId);
        if (!current) return;
        current.x = placement.x;
        current.y = placement.y;
        current.rotation = placement.rotation;
      });
      physicalElements.splice(0, physicalElements.length, ...snapshot.elements.map((element) => ({
        ...element,
        points: Array.isArray(element.points) ? element.points.map((point) => ({ ...point })) : null
      })));
      world.querySelectorAll('.distribution-table').forEach((node) => {
        const placement = placementState.get(node.dataset.tableId);
        if (placement) applyPlacement(node, placement);
      });
      world.querySelectorAll('.distribution-element').forEach((node) => node.remove());
      physicalElements.forEach((element) => {
        const node = renderPhysicalElement(element);
        world.append(node);
        bindElementInteraction(node, element);
      });
      clearSelection();
      dirty = true;
      updateSaveState();
      refreshSpatialConflicts();
    };

    const undoEdit = () => {
      if (!canEdit || !undoStack.length) return;
      redoStack.push(editorSnapshot());
      restoreEditorSnapshot(undoStack.pop());
      updateHistoryState();
    };

    const redoEdit = () => {
      if (!canEdit || !redoStack.length) return;
      undoStack.push(editorSnapshot());
      restoreEditorSnapshot(redoStack.pop());
      updateHistoryState();
    };

    const proximitySelect = root.querySelector('[data-distribution-proximity]');
    const snapToggle = root.querySelector('[data-distribution-snap]');
    const SNAP_STEP_METERS = 0.25;
    let proximityMeters = Number(proximitySelect?.value) || 1;
    let snapEnabled = false;
    const snapCoordinate = (value) => snapEnabled
      ? Math.round(value / (PLAN_SCALE.pixelsPerMeter * SNAP_STEP_METERS)) * PLAN_SCALE.pixelsPerMeter * SNAP_STEP_METERS
      : value;

    const refreshSpatialConflicts = () => {
      const issues = [];
      const tableShapes = layout.items.map((item) => {
        const tableId = escapeText(item.table?.id);
        const currentEntry = tableById.get(tableId);
        const table = currentEntry?.table || item.table;
        const index = currentEntry?.index ?? item.index;
        const capacity = capacityOf(table);
        const geometry = tablePhysicalGeometry(table, capacity || 4);
        syncLayoutTableGeometry(tableId, table, index, capacity, geometry);
        return { tableId, table, index, shape: spatialShapeForTable(table, placementState.get(tableId), geometry) };
      });
      const elementShapes = physicalElements.map((element) => ({
        element,
        shape: spatialShapeForElement(element)
      })).filter((entry) => entry.shape);

      const tableLabel = (entry) => tableName(entry.table, entry.index);
      const elementLabel = (element) => PHYSICAL_ELEMENT_TYPES[element.type]?.label || 'Elemento';

      world.querySelectorAll('.distribution-table,.distribution-element').forEach((node) => {
        node.classList.remove('has-spatial-conflict', 'has-spatial-warning', 'has-proximity-warning');
      });

      const markSpatialState = (node, state) => {
        if (!node || state === 'allow') return;
        node.classList.add(state === 'conflict' ? 'has-spatial-conflict' : 'has-spatial-warning');
      };

      const addIssue = (kind, message, target) => issues.push({ kind, message, target });

      tableShapes.forEach((tableEntry, index) => {
        const tableNode = world.querySelector(`.distribution-table[data-table-id="${CSS.escape(tableEntry.tableId)}"]`);
        elementShapes.forEach((elementEntry) => {
          if (!spatialShapesIntersect(tableEntry.shape, elementEntry.shape)) return;
          const state = spatialRuleFor(elementEntry.element, 'table');
          markSpatialState(tableNode, state);
          markSpatialState(world.querySelector(`.distribution-element[data-element-id="${CSS.escape(elementEntry.element.id)}"]`), state);
          if (state !== 'allow') {
            addIssue(state, `${tableLabel(tableEntry)} · ${elementLabel(elementEntry.element)}`, { kind: 'table', id: tableEntry.tableId });
          }
        });

        tableShapes.slice(index + 1).forEach((otherEntry) => {
          const second = world.querySelector(`.distribution-table[data-table-id="${CSS.escape(otherEntry.tableId)}"]`);
          if (spatialShapesIntersect(tableEntry.shape, otherEntry.shape)) {
            markSpatialState(tableNode, 'conflict');
            markSpatialState(second, 'conflict');
            addIssue('conflict', `${tableLabel(tableEntry)} · ${tableLabel(otherEntry)}`, { kind: 'table', id: tableEntry.tableId });
            return;
          }
          const gapMeters = PLAN_SCALE.pixelsToMeters(shapeBoundaryDistance(tableEntry.shape, otherEntry.shape));
          if (gapMeters >= proximityMeters) return;
          [tableNode, second].forEach((node) => node?.classList.add('has-proximity-warning'));
          addIssue('proximity', `${tableLabel(tableEntry)} · ${tableLabel(otherEntry)} · ${gapMeters.toFixed(2)} m`, { kind: 'table', id: tableEntry.tableId });
        });
      });

      elementShapes.forEach((entry, index) => {
        const node = world.querySelector(`.distribution-element[data-element-id="${CSS.escape(entry.element.id)}"]`);
        elementShapes.slice(index + 1).forEach((other) => {
          if (!spatialShapesIntersect(entry.shape, other.shape)) return;
          const state = spatialRuleFor(entry.element, other.element);
          markSpatialState(node, state);
          markSpatialState(world.querySelector(`.distribution-element[data-element-id="${CSS.escape(other.element.id)}"]`), state);
          if (state !== 'allow') {
            addIssue(state, `${elementLabel(entry.element)} · ${elementLabel(other.element)}`, { kind: 'element', id: entry.element.id });
          }
        });
      });

      const list = root.querySelector('[data-distribution-validation-list]');
      const conflicts = issues.filter((issue) => issue.kind === 'conflict').length;
      const warnings = issues.filter((issue) => issue.kind === 'warning').length;
      const proximity = issues.filter((issue) => issue.kind === 'proximity').length;
      root.querySelector('[data-distribution-validation-count]').textContent = `${issues.length} ${issues.length === 1 ? 'incidencia' : 'incidencias'}`;
      root.querySelector('[data-distribution-validation-conflicts]').textContent = String(conflicts);
      root.querySelector('[data-distribution-validation-warnings]').textContent = String(warnings);
      root.querySelector('[data-distribution-validation-proximity]').textContent = String(proximity);
      list.replaceChildren();

      if (!issues.length) {
        const ok = document.createElement('span');
        ok.className = 'distribution-validation-ok';
        ok.textContent = 'Plano sin incidencias espaciales.';
        list.append(ok);
        return;
      }

      issues.forEach((issue) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `distribution-validation-issue is-${issue.kind}`;
        button.textContent = issue.message;
        button.onclick = () => {
          const selector = issue.target.kind === 'table'
            ? `.distribution-table[data-table-id="${CSS.escape(issue.target.id)}"]`
            : `.distribution-element[data-element-id="${CSS.escape(issue.target.id)}"]`;
          const node = world.querySelector(selector);
          if (issue.target.kind === 'table') selectTable(issue.target.id);
          else selectElement(issue.target.id);
          camera.focusNode(node);
          node?.focus();
        };
        list.append(button);
      });
    };

    proximitySelect?.addEventListener('change', () => {
      const next = Number(proximitySelect.value);
      proximityMeters = PROXIMITY_OPTIONS_METERS.includes(next) ? next : 1;
      refreshSpatialConflicts();
      status.textContent = `Alerta de separación configurada en ${proximityMeters.toFixed(1)} m`;
    });

    snapToggle?.addEventListener('change', () => {
      snapEnabled = snapToggle.checked;
      status.textContent = snapEnabled
        ? `Ajuste a cuadrícula activo · pasos de ${SNAP_STEP_METERS.toFixed(2)} m`
        : 'Ajuste a cuadrícula desactivado';
    });

    const markDirty = () => {
      dirty = true;
      updateSaveState();
      refreshSpatialConflicts();
    };

    const createElement = (type, x, y, rotation = 0) => {
      if (!PHYSICAL_ELEMENT_TYPES[type]) return null;
      const usedIds = new Set(physicalElements.map((element) => escapeText(element.id)).filter(Boolean));
      let elementId = '';
      do {
        elementSequence += 1;
        elementId = `element_${elementSequence}`;
      } while (usedIds.has(elementId));
      const definition = PHYSICAL_ELEMENT_TYPES[type];
      const element = { id: elementId, type, x, y, rotation: normalizeRotation(rotation), layer: physicalElements.length, locked: false, width: definition.width, height: definition.height };
      physicalElements.push(element);
      const node = renderPhysicalElement(element);
      world.append(node);
      bindElementInteraction(node, element);
      return element;
    };

    const duplicateSelectedElement = () => {
      if (!canEdit || !selectedElementId) return;
      const source = physicalElements.find((item) => item.id === selectedElementId);
      if (!source || source.locked || !elementCapabilities(source).copyable) return;
      rememberEdit();
      const duplicate = createElement(source.type, source.x + 24, source.y + 24, source.rotation);
      if (!duplicate) return;
      duplicate.width = source.width;
      duplicate.height = source.height;
      duplicate.points = Array.isArray(source.points) ? source.points.map((point) => ({ ...point })) : null;
      const duplicateNode = world.querySelector(`.distribution-element[data-element-id="${CSS.escape(duplicate.id)}"]`);
      if (Array.isArray(duplicate.points) && duplicateNode) {
        const replacement = renderPhysicalElement(duplicate);
        duplicateNode.replaceWith(replacement);
        bindElementInteraction(replacement, duplicate);
      } else if (duplicateNode) {
        applyElementPlacement(duplicateNode, duplicate);
      }
      selectElement(duplicate.id);
      world.querySelector(`.distribution-element[data-element-id="${CSS.escape(duplicate.id)}"]`)?.focus();
      markDirty();
    };

    const deleteSelectedElement = () => {
      if (!canEdit || !selectedElementId) return;
      const selected = physicalElements.find((item) => item.id === selectedElementId);
      if (selected?.locked || !elementCapabilities(selected).deletable) return;
      const index = physicalElements.findIndex((item) => item.id === selectedElementId);
      if (index < 0) return;
      rememberEdit();
      const [removed] = physicalElements.splice(index, 1);
      world.querySelector(`.distribution-element[data-element-id="${CSS.escape(removed.id)}"]`)?.remove();
      clearSelection();
      markDirty();
    };

    let copiedElement = null;

    const copySelectedElement = () => {
      if (!selectedElementId) return;
      const source = physicalElements.find((item) => item.id === selectedElementId);
      if (!source || !elementCapabilities(source).copyable) return;
      copiedElement = { type: source.type, x: source.x, y: source.y, rotation: source.rotation, width: source.width, height: source.height, points: Array.isArray(source.points) ? source.points.map((point) => ({ ...point })) : null };
      status.textContent = `${PHYSICAL_ELEMENT_TYPES[source.type].label} copiado`;
    };

    const pasteCopiedElement = () => {
      if (!canEdit || !copiedElement || !PHYSICAL_ELEMENT_TYPES[copiedElement.type]?.capabilities?.copyable) return;
      rememberEdit();
      copiedElement = { ...copiedElement, x: copiedElement.x + 24, y: copiedElement.y + 24 };
      const pasted = createElement(copiedElement.type, copiedElement.x, copiedElement.y, copiedElement.rotation);
      if (!pasted) return;
      pasted.width = copiedElement.width;
      pasted.height = copiedElement.height;
      pasted.points = Array.isArray(copiedElement.points) ? copiedElement.points.map((point) => ({ ...point })) : null;
      const pastedNode = world.querySelector(`.distribution-element[data-element-id="${CSS.escape(pasted.id)}"]`);
      if (Array.isArray(pasted.points) && pastedNode) {
        const replacement = renderPhysicalElement(pasted);
        pastedNode.replaceWith(replacement);
        bindElementInteraction(replacement, pasted);
      } else if (pastedNode) {
        applyElementPlacement(pastedNode, pasted);
      }
      selectElement(pasted.id);
      world.querySelector(`.distribution-element[data-element-id="${CSS.escape(pasted.id)}"]`)?.focus();
      markDirty();
    };

    // Las asignaciones son canónicas de Invitados/Mesas y aquí son solo lectura.
    // Distribución no escribe guest.tableId, guest.seatId ni guest.seatNumber.

    const applyTableRotation = (tableId, rotation, { inspector = true } = {}) => {
      const placement = placementState.get(tableId);
      const node = world.querySelector(`.distribution-table[data-table-id="${CSS.escape(tableId)}"]`);
      const entry = tableById.get(tableId);
      if (!placement || !node || !entry) return false;
      placement.rotation = normalizeRotation(rotation);
      applyPlacement(node, placement);
      if (inspector && selectedTableId === tableId) {
        const rotationOutput = root.querySelector('[data-distribution-selected-rotation]');
        rotationOutput.value = `${Math.round(placement.rotation)}°`;
        rotationOutput.textContent = rotationOutput.value;
      }
      refreshSpatialConflicts();
      return true;
    };

    const bindTableInteraction = (node) => {
      let move = null;
      let rotationGesture = null;
      let moved = false;

      const pointerAngleFromTableCenter = (event) => {
        const rect = node.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
      };

      node.addEventListener('pointerdown', (event) => {
        if (presentationMode || event.button !== 0) return;
        const rotationHandle = event.target.closest('[data-distribution-table-rotation-handle]');
        if (rotationHandle) {
          if (!canEdit || !EDIT_CAPABILITIES.table.rotatable) return;
          event.preventDefault();
          event.stopPropagation();
          const placement = placementState.get(node.dataset.tableId);
          if (!placement) return;
          node.setPointerCapture(event.pointerId);
          node.classList.add('is-rotating');
          rotationGesture = {
            pointerId: event.pointerId,
            lastPointerAngle: pointerAngleFromTableCenter(event),
            rotation: normalizeRotation(placement.rotation)
          };
          moved = false;
          rememberEdit();
          selectTable(node.dataset.tableId);
          return;
        }

        if (event.target.closest('[data-guest-id],.distribution-chair')) return;
        if (!canEdit || !EDIT_CAPABILITIES.table.movable) return;
        event.stopPropagation();
        const placement = placementState.get(node.dataset.tableId);
        if (!placement) return;
        node.setPointerCapture(event.pointerId);
        node.classList.add('is-moving');
        move = {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          x: placement.x,
          y: placement.y
        };
        moved = false;
        rememberEdit();
        selectTable(node.dataset.tableId);
      });

      node.addEventListener('pointermove', (event) => {
        if (rotationGesture && rotationGesture.pointerId === event.pointerId) {
          event.preventDefault();
          const nextPointerAngle = pointerAngleFromTableCenter(event);
          const rawDelta = nextPointerAngle - rotationGesture.lastPointerAngle;
          const delta = Math.atan2(
            Math.sin(rawDelta * Math.PI / 180),
            Math.cos(rawDelta * Math.PI / 180)
          ) * 180 / Math.PI;
          rotationGesture.rotation = normalizeRotation(rotationGesture.rotation + delta);
          rotationGesture.lastPointerAngle = nextPointerAngle;
          moved = moved || Math.abs(delta) > 0.05;
          applyTableRotation(node.dataset.tableId, rotationGesture.rotation);
          return;
        }

        if (!move || move.pointerId !== event.pointerId) return;
        const dx = camera.clientDeltaToWorld(event.clientX - move.clientX);
        const dy = camera.clientDeltaToWorld(event.clientY - move.clientY);
        if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
        const placement = placementState.get(node.dataset.tableId);
        placement.x = snapCoordinate(move.x + dx);
        placement.y = snapCoordinate(move.y + dy);
        applyPlacement(node, placement);
        refreshSpatialConflicts();
      });

      const finishInteraction = (event) => {
        const wasMoving = move && move.pointerId === event.pointerId;
        const wasRotating = rotationGesture && rotationGesture.pointerId === event.pointerId;
        if (!wasMoving && !wasRotating) return;
        node.classList.remove('is-moving', 'is-rotating');
        move = null;
        rotationGesture = null;
        if (moved) markDirty();
        else {
          undoStack.pop();
          updateHistoryState();
        }
      };
      node.addEventListener('pointerup', finishInteraction);
      node.addEventListener('pointercancel', finishInteraction);

      node.addEventListener('click', (event) => {
        event.stopPropagation();
        if (moved) {
          moved = false;
          return;
        }
        selectTable(node.dataset.tableId);
      });
    };

    world.querySelectorAll('.distribution-table').forEach(bindTableInteraction);

    world.addEventListener('keydown', (event) => {
      const node = event.target.closest('.distribution-table');
      if (!node) return;
      if (['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        selectTable(node.dataset.tableId);
        return;
      }
      if (!canEdit || !EDIT_CAPABILITIES.table.movable || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const placement = placementState.get(node.dataset.tableId);
      if (!placement) return;
      event.preventDefault();
      rememberEdit();
      const step = event.shiftKey ? KEYBOARD_MOVE_FINE_STEP : KEYBOARD_MOVE_STEP;
      if (event.key === 'ArrowLeft') placement.x -= step;
      if (event.key === 'ArrowRight') placement.x += step;
      if (event.key === 'ArrowUp') placement.y -= step;
      if (event.key === 'ArrowDown') placement.y += step;
      applyPlacement(node, placement);
      selectTable(node.dataset.tableId);
      markDirty();
    });

    const bindElementInteraction = (node, element) => {
      let move = null;
      let resize = null;
      let moved = false;

      const localDelta = (dx, dy, rotation) => {
        const angle = -normalizeRotation(rotation) * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
          x: dx * cos - dy * sin,
          y: dx * sin + dy * cos
        };
      };

      node.addEventListener('pointerdown', (event) => {
        if (presentationMode || event.button !== 0) return;
        event.stopPropagation();
        selectElement(element.id);

        const handle = event.target.closest('[data-distribution-resize-handle]');
        if (handle) {
          if (!canEdit || element.locked || !elementCapabilities(element).resizable) return;
          node.setPointerCapture(event.pointerId);
          node.classList.add('is-resizing');
          resize = {
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            rotation: normalizeRotation(element.rotation),
            xSign: Number(handle.dataset.resizeX) || 1,
            ySign: Number(handle.dataset.resizeY) || 1,
            points: Array.isArray(element.points) ? element.points.map((point) => ({ ...point })) : null
          };
          moved = false;
          rememberEdit();
          return;
        }

        if (!canEdit || element.locked || !elementCapabilities(element).movable) return;
        node.setPointerCapture(event.pointerId);
        node.classList.add('is-moving');
        move = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: element.x, y: element.y };
        moved = false;
        rememberEdit();
      });

      node.addEventListener('pointermove', (event) => {
        if (resize && resize.pointerId === event.pointerId) {
          const worldDx = camera.clientDeltaToWorld(event.clientX - resize.clientX);
          const worldDy = camera.clientDeltaToWorld(event.clientY - resize.clientY);
          const delta = localDelta(worldDx, worldDy, resize.rotation);
          const minSize = PIXELS_PER_METER * MIN_ELEMENT_METERS;
          const maxSize = PIXELS_PER_METER * MAX_ELEMENT_METERS;
          const nextWidth = Math.max(minSize, Math.min(maxSize, resize.width + resize.xSign * delta.x));
          const nextHeight = Math.max(minSize, Math.min(maxSize, resize.height + resize.ySign * delta.y));
          const widthDelta = nextWidth - resize.width;
          const heightDelta = nextHeight - resize.height;
          const angle = resize.rotation * Math.PI / 180;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const localCenterShiftX = resize.xSign * widthDelta / 2;
          const localCenterShiftY = resize.ySign * heightDelta / 2;
          const worldCenterShiftX = localCenterShiftX * cos - localCenterShiftY * sin;
          const worldCenterShiftY = localCenterShiftX * sin + localCenterShiftY * cos;

          element.width = nextWidth;
          element.height = nextHeight;
          element.x = resize.x + worldCenterShiftX - widthDelta / 2;
          element.y = resize.y + worldCenterShiftY - heightDelta / 2;

          if (resize.points) {
            const widthRatio = resize.width > 0 ? nextWidth / resize.width : 1;
            const heightRatio = resize.height > 0 ? nextHeight / resize.height : 1;
            element.points = resize.points.map((point) => ({
              x: point.x * widthRatio,
              y: point.y * heightRatio
            }));
          }

          moved = Math.abs(widthDelta) + Math.abs(heightDelta) > 1;
          refreshElementGeometryNode(node, element);
          refreshSpatialConflicts();
          return;
        }

        if (!move || move.pointerId !== event.pointerId) return;
        const dx = camera.clientDeltaToWorld(event.clientX - move.clientX);
        const dy = camera.clientDeltaToWorld(event.clientY - move.clientY);
        if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
        element.x = snapCoordinate(move.x + dx);
        element.y = snapCoordinate(move.y + dy);
        applyElementPlacement(node, element);
        refreshSpatialConflicts();
      });

      const finishInteraction = (event) => {
        const wasResizing = resize && resize.pointerId === event.pointerId;
        const wasMoving = move && move.pointerId === event.pointerId;
        if (!wasResizing && !wasMoving) return;
        node.classList.remove('is-moving', 'is-resizing');
        move = null;
        resize = null;
        if (moved) {
          renderElementInspector(root, element);
          markDirty();
        } else {
          undoStack.pop();
          updateHistoryState();
        }
      };
      node.addEventListener('pointerup', finishInteraction);
      node.addEventListener('pointercancel', finishInteraction);
      node.addEventListener('click', (event) => {
        event.stopPropagation();
        if (moved) {
          moved = false;
          return;
        }
        selectElement(element.id);
      });
      node.addEventListener('keydown', (event) => {
        if (!canEdit || element.locked || !elementCapabilities(element).movable || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        rememberEdit();
        const step = event.shiftKey ? KEYBOARD_MOVE_FINE_STEP : KEYBOARD_MOVE_STEP;
        if (event.key === 'ArrowLeft') element.x -= step;
        if (event.key === 'ArrowRight') element.x += step;
        if (event.key === 'ArrowUp') element.y -= step;
        if (event.key === 'ArrowDown') element.y += step;
        applyElementPlacement(node, element);
        selectElement(element.id);
        markDirty();
      });
    };

    world.querySelectorAll('.distribution-element').forEach((node) => {
      const element = physicalElements.find((item) => item.id === node.dataset.elementId);
      if (element) bindElementInteraction(node, element);
    });

    const rotateSelected = (delta) => {
      if (!canEdit) return;
      if (selectedTableId) {
        const placement = placementState.get(selectedTableId);
        if (!placement || !EDIT_CAPABILITIES.table.rotatable) return;
        rememberEdit();
        if (!applyTableRotation(selectedTableId, placement.rotation + delta)) {
          undoStack.pop();
          updateHistoryState();
          return;
        }
        markDirty();
        return;
      }
      if (selectedElementId) {
        const element = physicalElements.find((item) => item.id === selectedElementId);
        const node = world.querySelector(`.distribution-element[data-element-id="${CSS.escape(selectedElementId)}"]`);
        if (!element || !node || element.locked || !elementCapabilities(element).rotatable) return;
        rememberEdit();
        element.rotation = normalizeRotation(element.rotation + delta);
        applyElementPlacement(node, element);
        renderElementInspector(root, element);
        markDirty();
      }
    };

    root.querySelectorAll('[data-distribution-add-element]').forEach((button) => {
      button.disabled = !canEdit;
      button.onclick = () => {
        if (!canEdit) return;
        const type = escapeText(button.dataset.distributionAddElement);
        if (!PHYSICAL_ELEMENT_TYPES[type]) return;
        rememberEdit();
        const element = createElement(
          type,
          WORLD_PADDING + 40 + physicalElements.length * 18,
          WORLD_PADDING + 40 + physicalElements.length * 18
        );
        if (!element) return;
        selectElement(element.id);
        world.querySelector(`.distribution-element[data-element-id="${CSS.escape(element.id)}"]`)?.focus();
        markDirty();
      };
    });

    const updateElementLayer = (direction) => {
      if (!canEdit || !selectedElementId) return;
      const element = physicalElements.find((item) => item.id === selectedElementId);
      const node = world.querySelector(`.distribution-element[data-element-id="${CSS.escape(selectedElementId)}"]`);
      if (!element || !node || !elementCapabilities(element).layerable) return;
      rememberEdit();
      const layers = physicalElements.map((item) => Number(item.layer || 0));
      element.layer = direction > 0 ? Math.max(0, ...layers) + 1 : Math.min(0, ...layers) - 1;
      applyElementPlacement(node, element);
      markDirty();
    };

    const toggleElementLock = () => {
      if (!canEdit || !selectedElementId) return;
      const element = physicalElements.find((item) => item.id === selectedElementId);
      const node = world.querySelector(`.distribution-element[data-element-id="${CSS.escape(selectedElementId)}"]`);
      if (!element || !node || !elementCapabilities(element).lockable) return;
      rememberEdit();
      element.locked = !element.locked;
      applyElementPlacement(node, element);
      renderElementInspector(root, element);
      markDirty();
    };

    const changeSelectedElementDimensions = (widthMeters, heightMeters) => {
      if (!canEdit || !selectedElementId) return false;
      const element = physicalElements.find((item) => item.id === selectedElementId);
      const node = world.querySelector(`.distribution-element[data-element-id="${CSS.escape(selectedElementId)}"]`);
      if (!element || !node || element.locked || !elementCapabilities(element).resizable) return false;

      const width = finiteNumber(widthMeters);
      const height = finiteNumber(heightMeters);
      if (
        width === null || height === null
        || width < MIN_ELEMENT_METERS || width > MAX_ELEMENT_METERS
        || height < MIN_ELEMENT_METERS || height > MAX_ELEMENT_METERS
      ) {
        renderElementInspector(root, element);
        return false;
      }

      const nextWidth = width * PIXELS_PER_METER;
      const nextHeight = height * PIXELS_PER_METER;
      if (Math.abs(nextWidth - element.width) < 0.01 && Math.abs(nextHeight - element.height) < 0.01) return true;

      rememberEdit();
      const previousWidth = element.width;
      const previousHeight = element.height;
      if (Array.isArray(element.points)) {
        const widthRatio = previousWidth > 0 ? nextWidth / previousWidth : 1;
        const heightRatio = previousHeight > 0 ? nextHeight / previousHeight : 1;
        element.points = element.points.map((point) => ({
          x: point.x * widthRatio,
          y: point.y * heightRatio
        }));
      }
      element.width = nextWidth;
      element.height = nextHeight;
      refreshElementGeometryNode(node, element);
      renderElementInspector(root, element);
      refreshSpatialConflicts();
      markDirty();
      return true;
    };

    const applyInspectorElementDimensions = () => {
      const widthInput = root.querySelector('[data-distribution-width]');
      const heightInput = root.querySelector('[data-distribution-height]');
      changeSelectedElementDimensions(widthInput.value, heightInput.value);
    };
    root.querySelector('[data-distribution-width]').onchange = applyInspectorElementDimensions;
    root.querySelector('[data-distribution-height]').onchange = applyInspectorElementDimensions;
    root.querySelector('[data-distribution-table-shape]').onchange = (event) => {
      void changeSelectedTableShape(event.currentTarget.value);
    };
    root.querySelector('[data-distribution-table-width]').onchange = () => {
      const width = root.querySelector('[data-distribution-table-width]').value;
      const height = root.querySelector('[data-distribution-table-height]').value;
      void changeSelectedTableDimensions(width, height);
    };
    root.querySelector('[data-distribution-table-height]').onchange = () => {
      const width = root.querySelector('[data-distribution-table-width]').value;
      const height = root.querySelector('[data-distribution-table-height]').value;
      void changeSelectedTableDimensions(width, height);
    };
    root.querySelector('[data-distribution-table-size-reset]').onclick = () => {
      void changeSelectedTableDimensions(null, null, { reset: true });
    };

    const measureButton = root.querySelector('[data-distribution-measure]');
    const clearMeasureButton = root.querySelector('[data-distribution-clear-measure]');
    const measureHint = root.querySelector('[data-distribution-measure-hint]');
    const measureLayer = root.querySelector('[data-distribution-measure-layer]');
    const coordsOutput = root.querySelector('[data-distribution-coords]');
    let measureStart = null;
    let measuring = false;
    const drawingLayer = root.querySelector('[data-distribution-drawing-layer]');
    const drawAreaButtons = [...root.querySelectorAll('[data-distribution-draw-area]')];
    let drawingPoints = [];
    let drawingArea = false;
    let drawingType = 'zone';

    const drawingLabel = (type) => PHYSICAL_ELEMENT_TYPES[type]?.label || 'Área libre';

    const stopMeasuring = () => {
      measuring = false;
      measureStart = null;
      measureButton.classList.remove('is-active');
      measureButton.textContent = 'Medir distancia';
      measureHint.hidden = true;
    };

    clearMeasureButton.onclick = () => {
      measureLayer.replaceChildren();
      stopMeasuring();
    };

    viewport.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const point = camera.clientPointToWorld(event.clientX, event.clientY);
      coordsOutput.value = `x ${(point.x / PLAN_SCALE.pixelsPerMeter).toFixed(2)} m · y ${(point.y / PLAN_SCALE.pixelsPerMeter).toFixed(2)} m`;
      coordsOutput.textContent = coordsOutput.value;
    });

    const renderDrawingPreview = () => {
      drawingLayer.replaceChildren();
      if (!drawingPoints.length) return;
      const svgNs = 'http://www.w3.org/2000/svg';
      const polyline = document.createElementNS(svgNs, 'polyline');
      polyline.setAttribute('points', drawingPoints.map((point) => `${point.x},${point.y}`).join(' '));
      drawingLayer.append(polyline);
    };

    const stopDrawingArea = () => {
      drawingArea = false;
      root.classList.remove('is-drawing-area');
      drawingPoints = [];
      drawingLayer.replaceChildren();
      drawAreaButtons.forEach((button) => {
        button.classList.remove('is-active');
        button.textContent = button.dataset.defaultLabel || button.textContent;
      });
      measureHint.hidden = true;
    };

    const finishDrawingArea = () => {
      if (drawingPoints.length < 3) return;
      if (polygonSelfIntersects(drawingPoints) || polygonArea(drawingPoints) < 1) {
        measureHint.textContent = 'El área se cruza o no tiene superficie válida';
        return;
      }
      const xs = drawingPoints.map((point) => point.x);
      const ys = drawingPoints.map((point) => point.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      if (maxX - minX < PIXELS_PER_METER * MIN_ELEMENT_METERS || maxY - minY < PIXELS_PER_METER * MIN_ELEMENT_METERS) return;
      rememberEdit();
      const element = createElement(drawingType, minX, minY);
      if (!element) return;
      element.width = maxX - minX;
      element.height = maxY - minY;
      element.points = drawingPoints.map((point) => ({ x: point.x - minX, y: point.y - minY }));
      const node = world.querySelector(`.distribution-element[data-element-id="${CSS.escape(element.id)}"]`);
      node?.remove();
      const rendered = renderPhysicalElement(element);
      world.append(rendered);
      bindElementInteraction(rendered, element);
      selectElement(element.id);
      rendered.focus();
      markDirty();
      stopDrawingArea();
    };

    drawAreaButtons.forEach((button) => {
      button.dataset.defaultLabel = button.textContent;
      button.onclick = () => {
        const nextType = button.dataset.distributionDrawArea || 'zone';
        if (!PHYSICAL_ELEMENT_TYPES[nextType]) return;
        if (drawingArea) {
          const switchingType = drawingType !== nextType;
          stopDrawingArea();
          if (!switchingType) return;
        }
        stopMeasuring();
        clearSelection();
        drawingType = nextType;
        drawingArea = true;
        root.classList.add('is-drawing-area');
        drawingPoints = [];
        button.classList.add('is-active');
        button.textContent = 'Cancelar dibujo';
        measureHint.textContent = `${drawingLabel(drawingType)} · marca al menos 3 puntos · toca el primer punto para cerrar`;
        measureHint.hidden = false;
      };
    });

    measureButton.onclick = () => {
      if (measuring) {
        stopMeasuring();
        return;
      }
      stopDrawingArea();
      clearSelection();
      measuring = true;
      measureStart = null;
      measureLayer.replaceChildren();
      measureButton.classList.add('is-active');
      measureButton.textContent = 'Cancelar medición';
      measureHint.textContent = 'Marca el primer punto';
      measureHint.hidden = false;
    };

    viewport.addEventListener('click', (event) => {
      if (event.target.closest('.distribution-table,.distribution-element')) return;
      const point = camera.clientPointToWorld(event.clientX, event.clientY);
      if (drawingArea) {
        const first = drawingPoints[0];
        if (first && drawingPoints.length >= 3 && Math.hypot(point.x - first.x, point.y - first.y) <= 14) {
          finishDrawingArea();
          return;
        }
        drawingPoints.push(point);
        renderDrawingPreview();
        return;
      }
      if (!measuring) return;
      if (!measureStart) {
        measureStart = point;
        measureHint.textContent = 'Marca el segundo punto';
        return;
      }
      const distanceMeters = Math.hypot(point.x - measureStart.x, point.y - measureStart.y) / PLAN_SCALE.pixelsPerMeter;
      const svgNs = 'http://www.w3.org/2000/svg';
      const line = document.createElementNS(svgNs, 'line');
      line.setAttribute('x1', measureStart.x);
      line.setAttribute('y1', measureStart.y);
      line.setAttribute('x2', point.x);
      line.setAttribute('y2', point.y);
      const label = document.createElementNS(svgNs, 'text');
      label.setAttribute('x', (measureStart.x + point.x) / 2);
      label.setAttribute('y', (measureStart.y + point.y) / 2 - 8);
      label.textContent = `${distanceMeters.toFixed(2)} m`;
      measureLayer.replaceChildren(line, label);
      stopMeasuring();
    });

    const applyVisibilityLayer = (className, visible, hiddenSelectionKind) => {
      world.classList.toggle(className, !visible);
      if (!visible && hiddenSelectionKind === 'table' && selectedTableId) clearSelection();
      if (!visible && hiddenSelectionKind === 'element' && selectedElementId) clearSelection();
    };
    root.querySelector('[data-distribution-show-tables]').onchange = (event) => {
      applyVisibilityLayer('hide-tables', event.currentTarget.checked, 'table');
    };
    root.querySelector('[data-distribution-show-guest-labels]').onchange = (event) => {
      applyVisibilityLayer('hide-guest-labels', event.currentTarget.checked, 'labels');
    };
    applyVisibilityLayer(
      'hide-guest-labels',
      root.querySelector('[data-distribution-show-guest-labels]').checked,
      'labels'
    );
    root.querySelector('[data-distribution-show-elements]').onchange = (event) => {
      applyVisibilityLayer('hide-elements', event.currentTarget.checked, 'element');
    };
    const referenceToggle = root.querySelector('[data-distribution-show-reference]');
    const referenceCatalog = root.querySelector('[data-distribution-reference-catalog]');
    const referenceFile = root.querySelector('[data-distribution-reference-file]');
    const referenceRemove = root.querySelector('[data-distribution-reference-remove]');
    const referenceImage = root.querySelector('[data-distribution-reference-image]');
    const referenceScopeId = context?.weddingId || context?.id || 'default';
    let referenceObjectUrl = '';
    let activeReferenceId = DEFAULT_BACKGROUND_ID;

    const releaseReferenceObjectUrl = () => {
      if (referenceObjectUrl) URL.revokeObjectURL(referenceObjectUrl);
      referenceObjectUrl = '';
    };
    const applyReferenceBackground = async (id) => {
      const background = await loadDistributionBackground(id);
      if (!root.isConnected) return;
      releaseReferenceObjectUrl();
      activeReferenceId = background.id;
      const source = background.blob ? URL.createObjectURL(background.blob) : background.source;
      if (background.blob) referenceObjectUrl = source;
      referenceImage.src = source;
      referenceImage.dataset.builtin = background.builtin ? 'true' : 'false';
      world.classList.add('has-reference-image');
      referenceCatalog.value = activeReferenceId;
      referenceRemove.disabled = background.builtin;
      referenceRemove.textContent = background.builtin ? 'Casa Acapulco · incluido' : 'Eliminar plano personalizado';
    };
    const refreshReferenceCatalog = async (selectedId = activeReferenceId) => {
      const backgrounds = await listDistributionBackgrounds();
      if (!root.isConnected) return;
      referenceCatalog.replaceChildren(...backgrounds.map((background) => {
        const option = document.createElement('option');
        option.value = background.id;
        option.textContent = background.builtin ? `${background.name} · por defecto` : background.name;
        return option;
      }));
      const available = backgrounds.some((background) => background.id === selectedId);
      await applyReferenceBackground(available ? selectedId : DEFAULT_BACKGROUND_ID);
    };
    const persistReferencePreference = () => writeDistributionBackgroundPreference(referenceScopeId, {
      backgroundId: activeReferenceId,
      visible: referenceToggle.checked
    }).catch(() => {});

    const referencePreference = await readDistributionBackgroundPreference(referenceScopeId);
    if (epoch !== mountEpoch || !root.isConnected) return;
    referenceToggle.checked = referencePreference.visible;
    world.classList.toggle('hide-reference-image', !referencePreference.visible);
    await refreshReferenceCatalog(referencePreference.backgroundId);
    if (epoch !== mountEpoch || !root.isConnected) return;

    referenceCatalog.onchange = async () => {
      await applyReferenceBackground(referenceCatalog.value);
      referenceToggle.checked = true;
      world.classList.remove('hide-reference-image');
      await persistReferencePreference();
      camera.fit();
      status.textContent = activeReferenceId === DEFAULT_BACKGROUND_ID ? 'Casa Acapulco seleccionado como plano base' : 'Plano local seleccionado';
    };
    referenceFile.onchange = async () => {
      const file = referenceFile.files?.[0];
      if (!file) return;
      try {
        const background = await addDistributionBackground(file);
        if (!root.isConnected) return;
        await refreshReferenceCatalog(background.id);
        referenceToggle.checked = true;
        world.classList.remove('hide-reference-image');
        await persistReferencePreference();
        camera.fit();
        status.textContent = 'Plano agregado al catálogo local de este navegador';
      } catch (error) {
        status.textContent = error?.message || 'No se pudo guardar el plano en este navegador';
      } finally {
        referenceFile.value = '';
      }
    };
    referenceToggle.onchange = () => {
      world.classList.toggle('hide-reference-image', !referenceToggle.checked);
      void persistReferencePreference();
    };
    referenceRemove.onclick = async () => {
      if (activeReferenceId === DEFAULT_BACKGROUND_ID) return;
      await removeDistributionBackground(activeReferenceId);
      await refreshReferenceCatalog(DEFAULT_BACKGROUND_ID);
      referenceToggle.checked = true;
      world.classList.remove('hide-reference-image');
      await persistReferencePreference();
      camera.fit();
      status.textContent = 'Plano personalizado eliminado. Casa Acapulco vuelve a ser el plano base';
    };
    root.querySelector('[data-distribution-rotate-left]').onclick = () => rotateSelected(-ROTATION_STEP);
    root.querySelector('[data-distribution-rotate-right]').onclick = () => rotateSelected(ROTATION_STEP);
    root.querySelector('[data-distribution-bring-front]').onclick = () => updateElementLayer(1);
    root.querySelector('[data-distribution-send-back]').onclick = () => updateElementLayer(-1);
    root.querySelector('[data-distribution-toggle-lock]').onclick = toggleElementLock;
    root.querySelector('[data-distribution-duplicate-element]').onclick = duplicateSelectedElement;
    root.querySelector('[data-distribution-delete-element]').onclick = deleteSelectedElement;
    undoButton.onclick = undoEdit;
    redoButton.onclick = redoEdit;
    updateHistoryState();

    world.addEventListener('keydown', (event) => {
      if (presentationMode) {
        if (event.key === 'Escape') setPresentationMode(false);
        return;
      }
      if (!canEdit) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable) return;
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (event.key === 'Escape') {
        if (drawingArea) stopDrawingArea();
        if (measuring) stopMeasuring();
        return;
      }
      if (drawingArea && event.key === 'Enter') {
        event.preventDefault();
        finishDrawingArea();
        return;
      }
      if (modifier && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redoEdit();
        else undoEdit();
        return;
      }
      if (modifier && key === 'y') {
        event.preventDefault();
        redoEdit();
        return;
      }
      if (selectedElementId && modifier && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelectedElement();
        return;
      }
      if (selectedElementId && modifier && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelectedElement();
        return;
      }
      if (modifier && event.key.toLowerCase() === 'v' && copiedElement) {
        event.preventDefault();
        pasteCopiedElement();
        return;
      }
      if (selectedElementId && ['Delete', 'Backspace'].includes(event.key)) {
        event.preventDefault();
        deleteSelectedElement();
      }
    });

    const seated = guests.filter((guest) => escapeText(guest.tableId)).length;

    const reconcileCanonicalTables = async () => {
      const latest = await loadInvitadosSnapshot(context);
      const latestTables = latest.canonical.tables;
      const latestGuests = latest.canonical.guests;
      validateCanonicalIntegrity(latestTables, latestGuests);

      const previousIds = tableIds.slice();
      const latestIds = latestTables.map((table) => escapeText(table.id)).filter(Boolean);
      const previousSet = new Set(previousIds);
      const latestSet = new Set(latestIds);
      const structureChanged = previousIds.length !== latestIds.length
        || previousIds.some((id) => !latestSet.has(id))
        || latestIds.some((id) => !previousSet.has(id));

      const nextLayout = projectedLayout(latestTables);
      const nextLayoutById = new Map(nextLayout.items.map((item) => [escapeText(item.table?.id), item]));
      const activeProposal = proposalState.find((proposal) => proposal.id === activeProposalId);
      const activeStoredPlacements = new Map((activeProposal?.placements || []).map((placement) => [escapeText(placement.tableId), placement]));

      tables.splice(0, tables.length, ...latestTables);
      guests.splice(0, guests.length, ...latestGuests);
      tableIds.splice(0, tableIds.length, ...latestIds);
      layout.items.splice(0, layout.items.length, ...nextLayout.items);
      layout.width = nextLayout.width;
      layout.height = nextLayout.height;
      tableById.clear();
      tables.forEach((table, index) => tableById.set(escapeText(table.id), { table, index }));
      guestIndex = buildGuestIndex(guests);

      [...placementState.keys()].forEach((tableId) => {
        if (!latestSet.has(tableId)) placementState.delete(tableId);
      });
      latestIds.forEach((tableId) => {
        if (placementState.has(tableId)) return;
        const stored = activeStoredPlacements.get(tableId);
        const projected = nextLayoutById.get(tableId);
        placementState.set(tableId, stored
          ? { x: stored.x, y: stored.y, rotation: stored.rotation }
          : { x: projected?.x ?? WORLD_PADDING, y: projected?.y ?? WORLD_PADDING, rotation: 0 });
      });

      proposalState.forEach((proposal) => {
        proposal.placements = proposal.placements.filter((placement) => latestSet.has(escapeText(placement.tableId)));
      });

      world.querySelectorAll('.distribution-table').forEach((node) => {
        if (!latestSet.has(escapeText(node.dataset.tableId))) node.remove();
      });

      tables.forEach((table, index) => {
        const tableId = escapeText(table.id);
        const placement = placementState.get(tableId);
        if (!placement) return;
        const capacity = capacityOf(table);
        const geometry = tablePhysicalGeometry(table, capacity || 4);
        syncLayoutTableGeometry(tableId, table, index, capacity, geometry);
        const currentNode = world.querySelector(`.distribution-table[data-table-id="${CSS.escape(tableId)}"]`);
        const replacement = renderTable({ table, index, capacity, geometry }, guestIndex, placement);
        if (currentNode) currentNode.replaceWith(replacement);
        else world.append(replacement);
        bindTableInteraction(replacement);
        if (selectedTableId === tableId) {
          replacement.classList.add('is-selected');
          renderInspector(root, table, index, guests, placement);
        }
      });

      if (selectedTableId && !latestSet.has(selectedTableId)) clearSelection();
      root.querySelector('[data-distribution-table-count]').textContent = String(tables.length);
      root.querySelector('[data-distribution-empty]').hidden = tables.length > 0;
      canonicalRefreshPending = false;

      if (structureChanged) {
        dirty = true;
        updateSaveState();
      }
      refreshSpatialConflicts();
      status.textContent = structureChanged
        ? 'Mesas actualizadas · sincronizando distribución'
        : 'Mesas sincronizadas con Invitados';
      return true;
    };

    const handleCanonicalChange = (event) => {
      if (escapeText(event?.detail?.weddingId) !== escapeText(context?.id)) return;
      const source = escapeText(event?.detail?.source);
      if (!source || source === 'distribucion') return;

      if (saving) {
        canonicalRefreshPending = true;
        status.textContent = 'Invitados o Mesas cambiaron · se actualizarán al terminar la sincronización';
        return;
      }

      void reconcileCanonicalTables().catch((error) => {
        console.error('No se pudo reconciliar Invitados/Mesas con Distribución:', error);
        status.textContent = 'No se pudo actualizar Invitados/Mesas en este momento';
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (dirty && !saving && !canonicalRefreshPending) {
          if (autosaveTimer) {
            window.clearTimeout(autosaveTimer);
            autosaveTimer = 0;
          }
          void persistDistribution();
        }
        return;
      }
      if (saving) {
        canonicalRefreshPending = true;
        return;
      }
      void reconcileCanonicalTables().catch((error) => {
        console.error('No se pudo reconciliar Distribución al volver a la pestaña:', error);
      });
    };

    const applyRemoteDistributionState = (remoteState) => {
      if (!remoteState?.proposals?.length) return false;
      closeMobileSheet();

      const incomingProposals = remoteState.proposals.map((proposal) => ({
        ...proposal,
        placements: proposal.placements.map((placement) => ({ ...placement })),
        elements: proposal.elements.map((element) => ({
          ...element,
          points: Array.isArray(element.points)
            ? element.points.map((point) => ({ ...point }))
            : null
        }))
      }));

      proposalState.splice(0, proposalState.length, ...incomingProposals);
      activeProposalId = activeProposalOf(remoteState)?.id || incomingProposals[0].id;

      const nextPlacements = placementMapFor(layout, remoteState);
      placementState.clear();
      nextPlacements.forEach((placement, tableId) => placementState.set(tableId, placement));

      world.querySelectorAll('.distribution-table').forEach((node) => {
        const placement = placementState.get(node.dataset.tableId);
        if (placement) applyPlacement(node, placement);
      });

      const nextProposal = activeProposalOf(remoteState);
      physicalElements.splice(
        0,
        physicalElements.length,
        ...(nextProposal?.elements || []).map((element) => ({
          ...element,
          points: Array.isArray(element.points)
            ? element.points.map((point) => ({ ...point }))
            : null
        }))
      );
      elementSequence = physicalElements.reduce((max, element) => {
        const value = Number(String(element.id).match(/(\d+)$/)?.[1] || 0);
        return Math.max(max, value);
      }, 0);

      world.querySelectorAll('.distribution-element').forEach((node) => node.remove());
      physicalElements.forEach((element) => {
        const node = renderPhysicalElement(element);
        world.append(node);
        bindElementInteraction(node, element);
      });

      if (selectedTableId) {
        const entry = tableById.get(selectedTableId);
        const placement = placementState.get(selectedTableId);
        if (entry && placement) {
          world.querySelector(`.distribution-table[data-table-id="${CSS.escape(selectedTableId)}"]`)?.classList.add('is-selected');
          renderInspector(root, entry.table, entry.index, guests, placement);
        } else {
          clearSelection();
        }
      } else if (selectedElementId) {
        const selectedElement = physicalElements.find((element) => element.id === selectedElementId);
        if (selectedElement) {
          world.querySelector(`.distribution-element[data-element-id="${CSS.escape(selectedElementId)}"]`)?.classList.add('is-selected');
          renderElementInspector(root, selectedElement);
        } else {
          clearSelection();
        }
      }

      undoStack.length = 0;
      redoStack.length = 0;
      lastPersistedState = JSON.parse(JSON.stringify(remoteState));
      hideSyncConflict();
      updateHistoryState();
      refreshProposalControls();
      refreshSpatialConflicts();
      status.textContent = 'Distribución sincronizada';
      return true;
    };

    root.querySelector('[data-distribution-sync-use-local]').onclick = async () => {
      if (!pendingLocalDistributionState || saving) return;
      dirty = true;
      await persistDistribution({ force: true });
    };

    root.querySelector('[data-distribution-sync-use-remote]').onclick = () => {
      if (!pendingRemoteDistributionState || saving) return;
      const remoteState = JSON.parse(JSON.stringify(pendingRemoteDistributionState));
      const remoteSignature = JSON.stringify(remoteState);
      if (applyRemoteDistributionState(remoteState)) {
        lastPersistedSignature = remoteSignature;
        lastPersistedState = JSON.parse(JSON.stringify(remoteState));
        dirty = false;
        updateSaveState();
      }
    };

    distributionCloudUnsubscribe = subscribePlannerStorageKey(context, DISTRIBUTION_STORAGE_KEY, (remoteValue) => {
      let remoteState = null;
      try {
        remoteState = parseDistributionState(remoteValue);
      } catch (error) {
        console.error('No se pudo aplicar la sincronización remota de Distribución:', error);
        return;
      }
      const remoteSignature = remoteState ? JSON.stringify(remoteState) : '';
      if (!remoteSignature || remoteSignature === lastPersistedSignature) return;

      if (dirty || saving || canonicalRefreshPending) {
        queuedRemoteDistributionSignature = remoteSignature;
        pendingRemoteDistributionState = JSON.parse(JSON.stringify(remoteState));
        return;
      }

      if (applyRemoteDistributionState(remoteState)) {
        lastPersistedSignature = remoteSignature;
        lastPersistedState = JSON.parse(JSON.stringify(remoteState));
      }
    }, (error) => {
      console.error('No se pudo escuchar la sincronización de Distribución:', error);
    });

    canonicalCloudUnsubscribe = subscribePlannerStorageKey(context, GUEST_STORAGE_KEY, () => {
      if (saving) {
        canonicalRefreshPending = true;
        return;
      }
      void reconcileCanonicalTables().catch((error) => {
        console.error('No se pudo sincronizar Invitados/Mesas remotos con Distribución:', error);
      });
    }, (error) => {
      console.error('No se pudo escuchar Invitados/Mesas en Distribución:', error);
    });

    window.addEventListener('migrandia:datachange', handleCanonicalChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    activeDistributionCleanup = () => {
      window.removeEventListener('migrandia:datachange', handleCanonicalChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      distributionCloudUnsubscribe?.();
      canonicalCloudUnsubscribe?.();
      closeMobileSheet();
      hideSyncConflict();
      if (autosaveTimer) window.clearTimeout(autosaveTimer);
      camera.destroy();
      if (referenceObjectUrl) {
        URL.revokeObjectURL(referenceObjectUrl);
        referenceObjectUrl = '';
      }
    };

    refreshSpatialConflicts();
    updateSaveState();
    if (!dirty && canEdit && storedState) status.textContent = `Distribución sincronizada · ${seated} invitados ubicados`;
  } catch (error) {
    console.error('No se pudo inicializar Distribución:', error);
    status.textContent = error?.message || 'Distribución no pudo inicializarse.';
    return false;
  }
  return true;
}

export { mountDistribucion };
