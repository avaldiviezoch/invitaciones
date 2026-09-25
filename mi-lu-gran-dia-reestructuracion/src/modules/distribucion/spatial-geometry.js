import { normalizeTableShape } from '../invitados/table-geometry.js?v=5';
import { getElementCatalogItem } from './distribution-catalog.js?v=4';

function normalizeRotation(value) {
  const number = Number(value);
  const finite = Number.isFinite(number) ? number : 0;
  return ((finite % 360) + 360) % 360;
}

function polygonPerimeter(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + Math.hypot(next.x - point.x, next.y - point.y);
  }, 0);
}

function polygonBounds(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

function normalizePolygonElementGeometry(element) {
  if (!Array.isArray(element.points) || element.points.length < 3) return;
  const oldWidth = element.width;
  const oldHeight = element.height;
  const bounds = polygonBounds(element.points);
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const oldCenter = { x: oldWidth / 2, y: oldHeight / 2 };
  const newCenterInOldLocal = { x: bounds.minX + width / 2, y: bounds.minY + height / 2 };
  const centerShift = rotateLocalPoint({
    x: newCenterInOldLocal.x - oldCenter.x,
    y: newCenterInOldLocal.y - oldCenter.y
  }, element.rotation);
  const oldWorldCenter = { x: element.x + oldWidth / 2, y: element.y + oldHeight / 2 };
  const newWorldCenter = { x: oldWorldCenter.x + centerShift.x, y: oldWorldCenter.y + centerShift.y };
  element.points = element.points.map((point) => ({ x: point.x - bounds.minX, y: point.y - bounds.minY }));
  element.width = width;
  element.height = height;
  element.x = newWorldCenter.x - width / 2;
  element.y = newWorldCenter.y - height / 2;
}

function polygonHasNearDuplicate(points, minimumDistance = 4) {
  return points.some((point, index) => {
    const next = points[(index + 1) % points.length];
    return Math.hypot(next.x - point.x, next.y - point.y) < minimumDistance;
  });
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
  const definition = getElementCatalogItem(element);
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
  return getElementCatalogItem(element)?.spatialFamily || 'informative';
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


export {
  normalizePolygonElementGeometry,
  polygonHasNearDuplicate,
  spatialShapeForElement,
  spatialShapeForTable,
  spatialRuleFor,
  spatialShapesIntersect,
  shapeBoundaryDistance,
  polygonPerimeter,
  polygonArea,
  polygonSelfIntersects
};
