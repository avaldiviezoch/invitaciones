import { weddingCapabilities } from '../../core/app/permissions.js';
import { auth } from '../../services/firebase-client.js';
import {
  listWeddingContexts,
  loadActiveWeddingContext,
  selectActiveWedding,
  updateWeddingIdentity,
  listWeddingMembers,
  listWeddingInvitations,
  inviteWeddingMember,
  updateWeddingMemberRole,
  removeWeddingMember,
  cancelWeddingInvitation,
  createWedding,
  listPendingInvitations,
  acceptWeddingInvitation
} from '../../services/wedding-context.js';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const $ = (id) => document.getElementById(id);
const menu = $('menuButton');
const backdrop = $('backdrop');
const overlay = $('authOverlay');
const status = $('authStatus');
const email = $('authEmail');
const password = $('authPassword');
const dateEditor = $('dateEditor');
const calendarGrid = $('calendarGrid');
const calendarMonthLabel = $('calendarMonthLabel');
const calendarSelectedLabel = $('calendarSelectedLabel');
const titleEditor = $('weddingTitleEditor');
const titleInput = $('weddingTitleInput');
const weddingSwitcher = $('weddingSwitcher');
const weddingsList = $('weddingsList');
const accessManager = $('accessManager');
const accessMembers = $('accessMembers');
const accessPending = $('accessPending');
const accessStatus = $('accessStatus');
const receivedInvitesList = $('receivedInvitesList');

let weddingContext = null;
let weddingDate = '';
let calendarSelectedDate = '';
let calendarCursor = new Date();
const heroVideo = $('heroVideo');

function syncEntrySurface() {
  const directModule = ['#checklist', '#presupuesto', '#proveedores', '#invitados', '#distribucion'].includes(location.hash);
  document.documentElement.classList.toggle('module-route', directModule);
  if (directModule) {
    heroVideo?.pause();
    heroVideo?.removeAttribute('autoplay');
    return;
  }
  if (heroVideo && auth.currentUser) {
    heroVideo.preload = 'auto';
    heroVideo.play().catch(() => {});
  }
}

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menu.setAttribute('aria-expanded', String(open));
}

