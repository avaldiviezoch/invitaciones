const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.12;
const WORLD_PADDING = 90;

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function worldBounds(world, fallbackSize) {
  const nodes = [...world.querySelectorAll('.distribution-table,.distribution-element')];
  if (!nodes.length) return { minX: 0, minY: 0, maxX: fallbackSize.width, maxY: fallbackSize.height };
  const bounds = nodes.map((node) => {
    const left = finiteNumber(node.style.left) ?? 0;
    const top = finiteNumber(node.style.top) ?? 0;
    const width = finiteNumber(node.style.width) ?? node.offsetWidth;
    const height = finiteNumber(node.style.height) ?? node.offsetHeight;
    return { left, top, right: left + width, bottom: top + height };
  });
  return {
    minX: Math.min(0, ...bounds.map((item) => item.left)) - WORLD_PADDING,
    minY: Math.min(0, ...bounds.map((item) => item.top)) - WORLD_PADDING,
    maxX: Math.max(fallbackSize.width, ...bounds.map((item) => item.right)) + WORLD_PADDING,
    maxY: Math.max(fallbackSize.height, ...bounds.map((item) => item.bottom)) + WORLD_PADDING
  };
}

export function setupDistributionCamera(root, world, worldSize) {
  const viewport = root.querySelector('[data-distribution-viewport]');
  const zoomOutput = root.querySelector('[data-distribution-zoom]');
  let scale = 1, x = 0, y = 0, drag = null, pinch = null;
  const pointers = new Map();

  const apply = () => {
    world.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    zoomOutput.value = `${Math.round(scale * 100)}%`;
    zoomOutput.textContent = zoomOutput.value;
  };
  const clampScale = (value) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
  const zoomAt = (nextScale, clientX, clientY) => {
    const rect = viewport.getBoundingClientRect();
    const px = clientX - rect.left, py = clientY - rect.top;
    const worldX = (px - x) / scale, worldY = (py - y) / scale;
    const next = clampScale(nextScale);
    x = px - worldX * next; y = py - worldY * next; scale = next; apply();
  };
  const fit = () => {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const bounds = worldBounds(world, worldSize);
    const width = Math.max(1, bounds.maxX - bounds.minX), height = Math.max(1, bounds.maxY - bounds.minY);
    scale = clampScale(Math.min((rect.width - 36) / width, (rect.height - 36) / height, 1));
    x = (rect.width - width * scale) / 2 - bounds.minX * scale;
    y = (rect.height - height * scale) / 2 - bounds.minY * scale;
    apply();
  };

  root.querySelector('[data-distribution-fit]').onclick = fit;
  root.querySelector('[data-distribution-zoom-in]').onclick = () => {
    const rect = viewport.getBoundingClientRect();
    zoomAt(scale + ZOOM_STEP, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };
  root.querySelector('[data-distribution-zoom-out]').onclick = () => {
    const rect = viewport.getBoundingClientRect();
    zoomAt(scale - ZOOM_STEP, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };
  viewport.addEventListener('wheel', (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    zoomAt(scale + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP), event.clientX, event.clientY);
  }, { passive: false });
  viewport.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.distribution-table,.distribution-element') || root.classList.contains('is-drawing-area')) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    viewport.setPointerCapture(event.pointerId);
    if (pointers.size === 1) {
      drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x, y };
      viewport.classList.add('is-panning');
    }
    if (pointers.size === 2) {
      const pair = [...pointers.values()];
      pinch = { distance: Math.hypot(pair[1].x - pair[0].x, pair[1].y - pair[0].y), scale };
      drag = null;
    }
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinch) {
      const pair = [...pointers.values()];
      const distance = Math.hypot(pair[1].x - pair[0].x, pair[1].y - pair[0].y);
      const rect = viewport.getBoundingClientRect();
      zoomAt(pinch.scale * distance / Math.max(1, pinch.distance), rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else if (drag?.pointerId === event.pointerId) {
      x = drag.x + event.clientX - drag.startX; y = drag.y + event.clientY - drag.startY; apply();
    }
  });
  const release = (event) => {
    pointers.delete(event.pointerId);
    if (drag?.pointerId === event.pointerId) drag = null;
    if (pointers.size < 2) pinch = null;
    viewport.classList.remove('is-panning');
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  requestAnimationFrame(fit);

  return {
    fit,
    clientDeltaToWorld: (delta) => delta / scale,
    clientPointToWorld: (clientX, clientY) => {
      const rect = viewport.getBoundingClientRect();
      return { x: (clientX - rect.left - x) / scale, y: (clientY - rect.top - y) / scale };
    },
    focusNode: (node) => {
      if (!node) return;
      const rect = viewport.getBoundingClientRect();
      const left = finiteNumber(node.style.left) ?? 0, top = finiteNumber(node.style.top) ?? 0;
      const width = finiteNumber(node.style.width) ?? node.offsetWidth, height = finiteNumber(node.style.height) ?? node.offsetHeight;
      x = rect.width / 2 - (left + width / 2) * scale;
      y = rect.height / 2 - (top + height / 2) * scale;
      apply();
    }
  };
}
