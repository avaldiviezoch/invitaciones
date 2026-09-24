import {
  loadRsvpAdminSnapshot,
  saveRsvpManagement,
  deleteRsvpManagement,
  restoreRsvpManagement
} from '../../services/rsvp-admin.js?v=5';
import { saveInvitadosSnapshot } from './invitados-data.js?v=3';

function createRsvpController(api) {
  let state = { config: null, token: '', responses: [], musicResponses: [], management: [] };
  let loadEpoch = 0;
  let loading = false;

  const text = (value) => String(value ?? '').trim();
  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");

  function normalizeName(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  function deepClone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function initials(name) {
    const parts = text(name).split(/\s+/).filter(Boolean);
    return parts.slice(0,2).map((part) => part.charAt(0)).join('').toUpperCase() || '?';
  }

  function statusLabel(status) {
    return ({
      confirmed: 'Confirmado',
      declined: 'No asistirá',
      tentative: 'Por confirmar',
      pending: 'Pendiente'
    })[text(status) || 'pending'] || 'Pendiente';
  }

  function managementFor(responseId) {
    return state.management.find((item) => String(item.responseId || '') === String(responseId || '')) || null;
  }

  function findResponse(responseId) {
    return state.responses.find((item) => String(item.id || '') === String(responseId || '')) || null;
  }

  function findGuest(guestId) {
    return api.getSnapshot()?.canonical?.guests.find((guest) => String(guest?.id) === String(guestId)) || null;
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
    const tags = [statusLabel(response?.attendance)];
    if (response?.menu) tags.push(`Menú: ${text(response.menu)}`);
    if (response?.restriction) tags.push(`Restricción: ${text(response.restriction)}`);
    return tags;
  }

  function responseMusic(response) {
    let value = response?.customData?.mgdMusic;
    if (!value) return { songs: [], message: '', guestName: '' };
    if (typeof value === 'string') {
      try { value = JSON.parse(value); } catch (_) { return { songs: [], message: '', guestName: '' }; }
    }
    const songs = Array.isArray(value?.songs)
      ? value.songs.map((item) => ({
        title: text(item?.title).slice(0, 140),
        artist: text(item?.artist).slice(0, 140)
      })).filter((item) => item.title || item.artist).slice(0, 10)
      : [];
    return { songs, message: text(value?.message).slice(0, 500), guestName: text(value?.guestName).slice(0, 120) };
  }

  function musicMarkup(response) {
    if (response?.attendance !== 'confirmed') return '';
    const music = responseMusic(response);
    if (!music.songs.length && !music.message) return '';
    return `<div class="rsvp-music-response">
      <div class="rsvp-music-response-head"><span aria-hidden="true">♫</span><strong>Música solicitada</strong><small>${music.songs.length} ${music.songs.length === 1 ? 'canción' : 'canciones'}</small></div>
      ${music.songs.length ? `<ol class="rsvp-music-response-list">${music.songs.map((song) => `<li><strong>${esc(song.title || 'Canción sin título')}</strong>${song.artist ? `<span>${esc(song.artist)}</span>` : ''}</li>`).join('')}</ol>` : ''}
      ${music.message ? `<p class="rsvp-music-response-message"><b>Dedicatoria:</b> ${esc(music.message)}</p>` : ''}
    </div>`;
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
          <div class="guest-name-row"><h3>${esc(text(response.name) || 'Respuesta sin nombre')}</h3><span class="guest-status is-${esc(status)}">${esc(statusLabel(status))}</span></div>
          <p>${esc(responseDate(response))} · ${quantity} ${quantity === 1 ? 'persona' : 'personas'}</p>
          ${companions.length ? `<small>Acompañantes: ${esc(companions.join(', '))}</small>` : '<small>Sin acompañantes declarados</small>'}
          <div class="guest-tags">${responseTags(response).map((tag) => `<span>${esc(tag)}</span>`).join('')}</div>
          ${musicMarkup(response)}
        </div>
      </div>
      <div class="rsvp-card-review">
        <span>${management?.reviewed ? 'Revisada' : 'Por revisar'}</span>
        <strong>${linkedCount ? `${linkedCount} vinculado${linkedCount === 1 ? '' : 's'}` : 'Sin vínculo'}</strong>
        <button type="button" data-rsvp-review>${api.canEdit() ? 'Revisar' : 'Ver'}</button>
      </div>
    </article>`;
  }

  function musicEntries() {
    const source = Array.isArray(state.musicResponses) ? state.musicResponses : [];
    return source.flatMap((response) => {
      const music = responseMusic(response);
      const person = text(music.guestName || response?.name) || 'Invitado';
      return music.songs.map((song) => ({ responseId:String(response.id||''), person, title:song.title, artist:song.artist, message:music.message }));
    });
  }

  function renderMusic(root) {
    const entries = musicEntries();
    const people = new Set(entries.map((item) => item.responseId || item.person)).size;
    const unique = new Set(entries.map((item) => `${normalizeName(item.title)}|${normalizeName(item.artist)}`)).size;
    root.querySelector('[data-music-tab-count]')?.replaceChildren(document.createTextNode(String(entries.length)));
    const total=root.querySelector('[data-music-total]'), peopleEl=root.querySelector('[data-music-people]'), uniqueEl=root.querySelector('[data-music-unique]');
    if(total) total.textContent=String(entries.length); if(peopleEl) peopleEl.textContent=String(people); if(uniqueEl) uniqueEl.textContent=String(unique);
    const list=root.querySelector('[data-music-list]'); if(!list) return;
    if(loading){list.innerHTML='<div class="guests-empty"><strong>Cargando música</strong><span>Consultando las respuestas existentes.</span></div>';return;}
    if(!state.token){list.innerHTML='<div class="guests-empty"><strong>RSVP aún no está configurado</strong><span>La música utiliza el mismo token de la boda.</span></div>';return;}
    list.innerHTML=entries.length?entries.map((item)=>`<article class="music-request-card"><span class="music-request-icon" aria-hidden="true">♫</span><div class="music-request-song"><strong>${esc(item.title||'Canción sin título')}</strong><span>${esc(item.artist||'Artista no indicado')}</span></div><div class="music-request-person"><strong>${esc(item.person)}</strong>${item.message?`<span>${esc(item.message)}</span>`:'<span>Sin dedicatoria</span>'}</div></article>`).join(''):'<div class="guests-empty"><strong>Aún no hay canciones solicitadas</strong><span>Las solicitudes enviadas desde las invitaciones aparecerán aquí.</span></div>';
  }

  function render() {
    const root = api.getRoot();
    if (!root) return;
    const responses = state.responses || [];
    renderMusic(root);
    const management = state.management || [];
    const confirmed = responses.filter((item) => item.attendance === 'confirmed');
    const people = confirmed.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
    const declined = responses.filter((item) => item.attendance === 'declined').length;
    const reviewed = new Set(management.filter((item) => item.reviewed).map((item) => String(item.responseId)));
    const unreviewed = responses.filter((item) => !reviewed.has(String(item.id))).length;

    root.querySelector('[data-rsvp-tab-count]')?.replaceChildren(document.createTextNode(String(responses.length)));
    const mainResponses = root.querySelector('[data-guests-kpi-responses]');
    if (mainResponses) mainResponses.textContent = String(responses.length);
    const total = root.querySelector('[data-rsvp-total]');
    const peopleEl = root.querySelector('[data-rsvp-people]');
    const unreviewedEl = root.querySelector('[data-rsvp-unreviewed]');
    const declinedEl = root.querySelector('[data-rsvp-declined]');
    if (total) total.textContent = String(responses.length);
    if (peopleEl) peopleEl.textContent = String(people);
    if (unreviewedEl) unreviewedEl.textContent = String(unreviewed);
    if (declinedEl) declinedEl.textContent = String(declined);

    const list = root.querySelector('[data-rsvp-list]');
    if (!list) return;
    if (loading) {
      list.innerHTML = '<div class="guests-empty"><strong>Cargando confirmaciones</strong><span>La lista de invitados ya está disponible.</span></div>';
      return;
    }
    if (!state.token) {
      list.innerHTML = '<div class="guests-empty"><strong>RSVP aún no está configurado</strong><span>No existe un token activo para esta boda.</span></div>';
      return;
    }
    list.innerHTML = responses.length
      ? responses.map(rsvpCard).join('')
      : '<div class="guests-empty"><strong>Aún no hay confirmaciones</strong><span>Las respuestas aparecerán aquí cuando lleguen.</span></div>';
  }

  function beginContext() {
    loadEpoch += 1;
    loading = true;
    state = { config: null, token: '', responses: [], musicResponses: [], management: [] };
    render();
  }

  async function load(context, { announce = false } = {}) {
    const epoch = ++loadEpoch;
    const weddingId = context?.id;
    const root = api.getRoot();
    const status = root?.querySelector('[data-rsvp-state]');
    loading = true;
    render();
    if (announce && status) status.textContent = 'Actualizando confirmaciones…';

    try {
      const loaded = await loadRsvpAdminSnapshot(context);
      if (epoch !== loadEpoch || api.getContext()?.id !== weddingId) return false;
      state = loaded;
      loading = false;
      render();
      const currentStatus = api.getRoot()?.querySelector('[data-rsvp-state]');
      if (currentStatus) currentStatus.textContent = state.token
        ? (announce ? 'Confirmaciones actualizadas.' : '')
        : 'RSVP aún no está configurado.';
      return true;
    } catch (error) {
      if (epoch !== loadEpoch || api.getContext()?.id !== weddingId) return false;
      loading = false;
      render();
      const currentStatus = api.getRoot()?.querySelector('[data-rsvp-state]');
      if (currentStatus) currentStatus.textContent = error?.message || 'No se pudieron cargar las confirmaciones.';
      return false;
    }
  }

  function suggestedGuestIds(response) {
    const snapshot = api.getSnapshot();
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

  function openReview(response) {
    const root = api.getRoot();
    const snapshot = api.getSnapshot();
    const dialog = root?.querySelector('[data-rsvp-dialog]');
    const form = root?.querySelector('[data-rsvp-form]');
    if (!dialog || !form || !response || !snapshot) return;

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
    [...form.elements].forEach((control) => {
      if (control.name !== 'responseId') control.disabled = !api.canEdit();
    });

    root.querySelector('[data-rsvp-dialog-title]').textContent = text(response.name) || 'Respuesta RSVP';
    root.querySelector('[data-rsvp-response-summary]').innerHTML = `
      <strong>${esc(statusLabel(response.attendance))}</strong>
      <span>${Math.max(1, Number(response.quantity || 1))} ${Number(response.quantity || 1) === 1 ? 'persona' : 'personas'} · ${esc(responseDate(response))}</span>
      ${Array.isArray(response.companions) && response.companions.length ? `<small>Acompañantes: ${esc(response.companions.map(text).filter(Boolean).join(', '))}</small>` : ''}
    `;

    const picker = root.querySelector('[data-rsvp-guest-picker]');
    picker.innerHTML = snapshot.canonical.guests.length
      ? snapshot.canonical.guests.map((guest) => {
        const id = String(guest.id ?? '');
        const suggested = suggestions.includes(id);
        return `<label class="rsvp-guest-option${suggested ? ' is-suggested' : ''}">
          <input type="checkbox" name="linkedGuestIds" value="${esc(id)}" ${selected.has(id) ? 'checked' : ''} ${api.canEdit() ? '' : 'disabled'}>
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
    root.querySelector('[data-rsvp-companion-status]').innerHTML = [
      matchedNames.length ? `<span class="is-ok">${matchedNames.length} nombre${matchedNames.length === 1 ? '' : 's'} encontrado${matchedNames.length === 1 ? '' : 's'} en Invitados</span>` : '',
      missingNames.length ? `<span class="is-pending">No encontrados: ${esc(missingNames.join(', '))}</span>` : ''
    ].filter(Boolean).join('');

    root.querySelector('[data-rsvp-apply]').hidden = !api.canEdit();
    const unlinkButton = root.querySelector('[data-rsvp-unlink]');
    unlinkButton.hidden = !api.canEdit() || !management || !Array.isArray(management.linkedGuestIds) || !management.linkedGuestIds.length;
    unlinkButton.dataset.responseId = String(response.id);
    dialog.showModal();
  }

  function closeReview() {
    api.getRoot()?.querySelector('[data-rsvp-dialog]')?.close();
  }

  function guestStatusFromAttendance(attendance) {
    if (attendance === 'confirmed') return 'confirmed';
    if (attendance === 'declined') return 'declined';
    return 'pending';
  }

  function managementTags(response, meta) {
    const tags = [statusLabel(response?.attendance)];
    const groupLabels = { familia:'Familia', amigos:'Amigos', trabajo:'Trabajo', otros:'Otros' };
    const sideLabels = { novio:'Del novio', novia:'De la novia', ambos:'De ambos' };
    if (meta.group && groupLabels[meta.group]) tags.push(groupLabels[meta.group]);
    if (meta.side && sideLabels[meta.side]) tags.push(sideLabels[meta.side]);
    if (meta.familyLabel) tags.push(meta.familyLabel);
    return [...new Set(tags.filter(Boolean))];
  }

  function removeRsvpMetadata(guest, responseId) {
    if (String(guest.rsvpResponseId || '') !== String(responseId)) return { ...guest };
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
  }

  function applyResponseLocally(response, meta, previousManagement) {
    const snapshot = api.getSnapshot();
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
      const id = String(guest.id ?? '');
      let next = { ...guest };

      if (previousLinked.has(id) && !selected.has(id)) {
        next = removeRsvpMetadata(next, response.id);
      }
      if (!selected.has(id)) return next;

      next.status = status;
      if (meta.side) next.side = meta.side;
      next.rsvpResponseId = response.id;
      next.rsvpResponseName = text(response.name).slice(0, 120);
      next.rsvpGroup = meta.group || '';
      next.rsvpFamilyLabel = meta.familyLabel || '';
      next.rsvpTags = tags;
      next.rsvpLinkedAt = timestamp;
      if (meta.familyLabel && !text(next.relation)) next.relation = meta.familyLabel;

      const rsvpLine = `[RSVP] ${tags.join(' · ')} · respuesta de ${text(response.name).slice(0, 120)}`;
      const previousNotes = String(next.notes || '')
        .split('\n')
        .filter((line) => !line.trim().startsWith('[RSVP]'))
        .join('\n')
        .trim();
      next.notes = [previousNotes, rsvpLine].filter(Boolean).join('\n');
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (!api.canEdit() || api.isSaving()) return true;

    const form = event.target;
    const data = new FormData(form);
    const response = findResponse(data.get('responseId'));
    if (!response || !state.token) return true;

    const linkedGuestIds = data.getAll('linkedGuestIds').map(String).filter(Boolean);
    if (!linkedGuestIds.length) {
      window.alert('Selecciona al menos un invitado existente para aplicar esta respuesta.');
      return true;
    }

    const conflictingGuests = linkedGuestIds
      .map(findGuest)
      .filter((guest) => guest && text(guest.rsvpResponseId) && String(guest.rsvpResponseId) !== String(response.id));
    if (conflictingGuests.length) {
      window.alert(`No se puede aplicar esta respuesta porque ${conflictingGuests.map((guest) => text(guest.name) || 'un invitado').join(', ')} ya está vinculado a otra respuesta RSVP. Primero revisa y desvincula esa relación.`);
      return true;
    }

    const meta = {
      linkedGuestIds,
      group: text(data.get('group')),
      side: text(data.get('side')),
      familyLabel: text(data.get('familyLabel'))
    };
    const previousSnapshot = deepClone(api.getSnapshot());
    const previousManagement = managementFor(response.id);
    const context = api.getContext();
    const root = api.getRoot();
    const status = root?.querySelector('[data-rsvp-state]');
    api.setSaving(true);
    if (status) status.textContent = 'Aplicando respuesta y guardando en Firebase…';

    try {
      await saveRsvpManagement(context, state.token, response.id, meta);
      applyResponseLocally(response, meta, previousManagement);
      try {
        await saveInvitadosSnapshot(context, api.getSnapshot().canonical);
      } catch (guestError) {
        api.setSnapshot(previousSnapshot);
        await restoreRsvpManagement(context, state.token, response.id, previousManagement).catch(() => {});
        throw guestError;
      }

      state.management = state.management.filter((item) => String(item.responseId || '') !== String(response.id));
      state.management.push({
        version: 1,
        token: state.token,
        responseId: response.id,
        weddingId: context.id,
        ...meta,
        reviewed: true
      });
      closeReview();
      api.renderMain();
      const currentStatus = api.getRoot()?.querySelector('[data-rsvp-state]');
      if (currentStatus) currentStatus.textContent = `Respuesta aplicada a ${linkedGuestIds.length} invitado${linkedGuestIds.length === 1 ? '' : 's'}.`;
      api.emitDataChange('rsvp-manual-link');
    } catch (error) {
      api.setSnapshot(previousSnapshot);
      api.renderMain();
      const currentStatus = api.getRoot()?.querySelector('[data-rsvp-state]');
      if (currentStatus) currentStatus.textContent = error?.message || 'No se pudo aplicar la respuesta RSVP.';
    } finally {
      api.setSaving(false);
    }
    return true;
  }

  async function unlink(responseId) {
    if (!api.canEdit() || api.isSaving() || !state.token) return true;
    const response = findResponse(responseId);
    const management = managementFor(responseId);
    if (!response || !management) return true;

    const linkedGuestIds = Array.isArray(management.linkedGuestIds) ? management.linkedGuestIds.map(String) : [];
    if (!linkedGuestIds.length) return true;
    if (!window.confirm(`¿Desvincular esta respuesta RSVP de ${linkedGuestIds.length} invitado${linkedGuestIds.length === 1 ? '' : 's'}? No se eliminarán personas ni mesas.`)) return true;

    const previousSnapshot = deepClone(api.getSnapshot());
    const previousManagement = { ...management };
    const context = api.getContext();
    const status = api.getRoot()?.querySelector('[data-rsvp-state]');
    api.setSaving(true);
    if (status) status.textContent = 'Desvinculando respuesta…';

    try {
      await deleteRsvpManagement(context, state.token, responseId);
      const snapshot = api.getSnapshot();
      snapshot.canonical.guests = snapshot.canonical.guests.map((guest) => removeRsvpMetadata(guest, responseId));
      try {
        await saveInvitadosSnapshot(context, snapshot.canonical);
      } catch (guestError) {
        api.setSnapshot(previousSnapshot);
        await restoreRsvpManagement(context, state.token, responseId, previousManagement).catch(() => {});
        throw guestError;
      }

      state.management = state.management.filter((item) => String(item.responseId || '') !== String(responseId));
      closeReview();
      api.renderMain();
      const currentStatus = api.getRoot()?.querySelector('[data-rsvp-state]');
      if (currentStatus) currentStatus.textContent = 'Respuesta desvinculada. Los invitados y sus mesas se conservaron.';
      api.emitDataChange('rsvp-unlinked');
    } catch (error) {
      api.setSnapshot(previousSnapshot);
      api.renderMain();
      const currentStatus = api.getRoot()?.querySelector('[data-rsvp-state]');
      if (currentStatus) currentStatus.textContent = error?.message || 'No se pudo desvincular la respuesta RSVP.';
    } finally {
      api.setSaving(false);
    }
    return true;
  }

  async function handleClick(event) {
    if (event.target.closest('[data-rsvp-close]')) {
      closeReview();
      return true;
    }
    if (event.target.closest('[data-rsvp-refresh]')) {
      await load(api.getContext(), { announce: true });
      return true;
    }
    const unlinkButton = event.target.closest('[data-rsvp-unlink]');
    if (unlinkButton) {
      await unlink(unlinkButton.dataset.responseId);
      return true;
    }
    const reviewButton = event.target.closest('[data-rsvp-review]');
    if (reviewButton) {
      const card = reviewButton.closest('[data-response-id]');
      const response = findResponse(card?.dataset.responseId);
      if (response) openReview(response);
      return true;
    }
    return false;
  }

  async function handleSubmit(event) {
    if (!event.target.matches('[data-rsvp-form]')) return false;
    return submit(event);
  }

  return Object.freeze({
    beginContext,
    load,
    render,
    handleClick,
    handleSubmit
  });
}

export { createRsvpController };