import { loadInvitadosSnapshot } from '../invitados/invitados-data.js?v=4';
import { normalizeTableShape, tableSeatGeometry } from '../invitados/table-geometry.js?v=1';
import { readPlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js?v=4';
import { weddingCapabilities } from '../../core/app/permissions.js';

const TEMPLATE_URL = new URL('./index.html?v=3', import.meta.url);
const DISTRIBUTION_STORAGE_KEY = 'planificador_bodas_distribucion_v1';
const DEFAULT_PROPOSAL_ID = 'proposal_main';
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.12;
const ROTATION_STEP = 15;
const KEYBOARD_MOVE_STEP = 10;
const KEYBOARD_MOVE_FINE_STEP = 1;
const TABLE_GAP = 72;
const WORLD_PADDING = 90;

let templatePromise = null;
let mountEpoch = 0;
let activeDistributionCleanup = null;

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

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeRotation(value) {
  const number = finiteNumber(value) ?? 0;
  return ((number % 360) + 360) % 360;
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
      if (!seatId || seatIds.has(seatId)) {
        throw new Error('Mesas contiene sillas con identificadores vacíos o duplicados. Distribución no modificó ningún dato.');
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
    if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > seats.length) {
      throw new Error('Existe un invitado con una silla fuera de rango. Corrige la asignación en Mesas antes de editar Distribución.');
    }
    const seatId = escapeText(guest?.seatId);
    const canonicalSeatId = escapeText(seats[seatNumber - 1]?.id);
    if (!seatId || seatId !== canonicalSeatId) {
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
    return {
      id: escapeText(proposal.id),
      name: escapeText(proposal.name) || 'Propuesta',
      placements
    };
  });
  const activeProposalId = escapeText(value.activeProposalId);
  return { version: 1, activeProposalId, proposals };
}

