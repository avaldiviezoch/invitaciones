import { loadInvitadosSnapshot } from '../invitados/invitados-data.js?v=4';
import { normalizeTableShape, tableSeatGeometry } from '../invitados/table-geometry.js?v=1';

const TEMPLATE_URL = new URL('./index.html?v=1', import.meta.url);
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.12;
const TABLE_GAP = 72;
const WORLD_PADDING = 90;

let templatePromise = null;
let mountEpoch = 0;

function template() {
  if (!templatePromise) templatePromise = fetch(TEMPLATE_URL).then((response) => {
    if (!response.ok) throw new Error('No se pudo cargar la vista de Distribución.');
    return response.text();
  });
  return templatePromise;
}

function escapeText(value) {
  return String(value ?? '').trim();
}

function capacityOf(table) {
  const seats = Array.isArray(table?.seats) ? table.seats.length : 0;
  const declared = Number(table?.capacity || 0);
  return Math.max(seats, Number.isFinite(declared) ? declared : 0, 0);
}

function tableName(table, index) {
  return escapeText(table?.name) || `Mesa ${index + 1}`;
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

function projectedLayout(tables) {
  const items = tables.map((table, index) => {
    const capacity = capacityOf(table);
    const geometry = tableSeatGeometry(table?.type, capacity || 4);
    return { table, index, capacity, geometry };
  });
  const columns = Math.max(1, Math.ceil(Math.sqrt(items.length || 1)));
  let maxWidth = 0;
  let maxHeight = 0;
  items.forEach((item) => {
    maxWidth = Math.max(maxWidth, item.geometry.visualWidth);
    maxHeight = Math.max(maxHeight, item.geometry.visualHeight);
  });
  items.forEach((item, index) => {
    item.x = WORLD_PADDING + (index % columns) * (maxWidth + TABLE_GAP);
    item.y = WORLD_PADDING + Math.floor(index / columns) * (maxHeight + TABLE_GAP);
  });
  const rows = Math.max(1, Math.ceil(items.length / columns));
  return {
    items,
    width: Math.max(760, WORLD_PADDING * 2 + columns * maxWidth + Math.max(0, columns - 1) * TABLE_GAP),
    height: Math.max(560, WORLD_PADDING * 2 + rows * maxHeight + Math.max(0, rows - 1) * TABLE_GAP)
  };
}

function renderTable(item, guestIndex) {
  const { table, index, capacity, geometry, x, y } = item;
  const tableId = escapeText(table?.id);
  const seats = Array.isArray(table?.seats) ? table.seats : [];
  const node = document.createElement('article');
  node.className = 'distribution-table';
  node.dataset.tableId = tableId;
  node.tabIndex = 0;
  node.setAttribute('role', 'button');
  node.setAttribute('aria-label', tableName(table, index));
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.style.width = `${geometry.visualWidth}px`;
  node.style.height = `${geometry.visualHeight}px`;

  const surface = document.createElement('div');
  surface.className = `distribution-tabletop is-${normalizeTableShape(table?.type)}`;
  surface.style.width = `${geometry.table.width}px`;
  surface.style.height = `${geometry.table.height}px`;
  surface.innerHTML = `<strong></strong><span>${capacity} sillas</span>`;
  surface.querySelector('strong').textContent = tableName(table, index);
  node.append(surface);

  geometry.positions.slice(0, capacity).forEach((position, seatIndex) => {
    const seat = seats[seatIndex] || {};
    const guest = guestForSeat(guestIndex, tableId, seat, seatIndex);
    const chair = document.createElement('span');
    chair.className = `distribution-chair${guest ? ' is-occupied' : ''}`;
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
      label.textContent = escapeText(guest.name) || 'Invitado';
      node.append(label);
    }
  });
  return node;
}

