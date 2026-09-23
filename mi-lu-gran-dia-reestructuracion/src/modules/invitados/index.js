import { weddingCapabilities } from '../../core/app/permissions.js';
import { loadInvitadosSnapshot, saveInvitadosSnapshot } from './invitados-data.js?v=3';
import { createRsvpController } from './rsvp-controller.js?v=1';
import { createTablesController } from './tables-controller.js?v=3';

let activeContext = null;
let snapshot = null;
let mountEpoch = 0;
let filter = 'all';
let search = '';
let activeView = 'list';
let saving = false;
let rsvpController = null;
let tablesController = null;

const esc = (value) => String(value ?? '')
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'","&#039;");

function text(value) {
  return String(value ?? '').trim();
}

function canEdit() {
  return weddingCapabilities(activeContext?.role).canEdit;
}

function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function guestStatus(guest) {
  const status = text(guest?.status).toLowerCase();
  if (status === 'confirmed') return 'confirmed';
  if (status === 'declined') return 'declined';
  if (status === 'tentative') return 'tentative';
  return 'pending';
}

function statusLabel(status) {
  return ({
    confirmed: 'Confirmado',
    declined: 'No asistirá',
    tentative: 'Por confirmar',
    pending: 'Pendiente'
  })[status] || 'Pendiente';
}

function tableName(guest, tables) {
  const tableId = text(guest?.tableId);
  if (!tableId) return '';
  const table = tables.find((item) => String(item?.id ?? '') === tableId);
  return text(table?.name) || `Mesa ${tableId}`;
}

function guestSearchText(guest, tables) {
  return [
    guest?.name,
    guest?.relation,
    guest?.side,
    guest?.restriction,
    guest?.rsvpFamilyLabel,
    guest?.rsvpGroup,
    ...(Array.isArray(guest?.rsvpTags) ? guest.rsvpTags : []),
    tableName(guest, tables)
  ].map(text).join(' ').toLocaleLowerCase('es');
}

function matchesFilter(guest) {
  const status = guestStatus(guest);
  if (filter === 'confirmed') return status === 'confirmed';
  if (filter === 'pending') return status !== 'confirmed' && status !== 'declined';
  if (filter === 'seated') return Boolean(text(guest?.tableId));
  if (filter === 'unseated') return !text(guest?.tableId);
  return true;
}

function initials(name) {
  const parts = text(name).split(/\s+/).filter(Boolean);
  return parts.slice(0,2).map((part) => part.charAt(0)).join('').toUpperCase() || '?';
}