function activeProposalOf(state) {
  if (!state?.proposals?.length) return null;
  return state.proposals.find((proposal) => proposal.id === state.activeProposalId) || state.proposals[0];
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

function serializeDistribution(placementState, tableIds) {
  return {
    version: 1,
    activeProposalId: DEFAULT_PROPOSAL_ID,
    proposals: [{
      id: DEFAULT_PROPOSAL_ID,
      name: 'Propuesta principal',
      placements: tableIds.map((tableId) => {
        const placement = placementState.get(tableId);
        return {
          tableId,
          x: Math.round(placement.x * 100) / 100,
          y: Math.round(placement.y * 100) / 100,
          rotation: normalizeRotation(placement.rotation)
        };
      })
    }]
  };
}

function applyPlacement(node, placement) {
  node.style.left = `${placement.x}px`;
  node.style.top = `${placement.y}px`;
  node.style.setProperty('--table-rotation', `${normalizeRotation(placement.rotation)}deg`);
  node.style.setProperty('--counter-rotation', `${-normalizeRotation(placement.rotation)}deg`);
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
    if (event.target.closest('.distribution-table')) return;
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
  return { clientDeltaToWorld: (delta) => delta / scale };
}

function renderInspector(root, table, tableIndex, guests, placement) {
  root.querySelector('[data-distribution-selection-empty]').hidden = true;
  root.querySelector('[data-distribution-selection]').hidden = false;
  const capacity = capacityOf(table);
  const assigned = guests
    .filter((guest) => escapeText(guest.tableId) === escapeText(table.id))
    .sort((a, b) => Number(a.seatNumber || 999) - Number(b.seatNumber || 999));
  root.querySelector('[data-distribution-selected-name]').textContent = tableName(table, tableIndex);
  root.querySelector('[data-distribution-selected-meta]').textContent = `${normalizeTableShape(table.type)} · ${capacity} sillas`;
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
  root.innerHTML = await template();
  const status = root.querySelector('[data-distribution-status]');
  const saveButton = root.querySelector('[data-distribution-save]');
  const canEdit = weddingCapabilities(context?.role).canEdit;
  status.textContent = 'Cargando mesas y distribución…';

  try {
    const [snapshot, storedValue] = await Promise.all([
      loadInvitadosSnapshot(context),
      readPlannerStorageKey(context, DISTRIBUTION_STORAGE_KEY)
    ]);
    if (epoch !== mountEpoch) return;

    const storedState = parseDistributionState(storedValue);
    const tables = snapshot.canonical.tables;
    const guests = snapshot.canonical.guests;
    validateCanonicalIntegrity(tables, guests);
    const guestIndex = buildGuestIndex(guests);
    const layout = projectedLayout(tables);
    const placementState = placementMapFor(layout, storedState);
    const tableIds = tables.map((table) => escapeText(table.id)).filter(Boolean);
    const world = root.querySelector('[data-distribution-world]');
    const tableById = new Map(tables.map((table, index) => [escapeText(table.id), { table, index }]));
    let selectedTableId = '';
    let dirty = false;
    let saving = false;
    let hasPersistedState = Boolean(storedState);

    world.style.width = `${layout.width}px`;
    world.style.height = `${layout.height}px`;
    root.querySelector('[data-distribution-table-count]').textContent = String(tables.length);
    root.querySelector('[data-distribution-empty]').hidden = tables.length > 0;

    layout.items.forEach((item) => {
      const tableId = escapeText(item.table?.id);
      if (!tableId) return;
      world.append(renderTable(item, guestIndex, placementState.get(tableId)));
    });

    const camera = setupCamera(root, world, layout);

    const updateSaveState = () => {
      saveButton.disabled = !canEdit || !dirty || saving || !tables.length;
      saveButton.textContent = saving ? 'Guardando…' : 'Guardar distribución';
      if (!canEdit) status.textContent = 'Solo lectura · la distribución no puede modificarse';
      else if (saving) status.textContent = 'Guardando distribución…';
      else if (dirty) status.textContent = 'Cambios sin guardar';
      else status.textContent = hasPersistedState ? 'Distribución guardada' : 'Distribución proyectada · aún sin guardar';
    };

    const selectTable = (tableId) => {
      const entry = tableById.get(tableId);
      const placement = placementState.get(tableId);
      if (!entry || !placement) return;
      selectedTableId = tableId;
      world.querySelectorAll('.distribution-table').forEach((node) => {
        node.classList.toggle('is-selected', node.dataset.tableId === tableId);
      });
      renderInspector(root, entry.table, entry.index, guests, placement);
    };

    const markDirty = () => {
      dirty = true;
      updateSaveState();
    };

    world.querySelectorAll('.distribution-table').forEach((node) => {
      let move = null;
      let moved = false;

      node.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || !canEdit) return;
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
        selectTable(node.dataset.tableId);
      });

      node.addEventListener('pointermove', (event) => {
        if (!move || move.pointerId !== event.pointerId) return;
        const dx = camera.clientDeltaToWorld(event.clientX - move.clientX);
        const dy = camera.clientDeltaToWorld(event.clientY - move.clientY);
        if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
        const placement = placementState.get(node.dataset.tableId);
        placement.x = move.x + dx;
        placement.y = move.y + dy;
        applyPlacement(node, placement);
      });

      const finishMove = (event) => {
        if (!move || move.pointerId !== event.pointerId) return;
        node.classList.remove('is-moving');
        move = null;
        if (moved) markDirty();
      };
      node.addEventListener('pointerup', finishMove);
      node.addEventListener('pointercancel', finishMove);

      node.addEventListener('click', (event) => {
        event.stopPropagation();
        if (moved) {
          moved = false;
          return;
        }
        selectTable(node.dataset.tableId);
      });
    });

    world.addEventListener('keydown', (event) => {
      const node = event.target.closest('.distribution-table');
      if (!node) return;
      if (['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        selectTable(node.dataset.tableId);
        return;
      }
      if (!canEdit || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const placement = placementState.get(node.dataset.tableId);
      if (!placement) return;
      event.preventDefault();
      const step = event.shiftKey ? KEYBOARD_MOVE_FINE_STEP : KEYBOARD_MOVE_STEP;
      if (event.key === 'ArrowLeft') placement.x -= step;
      if (event.key === 'ArrowRight') placement.x += step;
      if (event.key === 'ArrowUp') placement.y -= step;
      if (event.key === 'ArrowDown') placement.y += step;
      applyPlacement(node, placement);
      selectTable(node.dataset.tableId);
      markDirty();
    });

    const rotateSelected = (delta) => {
      if (!canEdit || !selectedTableId) return;
      const placement = placementState.get(selectedTableId);
      const node = world.querySelector(`.distribution-table[data-table-id="${CSS.escape(selectedTableId)}"]`);
      const entry = tableById.get(selectedTableId);
      if (!placement || !node || !entry) return;
      placement.rotation = normalizeRotation(placement.rotation + delta);
      applyPlacement(node, placement);
      renderInspector(root, entry.table, entry.index, guests, placement);
      markDirty();
    };

    root.querySelector('[data-distribution-rotate-left]').onclick = () => rotateSelected(-ROTATION_STEP);
    root.querySelector('[data-distribution-rotate-right]').onclick = () => rotateSelected(ROTATION_STEP);

    saveButton.onclick = async () => {
      if (!canEdit || !dirty || saving) return;
      saving = true;
      updateSaveState();
      try {
        await writePlannerStorageKey(context, DISTRIBUTION_STORAGE_KEY, serializeDistribution(placementState, tableIds));
        dirty = false;
        hasPersistedState = true;
        status.textContent = 'Distribución guardada';
      } catch (error) {
        console.error('No se pudo guardar Distribución:', error);
        status.textContent = error?.message || 'No se pudo guardar la distribución.';
      } finally {
        saving = false;
        updateSaveState();
      }
    };

    const seated = guests.filter((guest) => escapeText(guest.tableId)).length;

    const handleCanonicalChange = (event) => {
      if (escapeText(event?.detail?.weddingId) !== escapeText(context?.id)) return;
      const source = escapeText(event?.detail?.source);
      if (!source || source === 'distribucion') return;
      if (dirty || saving) {
        status.textContent = 'Invitados o Mesas cambiaron · guarda o vuelve a abrir Distribución para actualizar sin mezclar estados';
        return;
      }
      void mountDistribucion(context);
    };

    const handleVisibilityChange = () => {
      if (document.hidden || dirty || saving) return;
      void mountDistribucion(context);
    };
    window.addEventListener('migrandia:datachange', handleCanonicalChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    activeDistributionCleanup = () => {
      window.removeEventListener('migrandia:datachange', handleCanonicalChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    updateSaveState();
    if (!dirty && canEdit && storedState) status.textContent = `Distribución guardada · ${seated} invitados ubicados`;
  } catch (error) {
    console.error('No se pudo cargar Distribución:', error);
    status.textContent = error?.message || 'No se pudo cargar la distribución.';
    saveButton.disabled = true;
    root.querySelector('[data-distribution-empty]').hidden = false;
    root.querySelector('[data-distribution-empty] strong').textContent = 'No se pudo cargar el plano';
    root.querySelector('[data-distribution-empty] span').textContent = 'No se modificó ningún dato.';
  }
}

export { mountDistribucion };
