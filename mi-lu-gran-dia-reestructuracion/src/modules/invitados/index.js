import { weddingCapabilities } from '../../core/app/permissions.js';
import { loadRsvpAdminSnapshot, saveRsvpManagement, deleteRsvpManagement, restoreRsvpManagement } from '../../services/rsvp-admin.js?v=3';
import { loadInvitadosSnapshot, saveInvitadosSnapshot } from './invitados-data.js?v=2';

let activeContext = null;
let snapshot = null;
let rsvpSnapshot = { config: null, token: '', responses: [], management: [] };
let mountEpoch = 0;
let filter = 'all';
let search = '';
let activeView = 'list';
let saving = false;

const esc = (value) => String(value ?? '')
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'","&#039;");

function text(value) {
  return String(value ?? '').trim();
}

function cleanText(value, max = 700) {
  return text(value).slice(0, max);
}

function canEdit() {
  return weddingCapabilities(activeContext?.role).canEdit;
}

function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
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

function managementFor(responseId) {
  return rsvpSnapshot.management.find((item) => String(item.responseId || '') === String(responseId || '')) || null;
}

function attendanceLabel(value) {
  return statusLabel(text(value) || 'pending');
}

function responseDate(response) {
  const date = response?.submittedAtDate || response?.updatedAtDate || (response?.clientDate ? new Date(response.clientDate) : null);
  if (!date || Number.isNaN(date.getTime?.())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function responseTags(response) {
  const tags = [attendanceLabel(response?.attendance)];
  if (response?.menu) tags.push(`Menú: ${text(response.menu)}`);
  if (response?.restriction) tags.push(`Restricción: ${text(response.restriction)}`);
  return tags;
}

function rsvpCard(response) {
  const management = managementFor(response.id);
  const companions = Array.isArray(response.companions) ? response.companions.map(text).filter(Boolean) : [];
  const linkedCount = Array.isArray(management?.linkedGuestIds) ? management.linkedGuestIds.length : 0;
  const status = text(response.attendance) || 'pending';
  const quantity = Math.max(1, Number(response.quantity || 1));
  return `<article class="rsvp-card" data-response-id="${esc(response.id)}">
    <div class="rsvp-card-main">
      <span class="guest-avatar">${esc(initials(response.name))}</span>
      <div>
        <div class="guest-name-row"><h3>${esc(text(response.name) || 'Respuesta sin nombre')}</h3><span class="guest-status is-${esc(status)}">${esc(attendanceLabel(status))}</span></div>
        <p>${esc(responseDate(response))} · ${quantity} ${quantity === 1 ? 'persona' : 'personas'}</p>
        ${companions.length ? `<small>Acompañantes: ${esc(companions.join(', '))}</small>` : '<small>Sin acompañantes declarados</small>'}
        <div class="guest-tags">${responseTags(response).map((tag) => `<span>${esc(tag)}</span>`).join('')}</div>
      </div>
    </div>
    <div class="rsvp-card-review">
      <span>${management?.reviewed ? 'Revisada' : 'Por revisar'}</span>
      <strong>${linkedCount ? `${linkedCount} vinculado${linkedCount === 1 ? '' : 's'}` : 'Sin vínculo'}</strong>
      <button type="button" data-rsvp-review>${canEdit() ? 'Revisar' : 'Ver'}</button>
    </div>
  </article>`;
}

function renderRsvp() {
  const root = document.querySelector('[data-module-view="invitados"]');
  if (!root) return;
  const responses = rsvpSnapshot.responses || [];
  const management = rsvpSnapshot.management || [];
  const confirmed = responses.filter((item) => item.attendance === 'confirmed');
  const people = confirmed.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
  const declined = responses.filter((item) => item.attendance === 'declined').length;
  const reviewed = new Set(management.filter((item) => item.reviewed).map((item) => String(item.responseId)));
  const unreviewed = responses.filter((item) => !reviewed.has(String(item.id))).length;

  root.querySelector('[data-rsvp-tab-count]').textContent = String(responses.length);
  const mainResponses = root.querySelector('[data-guests-kpi-responses]');
  if (mainResponses) mainResponses.textContent = String(responses.length);
  root.querySelector('[data-rsvp-total]').textContent = String(responses.length);
  root.querySelector('[data-rsvp-people]').textContent = String(people);
  root.querySelector('[data-rsvp-unreviewed]').textContent = String(unreviewed);
  root.querySelector('[data-rsvp-declined]').textContent = String(declined);

  const list = root.querySelector('[data-rsvp-list]');
  if (!rsvpSnapshot.token) {
    list.innerHTML = '<div class="guests-empty"><strong>RSVP aún no está configurado</strong><span>No existe un token activo para esta boda.</span></div>';
    return;
  }
  list.innerHTML = responses.length
    ? responses.map(rsvpCard).join('')
    : '<div class="guests-empty"><strong>Aún no hay confirmaciones</strong><span>Las respuestas aparecerán aquí cuando lleguen.</span></div>';
}

function render() {
  const root = document.querySelector('[data-module-view="invitados"]');
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
  renderRsvp();
}

function findGuest(id) {
  return snapshot?.canonical?.guests.find((guest) => String(guest?.id) === String(id)) || null;
}

function findResponse(id) {
  return rsvpSnapshot.responses.find((response) => String(response?.id) === String(id)) || null;
}

function newGuestId() {
  const value = typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;
  return `guest_${value}`;
}

function openEditor(guest = null) {
  const root = document.querySelector('[data-module-view="invitados"]');
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
  document.querySelector('[data-module-view="invitados"] [data-guests-dialog]')?.close();
}

function suggestedGuestIds(response) {
  const wanted = new Set(
    [response?.name, ...(Array.isArray(response?.companions) ? response.companions : [])]
      .map(normalizeName)
      .filter(Boolean)
  );
  if (!wanted.size) return [];
  return snapshot.canonical.guests
    .filter((guest) => wanted.has(normalizeName(guest.name)))
    .map((guest) => String(guest.id));
}

function openRsvpReview(response) {
  const root = document.querySelector('[data-module-view="invitados"]');
  const dialog = root?.querySelector('[data-rsvp-dialog]');
  const form = root?.querySelector('[data-rsvp-form]');
  if (!dialog || !form || !response) return;

  const management = managementFor(response.id);
  const suggestions = suggestedGuestIds(response);
  const selected = new Set(
    Array.isArray(management?.linkedGuestIds) && management.linkedGuestIds.length
      ? management.linkedGuestIds.map(String)
      : suggestions
  );

  form.reset();
  form.elements.responseId.value = String(response.id);
  form.elements.group.value = text(management?.group);
  form.elements.side.value = text(management?.side);
  form.elements.familyLabel.value = text(management?.familyLabel);
  [...form.elements].forEach((control) => { if (control.name !== 'responseId') control.disabled = !canEdit(); });

  root.querySelector('[data-rsvp-dialog-title]').textContent = text(response.name) || 'Respuesta RSVP';
  root.querySelector('[data-rsvp-response-summary]').innerHTML = `
    <strong>${esc(attendanceLabel(response.attendance))}</strong>
    <span>${Math.max(1, Number(response.quantity || 1))} ${Number(response.quantity || 1) === 1 ? 'persona' : 'personas'} · ${esc(responseDate(response))}</span>
    ${Array.isArray(response.companions) && response.companions.length ? `<small>Acompañantes: ${esc(response.companions.map(text).filter(Boolean).join(', '))}</small>` : ''}
  `;

  const picker = root.querySelector('[data-rsvp-guest-picker]');
  picker.innerHTML = snapshot.canonical.guests.length
    ? snapshot.canonical.guests.map((guest) => {
      const id = String(guest.id ?? '');
      const suggested = suggestions.includes(id);
      return `<label class="rsvp-guest-option${suggested ? ' is-suggested' : ''}">
        <input type="checkbox" name="linkedGuestIds" value="${esc(id)}" ${selected.has(id) ? 'checked' : ''} ${canEdit() ? '' : 'disabled'}>
        <span class="guest-avatar">${esc(initials(guest.name))}</span>
        <span><strong>${esc(text(guest.name) || 'Sin nombre')}</strong><small>${suggested ? 'Coincidencia sugerida' : esc(text(guest.relation) || 'Invitado existente')}</small></span>
      </label>`;
    }).join('')
    : '<div class="guests-empty"><strong>No hay invitados disponibles</strong><span>Primero agrega las personas a la lista de invitados.</span></div>';

  root.querySelector('[data-rsvp-suggestion-label]').textContent = suggestions.length
    ? `${suggestions.length} coincidencia${suggestions.length === 1 ? '' : 's'} sugerida${suggestions.length === 1 ? '' : 's'}`
    : 'Sin coincidencias automáticas';

  const declaredNames = [response?.name, ...(Array.isArray(response?.companions) ? response.companions : [])]
    .map(text)
    .filter(Boolean);
  const guestNames = new Set(snapshot.canonical.guests.map((guest) => normalizeName(guest.name)));
  const matchedNames = declaredNames.filter((name) => guestNames.has(normalizeName(name)));
  const missingNames = declaredNames.filter((name) => !guestNames.has(normalizeName(name)));
  const companionState = root.querySelector('[data-rsvp-companion-status]');
  companionState.innerHTML = [
    matchedNames.length ? `<span class="is-ok">${matchedNames.length} nombre${matchedNames.length === 1 ? '' : 's'} encontrado${matchedNames.length === 1 ? '' : 's'} en Invitados</span>` : '',
    missingNames.length ? `<span class="is-pending">No encontrados: ${esc(missingNames.join(', '))}</span>` : ''
  ].filter(Boolean).join('');

  root.querySelector('[data-rsvp-apply]').hidden = !canEdit();
  const unlinkButton = root.querySelector('[data-rsvp-unlink]');
  unlinkButton.hidden = !canEdit() || !management || !Array.isArray(management.linkedGuestIds) || !management.linkedGuestIds.length;
  unlinkButton.dataset.responseId = String(response.id);
  dialog.showModal();
}

function closeRsvpReview() {
  document.querySelector('[data-module-view="invitados"] [data-rsvp-dialog]')?.close();
}

async function persistMutation(previous, message) {
  const root = document.querySelector('[data-module-view="invitados"]');
  const state = root?.querySelector('[data-guests-state]');
  saving = true;
  if (state) state.textContent = 'Guardando en Firebase…';
  render();

  try {
    await saveInvitadosSnapshot(activeContext, snapshot.canonical);
    if (state) state.textContent = message;
    window.dispatchEvent(new CustomEvent('migrandia:datachange', {
      detail: {
        source: 'invitados',
        module: 'invitados',
        weddingId: activeContext.id,
        guests: snapshot.canonical.guests.length
      }
    }));
  } catch (error) {
    snapshot = previous;
    render();
    const restoredState = root?.querySelector('[data-guests-state]');
    if (restoredState) restoredState.textContent = error?.message || 'No se pudo guardar en Firebase.';
    throw error;
  } finally {
    saving = false;
  }
}

async function handleSubmit(event) {
  if (!event.target.matches('[data-guests-form]')) return;
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

function guestStatusFromAttendance(attendance) {
  if (attendance === 'confirmed') return 'confirmed';
  if (attendance === 'declined') return 'declined';
  return 'pending';
}

function managementTags(response, meta) {
  const tags = [attendanceLabel(response?.attendance)];
  const groupLabels = { familia:'Familia', amigos:'Amigos', trabajo:'Trabajo', otros:'Otros' };
  const sideLabels = { novio:'Del novio', novia:'De la novia', ambos:'De ambos' };
  if (meta.group && groupLabels[meta.group]) tags.push(groupLabels[meta.group]);
  if (meta.side && sideLabels[meta.side]) tags.push(sideLabels[meta.side]);
  if (meta.familyLabel) tags.push(meta.familyLabel);
  return [...new Set(tags.filter(Boolean))];
}

function applyResponseLocally(response, meta, previousManagement) {
  const selected = new Set(meta.linkedGuestIds.map(String));
  const previousLinked = new Set(
    Array.isArray(previousManagement?.linkedGuestIds)
      ? previousManagement.linkedGuestIds.map(String)
      : []
  );
  const tags = managementTags(response, meta);
  const status = guestStatusFromAttendance(response.attendance);
  const timestamp = new Date().toISOString();

  snapshot.canonical.guests = snapshot.canonical.guests.map((guest) => {
    const next = { ...guest };
    const id = String(next.id ?? '');

    if (previousLinked.has(id) && !selected.has(id) && String(next.rsvpResponseId || '') === String(response.id)) {
      delete next.rsvpResponseId;
      delete next.rsvpResponseName;
      delete next.rsvpGroup;
      delete next.rsvpFamilyLabel;
      delete next.rsvpTags;
      delete next.rsvpLinkedAt;
      next.notes = String(next.notes || '')
        .split('\n')
        .filter((line) => !line.trim().startsWith('[RSVP]'))
        .join('\n')
        .trim();
    }

    if (!selected.has(id)) return next;

    next.status = status;
    if (meta.side) next.side = meta.side;
    next.rsvpResponseId = response.id;
    next.rsvpResponseName = cleanText(response.name, 120);
    next.rsvpGroup = meta.group || '';
    next.rsvpFamilyLabel = meta.familyLabel || '';
    next.rsvpTags = tags;
    next.rsvpLinkedAt = timestamp;

    if (meta.familyLabel && !text(next.relation)) next.relation = meta.familyLabel;

    const rsvpLine = `[RSVP] ${tags.join(' · ')} · respuesta de ${cleanText(response.name, 120)}`;
    const previousNotes = String(next.notes || '')
      .split('\n')
      .filter((line) => !line.trim().startsWith('[RSVP]'))
      .join('\n')
      .trim();
    next.notes = [previousNotes, rsvpLine].filter(Boolean).join('\n');
    return next;
  });
}

async function handleRsvpSubmit(event) {
  if (!event.target.matches('[data-rsvp-form]')) return;
  event.preventDefault();
  if (!canEdit() || saving) return;

  const form = event.target;
  const data = new FormData(form);
  const response = findResponse(data.get('responseId'));
  if (!response || !rsvpSnapshot.token) return;

  const linkedGuestIds = data.getAll('linkedGuestIds').map(String).filter(Boolean);
  if (!linkedGuestIds.length) {
    window.alert('Selecciona al menos un invitado existente para aplicar esta respuesta.');
    return;
  }

  const conflictingGuests = linkedGuestIds
    .map((id) => findGuest(id))
    .filter((guest) => guest && text(guest.rsvpResponseId) && String(guest.rsvpResponseId) !== String(response.id));
  if (conflictingGuests.length) {
    window.alert(`No se puede aplicar esta respuesta porque ${conflictingGuests.map((guest) => text(guest.name) || 'un invitado').join(', ')} ya está vinculado a otra respuesta RSVP. Primero revisa y desvincula esa relación.`);
    return;
  }

  const meta = {
    linkedGuestIds,
    group: text(data.get('group')),
    side: text(data.get('side')),
    familyLabel: text(data.get('familyLabel'))
  };

  const previousGuests = deepClone(snapshot);
  const previousManagement = managementFor(response.id);
  const root = document.querySelector('[data-module-view="invitados"]');
  const state = root?.querySelector('[data-rsvp-state]');
  saving = true;
  if (state) state.textContent = 'Aplicando respuesta y guardando en Firebase…';

  try {
    await saveRsvpManagement(activeContext, rsvpSnapshot.token, response.id, meta);
    applyResponseLocally(response, meta, previousManagement);
    try {
      await saveInvitadosSnapshot(activeContext, snapshot.canonical);
    } catch (guestError) {
      snapshot = previousGuests;
      await restoreRsvpManagement(activeContext, rsvpSnapshot.token, response.id, previousManagement).catch(() => {});
      throw guestError;
    }

    rsvpSnapshot.management = rsvpSnapshot.management.filter((item) => String(item.responseId || '') !== String(response.id));
    rsvpSnapshot.management.push({
      version: 1,
      token: rsvpSnapshot.token,
      responseId: response.id,
      weddingId: activeContext.id,
      ...meta,
      reviewed: true
    });

    closeRsvpReview();
    render();
    const currentState = root?.querySelector('[data-rsvp-state]');
    if (currentState) currentState.textContent = `Respuesta aplicada a ${linkedGuestIds.length} invitado${linkedGuestIds.length === 1 ? '' : 's'}.`;
    window.dispatchEvent(new CustomEvent('migrandia:datachange', {
      detail: {
        source: 'rsvp-manual-link',
        module: 'invitados',
        weddingId: activeContext.id,
        guests: snapshot.canonical.guests.length
      }
    }));
  } catch (error) {
    snapshot = previousGuests;
    render();
    const currentState = root?.querySelector('[data-rsvp-state]');
    if (currentState) currentState.textContent = error?.message || 'No se pudo aplicar la respuesta RSVP.';
  } finally {
    saving = false;
  }
}

async function unlinkRsvpResponse(responseId) {
  if (!canEdit() || saving || !rsvpSnapshot.token) return;
  const response = findResponse(responseId);
  const management = managementFor(responseId);
  if (!response || !management) return;

  const linkedGuestIds = Array.isArray(management.linkedGuestIds) ? management.linkedGuestIds.map(String) : [];
  if (!linkedGuestIds.length) return;
  if (!window.confirm(`¿Desvincular esta respuesta RSVP de ${linkedGuestIds.length} invitado${linkedGuestIds.length === 1 ? '' : 's'}? No se eliminarán personas ni mesas.`)) return;

  const previousGuests = deepClone(snapshot);
  const previousManagement = { ...management };
  const root = document.querySelector('[data-module-view="invitados"]');
  const state = root?.querySelector('[data-rsvp-state]');
  saving = true;
  if (state) state.textContent = 'Desvinculando respuesta…';

  try {
    await deleteRsvpManagement(activeContext, rsvpSnapshot.token, responseId);

    snapshot.canonical.guests = snapshot.canonical.guests.map((guest) => {
      if (String(guest.rsvpResponseId || '') !== String(responseId)) return guest;
      const next = { ...guest };
      delete next.rsvpResponseId;
      delete next.rsvpResponseName;
      delete next.rsvpGroup;
      delete next.rsvpFamilyLabel;
      delete next.rsvpTags;
      delete next.rsvpLinkedAt;
      next.notes = String(next.notes || '')
        .split('\n')
        .filter((line) => !line.trim().startsWith('[RSVP]'))
        .join('\n')
        .trim();
      return next;
    });

    try {
      await saveInvitadosSnapshot(activeContext, snapshot.canonical);
    } catch (guestError) {
      snapshot = previousGuests;
      await restoreRsvpManagement(activeContext, rsvpSnapshot.token, responseId, previousManagement).catch(() => {});
      throw guestError;
    }

    rsvpSnapshot.management = rsvpSnapshot.management.filter((item) => String(item.responseId || '') !== String(responseId));
    closeRsvpReview();
    render();
    const currentState = root?.querySelector('[data-rsvp-state]');
    if (currentState) currentState.textContent = 'Respuesta desvinculada. Los invitados y sus mesas se conservaron.';
    window.dispatchEvent(new CustomEvent('migrandia:datachange', {
      detail: {
        source: 'rsvp-unlinked',
        module: 'invitados',
        weddingId: activeContext.id,
        guests: snapshot.canonical.guests.length
      }
    }));
  } catch (error) {
    snapshot = previousGuests;
    render();
    const currentState = root?.querySelector('[data-rsvp-state]');
    if (currentState) currentState.textContent = error?.message || 'No se pudo desvincular la respuesta RSVP.';
  } finally {
    saving = false;
  }
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

async function refreshRsvp() {
  const root = document.querySelector('[data-module-view="invitados"]');
  const state = root?.querySelector('[data-rsvp-state]');
  if (state) state.textContent = 'Actualizando confirmaciones…';
  try {
    rsvpSnapshot = await loadRsvpAdminSnapshot(activeContext);
    renderRsvp();
    if (state) state.textContent = rsvpSnapshot.token ? 'Confirmaciones actualizadas.' : 'RSVP aún no está configurado.';
  } catch (error) {
    if (state) state.textContent = error?.message || 'No se pudieron cargar las confirmaciones.';
  }
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

    if (event.target.closest('[data-rsvp-close]')) {
      closeRsvpReview();
      return;
    }

    if (event.target.closest('[data-rsvp-refresh]')) {
      await refreshRsvp();
      return;
    }

    const unlinkButton = event.target.closest('[data-rsvp-unlink]');
    if (unlinkButton) {
      await unlinkRsvpResponse(unlinkButton.dataset.responseId);
      return;
    }

    const reviewButton = event.target.closest('[data-rsvp-review]');
    if (reviewButton) {
      const card = reviewButton.closest('[data-response-id]');
      const response = findResponse(card?.dataset.responseId);
      if (response) openRsvpReview(response);
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
    }
  });

  root.addEventListener('input', (event) => {
    if (!event.target.matches('[data-guests-search]')) return;
    search = event.target.value;
    render();
    const input = root.querySelector('[data-guests-search]');
    input?.focus();
    input?.setSelectionRange(search.length, search.length);
  });

  root.addEventListener('submit', async (event) => {
    if (event.target.matches('[data-guests-form]')) return handleSubmit(event);
    if (event.target.matches('[data-rsvp-form]')) return handleRsvpSubmit(event);
  });
}

async function mountInvitados(context) {
  const root = document.querySelector('[data-module-view="invitados"]');
  if (!root || !context?.id) return;
  const epoch = ++mountEpoch;
  activeContext = context;
  root.innerHTML = '<div class="guests-loading">Cargando Invitados desde Firebase…</div>';

  try {
    const [template, loaded] = await Promise.all([
      fetch(new URL('./index.html?v=4', import.meta.url)).then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar la interfaz de Invitados.');
        return response.text();
      }),
      loadInvitadosSnapshot(context)
    ]);
    if (epoch !== mountEpoch || activeContext?.id !== context.id) return;

    root.innerHTML = template;
    snapshot = loaded;
    rsvpSnapshot = { config: null, token: '', responses: [], management: [] };
    filter = 'all';
    search = '';
    activeView = 'list';
    saving = false;
    bind(root);
    render();

    const state = root.querySelector('[data-guests-state]');
    if (state) {
      const sharedCount = loaded.shared.guests.length;
      state.textContent = sharedCount && sharedCount !== loaded.canonical.guests.length
        ? `Datos de la boda activa · representación compartida: ${sharedCount}`
        : 'Datos de la boda activa';
    }
    await refreshRsvp();
  } catch (error) {
    if (epoch !== mountEpoch) return;
    root.innerHTML = `<div class="guests-error"><strong>No se pudo cargar Invitados</strong><span>${esc(error?.message || 'Revisa la conexión con Firebase.')}</span></div>`;
  }
}

export { mountInvitados };