function guestCard(guest, tables) {
  const status = guestStatus(guest);
  const table = tableName(guest, tables);
  const seat = guest?.seatNumber ?? '';
  const relation = text(guest?.relation);
  const side = text(guest?.side);
  const family = text(guest?.rsvpFamilyLabel || guest?.rsvpGroup);
  const restriction = text(guest?.restriction);
  const invitation = Boolean(guest?.invitationSent);
  const rsvpLinked = Boolean(text(guest?.rsvpResponseId));
  const meta = [relation, side && side !== 'ambos' ? side : '', family].filter(Boolean);
  const editable = canEdit();

  return `<article class="guest-card${editable ? ' is-editable' : ''}" data-guest-id="${esc(guest?.id)}">
    <div class="guest-main">
      <span class="guest-avatar">${esc(initials(guest?.name))}</span>
      <div class="guest-copy">
        <div class="guest-name-row">
          <h3>${esc(text(guest?.name) || 'Invitado sin nombre')}</h3>
          <span class="guest-status is-${status}">${esc(statusLabel(status))}</span>
        </div>
        <p>${meta.length ? esc(meta.join(' · ')) : 'Sin relación o grupo registrado'}</p>
        <div class="guest-tags">
          ${invitation ? '<span>Invitación enviada</span>' : ''}
          ${rsvpLinked ? '<span>RSVP vinculado</span>' : ''}
          ${restriction && restriction.toLowerCase() !== 'ninguna' ? `<span>Restricción: ${esc(restriction)}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="guest-assignment">
      <span>Mesa</span>
      <strong>${table ? esc(table) : 'Sin mesa'}</strong>
      <small>${table && seat ? `Silla ${esc(seat)}` : text(guest?.seatId) ? esc(guest.seatId) : '—'}</small>
    </div>
    ${editable ? '<button class="guest-card-action" type="button" data-guest-edit aria-label="Editar invitado">✎</button>' : ''}
  </article>`;
}

function getRoot() {
  return document.querySelector('[data-module-view="invitados"]');
}

function emitDataChange(source = 'invitados') {
  window.dispatchEvent(new CustomEvent('migrandia:datachange', {
    detail: {
      source,
      module: 'invitados',
      weddingId: activeContext?.id || '',
      guests: snapshot?.canonical?.guests?.length || 0
    }
  }));
}

function ensureRsvpController() {
  if (rsvpController) return rsvpController;
  rsvpController = createRsvpController({
    getRoot,
    getContext: () => activeContext,
    getSnapshot: () => snapshot,
    setSnapshot: (value) => { snapshot = value; },
    canEdit,
    isSaving: () => saving,
    setSaving: (value) => { saving = Boolean(value); },
    renderMain: render,
    emitDataChange
  });
  return rsvpController;
}

function ensureTablesController() {
  if (tablesController) return tablesController;
  tablesController = createTablesController({
    getRoot,
    getContext: () => activeContext,
    getSnapshot: () => snapshot,
    setSnapshot: (value) => { snapshot = value; },
    canEdit,
    isSaving: () => saving,
    setSaving: (value) => { saving = Boolean(value); },
    renderMain: render,
    emitDataChange
  });
  return tablesController;
}


function render() {
  const root = getRoot();
  if (!root || !snapshot) return;
  const guests = snapshot.canonical.guests;
  const tables = snapshot.canonical.tables;
  const confirmed = guests.filter((guest) => guestStatus(guest) === 'confirmed').length;
  const pending = guests.filter((guest) => !['confirmed','declined'].includes(guestStatus(guest))).length;
  const seated = guests.filter((guest) => Boolean(text(guest?.tableId))).length;

  root.querySelector('[data-guests-total]').textContent = String(guests.length);
  root.querySelector('[data-guests-kpi-total]').textContent = String(guests.length);
  root.querySelector('[data-guests-kpi-confirmed]').textContent = String(confirmed);
  root.querySelector('[data-guests-kpi-pending]').textContent = String(pending);
  root.querySelector('[data-guests-kpi-seated]').textContent = String(seated);
  root.querySelector('[data-guests-kpi-unseated]').textContent = String(Math.max(0, guests.length - seated));

  const addButton = root.querySelector('[data-guests-add]');
  if (addButton) addButton.hidden = !canEdit();

  const needle = search.trim().toLocaleLowerCase('es');
  const rows = guests.filter((guest) => matchesFilter(guest) && (!needle || guestSearchText(guest, tables).includes(needle)));
  root.querySelector('[data-guests-results]').textContent = `${rows.length} ${rows.length === 1 ? 'invitado' : 'invitados'}`;
  root.querySelector('[data-guests-list]').innerHTML = rows.length
    ? rows.map((guest) => guestCard(guest, tables)).join('')
    : '<div class="guests-empty"><strong>No hay invitados para mostrar</strong><span>Cambia el filtro o la búsqueda.</span></div>';

  root.querySelectorAll('[data-guests-filter]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.guestsFilter === filter);
  });
  root.querySelectorAll('[data-guests-view]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.guestsView === activeView);
  });
  root.querySelectorAll('[data-guests-pane]').forEach((pane) => {
    pane.hidden = pane.dataset.guestsPane !== activeView;
  });
  ensureRsvpController().render();
  ensureTablesController().render();
}

function findGuest(id) {
  return snapshot?.canonical?.guests.find((guest) => String(guest?.id) === String(id)) || null;
}

function newGuestId() {
  const value = typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;
  return `guest_${value}`;
}

function openEditor(guest = null) {
  const root = getRoot();
  const dialog = root?.querySelector('[data-guests-dialog]');
  const form = root?.querySelector('[data-guests-form]');
  if (!dialog || !form || !canEdit()) return;

  form.reset();
  form.elements.guestId.value = guest ? String(guest.id ?? '') : '';
  form.elements.name.value = guest ? text(guest.name) : '';
  form.elements.status.value = guest ? guestStatus(guest) : 'pending';
  form.elements.side.value = ['novio','novia','ambos'].includes(text(guest?.side)) ? text(guest.side) : 'ambos';
  form.elements.relation.value = guest ? text(guest.relation) : '';
  form.elements.restriction.value = guest ? text(guest.restriction || 'Ninguna') : 'Ninguna';
  form.elements.notes.value = guest ? text(guest.notes) : '';
  form.elements.invitationSent.checked = Boolean(guest?.invitationSent);

  root.querySelector('[data-guests-dialog-title]').textContent = guest ? 'Editar invitado' : 'Nuevo invitado';
  const deleteButton = root.querySelector('[data-guests-delete]');
  deleteButton.hidden = !guest;
  deleteButton.dataset.guestId = guest ? String(guest.id ?? '') : '';
  dialog.showModal();
  if (!window.matchMedia('(max-width:760px)').matches) form.elements.name.focus();
}

function closeEditor() {
  getRoot()?.querySelector('[data-guests-dialog]')?.close();
}

async function persistMutation(previous, message) {
  const root = getRoot();
  const state = root?.querySelector('[data-guests-state]');
  saving = true;
  if (state) state.textContent = 'Guardando en Firebase…';
  render();

  try {
    await saveInvitadosSnapshot(activeContext, snapshot.canonical);
    if (state) state.textContent = message;
    emitDataChange('invitados');
  } catch (error) {
    snapshot = previous;
    render();
    const restoredState = getRoot()?.querySelector('[data-guests-state]');
    if (restoredState) restoredState.textContent = error?.message || 'No se pudo guardar en Firebase.';
    throw error;
  } finally {
    saving = false;
  }
}

async function handleGuestSubmit(event) {
  event.preventDefault();
  if (!canEdit() || saving) return;

  const form = event.target;
  const data = new FormData(form);
  const name = text(data.get('name'));
  if (!name) return;

  const previous = deepClone(snapshot);
  const guestId = text(data.get('guestId'));
  const patch = {
    name,
    status: text(data.get('status')) || 'pending',
    side: text(data.get('side')) || 'ambos',
    relation: text(data.get('relation')),
    restriction: text(data.get('restriction')) || 'Ninguna',
    notes: text(data.get('notes')),
    invitationSent: form.elements.invitationSent.checked
  };

  if (guestId) {
    const index = snapshot.canonical.guests.findIndex((guest) => String(guest?.id) === guestId);
    if (index < 0) return;
    snapshot.canonical.guests[index] = { ...snapshot.canonical.guests[index], ...patch };
  } else {
    snapshot.canonical.guests.push({
      id: newGuestId(),
      ...patch,
      tableId: '',
      seatId: '',
      seatNumber: null,
      photoId: '',
      photoThumb: '',
      rsvpResponseId: '',
      rsvpResponseName: '',
      rsvpGroup: '',
      rsvpFamilyLabel: '',
      rsvpTags: []
    });
  }

  closeEditor();
  render();
  await persistMutation(previous, guestId ? 'Invitado actualizado' : 'Invitado agregado');
}

async function deleteGuest(guestId) {
  if (!canEdit() || saving) return;
  const guest = findGuest(guestId);
  if (!guest) return;

  if (text(guest.rsvpResponseId)) {
    window.alert('Este invitado está vinculado a una respuesta RSVP. La vinculación debe resolverse antes de eliminarlo para no dejar relaciones incompletas.');
    return;
  }

  const table = tableName(guest, snapshot.canonical.tables);
  const detail = table ? ` Está asignado a ${table}; su asiento quedará libre.` : '';
  if (!window.confirm(`¿Eliminar a “${text(guest.name) || 'este invitado'}”? Esta acción elimina a la persona de la lista.${detail}`)) return;

  const previous = deepClone(snapshot);
  snapshot.canonical.guests = snapshot.canonical.guests.filter((item) => String(item?.id) !== String(guestId));
  closeEditor();
  render();
  await persistMutation(previous, 'Invitado eliminado');
}

function bind(root) {
  if (root.dataset.guestsBound === 'true') return;
  root.dataset.guestsBound = 'true';

  root.addEventListener('click', async (event) => {
    const viewButton = event.target.closest('[data-guests-view]');
    if (viewButton) {
      activeView = viewButton.dataset.guestsView || 'list';
      render();
      return;
    }

    const filterButton = event.target.closest('[data-guests-filter]');
    if (filterButton) {
      filter = filterButton.dataset.guestsFilter || 'all';
      render();
      return;
    }

    if (event.target.closest('[data-guests-add]')) {
      openEditor();
      return;
    }

    if (event.target.closest('[data-guests-close]')) {
      closeEditor();
      return;
    }

    const editButton = event.target.closest('[data-guest-edit]');
    if (editButton) {
      const card = editButton.closest('[data-guest-id]');
      const guest = findGuest(card?.dataset.guestId);
      if (guest) openEditor(guest);
      return;
    }

    const deleteButton = event.target.closest('[data-guests-delete]');
    if (deleteButton) {
      await deleteGuest(deleteButton.dataset.guestId);
      return;
    }

    if (await ensureTablesController().handleClick(event)) return;
    await ensureRsvpController().handleClick(event);
  });

  root.addEventListener('input', (event) => {
    if (ensureTablesController().handleInput(event)) return;
    if (!event.target.matches('[data-guests-search]')) return;
    search = event.target.value;
    render();
    const input = root.querySelector('[data-guests-search]');
    input?.focus();
    input?.setSelectionRange(search.length, search.length);
  });

  root.addEventListener('change', async (event) => {
    await ensureTablesController().handleChange(event);
  });

  root.addEventListener('dragstart', (event) => {
    ensureTablesController().handleDragStart(event);
  });

  root.addEventListener('dragover', (event) => {
    ensureTablesController().handleDragOver(event);
  });

  root.addEventListener('drop', async (event) => {
    await ensureTablesController().handleDrop(event);
  });

  root.addEventListener('dragend', () => {
    ensureTablesController().handleDragEnd();
  });

  root.addEventListener('submit', async (event) => {
    if (event.target.matches('[data-guests-form]')) {
      await handleGuestSubmit(event);
      return;
    }
    if (await ensureTablesController().handleSubmit(event)) return;
    await ensureRsvpController().handleSubmit(event);
  });
}

async function mountInvitados(context) {
  const root = getRoot();
  if (!root || !context?.id) return;
  const epoch = ++mountEpoch;
  activeContext = context;
  root.innerHTML = '<div class="guests-loading">Cargando Invitados desde Firebase…</div>';

  try {
    const [template, loaded] = await Promise.all([
      fetch(new URL('./index.html?v=6', import.meta.url)).then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar la interfaz de Invitados.');
        return response.text();
      }),
      loadInvitadosSnapshot(context)
    ]);
    if (epoch !== mountEpoch || activeContext?.id !== context.id) return;

    root.innerHTML = template;
    snapshot = loaded;
    filter = 'all';
    search = '';
    activeView = 'list';
    saving = false;

    const rsvp = ensureRsvpController();
    const tables = ensureTablesController();
    rsvp.beginContext();
    tables.beginContext();
    bind(root);
    render();

    const state = root.querySelector('[data-guests-state]');
    if (state) {
      const sharedCount = loaded.shared.guests.length;
      state.textContent = sharedCount && sharedCount !== loaded.canonical.guests.length
        ? `Datos de la boda activa · representación compartida: ${sharedCount}`
        : 'Datos de la boda activa';
    }

    void rsvp.load(context);
  } catch (error) {
    if (epoch !== mountEpoch) return;
    root.innerHTML = `<div class="guests-error"><strong>No se pudo cargar Invitados</strong><span>${esc(error?.message || 'Revisa la conexión con Firebase.')}</span></div>`;
  }
}

export { mountInvitados };