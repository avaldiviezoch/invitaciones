import { saveInvitadosSnapshot } from './invitados-data.js?v=3';

const SHAPES = Object.freeze(['round', 'square', 'rectangular']);
const SHAPE_LABELS = Object.freeze({
  round: 'Redonda',
  square: 'Cuadrada',
  rectangular: 'Rectangular'
});
const CAPACITIES = Object.freeze([4, 6, 8, 10, 12, 14, 16]);

function createTablesController(api) {
  const text = (value) => String(value ?? '').trim();
  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");

  function deepClone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function uid(prefix) {
    const value = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;
    return `${prefix}_${value}`;
  }

  function normalizeShape(value) {
    const clean = text(value).toLowerCase();
    if (['rect','rectangle','rectangular'].includes(clean)) return 'rectangular';
    if (['square','cuadrada','cuadrado'].includes(clean)) return 'square';
    return 'round';
  }

  function normalizeCapacity(value) {
    const number = Number(value);
    return CAPACITIES.includes(number) ? number : 10;
  }

  function tableCapacity(table) {
    const direct = Number(table?.capacity);
    if (CAPACITIES.includes(direct)) return direct;
    const seatCount = Array.isArray(table?.seats) ? table.seats.length : 0;
    return CAPACITIES.includes(seatCount) ? seatCount : 10;
  }

  function ensureSeats(table, capacity) {
    const source = Array.isArray(table?.seats) ? table.seats : [];
    return Array.from({ length: capacity }, (_, index) => ({
      ...(source[index] && typeof source[index] === 'object' ? source[index] : {}),
      id: text(source[index]?.id) || uid('seat'),
      index
    }));
  }

  function tables() {
    return api.getSnapshot()?.canonical?.tables || [];
  }

  function guests() {
    return api.getSnapshot()?.canonical?.guests || [];
  }

  function tableById(tableId) {
    return tables().find((table) => String(table?.id) === String(tableId)) || null;
  }

  function guestById(guestId) {
    return guests().find((guest) => String(guest?.id) === String(guestId)) || null;
  }

  function guestsAtTable(tableId) {
    return guests()
      .filter((guest) => String(guest.tableId || '') === String(tableId || ''))
      .sort((a,b) => (Number(a.seatNumber) || 999) - (Number(b.seatNumber) || 999));
  }

  function guestAtSeat(tableId, seatIndex) {
    return guests().find((guest) =>
      String(guest.tableId || '') === String(tableId || '') &&
      Number(guest.seatNumber) === seatIndex + 1
    ) || null;
  }

  function nextTableName() {
    const used = new Set(tables().map((table) => text(table.name)));
    let number = 1;
    while (used.has(`Mesa ${number}`)) number += 1;
    return `Mesa ${number}`;
  }

  function assignmentWarnings() {
    const warnings = [];
    const tableMap = new Map(tables().filter((table) => text(table?.id)).map((table) => [String(table.id), table]));
    const occupied = new Map();

    guests().forEach((guest) => {
      if (!text(guest.tableId)) return;
      const table = tableMap.get(String(guest.tableId));
      if (!table) {
        warnings.push(`${text(guest.name) || 'Invitado'} apunta a una mesa inexistente`);
        return;
      }
      const seatNumber = Number(guest.seatNumber);
      const capacity = tableCapacity(table);
      if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > capacity) {
        warnings.push(`${text(guest.name) || 'Invitado'} tiene una silla fuera de rango en ${text(table.name) || 'su mesa'}`);
        return;
      }
      const key = `${table.id}::${seatNumber}`;
      if (occupied.has(key)) {
        warnings.push(`${text(table.name) || 'Mesa'} tiene dos invitados en la silla ${seatNumber}`);
      } else {
        occupied.set(key, guest.id);
      }
      const seat = Array.isArray(table.seats) ? table.seats[seatNumber - 1] : null;
      if (seat && text(guest.seatId) && text(seat.id) && String(guest.seatId) !== String(seat.id)) {
        warnings.push(`${text(guest.name) || 'Invitado'} tiene un seatId distinto al de su silla ${seatNumber}`);
      }
    });

    return warnings;
  }

  function render() {
    const root = api.getRoot();
    if (!root) return;
    const list = root.querySelector('[data-tables-list]');
    const total = root.querySelector('[data-tables-total]');
    const seatsTotal = root.querySelector('[data-tables-seats]');
    const occupiedTotal = root.querySelector('[data-tables-occupied]');
    const unassignedTotal = root.querySelector('[data-tables-unassigned]');
    if (!list) return;

    const tableRows = tables();
    const guestRows = guests();
    const seatCount = tableRows.reduce((sum, table) => sum + tableCapacity(table), 0);
    const occupied = guestRows.filter((guest) => text(guest.tableId)).length;
    const unassigned = guestRows.length - occupied;

    if (total) total.textContent = String(tableRows.length);
    if (seatsTotal) seatsTotal.textContent = String(seatCount);
    if (occupiedTotal) occupiedTotal.textContent = String(occupied);
    if (unassignedTotal) unassignedTotal.textContent = String(unassigned);
    const tabCount = root.querySelector('[data-tables-tab-count]');
    if (tabCount) tabCount.textContent = String(tableRows.length);

    const warnings = assignmentWarnings();
    const state = root.querySelector('[data-tables-state]');
    if (state && !api.isSaving()) {
      state.textContent = warnings.length
        ? `Revisión necesaria: ${warnings[0]}${warnings.length > 1 ? ` · +${warnings.length - 1} observación${warnings.length - 1 === 1 ? '' : 'es'}` : ''}`
        : '';
    }

    const add = root.querySelector('[data-table-add]');
    if (add) add.hidden = !api.canEdit();

    list.innerHTML = tableRows.length
      ? tableRows.map((table) => tableCard(table)).join('')
      : '<div class="guests-empty"><strong>Aún no hay mesas</strong><span>Crea la primera mesa cuando estés listo para ubicar invitados.</span></div>';
  }

  function tableCard(table) {
    const shape = normalizeShape(table.type || table.shape);
    const capacity = tableCapacity(table);
    const assigned = guestsAtTable(table.id);
    const free = Math.max(0, capacity - assigned.length);
    const preview = assigned.slice(0,4).map((guest) => esc(text(guest.name) || 'Invitado')).join(', ');
    return `<article class="table-card" data-table-id="${esc(table.id)}">
      <div class="table-card-shape is-${shape}" aria-hidden="true"><span>${capacity}</span></div>
      <div class="table-card-copy">
        <div class="table-card-title"><h3>${esc(text(table.name) || 'Mesa')}</h3><span>${esc(SHAPE_LABELS[shape])}</span></div>
        <p>${assigned.length} de ${capacity} lugares ocupados · ${free} libres</p>
        <small>${preview || 'Sin invitados asignados'}${assigned.length > 4 ? ` y ${assigned.length - 4} más` : ''}</small>
      </div>
      <button type="button" data-table-manage>${api.canEdit() ? 'Administrar' : 'Ver'}</button>
    </article>`;
  }

  function openTable(table = null) {
    const root = api.getRoot();
    const dialog = root?.querySelector('[data-table-dialog]');
    const form = root?.querySelector('[data-table-form]');
    if (!dialog || !form) return;

    const isNew = !table;
    const capacity = table ? tableCapacity(table) : 10;
    form.reset();
    form.elements.tableId.value = table ? String(table.id) : '';
    form.elements.name.value = table ? text(table.name) : nextTableName();
    form.elements.type.value = table ? normalizeShape(table.type || table.shape) : 'round';
    form.elements.capacity.value = String(capacity);

    [...form.elements].forEach((control) => {
      if (control.name !== 'tableId') control.disabled = !api.canEdit();
    });

    root.querySelector('[data-table-dialog-title]').textContent = isNew ? 'Nueva mesa' : text(table.name) || 'Editar mesa';
    root.querySelector('[data-table-delete]').hidden = isNew || !api.canEdit();
    root.querySelector('[data-table-save]').hidden = !api.canEdit();
    root.querySelector('[data-table-delete]').dataset.tableId = table ? String(table.id) : '';

    renderSeats(table);
    dialog.showModal();
  }

  function closeTable() {
    api.getRoot()?.querySelector('[data-table-dialog]')?.close();
  }

  function renderSeats(table) {
    const root = api.getRoot();
    const seatsRoot = root?.querySelector('[data-table-seats-editor]');
    const form = root?.querySelector('[data-table-form]');
    if (!seatsRoot || !form) return;

    const tableId = text(form.elements.tableId.value);
    const capacity = normalizeCapacity(form.elements.capacity.value);
    const currentTable = table || tableById(tableId);
    const seatModels = currentTable ? ensureSeats(currentTable, capacity) : ensureSeats({}, capacity);

    seatsRoot.innerHTML = seatModels.map((seat, index) => {
      const occupant = currentTable ? guestAtSeat(currentTable.id, index) : null;
      return `<div class="table-seat-row" data-seat-index="${index}">
        <div class="table-seat-index"><span>${index + 1}</span><small>${esc(text(seat.id))}</small></div>
        <label>
          <span>Invitado</span>
          <select data-seat-guest ${api.canEdit() && currentTable ? '' : 'disabled'}>
            <option value="">Silla libre</option>
            ${guests().map((guest) => {
              const assignedElsewhere = text(guest.tableId) &&
                !(String(guest.tableId) === String(currentTable?.id) && Number(guest.seatNumber) === index + 1);
              return `<option value="${esc(guest.id)}" ${occupant && String(occupant.id) === String(guest.id) ? 'selected' : ''} ${assignedElsewhere ? 'data-assigned="true"' : ''}>${esc(text(guest.name) || 'Sin nombre')}${assignedElsewhere ? ' · asignado' : ''}</option>`;
            }).join('')}
          </select>
        </label>
      </div>`;
    }).join('');
  }

  async function persist(previous, message, source) {
    const context = api.getContext();
    const state = api.getRoot()?.querySelector('[data-tables-state]');
    api.setSaving(true);
    if (state) state.textContent = 'Guardando en Firebase…';
    render();

    try {
      await saveInvitadosSnapshot(context, api.getSnapshot().canonical);
      if (state) state.textContent = message;
      api.emitDataChange(source);
      api.renderMain();
    } catch (error) {
      api.setSnapshot(previous);
      render();
      api.renderMain();
      const currentState = api.getRoot()?.querySelector('[data-tables-state]');
      if (currentState) currentState.textContent = error?.message || 'No se pudo guardar Mesas.';
      throw error;
    } finally {
      api.setSaving(false);
    }
  }

  async function submitTable(event) {
    event.preventDefault();
    if (!api.canEdit() || api.isSaving()) return true;

    const form = event.target;
    const data = new FormData(form);
    const tableId = text(data.get('tableId'));
    const name = text(data.get('name')).slice(0,80);
    const type = normalizeShape(data.get('type'));
    const capacity = normalizeCapacity(data.get('capacity'));
    if (!name) return true;

    const previous = deepClone(api.getSnapshot());

    if (!tableId) {
      api.getSnapshot().canonical.tables.push({
        id: uid('table'),
        name,
        type,
        capacity,
        seats: ensureSeats({}, capacity),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      closeTable();
      await persist(previous, 'Mesa creada', 'table-created');
      return true;
    }

    const table = tableById(tableId);
    if (!table) return true;

    const occupied = guestsAtTable(table.id);
    const invalidOccupied = occupied.filter((guest) => Number(guest.seatNumber) > capacity);
    if (invalidOccupied.length || occupied.length > capacity) {
      window.alert(`No se puede reducir a ${capacity} lugares porque hay invitados en sillas que desaparecerían. Reasígnalos o déjalos sin mesa primero.`);
      return true;
    }

    table.name = name;
    table.type = type;
    table.capacity = capacity;
    table.seats = ensureSeats(table, capacity);
    table.updatedAt = new Date().toISOString();

    occupied.forEach((guest) => {
      const seatIndex = Number(guest.seatNumber) - 1;
      guest.seatId = table.seats[seatIndex]?.id || guest.seatId || '';
    });

    closeTable();
    await persist(previous, 'Mesa actualizada', 'table-updated');
    return true;
  }

  async function deleteTable(tableId) {
    if (!api.canEdit() || api.isSaving()) return true;
    const table = tableById(tableId);
    if (!table) return true;
    const assigned = guestsAtTable(table.id);
    const detail = assigned.length
      ? ` Tiene ${assigned.length} invitado${assigned.length === 1 ? '' : 's'}; quedarán sin mesa.`
      : '';
    if (!window.confirm(`¿Eliminar “${text(table.name) || 'esta mesa'}”?${detail} No se eliminarán invitados.`)) return true;

    const previous = deepClone(api.getSnapshot());
    assigned.forEach((guest) => {
      guest.tableId = '';
      guest.seatId = '';
      guest.seatNumber = null;
    });
    api.getSnapshot().canonical.tables = tables().filter((item) => String(item.id) !== String(table.id));
    closeTable();
    await persist(previous, 'Mesa eliminada. Sus invitados quedaron sin mesa.', 'table-deleted');
    return true;
  }

  async function assignSeat(tableId, seatIndex, guestId) {
    if (!api.canEdit() || api.isSaving()) return true;
    const table = tableById(tableId);
    if (!table) return true;
    const capacity = tableCapacity(table);
    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= capacity) return true;

    const previous = deepClone(api.getSnapshot());
    const current = guestAtSeat(table.id, seatIndex);
    const nextGuest = guestId ? guestById(guestId) : null;

    if (current && (!nextGuest || String(current.id) !== String(nextGuest.id))) {
      current.tableId = '';
      current.seatId = '';
      current.seatNumber = null;
    }

    if (nextGuest) {
      const targetOccupied = guestAtSeat(table.id, seatIndex);
      if (targetOccupied && String(targetOccupied.id) !== String(nextGuest.id)) {
        api.setSnapshot(previous);
        window.alert('Esa silla ya está ocupada.');
        return true;
      }

      nextGuest.tableId = table.id;
      nextGuest.seatNumber = seatIndex + 1;
      nextGuest.seatId = ensureSeats(table, capacity)[seatIndex].id;
    }

    await persist(
      previous,
      nextGuest ? `${text(nextGuest.name) || 'Invitado'} asignado a ${text(table.name)} · silla ${seatIndex + 1}` : `Silla ${seatIndex + 1} liberada`,
      nextGuest ? 'table-guest-assigned' : 'table-guest-unassigned'
    );
    renderSeats(tableById(table.id));
    return true;
  }

  function handleCapacityPreview(event) {
    if (!event.target.matches('[name="capacity"]')) return false;
    const form = event.target.closest('[data-table-form]');
    const tableId = text(form?.elements.tableId?.value);
    renderSeats(tableById(tableId));
    return true;
  }

  async function handleChange(event) {
    if (event.target.matches('[name="capacity"]')) {
      handleCapacityPreview(event);
      return true;
    }
    const select = event.target.closest('[data-seat-guest]');
    if (!select) return false;
    const row = select.closest('[data-seat-index]');
    const form = select.closest('[data-table-dialog]')?.querySelector('[data-table-form]');
    const tableId = text(form?.elements.tableId?.value);
    const seatIndex = Number(row?.dataset.seatIndex);
    if (!tableId || !Number.isInteger(seatIndex)) return true;

    const chosenId = text(select.value);
    const chosen = chosenId ? guestById(chosenId) : null;
    if (chosen && text(chosen.tableId) && !(String(chosen.tableId) === String(tableId) && Number(chosen.seatNumber) === seatIndex + 1)) {
      const currentTable = tableById(chosen.tableId);
      const currentLabel = currentTable ? `${text(currentTable.name)} · silla ${chosen.seatNumber || '—'}` : 'otra mesa';
      if (!window.confirm(`${text(chosen.name) || 'Este invitado'} ya está en ${currentLabel}. ¿Moverlo a esta silla?`)) {
        renderSeats(tableById(tableId));
        return true;
      }
    }
    await assignSeat(tableId, seatIndex, chosenId);
    return true;
  }

  async function handleClick(event) {
    if (event.target.closest('[data-table-close]')) {
      closeTable();
      return true;
    }
    if (event.target.closest('[data-table-add]')) {
      openTable();
      return true;
    }
    const manage = event.target.closest('[data-table-manage]');
    if (manage) {
      const card = manage.closest('[data-table-id]');
      openTable(tableById(card?.dataset.tableId));
      return true;
    }
    const deleteButton = event.target.closest('[data-table-delete]');
    if (deleteButton) {
      await deleteTable(deleteButton.dataset.tableId);
      return true;
    }
    return false;
  }

  async function handleSubmit(event) {
    if (!event.target.matches('[data-table-form]')) return false;
    return submitTable(event);
  }

  function handleInput(event) {
    return handleCapacityPreview(event);
  }

  function beginContext() {
    render();
  }

  return Object.freeze({
    beginContext,
    render,
    handleClick,
    handleSubmit,
    handleChange,
    handleInput
  });
}

export { createTablesController };