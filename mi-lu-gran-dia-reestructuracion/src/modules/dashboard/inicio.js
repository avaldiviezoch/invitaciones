import { weddingCapabilities } from '../../core/app/permissions.js';
import { auth } from '../../services/firebase-client.js';
import {
  listWeddingContexts,
  loadActiveWeddingContext,
  selectActiveWedding,
  updateWeddingIdentity
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

let weddingContext = null;
let weddingDate = '';
let calendarSelectedDate = '';
let calendarCursor = new Date();

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

async function openWeddingSwitcher() {
  if (!auth.currentUser) return;
  weddingsList.innerHTML = '<div class="wedding-list-empty">Cargando…</div>';
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
  if (location.hash === '#checklist') openModule('checklist');
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
document.querySelectorAll('[data-close-weddings]').forEach((button) => {
  button.onclick = () => setWeddingSwitcher(false);
});
weddingsList.onclick = async (event) => {
  const button = event.target.closest('[data-wedding-id]');
  if (!button || button.dataset.weddingId === weddingContext?.id) return;
  try {
    const context = await selectActiveWedding(button.dataset.weddingId);
    applyWeddingContext(context);
    setWeddingSwitcher(false);
  } catch (error) {
    console.error('No se pudo cambiar de boda:', error);
  }
};

$('shareWeddingButton').onclick = () => {
  if (!weddingContext || !weddingCapabilities(weddingContext.role).canManageTeam) return;
  window.dispatchEvent(new CustomEvent('migrandia:share-wedding-request', {
    detail: { ...weddingContext }
  }));
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

function openModule(moduleId) {
  if (moduleId !== 'checklist') return;
  setMenu(false);
  document.body.classList.add('module-open');
  moduleWorkspace.setAttribute('aria-hidden', 'false');
  document.querySelectorAll('[data-app-module]').forEach((button) => {
    const active = button.dataset.appModule === moduleId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
  history.replaceState(null, '', '#checklist');
}

function closeModuleWorkspace() {
  document.body.classList.remove('module-open');
  moduleWorkspace.setAttribute('aria-hidden', 'true');
  history.replaceState(null, '', location.pathname + location.search);
}

$('appNavHome').onclick = closeModuleWorkspace;

document.querySelectorAll('[data-app-module]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.appModule === 'checklist') openModule('checklist');
  });
});

document.querySelectorAll('.module-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    if (link.dataset.module === 'checklist') openModule('checklist');
  });
});

if (location.hash === '#checklist' && auth.currentUser) openModule('checklist');

applyWeddingContext(null);
tick();
setInterval(tick, 1000);
