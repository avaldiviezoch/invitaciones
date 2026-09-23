const MIN_CAPACITY = 4;
const MAX_CAPACITY = 16;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || min));
}

function normalizeTableShape(value) {
  const clean = String(value || '').toLowerCase();
  if (['rect', 'rectangle', 'rectangular'].includes(clean)) return 'rectangular';
  if (['square', 'cuadrada', 'cuadrado'].includes(clean)) return 'square';
  return 'round';
}

function tableVisualSize(type, capacity) {
  const shape = normalizeTableShape(type);
  const seats = clamp(capacity, MIN_CAPACITY, MAX_CAPACITY);
  if (shape === 'rectangular') {
    return {
      width: clamp(138 + Math.max(0, seats - 6) * 9, 138, 246),
      height: clamp(78 + Math.floor(seats / 8) * 5, 82, 100)
    };
  }
  if (shape === 'square') {
    const size = clamp(106 + Math.max(0, seats - 4) * 4, 106, 154);
    return { width: size, height: size };
  }
  const size = clamp(106 + Math.max(0, seats - 4) * 3.5, 106, 164);
  return { width: size, height: size };
}

function tableSeatGeometry(type, capacity) {
  const shape = normalizeTableShape(type);
  const count = clamp(capacity, MIN_CAPACITY, MAX_CAPACITY);
  const table = tableVisualSize(shape, count);
  const visualWidth = table.width + 172;
  const visualHeight = table.height + 188;
  const centerX = visualWidth / 2;
  const centerY = visualHeight / 2;
  const positions = [];

  if (shape === 'round') {
    const radiusX = table.width / 2 + 30;
    const radiusY = table.height / 2 + 30;
    for (let index = 0; index < count; index += 1) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index / count);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      positions.push({
        x: centerX + cos * radiusX,
        y: centerY + sin * radiusY,
        labelX: centerX + cos * (radiusX + 34),
        labelY: centerY + sin * (radiusY + 34),
        labelMediumX: centerX + cos * (radiusX + 34),
        labelMediumY: centerY + sin * (radiusY + 34),
        labelCompactX: centerX + cos * (radiusX + 34),
        labelCompactY: centerY + sin * (radiusY + 34),
        labelAlign: cos > 0.28 ? 'left' : cos < -0.28 ? 'right' : 'center'
      });
    }
    return { shape, table, visualWidth, visualHeight, positions };
  }

  const outerWidth = table.width + 56;
  const outerHeight = table.height + 56;
  const left = centerX - outerWidth / 2;
  const top = centerY - outerHeight / 2;
  const perimeter = 2 * (outerWidth + outerHeight);

  for (let index = 0; index < count; index += 1) {
    let distance = (perimeter * index / count + outerWidth / 2) % perimeter;
    let x;
    let y;
    if (distance < outerWidth) {
      x = left + distance;
      y = top;
    } else if ((distance -= outerWidth) < outerHeight) {
      x = left + outerWidth;
      y = top + distance;
    } else if ((distance -= outerHeight) < outerWidth) {
      x = left + outerWidth - distance;
      y = top + outerHeight;
    } else {
      distance -= outerWidth;
      x = left;
      y = top + outerHeight - distance;
    }

    const dx = x - centerX;
    const dy = y - centerY;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    positions.push({
      x,
      y,
      labelX: x + ux * 34,
      labelY: y + uy * 34,
      labelMediumX: x + ux * 34,
      labelMediumY: y + uy * 34,
      labelCompactX: x + ux * 34,
      labelCompactY: y + uy * 34,
      labelAlign: ux > 0.32 ? 'left' : ux < -0.32 ? 'right' : 'center'
    });
  }

  return { shape, table, visualWidth, visualHeight, positions };
}

export { normalizeTableShape, tableVisualSize, tableSeatGeometry };