function setAuth(open, message = '') {
  overlay.classList.toggle('show', open);
  status.textContent = message;
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

function applyWeddingContext(context) {
  weddingContext = context;
  const name = context?.name || 'Mi boda';
  const capabilities = weddingCapabilities(context?.role);

  $('activeWeddingName').textContent = name;
  $('mainWeddingTitle').textContent = name;
  $('appNavWeddingName').textContent = name;
  $('appMobileWeddingName').textContent = context?.name
    ? (/^la boda de\b/i.test(name) ? name : `La boda de ${name}`)
    : 'Mi boda';
  $('appNavRole').textContent = capabilities.label || 'Mi acceso';
  $('appNavPopoverWedding').textContent = name;
  $('shareWeddingButton').hidden = !capabilities.canManageTeam;
  $('editMainWeddingTitleButton').hidden = !capabilities.canEditWeddingIdentity;
  $('editWeddingDateButton').hidden = !context || !capabilities.canEditWeddingIdentity;

  weddingDate = context?.date || '';
  $('weddingDateLabel').textContent = formatDate(weddingDate);
  calendarSelectedDate = weddingDate;
  document.body.dataset.weddingRole = capabilities.role;
  tick();
}

async function hydrateWedding(user) {
  try {
    const context = await loadActiveWeddingContext(user);
    applyWeddingContext(context);
  } catch (error) {
    console.error('No se pudo cargar la boda activa:', error);
    applyWeddingContext(null);
  }
}

function roleLabel(role) {
  return ({ owner: 'Propietario', admin: 'Administrador', editor: 'Editor', provider: 'Proveedor', viewer: 'Solo lectura' })[role] || '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setWeddingSwitcher(open) {
  weddingSwitcher.classList.toggle('show', open);
  weddingSwitcher.setAttribute('aria-hidden', String(!open));
}


async function renderReceivedInvitations() {
  try {
    const invitations = await listPendingInvitations();
    $('receivedInvitesCount').textContent = String(invitations.length);
    receivedInvitesList.innerHTML = invitations.length ? invitations.map((invite) => `<article class="wedding-option wedding-invite-option"><span><strong>${escapeHtml(invite.weddingName || 'Boda compartida')}</strong><small>Te invitaron como ${escapeHtml(roleLabel(invite.role))}</small></span><button type="button" data-accept-invite="${escapeHtml(invite.id)}">Aceptar</button></article>`).join('') : '<div class="wedding-empty">No tienes invitaciones pendientes.</div>';
  } catch (error) {
    receivedInvitesList.innerHTML = '<div class="wedding-empty">No se pudieron cargar tus invitaciones.</div>';
  }
}

function setWeddingView(view) {
  document.querySelectorAll('[data-wedding-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.weddingView === view));
  document.querySelectorAll('[data-wedding-pane]').forEach((pane) => { pane.hidden = pane.dataset.weddingPane !== view; });
  $('createWeddingForm').hidden = true;
}

async function openWeddingSwitcher() {
  if (!auth.currentUser) return;
  weddingsList.innerHTML = '<div class="wedding-list-empty">Cargando…</div>';
  setWeddingView('mine');
  await renderReceivedInvitations();
  setWeddingSwitcher(true);
  try {
    const weddings = await listWeddingContexts(auth.currentUser);
    weddingsList.innerHTML = weddings.length ? weddings.map((item) => `
      <button type="button" class="wedding-list-item ${item.id === weddingContext?.id ? 'is-current' : ''}" data-wedding-id="${item.id}">
        <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(roleLabel(item.role))}${item.date ? ` · ${escapeHtml(formatDate(item.date))}` : ''}</small></span>
        <b>${item.id === weddingContext?.id ? 'Actual' : 'Abrir'}</b>
      </button>`).join('') : '<div class="wedding-list-empty">No hay otras bodas disponibles.</div>';
  } catch (error) {
    console.error('No se pudieron listar las bodas:', error);
    weddingsList.innerHTML = '<div class="wedding-list-empty">No se pudieron cargar tus bodas.</div>';
  }
}


function setAccessManager(open) {
  accessManager.classList.toggle('show', open);
  accessManager.setAttribute('aria-hidden', String(!open));
  if (!open) accessStatus.textContent = '';
}

function roleOptions(selected, canAssignAdmin) {
  return [
    ['admin', 'Administrador'], ['editor', 'Editor'], ['provider', 'Proveedor'], ['viewer', 'Solo lectura']
  ].filter(([value]) => value !== 'admin' || canAssignAdmin || selected === 'admin')
   .map(([value, label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`).join('');
}

async function renderAccessManager() {
  if (!weddingContext) return;
  const capabilities = weddingCapabilities(weddingContext.role);
  $('accessManagerWedding').textContent = weddingContext.name;
  $('accessInviteRole').querySelector('option[value="admin"]').hidden = !capabilities.canAssignAdmin;
  if (!capabilities.canAssignAdmin && $('accessInviteRole').value === 'admin') $('accessInviteRole').value = 'editor';
  accessMembers.innerHTML = '<div class="access-empty">Cargando personas…</div>';
  accessPending.innerHTML = '<div class="access-empty">Cargando invitaciones…</div>';
  setAccessManager(true);
  try {
    const [members, invitations] = await Promise.all([
      listWeddingMembers(weddingContext),
      listWeddingInvitations(weddingContext)
    ]);
    $('accessMembersCount').textContent = String(members.length);
    $('accessPendingCount').textContent = String(invitations.length);
    accessMembers.innerHTML = members.length ? members.map((member) => {
      const isOwner = member.role === 'owner';
      const isSelf = member.uid === auth.currentUser?.uid;
      const lockedAdmin = weddingContext.role === 'admin' && member.role === 'admin';
      const canEdit = !isOwner && !isSelf && !lockedAdmin;
      const name = escapeHtml(member.displayName || member.email || 'Usuario');
      const emailText = escapeHtml(member.email || '');
      return `<article class="access-person" data-member-uid="${escapeHtml(member.uid)}"><span class="access-person-avatar">${escapeHtml((member.displayName || member.email || '?').trim().charAt(0).toUpperCase())}</span><span class="access-person-copy"><strong>${name}</strong><small>${emailText}</small></span>${canEdit ? `<select class="access-role" aria-label="Rol de ${name}">${roleOptions(member.role, capabilities.canAssignAdmin)}</select><button class="access-remove" type="button">Retirar</button>` : `<span class="access-role-label">${escapeHtml(roleLabel(member.role))}${isSelf ? ' · Tú' : ''}</span>`}</article>`;
    }).join('') : '<div class="access-empty">Todavía no hay personas con acceso.</div>';
    accessPending.innerHTML = invitations.length ? invitations.map((invite) => `<article class="access-person access-pending" data-invite-id="${escapeHtml(invite.id)}"><span class="access-person-avatar">✉</span><span class="access-person-copy"><strong>${escapeHtml(invite.email)}</strong><small>Invitación pendiente · ${escapeHtml(roleLabel(invite.role))}</small></span><button class="access-cancel" type="button">Cancelar</button></article>`).join('') : '<div class="access-empty">No hay invitaciones pendientes.</div>';
  } catch (error) {
    console.error('No se pudieron cargar los accesos:', error);
    accessMembers.innerHTML = '<div class="access-empty">No se pudieron cargar los accesos.</div>';
    accessPending.innerHTML = '';
    accessStatus.textContent = error?.message || 'No se pudieron cargar los accesos.';
  }
}

async function openAccessManager() {
  if (!weddingContext || !weddingCapabilities(weddingContext.role).canManageTeam) return;
  await renderAccessManager();
}

function errorText(error) {
  return String(error?.code || '').includes('invalid-credential')
    ? 'Correo o contraseña incorrectos.'
    : 'No se pudo iniciar sesión.';
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function calendarDateLabel(value) {
  if (!value) return 'Elige un día';
  const [year, month, day] = value.split('-');
  return `${day} de ${MONTHS[Number(month) - 1].toLowerCase()} de ${year}`;
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  calendarMonthLabel.textContent = `${MONTHS[month]} ${year}`;
  calendarSelectedLabel.textContent = calendarDateLabel(calendarSelectedDate);
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push('<span class="calendar-blank"></span>');
  for (let day = 1; day <= daysInMonth; day += 1) {
    const value = isoDate(year, month, day);
    const classes = ['calendar-day'];
    if (value === todayIso) classes.push('is-today');
    if (value === calendarSelectedDate) classes.push('is-selected');
    cells.push(`<button type="button" class="${classes.join(' ')}" data-calendar-date="${value}" aria-pressed="${value === calendarSelectedDate}">${day}</button>`);
  }
  calendarGrid.innerHTML = cells.join('');
}

function openDateCalendar() {
  if (!weddingContext) return;
  calendarSelectedDate = weddingDate;
  const base = weddingDate ? new Date(`${weddingDate}T00:00:00`) : new Date();
  calendarCursor = new Date(base.getFullYear(), base.getMonth(), 1);
  renderCalendar();
  dateEditor.classList.add('show');
  dateEditor.setAttribute('aria-hidden', 'false');
}

function closeDateCalendar() {
  dateEditor.classList.remove('show');
  dateEditor.setAttribute('aria-hidden', 'true');
}

function tick() {
  if (!weddingDate) {
    $('days').textContent = '---';
    $('hours').textContent = '--';
    $('minutes').textContent = '--';
    $('seconds').textContent = '--';
    return;
  }

  const difference = Math.max(0, new Date(`${weddingDate}T00:00:00`) - Date.now());
  $('days').textContent = String(Math.floor(difference / 86400000)).padStart(3, '0');
  $('hours').textContent = String(Math.floor((difference % 86400000) / 3600000)).padStart(2, '0');
  $('minutes').textContent = String(Math.floor((difference % 3600000) / 60000)).padStart(2, '0');
  $('seconds').textContent = String(Math.floor((difference % 60000) / 1000)).padStart(2, '0');
}

menu.onclick = () => auth.currentUser
  ? setMenu(!document.body.classList.contains('menu-open'))
  : setAuth(true);

backdrop.onclick = () => setMenu(false);
$('authCloseButton').onclick = () => setAuth(false);

$('emailLoginButton').onclick = async () => {
  status.textContent = 'Ingresando…';
  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    setAuth(false);
    setMenu(true);
  } catch (error) {
    status.textContent = errorText(error);
  }
};

$('googleLoginButton').onclick = async () => {
  status.textContent = 'Elige la cuenta de Google que deseas usar…';
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    if (result?.user) {
      setAuth(false);
      setMenu(true);
    }
  } catch (error) {
    const code = String(error?.code || '');
    status.textContent = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'].includes(code)
      ? 'Ventana de Google cerrada. Puedes intentarlo nuevamente.'
      : errorText(error);
  }
};

$('logoutButton').onclick = async () => {
  setMenu(false);
  await signOut(auth);
};

onAuthStateChanged(auth, async (user) => {
  document.body.classList.toggle('auth-locked', !user);
  if (!user) {
    applyWeddingContext(null);
    setWeddingSwitcher(false);
    closeModuleWorkspace();
    setMenu(false);
    setAuth(true);
    return;
  }

  $('accountName').textContent = user.displayName || 'Mi Gran Día';
  $('appNavAccountName').textContent = user.displayName || 'Mi Gran Día';
  $('appNavPopoverName').textContent = user.displayName || 'Mi Gran Día';
  $('appNavPopoverEmail').textContent = user.email || '';
  $('appNavInitials').textContent = (user.displayName || 'MGD').trim().split(/\\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  $('accountEmail').textContent = user.email || '';
  const avatar = $('accountAvatar');
  if (user.photoURL) {
    avatar.src = user.photoURL;
    avatar.style.display = '';
    $('appNavAvatar').src = user.photoURL;
    $('appNavAvatar').classList.add('show');
  } else {
    avatar.style.display = 'none';
    $('appNavAvatar').removeAttribute('src');
    $('appNavAvatar').classList.remove('show');
  }

  await hydrateWedding(user);
  openModuleFromHash();
});

$('editWeddingDateButton').onclick = openDateCalendar;
$('cancelWeddingDateButton').onclick = closeDateCalendar;
$('calendarPrevButton').onclick = () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
  renderCalendar();
};
$('calendarNextButton').onclick = () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
  renderCalendar();
};
calendarGrid.onclick = (event) => {
  const day = event.target.closest('[data-calendar-date]');
  if (!day) return;
  calendarSelectedDate = day.dataset.calendarDate;
  renderCalendar();
};

$('saveWeddingDateButton').onclick = async () => {
  if (!calendarSelectedDate || !weddingContext) return;
  try {
    weddingContext = await updateWeddingIdentity(weddingContext, { date: calendarSelectedDate });
    applyWeddingContext(weddingContext);
    closeDateCalendar();
  } catch (error) {
    console.error('No se pudo guardar la fecha:', error);
    status.textContent = error?.message || 'No se pudo guardar la fecha.';
  }
};

$('editMainWeddingTitleButton').onclick = () => {
  if (!weddingContext) return;
  titleInput.value = weddingContext.name;
  titleEditor.classList.add('show');
  titleInput.focus();
};

$('cancelWeddingTitleButton').onclick = () => titleEditor.classList.remove('show');

$('saveWeddingTitleButton').onclick = async () => {
  const name = titleInput.value.trim();
  if (!name || !weddingContext) return;
  try {
    weddingContext = await updateWeddingIdentity(weddingContext, { name });
    applyWeddingContext(weddingContext);
    titleEditor.classList.remove('show');
  } catch (error) {
    console.error('No se pudo guardar el nombre:', error);
    status.textContent = error?.message || 'No se pudo guardar el nombre.';
  }
};

$('activeWeddingButton').onclick = openWeddingSwitcher;

document.querySelectorAll('[data-wedding-view]').forEach((button) => {
  button.onclick = () => setWeddingView(button.dataset.weddingView);
});
$('newWeddingButton').onclick = () => {
  $('createWeddingForm').hidden = false;
  $('createWeddingStatus').textContent = '';
  $('newWeddingName').focus();
};
$('cancelCreateWedding').onclick = () => { $('createWeddingForm').hidden = true; };
$('createWeddingForm').onsubmit = async (event) => {
  event.preventDefault();
  $('createWeddingStatus').textContent = 'Creando boda…';
  try {
    const context = await createWedding({ name: $('newWeddingName').value, date: $('newWeddingDate').value });
    applyWeddingContext(context);
    $('createWeddingForm').reset();
    $('createWeddingForm').hidden = true;
    setWeddingSwitcher(false);
  } catch (error) {
    $('createWeddingStatus').textContent = error?.message || 'No se pudo crear la boda.';
  }
};
receivedInvitesList.onclick = async (event) => {
  const button = event.target.closest('[data-accept-invite]');
  if (!button) return;
  button.disabled = true;
  button.textContent = 'Aceptando…';
  try {
    const context = await acceptWeddingInvitation(button.dataset.acceptInvite);
    applyWeddingContext(context);
    setWeddingSwitcher(false);
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Aceptar';
    receivedInvitesList.insertAdjacentHTML('afterbegin', `<div class="wedding-empty">${escapeHtml(error?.message || 'No se pudo aceptar la invitación.')}</div>`);
  }
};

document.querySelectorAll('[data-close-weddings]').forEach((button) => {
  button.onclick = () => setWeddingSwitcher(false);
});
weddingsList.onclick = async (event) => {
  const button = event.target.closest('[data-wedding-id]');
  if (!button || button.dataset.weddingId === weddingContext?.id) return;
  try {
    const activeModule = document.body.classList.contains('module-open')
      ? (location.hash.replace(/^#/, '') || 'checklist')
      : '';
    const context = await selectActiveWedding(button.dataset.weddingId);
    applyWeddingContext(context);
    setWeddingSwitcher(false);
    if (ACTIVE_MODULES.has(activeModule)) openModule(activeModule);
  } catch (error) {
    console.error('No se pudo cambiar de boda:', error);
  }
};

$('shareWeddingButton').onclick = openAccessManager;
document.querySelectorAll('[data-close-access]').forEach((button) => {
  button.onclick = () => setAccessManager(false);
});
$('accessInviteForm').onsubmit = async (event) => {
  event.preventDefault();
  accessStatus.textContent = 'Enviando invitación…';
  try {
    await inviteWeddingMember(weddingContext, $('accessInviteEmail').value, $('accessInviteRole').value);
    $('accessInviteEmail').value = '';
    accessStatus.textContent = 'Invitación creada.';
    await renderAccessManager();
  } catch (error) {
    accessStatus.textContent = error?.message || 'No se pudo crear la invitación.';
  }
};
accessMembers.onchange = async (event) => {
  const select = event.target.closest('.access-role');
  if (!select) return;
  const row = select.closest('[data-member-uid]');
  accessStatus.textContent = 'Actualizando permiso…';
  try {
    await updateWeddingMemberRole(weddingContext, row.dataset.memberUid, select.value);
    accessStatus.textContent = 'Permiso actualizado.';
    await renderAccessManager();
  } catch (error) {
    accessStatus.textContent = error?.message || 'No se pudo actualizar el permiso.';
    await renderAccessManager();
  }
};
accessMembers.onclick = async (event) => {
  const button = event.target.closest('.access-remove');
  if (!button) return;
  const row = button.closest('[data-member-uid]');
  accessStatus.textContent = 'Retirando acceso…';
  try {
    await removeWeddingMember(weddingContext, row.dataset.memberUid);
    accessStatus.textContent = 'Acceso retirado.';
    await renderAccessManager();
  } catch (error) {
    accessStatus.textContent = error?.message || 'No se pudo retirar el acceso.';
  }
};
accessPending.onclick = async (event) => {
  const button = event.target.closest('.access-cancel');
  if (!button) return;
  const row = button.closest('[data-invite-id]');
  accessStatus.textContent = 'Cancelando invitación…';
  try {
    await cancelWeddingInvitation(weddingContext, row.dataset.inviteId);
    accessStatus.textContent = 'Invitación cancelada.';
    await renderAccessManager();
  } catch (error) {
    accessStatus.textContent = error?.message || 'No se pudo cancelar la invitación.';
  }
};

document.querySelectorAll('.module-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const module = button.closest('.module');
    const open = !module.classList.contains('open');
    document.querySelectorAll('.module').forEach((item) => {
      item.classList.remove('open');
      item.querySelector('.module-toggle')?.setAttribute('aria-expanded', 'false');
    });
    if (open) {
      module.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
    }
  });
});

const appNavAccountWrap = $('appNavAccountWrap');
$('appNavAccountButton').onclick = () => {
  const open = !appNavAccountWrap.classList.contains('is-open');
  appNavAccountWrap.classList.toggle('is-open', open);
  $('appNavAccountButton').setAttribute('aria-expanded', String(open));
};
$('appNavWeddingButton').onclick = () => {
  appNavAccountWrap.classList.remove('is-open');
  $('appNavAccountButton').setAttribute('aria-expanded', 'false');
  openWeddingSwitcher();
};
$('appNavLogout').onclick = async () => {
  appNavAccountWrap.classList.remove('is-open');
  await signOut(auth);
};
document.addEventListener('click', (event) => {
  if (!appNavAccountWrap.classList.contains('is-open') || appNavAccountWrap.contains(event.target)) return;
  appNavAccountWrap.classList.remove('is-open');
  $('appNavAccountButton').setAttribute('aria-expanded', 'false');
});

const moduleWorkspace = $('moduleWorkspace');
const appModuleNav = $('appModuleNav');
const appMobileMenu = $('appMobileMenu');
const appMobileNavBackdrop = $('appMobileNavBackdrop');
const mobileModuleNavMedia = window.matchMedia('(max-width: 980px)');

function setMobileModuleMenu(open, { moveFocus = false } = {}) {
  const next = Boolean(open) && mobileModuleNavMedia.matches;
  moduleWorkspace.classList.toggle('is-mobile-menu-open', next);
  appMobileMenu?.setAttribute('aria-expanded', String(next));
  appMobileMenu?.setAttribute('aria-label', next ? 'Cerrar navegación' : 'Abrir navegación');
  appModuleNav?.setAttribute('aria-hidden', mobileModuleNavMedia.matches ? String(!next) : 'false');
  appMobileNavBackdrop?.setAttribute('aria-hidden', String(!next));
  if (!next) {
    appNavAccountWrap.classList.remove('is-open');
    $('appNavAccountButton').setAttribute('aria-expanded', 'false');
  }
  if (moveFocus) requestAnimationFrame(() => appMobileMenu?.focus({ preventScroll: true }));
}

appMobileMenu?.addEventListener('click', () => {
  setMobileModuleMenu(!moduleWorkspace.classList.contains('is-mobile-menu-open'));
});
appMobileNavBackdrop?.addEventListener('click', () => setMobileModuleMenu(false, { moveFocus: true }));
mobileModuleNavMedia.addEventListener?.('change', () => setMobileModuleMenu(false));
setMobileModuleMenu(false);

const moduleLoader = $('moduleLoader');
let moduleLoadEpoch = 0;
let mountedModuleId = '';
let mountedWeddingId = '';

function setModuleLoading(loading) {
  if (!moduleLoader) return;
  if (loading) {
    document.body.classList.add('is-module-loading');
    moduleLoader.hidden = false;
    moduleLoader.classList.remove('is-leaving');
    return;
  }
  if (moduleLoader.hidden) {
    document.body.classList.remove('is-module-loading');
    return;
  }
  moduleLoader.classList.add('is-leaving');
  window.setTimeout(() => {
    if (!moduleLoader.classList.contains('is-leaving')) return;
    moduleLoader.hidden = true;
    document.body.classList.remove('is-module-loading');
  }, 200);
}

const ACTIVE_MODULES = new Set(['checklist', 'presupuesto', 'proveedores', 'invitados', 'distribucion']);

function moduleFromHash() {
  const moduleId = location.hash.replace(/^#/, '');
  return ACTIVE_MODULES.has(moduleId) ? moduleId : '';
}

function openModuleFromHash() {
  if (!auth.currentUser || !weddingContext) return;
  const moduleId = moduleFromHash();
  if (moduleId) openModule(moduleId, { updateHash: false });
}

async function openModule(moduleId, { updateHash = true } = {}) {
  if (!auth.currentUser || !weddingContext || !ACTIVE_MODULES.has(moduleId)) return;
  const sameMountedModule = mountedModuleId === moduleId && mountedWeddingId === weddingContext.id;
  const loadEpoch = ++moduleLoadEpoch;
  if (!sameMountedModule) setModuleLoading(true);
  document.documentElement.classList.add('module-route');
  heroVideo?.pause();
  setMenu(false);
  document.body.classList.add('module-open');
  moduleWorkspace.setAttribute('aria-hidden', 'false');
  document.querySelectorAll('[data-module-view]').forEach((view) => { view.hidden = view.dataset.moduleView !== moduleId; });
  document.querySelectorAll('[data-app-module]').forEach((button) => {
    const active = button.dataset.appModule === moduleId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
  if (updateHash && location.hash !== '#' + moduleId) history.replaceState(null, '', '#' + moduleId);
  if (sameMountedModule) {
    setModuleLoading(false);
    return;
  }
  try {
    if (moduleId === 'checklist') {
      const { mountChecklist } = await import('../checklist/index.js?v=15');
      await mountChecklist(weddingContext);
    }
    if (moduleId === 'presupuesto') {
      const { mountPresupuesto } = await import('../presupuesto/index.js?v=11');
      await mountPresupuesto(weddingContext);
    }
    if (moduleId === 'proveedores') {
      const { mountProveedores } = await import('../proveedores/index.js?v=5');
      await mountProveedores(weddingContext);
    }
    if (moduleId === 'invitados') {
      const { mountInvitados } = await import('../invitados/index.js?v=27');
      await mountInvitados(weddingContext);
    }
    if (moduleId === 'distribucion') {
      const { mountDistribucion } = await import('../distribucion/index.js?v=73');
      await mountDistribucion(weddingContext);
    }
    if (loadEpoch === moduleLoadEpoch) {
      mountedModuleId = moduleId;
      mountedWeddingId = weddingContext.id;
    }
  } finally {
    if (loadEpoch === moduleLoadEpoch) setModuleLoading(false);
  }
}

function closeModuleWorkspace() {
  setMobileModuleMenu(false);
  mountedModuleId = '';
  mountedWeddingId = '';
  document.documentElement.classList.remove('module-route');
  document.body.classList.remove('module-open');
  moduleWorkspace.setAttribute('aria-hidden', 'true');
  history.replaceState(null, '', location.pathname + location.search);
  syncEntrySurface();
}

$('appNavHome').onclick = closeModuleWorkspace;

document.querySelectorAll('[data-app-module]').forEach((button) => {
  button.addEventListener('click', () => {
    const moduleId = button.dataset.appModule;
    if (!ACTIVE_MODULES.has(moduleId)) return;
    setMobileModuleMenu(false);
    openModule(moduleId);
  });
});

document.querySelectorAll('.module-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    if (ACTIVE_MODULES.has(link.dataset.module)) openModule(link.dataset.module);
  });
});

window.addEventListener('hashchange', () => {
  syncEntrySurface();
  if (!auth.currentUser) return;
  const moduleId = moduleFromHash();
  if (moduleId) openModule(moduleId, { updateHash: false });
  else if (document.body.classList.contains('module-open')) closeModuleWorkspace();
});

syncEntrySurface();
applyWeddingContext(null);
tick();
setInterval(tick, 1000);
