import { saveInvitadosSnapshot } from './invitados-data.js?v=3';
import { normalizeTableShape, tableSeatGeometry } from './table-geometry.js?v=4';

const SHAPE_LABELS = Object.freeze({
  round: 'Redonda',
  square: 'Cuadrada',
  rectangular: 'Rectangular'
});
function createTablesController(api) {
  let displayMode = 'visual';
  let guestFilter = 'unassigned';
  let guestSearch = '';
  let selectedGuestId = '';
  let draggingGuestId = '';
  let pendingSeatConflict = null;

  const text = (value) => String(value ?? '').trim();
  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");

  function normalizeText(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

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

  function normalizeCapacity(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 4 && number <= 16 ? number : 10;
  }

  function tableCapacity(table) {
    const direct = Number(table?.capacity);
    if (Number.isInteger(direct) && direct >= 4 && direct <= 16) return direct;
    const seatCount = Array.isArray(table?.seats) ? table.seats.length : 0;
    if (Number.isInteger(seatCount) && seatCount >= 4 && seatCount <= 16) return seatCount;
    return 10;
  }

  function seatAt(table, index) {
    const seat = Array.isArray(table?.seats) ? table.seats[index] : null;
    return seat && typeof seat === 'object' ? seat : { id: '', index };
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
      .sort((a, b) => (Number(a.seatNumber) || 999) - (Number(b.seatNumber) || 999));
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

  function initials(name) {
    return text(name).split(/\s+/).filter(Boolean).slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase()).join('') || '?';
  }

  function assignmentWarnings() {
    const warnings = [];
    const tableMap = new Map(
      tables().filter((table) => text(table?.id)).map((table) => [String(table.id), table])
    );
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
      const seat = seatAt(table, seatNumber - 1);
      if (text(guest.seatId) && text(seat.id) && String(guest.seatId) !== String(seat.id)) {
        warnings.push(`${text(guest.name) || 'Invitado'} tiene un seatId distinto al de su silla ${seatNumber}`);
      }
    });

    return warnings;
  }

  function firstFreeSeat(table, movingGuestId = '') {
    const capacity = tableCapacity(table);
    const occupied = new Set(
      guestsAtTable(table.id)
        .filter((guest) => String(guest.id) !== String(movingGuestId || ''))
        .map((guest) => Number(guest.seatNumber) - 1)
        .filter((index) => Number.isInteger(index) && index >= 0 && index < capacity)
    );
    for (let index = 0; index < capacity; index += 1) {
      if (!occupied.has(index)) return index;
    }
    return -1;
  }

  function guestFilterMatch(guest) {
    if (guestFilter === 'unassigned' && text(guest.tableId)) return false;
    if (guestFilter === 'assigned' && !text(guest.tableId)) return false;
    const status = text(guest.status).toLowerCase();
    if (guestFilter === 'confirmed' && status !== 'confirmed') return false;
    if (guestFilter === 'pending' && (status === 'confirmed' || status === 'declined')) return false;
    if (guestSearch && !normalizeText(guest.name).includes(normalizeText(guestSearch))) return false;
    return true;
  }

  function guestAssignmentLabel(guest) {
    if (!text(guest.tableId)) return 'Sin mesa';
    const table = tableById(guest.tableId);
    return table
      ? `${text(table.name) || 'Mesa'} · silla ${guest.seatNumber || '—'}`
      : 'Mesa no encontrada';
  }

  function guestStatusLabel(guest) {
    const status = text(guest?.status).toLowerCase();
    if (status === 'confirmed') return 'Confirmado';
    if (status === 'declined') return 'No asistirá';
    if (status === 'tentative') return 'Por confirmar';
    return 'Pendiente';
  }

  function closeGuestDetail() {
    const dialog = api.getRoot()?.querySelector('[data-table-guest-detail-dialog]');
    if (dialog?.open) dialog.close();
  }

  function openGuestDetail(guestId) {
    const root = api.getRoot();
    const dialog = root?.querySelector('[data-table-guest-detail-dialog]');
    const guest = guestById(guestId);
    if (!dialog || !guest || !text(guest.tableId)) return;

    const name = text(guest.name) || 'Invitado';
    const group = text(guest.rsvpFamilyLabel || guest.rsvpGroup || guest.relation) || 'Sin grupo';
    const rsvp = text(guest.rsvpResponseId)
      ? `RSVP vinculado${text(guest.rsvpResponseName) ? ` · ${text(guest.rsvpResponseName)}` : ''}`
      : 'Sin respuesta RSVP vinculada';

    root.querySelector('[data-table-guest-detail-name]').textContent = name;
    root.querySelector('[data-table-guest-detail-avatar]').textContent = initials(name);
    root.querySelector('[data-table-guest-detail-assignment]').textContent = guestAssignmentLabel(guest);
    root.querySelector('[data-table-guest-detail-rsvp]').textContent = rsvp;
    root.querySelector('[data-table-guest-detail-status]').textContent = guestStatusLabel(guest);
    root.querySelector('[data-table-guest-detail-group]').textContent = group;

    const move = root.querySelector('[data-table-guest-detail-move]');
    const unassign = root.querySelector('[data-table-guest-detail-unassign]');
    [move, unassign].forEach((button) => {
      if (!button) return;
      button.dataset.guestId = String(guest.id);
      button.hidden = !api.canEdit();
    });
    dialog.showModal();
  }

  function guestPanelItem(guest) {
    const selected = String(selectedGuestId) === String(guest.id);
    const declined = text(guest.status) === 'declined';
    const draggable = api.canEdit() ? 'draggable="true"' : '';
    return `<button class="tables-guest-item${selected ? ' is-selected' : ''}${declined ? ' is-declined' : ''}"
      type="button"
      data-table-guest-item="${esc(guest.id)}"
      data-drag-guest="${esc(guest.id)}"
      ${draggable}>
      <span class="tables-guest-avatar">${esc(initials(guest.name))}</span>
      <span class="tables-guest-copy">
        <strong>${esc(text(guest.name) || 'Sin nombre')}</strong>
        <span>${esc(guestAssignmentLabel(guest))}</span>
      </span>
      ${declined ? '<span class="tables-guest-warning" title="Marcado como No asistirá">!</span>' : ''}
      <span class="tables-guest-drag" aria-hidden="true">⋮⋮</span>
    </button>`;
  }

  function visualSeatMarkup(table, geometry, seatIndex) {
    const position = geometry.positions[seatIndex];
    const guest = guestAtSeat(table.id, seatIndex);
    const declined = guest && text(guest.status) === 'declined';
    const selected = guest && String(selectedGuestId) === String(guest.id);
    const align = position.labelAlign === 'left'
      ? 'is-label-left'
      : position.labelAlign === 'right'
        ? 'is-label-right'
        : 'is-label-center';

    const seat = `<button
      class="table-visual-seat${guest ? ' is-occupied' : ''}${declined ? ' is-declined' : ''}${selected ? ' is-selected' : ''}"
      type="button"
      data-seat-drop
      data-table-id="${esc(table.id)}"
      data-seat-index="${seatIndex}"
      ${guest ? `data-drag-guest="${esc(guest.id)}" draggable="${api.canEdit() ? 'true' : 'false'}"` : ''}
      style="left:${position.x}px;top:${position.y}px"
      aria-label="${esc(guest ? `${guest.name || 'Invitado'}, silla ${seatIndex + 1}` : `Silla ${seatIndex + 1} libre`)}"
      title="${esc(guest ? `${guest.name || 'Invitado'} · silla ${seatIndex + 1}` : `Silla ${seatIndex + 1} libre`)}"
    >${guest ? esc(initials(guest.name)) : '<i></i>'}</button>`;

    if (!guest) return seat;

    return `${seat}<button
      class="table-seat-label ${align}${declined ? ' is-declined' : ''}"
      type="button"
      data-seat-label
      data-drag-guest="${esc(guest.id)}"
      draggable="${api.canEdit() ? 'true' : 'false'}"
      style="--label-x:${position.labelX}px;--label-y:${position.labelY}px;--label-x-medium:${position.labelMediumX}px;--label-y-medium:${position.labelMediumY}px;--label-x-compact:${position.labelCompactX}px;--label-y-compact:${position.labelCompactY}px"
      title="${esc(guestAssignmentLabel(guest))}">
      <span>${esc(text(guest.name) || 'Invitado')}</span>
      ${declined ? '<small>No asistirá</small>' : ''}
    </button>`;
  }

  function visualTableCard(table) {
    const shape = normalizeTableShape(table.type || table.shape);
    const capacity = tableCapacity(table);
    const assigned = guestsAtTable(table.id);
    const declinedCount = assigned.filter((guest) => text(guest.status) === 'declined').length;
    const geometry = tableSeatGeometry(shape, capacity);
    const fill = capacity ? Math.round((assigned.length / capacity) * 100) : 0;

    return `<article class="table-visual-card${assigned.length >= capacity ? ' is-full' : ''}" data-table-id="${esc(table.id)}">
      <header class="table-visual-card-head">
        <div>
          <strong>${esc(text(table.name) || 'Mesa')}</strong>
          <span>${esc(SHAPE_LABELS[shape])} · ${assigned.length}/${capacity}</span>
        </div>
        <div class="table-order-actions" aria-label="Orden de ${esc(text(table.name) || 'mesa')}">
          ${api.canEdit() ? '<button type="button" data-table-order="-1" aria-label="Mover mesa antes">‹</button><button type="button" data-table-order="1" aria-label="Mover mesa después">›</button>' : ''}
          <button type="button" data-table-manage aria-label="Administrar ${esc(text(table.name) || 'mesa')}">•••</button>
        </div>
      </header>
      ${declinedCount ? `<div class="table-visual-warning">${declinedCount} invitado${declinedCount === 1 ? '' : 's'} marcado${declinedCount === 1 ? '' : 's'} como “No asistirá”</div>` : ''}
      <div class="table-visual-canvas" style="width:${geometry.visualWidth}px;height:${geometry.visualHeight}px;--table-body-w:${geometry.table.width}px;--table-body-h:${geometry.table.height}px">
        <button class="table-visual-body is-${shape}" type="button" data-table-drop="${esc(table.id)}">
          <strong>${esc(text(table.name) || 'Mesa')}</strong>
          <span>${assigned.length} / ${capacity}</span>
          <small>${Math.max(0, capacity - assigned.length)} libres</small>
        </button>
        ${geometry.positions.map((_, index) => visualSeatMarkup(table, geometry, index)).join('')}
      </div>
      <footer class="table-visual-footer">
        <div class="table-occupancy"><i style="width:${fill}%"></i></div>
        <span>${assigned.length >= capacity ? 'Mesa completa' : `${capacity - assigned.length} lugar${capacity - assigned.length === 1 ? '' : 'es'} libre${capacity - assigned.length === 1 ? '' : 's'}`}</span>
      </footer>
    </article>`;
  }

  function listTableCard(table) {
    const shape = normalizeTableShape(table.type || table.shape);
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
      <div class="table-card-actions">
        ${api.canEdit() ? '<div class="table-order-actions" aria-label="Orden de mesa"><button type="button" data-table-order="-1" aria-label="Mover mesa antes">‹</button><button type="button" data-table-order="1" aria-label="Mover mesa después">›</button></div>' : ''}
        <button type="button" data-table-manage>${api.canEdit() ? 'Administrar' : 'Ver'}</button>
      </div>
    </article>`;
  }

  function renderGuestPanel() {
    const root = api.getRoot();
    const list = root?.querySelector('[data-table-guest-list]');
    if (!list) return;
    const visible = guests().filter(guestFilterMatch);
    const count = root.querySelector('[data-tables-guests-visible]');
    if (count) count.textContent = String(visible.length);

    list.innerHTML = visible.length
      ? visible.map(guestPanelItem).join('')
      : '<div class="tables-guests-empty">No hay invitados en este filtro.</div>';

    root.querySelectorAll('[data-table-guest-filter]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.tableGuestFilter === guestFilter);
    });

    const hint = root.querySelector('[data-tables-selection-hint]');
    const selected = guestById(selectedGuestId);
    if (hint) {
      hint.hidden = !selected;
      hint.textContent = selected
        ? `${text(selected.name) || 'Invitado'} seleccionado · toca una silla libre o una mesa`
        : '';
    }
  }

  function render() {
    const root = api.getRoot();
    if (!root) return;

    const tableRows = tables();
    const guestRows = guests();
    const seatCount = tableRows.reduce((sum, table) => sum + tableCapacity(table), 0);
    const occupied = guestRows.filter((guest) => text(guest.tableId)).length;
    const unassigned = guestRows.length - occupied;

    const total = root.querySelector('[data-tables-total]');
    const seatsTotal = root.querySelector('[data-tables-seats]');
    const occupiedTotal = root.querySelector('[data-tables-occupied]');
    const unassignedTotal = root.querySelector('[data-tables-unassigned]');
    if (total) total.textContent = String(tableRows.length);
    if (seatsTotal) seatsTotal.textContent = String(seatCount);
    if (occupiedTotal) occupiedTotal.textContent = String(occupied);
    if (unassignedTotal) unassignedTotal.textContent = String(unassigned);

    const tabCount = root.querySelector('[data-tables-tab-count]');
    if (tabCount) tabCount.textContent = String(tableRows.length);

    const stageSummary = root.querySelector('[data-tables-stage-summary]');
    if (stageSummary) {
      stageSummary.textContent = `${tableRows.length} mesa${tableRows.length === 1 ? '' : 's'} · ${occupied} persona${occupied === 1 ? '' : 's'} ubicada${occupied === 1 ? '' : 's'}`;
    }

    const warnings = assignmentWarnings();
    const stateNode = root.querySelector('[data-tables-state]');
    if (stateNode && !api.isSaving()) {
      stateNode.textContent = warnings.length
        ? `Revisión necesaria: ${warnings[0]}${warnings.length > 1 ? ` · +${warnings.length - 1} observación${warnings.length - 1 === 1 ? '' : 'es'}` : ''}`
        : '';
      stateNode.classList.toggle('has-warning', Boolean(warnings.length));
    }

    const add = root.querySelector('[data-table-add]');
    if (add) add.hidden = !api.canEdit();

    root.querySelectorAll('[data-tables-display]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.tablesDisplay === displayMode);
    });

    const visualView = root.querySelector('[data-tables-visual-view]');
    const listView = root.querySelector('[data-tables-list-view]');
    if (visualView) visualView.hidden = displayMode !== 'visual';
    if (listView) listView.hidden = displayMode !== 'list';

    const visualGrid = root.querySelector('[data-tables-visual-grid]');
    if (visualGrid) {
      visualGrid.innerHTML = tableRows.length
        ? tableRows.map(visualTableCard).join('')
        : '<div class="tables-stage-empty"><strong>Aún no hay mesas</strong><span>Crea una mesa para comenzar la distribución de invitados.</span></div>';
    }

    const list = root.querySelector('[data-tables-list]');
    if (list) {
      list.innerHTML = tableRows.length
        ? tableRows.map(listTableCard).join('')
        : '<div class="guests-empty"><strong>Aún no hay mesas</strong><span>Crea la primera mesa cuando estés listo para ubicar invitados.</span></div>';
    }

    renderGuestPanel();
  }

  function syncCapacityPicker(capacity) {
    const root = api.getRoot();
    const form = root?.querySelector('[data-table-form]');
    const optionsRoot = root?.querySelector('[data-table-capacity-options]');
    if (!form?.elements?.capacity || !optionsRoot) return;

    const normalized = normalizeCapacity(capacity);
    form.elements.capacity.value = String(normalized);

    optionsRoot.querySelectorAll('[data-table-capacity][data-legacy-capacity="true"]').forEach((button) => button.remove());
    let activeButton = optionsRoot.querySelector(`[data-table-capacity="${normalized}"]`);
    if (!activeButton) {
      activeButton = document.createElement('button');
      activeButton.type = 'button';
      activeButton.dataset.tableCapacity = String(normalized);
      activeButton.dataset.legacyCapacity = 'true';
      activeButton.innerHTML = `<strong>${normalized}</strong><small>existente</small>`;
      optionsRoot.appendChild(activeButton);
    }

    optionsRoot.querySelectorAll('[data-table-capacity]').forEach((button) => {
      const active = Number(button.dataset.tableCapacity) === normalized;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.disabled = !api.canEdit();
    });
  }

  function syncShapePicker(shape) {
    const root = api.getRoot();
    const normalized = normalizeTableShape(shape);
    const form = root?.querySelector('[data-table-form]');
    if (form?.elements?.type) form.elements.type.value = normalized;
    root?.querySelectorAll('[data-table-shape]').forEach((button) => {
      const active = button.dataset.tableShape === normalized;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.disabled = !api.canEdit();
    });
  }

  function renderTablePreview() {
    const root = api.getRoot();
    const form = root?.querySelector('[data-table-form]');
    const previewRoot = root?.querySelector('[data-table-preview]');
    const summary = root?.querySelector('[data-table-preview-summary]');
    if (!form || !previewRoot) return;

    const shape = normalizeTableShape(form.elements.type?.value);
    const capacity = normalizeCapacity(form.elements.capacity?.value);
    const geometry = tableSeatGeometry(shape, capacity);
    const shapeLabel = SHAPE_LABELS[shape] || 'Mesa';

    previewRoot.innerHTML = `<div class="table-editor-preview-canvas" style="width:${geometry.visualWidth}px;height:${geometry.visualHeight}px;--table-body-w:${geometry.table.width}px;--table-body-h:${geometry.table.height}px">
      <div class="table-editor-preview-body is-${shape}">
        <strong>${esc(shapeLabel)}</strong>
        <span>${capacity} sillas</span>
      </div>
      ${geometry.positions.map((position, index) => `<span class="table-editor-preview-seat" style="left:${position.x}px;top:${position.y}px" aria-hidden="true">${index + 1}</span>`).join('')}
    </div>`;
    if (summary) summary.textContent = `${shapeLabel} · ${capacity} lugares`;
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
    form.elements.type.value = table ? normalizeTableShape(table.type || table.shape) : 'round';
    syncShapePicker(form.elements.type.value);

    syncCapacityPicker(capacity);
    renderTablePreview();

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

    seatsRoot.innerHTML = Array.from({ length: capacity }, (_, index) => {
      const seat = currentTable ? seatAt(currentTable, index) : { id: '', index };
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
              return `<option value="${esc(guest.id)}" ${occupant && String(occupant.id) === String(guest.id) ? 'selected' : ''}>${esc(text(guest.name) || 'Sin nombre')}${assignedElsewhere ? ' · asignado' : ''}</option>`;
            }).join('')}
          </select>
        </label>
      </div>`;
    }).join('');
  }

  async function persist(previous, message, source) {
    const context = api.getContext();
    const stateNode = api.getRoot()?.querySelector('[data-tables-state]');
    api.setSaving(true);
    if (stateNode) {
      stateNode.textContent = 'Guardando en Firebase…';
      stateNode.classList.remove('has-warning');
    }
    render();

    try {
      await saveInvitadosSnapshot(context, api.getSnapshot().canonical);
      if (stateNode) stateNode.textContent = message;
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
    const name = text(data.get('name')).slice(0, 80);
    const type = normalizeTableShape(data.get('type'));
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
    if (String(selectedGuestId) && !guestById(selectedGuestId)) selectedGuestId = '';
    closeTable();
    await persist(previous, 'Mesa eliminada. Sus invitados quedaron sin mesa.', 'table-deleted');
    return true;
  }

  function guestSeatLocation(guest) {
    const table = guest && text(guest.tableId) ? tableById(guest.tableId) : null;
    const seatIndex = Number(guest?.seatNumber) - 1;
    if (!table || !Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= tableCapacity(table)) return null;
    return { table, seatIndex };
  }

  function closeSeatConflict(choice = 'cancel') {
    const dialog = api.getRoot()?.querySelector('[data-seat-conflict-dialog]');
    if (dialog?.open) dialog.close();
    const pending = pendingSeatConflict;
    pendingSeatConflict = null;
    pending?.resolve(choice);
  }

  function requestSeatConflict(guest, current, table, seatIndex) {
    const root = api.getRoot();
    const dialog = root?.querySelector('[data-seat-conflict-dialog]');
    if (!dialog) return Promise.resolve('cancel');

    const origin = guestSeatLocation(guest);
    const targetName = text(current.name) || 'El invitado actual';
    const movingName = text(guest.name) || 'El invitado seleccionado';
    const targetLabel = `${text(table.name) || 'Mesa'} · silla ${seatIndex + 1}`;
    const summary = root.querySelector('[data-seat-conflict-summary]');
    const swapCopy = root.querySelector('[data-seat-conflict-swap-copy]');
    const replaceCopy = root.querySelector('[data-seat-conflict-replace-copy]');
    const swapButton = root.querySelector('[data-seat-conflict-action="swap"]');

    if (summary) summary.textContent = `${targetLabel} está ocupada por ${targetName}.`;
    if (origin) {
      if (swapCopy) swapCopy.textContent = `${movingName} y ${targetName} cambian de silla.`;
      if (swapButton) swapButton.hidden = false;
    } else {
      if (swapCopy) swapCopy.textContent = '';
      if (swapButton) swapButton.hidden = true;
    }
    if (replaceCopy) replaceCopy.textContent = `${movingName} ocupa esta silla y ${targetName} queda sin mesa.`;

    if (pendingSeatConflict) closeSeatConflict('cancel');
    return new Promise((resolve) => {
      pendingSeatConflict = { resolve };
      dialog.showModal();
    });
  }

  async function assignGuestToSeat(guestId, tableId, seatIndex, { confirmReplacement = true } = {}) {
    if (!api.canEdit() || api.isSaving()) return false;
    const table = tableById(tableId);
    const guest = guestById(guestId);
    if (!table || !guest) return false;

    const capacity = tableCapacity(table);
    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= capacity) return false;

    const current = guestAtSeat(table.id, seatIndex);
    let conflictAction = 'replace';
    let origin = null;
    if (current && String(current.id) !== String(guest.id)) {
      origin = guestSeatLocation(guest);
      if (confirmReplacement) {
        conflictAction = await requestSeatConflict(guest, current, table, seatIndex);
        if (conflictAction === 'cancel') return false;
      }
    }

    const previous = deepClone(api.getSnapshot());
    table.seats = ensureSeats(table, capacity);

    if (current && String(current.id) !== String(guest.id)) {
      if (conflictAction === 'swap' && origin) {
        origin.table.seats = ensureSeats(origin.table, tableCapacity(origin.table));
        current.tableId = origin.table.id;
        current.seatNumber = origin.seatIndex + 1;
        current.seatId = origin.table.seats[origin.seatIndex].id;
      } else {
        current.tableId = '';
        current.seatId = '';
        current.seatNumber = null;
      }
    }

    guest.tableId = table.id;
    guest.seatNumber = seatIndex + 1;
    guest.seatId = table.seats[seatIndex].id;
    selectedGuestId = '';
    const message = conflictAction === 'swap' && current
      ? `${text(guest.name) || 'Invitado'} y ${text(current.name) || 'Invitado'} intercambiaron lugares`
      : `${text(guest.name) || 'Invitado'} · ${text(table.name) || 'Mesa'} · silla ${seatIndex + 1}`;
    await persist(
      previous,
      message,
      conflictAction === 'swap' ? 'table-guests-swapped' : 'table-guest-assigned'
    );
    return true;
  }

  async function assignGuestToTable(guestId, tableId) {
    const table = tableById(tableId);
    const guest = guestById(guestId);
    if (!table || !guest) return false;
    const seatIndex = firstFreeSeat(table, guest.id);
    if (seatIndex < 0) {
      window.alert(`${text(table.name) || 'Esta mesa'} ya está completa.`);
      return false;
    }
    return assignGuestToSeat(guest.id, table.id, seatIndex, { confirmReplacement: false });
  }

  async function unassignGuest(guestId) {
    if (!api.canEdit() || api.isSaving()) return false;
    const guest = guestById(guestId);
    if (!guest || !text(guest.tableId)) {
      selectedGuestId = '';
      render();
      return false;
    }
    const previous = deepClone(api.getSnapshot());
    const name = text(guest.name) || 'Invitado';
    guest.tableId = '';
    guest.seatId = '';
    guest.seatNumber = null;
    selectedGuestId = '';
    await persist(previous, `${name} quedó sin mesa`, 'table-guest-unassigned');
    return true;
  }

  function clearDropState() {
    const root = api.getRoot();
    root?.classList.remove('is-guest-dragging');
    root?.querySelectorAll('.is-drag-over,.is-drag-source,.is-drop-free,.is-drop-occupied,.is-drop-full').forEach((node) => {
      node.classList.remove('is-drag-over','is-drag-source','is-drop-free','is-drop-occupied','is-drop-full');
    });
  }

  function showDropTargets(guestId) {
    const root = api.getRoot();
    const moving = guestById(guestId);
    if (!root || !moving) return;
    root.classList.add('is-guest-dragging');

    root.querySelectorAll('[data-seat-drop]').forEach((seat) => {
      const occupantId = text(seat.dataset.dragGuest);
      const isSelf = occupantId && String(occupantId) === String(guestId);
      seat.classList.toggle('is-drop-free', !occupantId || isSelf);
      seat.classList.toggle('is-drop-occupied', Boolean(occupantId && !isSelf));
    });

    root.querySelectorAll('[data-table-drop]').forEach((body) => {
      const table = tableById(body.dataset.tableDrop);
      if (!table) return;
      const freeSeat = firstFreeSeat(table, guestId);
      body.classList.toggle('is-drop-free', freeSeat >= 0);
      body.classList.toggle('is-drop-full', freeSeat < 0);
    });
  }

  function setSelectedGuest(guestId) {
    selectedGuestId = String(selectedGuestId) === String(guestId || '') ? '' : String(guestId || '');
    render();
  }

  async function reorderTable(tableId, direction) {
    if (!api.canEdit() || api.isSaving()) return false;
    const rows = tables();
    const from = rows.findIndex((table) => String(table?.id) === String(tableId));
    const step = Number(direction) < 0 ? -1 : 1;
    const to = from + step;
    if (from < 0 || to < 0 || to >= rows.length) return false;

    const previous = deepClone(api.getSnapshot());
    const [table] = rows.splice(from, 1);
    rows.splice(to, 0, table);
    await persist(previous, `${text(table.name) || 'Mesa'} reordenada`, 'table-reordered');
    return true;
  }

  async function handleClick(event) {
    if (event.target.closest('[data-table-guest-detail-close]')) {
      closeGuestDetail();
      return true;
    }
    const moveGuest = event.target.closest('[data-table-guest-detail-move]');
    if (moveGuest) {
      closeGuestDetail();
      selectedGuestId = String(moveGuest.dataset.guestId || '');
      render();
      return true;
    }
    const unassignDetail = event.target.closest('[data-table-guest-detail-unassign]');
    if (unassignDetail) {
      const guestId = String(unassignDetail.dataset.guestId || '');
      closeGuestDetail();
      await unassignGuest(guestId);
      return true;
    }

    const conflictAction = event.target.closest('[data-seat-conflict-action]');
    if (conflictAction) {
      closeSeatConflict(conflictAction.dataset.seatConflictAction);
      return true;
    }
    if (event.target.closest('[data-seat-conflict-cancel]')) {
      closeSeatConflict('cancel');
      return true;
    }

    const capacityButton = event.target.closest('[data-table-capacity]');
    if (capacityButton) {
      if (!api.canEdit()) return true;
      syncCapacityPicker(capacityButton.dataset.tableCapacity);
      renderTablePreview();
      const form = capacityButton.closest('[data-table-form]');
      const tableId = text(form?.elements.tableId?.value);
      renderSeats(tableById(tableId));
      return true;
    }

    const shapeButton = event.target.closest('[data-table-shape]');
    if (shapeButton) {
      if (!api.canEdit()) return true;
      syncShapePicker(shapeButton.dataset.tableShape);
      renderTablePreview();
      return true;
    }

    const display = event.target.closest('[data-tables-display]');
    if (display) {
      displayMode = display.dataset.tablesDisplay === 'list' ? 'list' : 'visual';
      render();
      return true;
    }

    const filterButton = event.target.closest('[data-table-guest-filter]');
    if (filterButton) {
      guestFilter = filterButton.dataset.tableGuestFilter || 'unassigned';
      render();
      return true;
    }

    if (event.target.closest('[data-table-close]')) {
      closeTable();
      return true;
    }

    if (event.target.closest('[data-table-add]')) {
      openTable();
      return true;
    }

    const orderButton = event.target.closest('[data-table-order]');
    if (orderButton) {
      const card = orderButton.closest('[data-table-id]');
      await reorderTable(card?.dataset.tableId, orderButton.dataset.tableOrder);
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

    const guestItem = event.target.closest('[data-table-guest-item]');
    if (guestItem) {
      setSelectedGuest(guestItem.dataset.tableGuestItem);
      return true;
    }

    const seat = event.target.closest('[data-seat-drop]');
    if (seat) {
      const tableId = seat.dataset.tableId;
      const seatIndex = Number(seat.dataset.seatIndex);
      const occupantId = seat.dataset.dragGuest || '';
      if (selectedGuestId) {
        await assignGuestToSeat(selectedGuestId, tableId, seatIndex);
      } else if (occupantId) {
        openGuestDetail(occupantId);
      }
      return true;
    }

    const label = event.target.closest('[data-seat-label]');
    if (label) {
      if (selectedGuestId && String(selectedGuestId) !== String(label.dataset.dragGuest)) {
        const guest = guestById(label.dataset.dragGuest);
        const location = guestSeatLocation(guest);
        if (location) await assignGuestToSeat(selectedGuestId, location.table.id, location.seatIndex);
      } else {
        openGuestDetail(label.dataset.dragGuest);
      }
      return true;
    }

    const body = event.target.closest('[data-table-drop]');
    if (body && selectedGuestId) {
      await assignGuestToTable(selectedGuestId, body.dataset.tableDrop);
      return true;
    }

    const unassigned = event.target.closest('[data-table-unassigned-drop]');
    if (unassigned && selectedGuestId) {
      await unassignGuest(selectedGuestId);
      return true;
    }

    return false;
  }

  async function handleSubmit(event) {
    if (!event.target.matches('[data-table-form]')) return false;
    return submitTable(event);
  }

  function handleInput(event) {
    if (event.target.matches('[data-table-guest-search]')) {
      guestSearch = event.target.value;
      renderGuestPanel();
      const input = api.getRoot()?.querySelector('[data-table-guest-search]');
      if (input) {
        input.value = guestSearch;
        input.focus();
        input.setSelectionRange(guestSearch.length, guestSearch.length);
      }
      return true;
    }
    return false;
  }

  async function handleChange(event) {
    const select = event.target.closest('[data-seat-guest]');
    if (!select) return false;
    const row = select.closest('[data-seat-index]');
    const form = select.closest('[data-table-dialog]')?.querySelector('[data-table-form]');
    const tableId = text(form?.elements.tableId?.value);
    const seatIndex = Number(row?.dataset.seatIndex);
    if (!tableId || !Number.isInteger(seatIndex)) return true;

    const chosenId = text(select.value);
    const current = guestAtSeat(tableId, seatIndex);
    if (!chosenId) {
      if (current) await unassignGuest(current.id);
      renderSeats(tableById(tableId));
      return true;
    }

    const chosen = guestById(chosenId);
    if (!chosen) return true;
    await assignGuestToSeat(chosen.id, tableId, seatIndex);
    renderSeats(tableById(tableId));
    return true;
  }

  function handleDragStart(event) {
    if (!api.canEdit()) return false;
    const source = event.target.closest('[data-drag-guest]');
    if (!source) return false;
    const guestId = text(source.dataset.dragGuest);
    if (!guestId || !guestById(guestId)) return false;

    draggingGuestId = guestId;
    selectedGuestId = guestId;
    clearDropState();
    showDropTargets(guestId);
    source.classList.add('is-drag-source');
    try {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/mgd-guest-id', guestId);
      event.dataTransfer.setData('text/plain', guestId);
    } catch (_) {}
    return true;
  }

  function handleDragOver(event) {
    if (!draggingGuestId) return false;
    const target = event.target.closest('[data-seat-drop],[data-table-drop],[data-table-unassigned-drop]');
    if (!target) return false;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const root = api.getRoot();
    root?.querySelectorAll('.is-drag-over').forEach((node) => {
      if (node !== target) node.classList.remove('is-drag-over');
    });
    target.classList.add('is-drag-over');
    return true;
  }

  async function handleDrop(event) {
    if (!draggingGuestId) return false;
    const target = event.target.closest('[data-seat-drop],[data-table-drop],[data-table-unassigned-drop]');
    if (!target) return false;
    event.preventDefault();

    const guestId = draggingGuestId;
    draggingGuestId = '';
    clearDropState();

    if (target.matches('[data-table-unassigned-drop]')) {
      await unassignGuest(guestId);
      return true;
    }
    if (target.matches('[data-seat-drop]')) {
      await assignGuestToSeat(guestId, target.dataset.tableId, Number(target.dataset.seatIndex));
      return true;
    }
    if (target.matches('[data-table-drop]')) {
      await assignGuestToTable(guestId, target.dataset.tableDrop);
      return true;
    }
    return false;
  }

  function handleDragEnd() {
    draggingGuestId = '';
    clearDropState();
    render();
    return true;
  }

  function beginContext() {
    displayMode = 'visual';
    guestFilter = 'unassigned';
    guestSearch = '';
    selectedGuestId = '';
    draggingGuestId = '';
    if (pendingSeatConflict) closeSeatConflict('cancel');
    render();
  }

  return Object.freeze({
    beginContext,
    render,
    handleClick,
    handleSubmit,
    handleChange,
    handleInput,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  });
}

export { createTablesController };