function setupCamera(root, world, worldSize) {
  const viewport = root.querySelector('[data-distribution-viewport]');
  const zoomOutput = root.querySelector('[data-distribution-zoom]');
  let scale = 1;
  let x = 0;
  let y = 0;
  let drag = null;
  const pointers = new Map();
  let pinch = null;

  const apply = () => {
    world.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    zoomOutput.value = `${Math.round(scale * 100)}%`;
    zoomOutput.textContent = zoomOutput.value;
  };

  const clampScale = (value) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));

  const zoomAt = (nextScale, clientX, clientY) => {
    const rect = viewport.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const worldX = (px - x) / scale;
    const worldY = (py - y) / scale;
    const next = clampScale(nextScale);
    x = px - worldX * next;
    y = py - worldY * next;
    scale = next;
    apply();
  };

  const fit = () => {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    scale = clampScale(Math.min((rect.width - 36) / worldSize.width, (rect.height - 36) / worldSize.height, 1));
    x = (rect.width - worldSize.width * scale) / 2;
    y = (rect.height - worldSize.height * scale) / 2;
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
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    viewport.setPointerCapture(event.pointerId);
    if (pointers.size === 1 && !event.target.closest('.distribution-table')) {
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
      return;
    }
    if (drag?.pointerId === event.pointerId) {
      x = drag.x + event.clientX - drag.startX;
      y = drag.y + event.clientY - drag.startY;
      apply();
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
  return { fit };
}

function renderInspector(root, table, tableIndex, guests) {
  root.querySelector('[data-distribution-selection-empty]').hidden = true;
  root.querySelector('[data-distribution-selection]').hidden = false;
  const capacity = capacityOf(table);
  const assigned = guests
    .filter((guest) => escapeText(guest.tableId) === escapeText(table.id))
    .sort((a, b) => Number(a.seatNumber || 999) - Number(b.seatNumber || 999));
  root.querySelector('[data-distribution-selected-name]').textContent = tableName(table, tableIndex);
  root.querySelector('[data-distribution-selected-meta]').textContent = `${normalizeTableShape(table.type)} · ${capacity} sillas`;
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
  const epoch = ++mountEpoch;
  const root = document.querySelector('[data-module-view="distribucion"]');
  if (!root) return;
  root.innerHTML = await template();
  const status = root.querySelector('[data-distribution-status]');
  status.textContent = 'Cargando mesas…';

  try {
    const snapshot = await loadInvitadosSnapshot(context);
    if (epoch !== mountEpoch) return;
    const tables = snapshot.canonical.tables;
    const guests = snapshot.canonical.guests;
    const guestIndex = buildGuestIndex(guests);
    const layout = projectedLayout(tables);
    const world = root.querySelector('[data-distribution-world]');
    world.style.width = `${layout.width}px`;
    world.style.height = `${layout.height}px`;
    root.querySelector('[data-distribution-table-count]').textContent = String(tables.length);
    root.querySelector('[data-distribution-empty]').hidden = tables.length > 0;

    layout.items.forEach((item) => world.append(renderTable(item, guestIndex)));

    world.addEventListener('click', (event) => {
      const node = event.target.closest('.distribution-table');
      if (!node) return;
      world.querySelectorAll('.distribution-table.is-selected').forEach((item) => item.classList.remove('is-selected'));
      node.classList.add('is-selected');
      const index = tables.findIndex((table) => escapeText(table.id) === node.dataset.tableId);
      if (index >= 0) renderInspector(root, tables[index], index, guests);
    });
    world.addEventListener('keydown', (event) => {
      if (!['Enter', ' '].includes(event.key)) return;
      const node = event.target.closest('.distribution-table');
      if (!node) return;
      event.preventDefault();
      node.click();
    });

    setupCamera(root, world, layout);
    const seated = guests.filter((guest) => escapeText(guest.tableId)).length;
    status.textContent = `Lectura segura · ${seated} invitados ubicados`;
  } catch (error) {
    console.error('No se pudo cargar Distribución:', error);
    status.textContent = error?.message || 'No se pudo cargar la distribución.';
    root.querySelector('[data-distribution-empty]').hidden = false;
    root.querySelector('[data-distribution-empty] strong').textContent = 'No se pudo cargar el plano';
    root.querySelector('[data-distribution-empty] span').textContent = 'No se modificó ningún dato.';
  }
}

export { mountDistribucion };
