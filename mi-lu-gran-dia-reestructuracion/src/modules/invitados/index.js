import { loadInvitadosSnapshot } from './invitados-data.js?v=1';

let activeContext = null;
let snapshot = null;
let mountEpoch = 0;
let filter = 'all';
let search = '';

const esc = (value) => String(value ?? '')
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'","&#039;");

function text(value) {
  return String(value ?? '').trim();
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

  return `<article class="guest-card">
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
  </article>`;
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

  const needle = search.trim().toLocaleLowerCase('es');
  const rows = guests.filter((guest) => matchesFilter(guest) && (!needle || guestSearchText(guest, tables).includes(needle)));
  root.querySelector('[data-guests-results]').textContent = `${rows.length} ${rows.length === 1 ? 'invitado' : 'invitados'}`;
  root.querySelector('[data-guests-list]').innerHTML = rows.length
    ? rows.map((guest) => guestCard(guest, tables)).join('')
    : '<div class="guests-empty"><strong>No hay invitados para mostrar</strong><span>Cambia el filtro o la búsqueda.</span></div>';

  root.querySelectorAll('[data-guests-filter]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.guestsFilter === filter);
  });
}

function bind(root) {
  if (root.dataset.guestsBound === 'true') return;
  root.dataset.guestsBound = 'true';

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-guests-filter]');
    if (!button) return;
    filter = button.dataset.guestsFilter || 'all';
    render();
  });

  root.addEventListener('input', (event) => {
    if (!event.target.matches('[data-guests-search]')) return;
    search = event.target.value;
    render();
    const input = root.querySelector('[data-guests-search]');
    input?.focus();
    input?.setSelectionRange(search.length, search.length);
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
      fetch(new URL('./index.html?v=1', import.meta.url)).then((response) => {
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
    bind(root);
    render();

    const state = root.querySelector('[data-guests-state]');
    if (state) {
      const sharedCount = loaded.shared.guests.length;
      state.textContent = sharedCount && sharedCount !== loaded.canonical.guests.length
        ? `Datos de la boda activa · solo lectura · representación compartida: ${sharedCount}`
        : 'Datos de la boda activa · solo lectura';
    }
  } catch (error) {
    if (epoch !== mountEpoch) return;
    root.innerHTML = `<div class="guests-error"><strong>No se pudo cargar Invitados</strong><span>${esc(error?.message || 'Revisa la conexión con Firebase.')}</span></div>`;
  }
}

export { mountInvitados };