import { weddingCapabilities } from '../../core/app/permissions.js';
import { auth } from '../../services/firebase-client.js';
import {
  loadActiveWeddingContext,
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
const dateInput = $('weddingDateInput');
const titleEditor = $('weddingTitleEditor');
const titleInput = $('weddingTitleInput');

let weddingContext = null;
let weddingDate = '';

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
  $('shareWeddingButton').hidden = !capabilities.canManageTeam;
  $('editMainWeddingTitleButton').hidden = !capabilities.canEditWeddingIdentity;
  $('editWeddingDateButton').hidden = !capabilities.canEditWeddingIdentity;

  weddingDate = context?.date || '';
  $('weddingDateLabel').textContent = formatDate(weddingDate);
  document.body.dataset.weddingRole = capabilities.role;
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

function errorText(error) {
  return String(error?.code || '').includes('invalid-credential')
    ? 'Correo o contraseña incorrectos.'
    : 'No se pudo iniciar sesión.';
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
  $('accountEmail').textContent = user.email || '';
  const avatar = $('accountAvatar');
  if (user.photoURL) {
    avatar.src = user.photoURL;
    avatar.style.display = '';
  } else {
    avatar.style.display = 'none';
  }

  await hydrateWedding(user);
});

$('editWeddingDateButton').onclick = () => {
  if (!weddingContext) return;
  dateInput.value = weddingDate;
  dateEditor.classList.add('show');
};

$('cancelWeddingDateButton').onclick = () => dateEditor.classList.remove('show');

$('saveWeddingDateButton').onclick = async () => {
  if (!dateInput.value || !weddingContext) return;
  try {
    weddingContext = await updateWeddingIdentity(weddingContext, { date: dateInput.value });
    applyWeddingContext(weddingContext);
    dateEditor.classList.remove('show');
    tick();
  } catch (error) {
    console.error('No se pudo guardar la fecha:', error);
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

document.querySelectorAll('.module-link').forEach((link) => {
  link.addEventListener('click', (event) => event.preventDefault());
});

applyWeddingContext(null);
tick();
setInterval(tick, 1000);
