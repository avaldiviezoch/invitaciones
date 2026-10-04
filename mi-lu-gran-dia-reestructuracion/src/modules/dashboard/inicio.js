import { weddingCapabilities } from '../../core/app/permissions.js';
import { auth } from '../../services/firebase-client.js';
import { readPlannerStorageKeys, writePlannerStorageKey } from '../../services/planner-cloud.js?v=4';
import { GUEST_STORAGE_KEY, summarizeInvitadosValue } from '../invitados/invitados-data.js?v=10';
import { CHECKLIST_STORAGE_KEY, summarizeChecklistValue } from '../checklist/index.js?v=20';
import { BUDGET_STORAGE_KEY, summarizeBudgetValue } from '../presupuesto/index.js?v=16';
import {
  listWeddingContexts,
  loadActiveWeddingContext,
  selectActiveWedding,
  updateWeddingIdentity,
  saveWeddingOnboarding,
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
const homeDashboard = $('homeDashboard');

let weddingContext = null;
let weddingDate = '';
let calendarSelectedDate = '';
let calendarCursor = new Date();
let homeSummaryEpoch = 0;
const heroVideo = $('heroVideo');
const heroSurface = document.querySelector('.app');
const MODULE_HASHES = new Set(['#checklist', '#presupuesto', '#proveedores', '#invitados', '#distribucion', '#cronograma', '#invitaciones', '#musica', '#ideas']);
let heroPlaybackTimer = 0;

function isDirectModuleRoute() {
  return MODULE_HASHES.has(location.hash);
}

function setHeroFallback(active) {
  if (!heroSurface || !window.matchMedia('(max-width: 980px)').matches) return;
  heroSurface.classList.toggle('hero-video-fallback', Boolean(active));
}

function prepareHeroVideo() {
  if (!heroVideo) return;
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.autoplay = true;
  heroVideo.loop = true;
  heroVideo.playsInline = true;
  heroVideo.setAttribute('muted', '');
  heroVideo.setAttribute('autoplay', '');
  heroVideo.setAttribute('loop', '');
  heroVideo.setAttribute('playsinline', '');
  heroVideo.preload = 'auto';
}

function tryPlayHeroVideo() {
  if (!heroVideo || document.hidden || isDirectModuleRoute()) return;
  prepareHeroVideo();
  clearTimeout(heroPlaybackTimer);
  heroPlaybackTimer = window.setTimeout(() => {
    if (heroVideo.paused) setHeroFallback(true);
  }, 2200);
  const playPromise = heroVideo.play();
  if (playPromise?.catch) playPromise.catch(() => setHeroFallback(true));
}

function syncEntrySurface() {
  const directModule = isDirectModuleRoute();
  document.documentElement.classList.toggle('module-route', directModule);
  if (directModule) {
    heroVideo?.pause();
    return;
  }
  tryPlayHeroVideo();
}

heroVideo?.addEventListener('playing', () => {
  clearTimeout(heroPlaybackTimer);
  setHeroFallback(false);
});
heroVideo?.addEventListener('error', () => setHeroFallback(true));
heroVideo?.addEventListener('loadeddata', tryPlayHeroVideo);
heroVideo?.addEventListener('canplay', tryPlayHeroVideo);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) heroVideo?.pause();
  else tryPlayHeroVideo();
});
window.addEventListener('pageshow', tryPlayHeroVideo);

const discoverOverlay = $('discoverOverlay');
const discoverSlides = [...document.querySelectorAll('[data-discover-slide]')];
const discoverDots = $('discoverDots');
const discoverNextButton = $('discoverNextButton');
const discoverBackButton = $('discoverBackButton');
const discoverSkipButton = $('discoverSkipButton');
const discoverMenuButton = $('discoverMenuButton');
const discoverGoogleButton = $('discoverGoogleButton');
const discoverEmailButton = $('discoverEmailButton');
const discoverDateField = $('discoverDateField');
const discoverGuestExactField = $('discoverGuestExactField');
const discoverGuestExactInput = $('discoverGuestExactInput');
const discoverDateInput = $('discoverDateInput');
const discoverBudgetInput = $('discoverBudgetInput');
const discoverSummary = $('discoverSummary');
let discoverIndex = 0;
let discoverSeenThisSession = false;
const discoverAnswers = { role:'', stage:'', priorities:new Set(), guests:'', guestCount:0, dateStatus:'', date:'', budgetStatus:'', budget:'' };

function onboardingBudgetNumber(value) {
  const normalized = String(value || '').replace(/[^0-9.,]/g, '').replaceAll(',', '');
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

async function applyOnboardingToWedding(context) {
  if (!context?.id) return context;
  let nextContext = context;
  if (discoverAnswers.dateStatus === 'si' && /^\d{4}-\d{2}-\d{2}$/.test(discoverAnswers.date)) {
    nextContext = await updateWeddingIdentity(nextContext, { date: discoverAnswers.date });
  }

  const guestCount = Number.isInteger(discoverAnswers.guestCount) && discoverAnswers.guestCount > 0 ? discoverAnswers.guestCount : 0;
  const totalBudget = discoverAnswers.budgetStatus === 'definido' ? onboardingBudgetNumber(discoverAnswers.budget) : 0;
  if (guestCount || totalBudget) {
    const values = await readPlannerStorageKeys(nextContext, [BUDGET_STORAGE_KEY]);
    const current = values[BUDGET_STORAGE_KEY] && typeof values[BUDGET_STORAGE_KEY] === 'object' ? values[BUDGET_STORAGE_KEY] : {};
    const currentSettings = current.settings && typeof current.settings === 'object' ? current.settings : {};
    await writePlannerStorageKey(nextContext, BUDGET_STORAGE_KEY, {
      ...current,
      settings: {
        ...currentSettings,
        ...(totalBudget ? { totalBudget } : {}),
        ...(guestCount ? { guestCount } : {}),
        currency: ['PEN','USD','EUR'].includes(currentSettings.currency) ? currentSettings.currency : 'PEN'
      }
    });
  }
  await saveWeddingOnboarding(nextContext, {
    role: discoverAnswers.role,
    stage: discoverAnswers.stage,
    priorities: [...discoverAnswers.priorities]
  });
  return nextContext;
}

async function finishOnboardingForNewUser(user) {
  const weddings = await listWeddingContexts(user);
  if (weddings.length) {
    const context = await loadActiveWeddingContext(user);
    applyWeddingContext(context);
    return context;
  }
  const context = await createWedding({
    name: user.displayName ? `Boda de ${String(user.displayName).split(/\s+/)[0]}` : 'Mi boda',
    date: discoverAnswers.dateStatus === 'si' ? discoverAnswers.date : ''
  });
  const configured = await applyOnboardingToWedding(context);
  applyWeddingContext(configured);
  return configured;
}

function discoverAnswerLabel(name, value) {
  const labels = {
    role:{novia:'Novia',novio:'Novio',pareja:'Somos la pareja',organiza:'Ayudo a organizar'},
    stage:{inicio:'Recién empezamos',algunas:'Ya tenemos algunas cosas',avanzado:'Vamos avanzados',final:'Últimos detalles'},
    guests:{'menos-50':'Menos de 50','50-100':'50 – 100','100-150':'100 – 150','mas-150':'Más de 150','no-se':'Por definir'}
  };
  return labels[name]?.[value] || value;
}

function renderDiscoverSummary() {
  if (!discoverSummary) return;
  const items = [];
  if (discoverAnswers.role) items.push(['Tu papel', discoverAnswerLabel('role', discoverAnswers.role)]);
  if (discoverAnswers.stage) items.push(['Etapa', discoverAnswerLabel('stage', discoverAnswers.stage)]);
  if (discoverAnswers.guests) items.push(['Invitados', discoverAnswers.guestCount ? `${discoverAnswers.guestCount} aprox.` : discoverAnswerLabel('guests', discoverAnswers.guests)]);
  if (discoverAnswers.priorities.size) items.push(['Primero', [...discoverAnswers.priorities].slice(0,3).join(' · ')]);
  discoverSummary.innerHTML = items.map(([label,value]) => `<span><small>${label}</small><strong>${value}</strong></span>`).join('');
}

function renderDiscover() {
  discoverSlides.forEach((slide, index) => slide.classList.toggle('is-active', index === discoverIndex));
  [...(discoverDots?.children || [])].forEach((dot, index) => dot.classList.toggle('is-active', index === discoverIndex));
  const slide = discoverSlides[discoverIndex];
  const kind = slide?.dataset.discoverKind;
  if (discoverBackButton) discoverBackButton.hidden = discoverIndex === 0;
  if (discoverNextButton) {
    discoverNextButton.hidden = kind === 'finish';
    discoverNextButton.textContent = discoverIndex === 0 ? 'Descubrir Migrandia' : (kind === 'intro' ? 'Continuar' : 'Siguiente');
  }
  if (kind === 'finish') renderDiscoverSummary();
}

function openDiscover() {
  if (!discoverOverlay || discoverSeenThisSession) return;
  discoverSeenThisSession = true;
  discoverIndex = 0;
  discoverOverlay.hidden = false;
  renderDiscover();
}

function closeDiscover() {
  if (discoverOverlay) discoverOverlay.hidden = true;
}

function moveDiscover(delta) {
  discoverIndex = Math.max(0, Math.min(discoverSlides.length - 1, discoverIndex + delta));
  renderDiscover();
}

if (discoverDots) {
  discoverSlides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Ir a la pantalla ${index + 1}`);
    dot.addEventListener('click', () => {
      discoverIndex = index;
      renderDiscover();
    });
    discoverDots.append(dot);
  });
}

document.querySelectorAll('[data-answer]').forEach((button) => {
  button.addEventListener('click', () => {
    const name = button.dataset.answer;
    const value = button.dataset.value;
    if (name === 'priorities') {
      discoverAnswers.priorities.clear();
      discoverAnswers.priorities.add(value);
      document.querySelectorAll('[data-answer="priorities"]').forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle('is-selected', selected);
        candidate.setAttribute('aria-pressed', String(selected));
      });
      window.setTimeout(() => moveDiscover(1), 170);
      return;
    }
    if (name === 'guests') {
      discoverAnswers.guests = value;
      discoverAnswers.guestCount = 0;
      document.querySelectorAll('[data-answer="guests"]').forEach((candidate) => candidate.classList.toggle('is-selected', candidate === button));
      if (discoverGuestExactField) discoverGuestExactField.hidden = value === 'no-se';
      if (value === 'no-se') {
        if (discoverGuestExactInput) discoverGuestExactInput.value = '';
        window.setTimeout(() => moveDiscover(1), 170);
      } else {
        window.setTimeout(() => discoverGuestExactInput?.focus(), 0);
      }
      return;
    }
    if (name === 'dateStatus') {
      discoverAnswers.dateStatus = value;
      if (discoverDateField) discoverDateField.hidden = value !== 'si';
    } else if (name === 'budgetStatus') {
      discoverAnswers.budgetStatus = value;
      if (discoverBudgetInput) discoverBudgetInput.value = '';
      discoverAnswers.budget = '';
    } else {
      discoverAnswers[name] = value;
    }
    document.querySelectorAll(`[data-answer="${name}"]`).forEach((candidate) => candidate.classList.toggle('is-selected', candidate === button));
    if (name !== 'dateStatus' || value === 'no') window.setTimeout(() => moveDiscover(1), 170);
  });
});

discoverGuestExactInput?.addEventListener('input', () => {
  const value = Math.max(0, Math.min(9999, Math.floor(Number(discoverGuestExactInput.value) || 0)));
  discoverAnswers.guestCount = value;
});
discoverGuestExactInput?.addEventListener('change', () => {
  if (discoverAnswers.guestCount > 0) window.setTimeout(() => moveDiscover(1), 170);
});
discoverDateInput?.addEventListener('change', () => {
  discoverAnswers.date = discoverDateInput.value;
  if (discoverAnswers.date) window.setTimeout(() => moveDiscover(1), 170);
});
discoverBudgetInput?.addEventListener('input', () => {
  discoverAnswers.budget = discoverBudgetInput.value.trim();
  discoverAnswers.budgetStatus = discoverAnswers.budget ? 'definido' : '';
  document.querySelectorAll('[data-answer="budgetStatus"]').forEach((candidate) => candidate.classList.remove('is-selected'));
});
discoverNextButton?.addEventListener('click', () => moveDiscover(1));
discoverBackButton?.addEventListener('click', () => moveDiscover(-1));
discoverSkipButton?.addEventListener('click', () => { closeDiscover(); setAuth(true); });
discoverMenuButton?.addEventListener('click', () => { closeDiscover(); setAuth(true); });
discoverGoogleButton?.addEventListener('click', () => { closeDiscover(); $('googleLoginButton')?.click(); });
discoverEmailButton?.addEventListener('click', () => { closeDiscover(); setAuth(true); window.setTimeout(() => email?.focus(), 0); });

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menu.setAttribute('aria-expanded', String(open));
  homeDashboard?.setAttribute('aria-hidden', String(!open));
  if (open && weddingContext) void refreshHomeDashboard(weddingContext);
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

function formatHomeMoney(value, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function setHomeRing(selector, percent) {
  const ring = homeDashboard?.querySelector(selector);
  if (ring) ring.style.setProperty('--p', String(Math.max(0, Math.min(100, Number(percent) || 0))));
}

function homePriority(summary) {
  const guests = summary?.guests || {};
  const checklist = summary?.checklist || {};
  const budget = summary?.budget || {};
  const total = Number(guests.total) || 0;
  const confirmed = Number(guests.confirmed) || 0;
  const pendingGuests = Number(guests.pending) || 0;
  const unseatedGuests = Math.max(0, total - (Number(guests.seated) || 0));
  const pendingTasks = Number(checklist.pending) || 0;
  const progressTasks = Number(checklist.progress) || 0;
  const overdueTasks = Number(checklist.overdue) || 0;
  if (overdueTasks > 0) return { module:'checklist', target:'overdue', title: overdueTasks + (overdueTasks === 1 ? ' tarea está atrasada' : ' tareas están atrasadas'), detail:'Empieza por los pendientes que ya superaron su fecha prevista.' };
  if (unseatedGuests > 0) return { module:'invitados', target:'unseated', title: unseatedGuests + (unseatedGuests === 1 ? ' invitado aún no tiene mesa' : ' invitados aún no tienen mesa'), detail:'Revisa las personas que todavía faltan por ubicar en una mesa.' };
  if (pendingGuests > 0) return { module:'invitados', target:'pending-rsvp', title: pendingGuests + (pendingGuests === 1 ? ' invitado está pendiente de confirmar' : ' invitados están pendientes de confirmar'), detail:'Revisa las confirmaciones pendientes antes de cerrar la distribución.' };
  if (progressTasks > 0) return { module:'checklist', target:'progress', title: progressTasks + (progressTasks === 1 ? ' tarea sigue en proceso' : ' tareas siguen en proceso'), detail:'Continúa lo que ya empezaste antes de abrir nuevos pendientes.' };
  if (pendingTasks > 0) return { module:'checklist', target:'pending', title: pendingTasks + (pendingTasks === 1 ? ' tarea queda pendiente' : ' tareas quedan pendientes'), detail:'Revisa el Checklist y elige el siguiente pendiente de la boda.' };
  if ((Number(budget.budget) || 0) > 0 && (Number(budget.balance) || 0) > 0) return { module:'presupuesto', target:'overview', title: formatHomeMoney(budget.balance, budget.currency) + ' disponibles en presupuesto', detail:'Consulta lo presupuestado y los pagos registrados antes de la siguiente decisión.' };
  if (!total && !Number(checklist.total) && !(Number(budget.budget) || 0)) return { module:'', title:'Empieza a darle forma a tu boda', detail:'Agrega tus primeros invitados, tareas o presupuesto para ver aquí qué sigue.' };
  return { module:'', title:'Tus principales pendientes están al día', detail:'Puedes continuar desde el módulo que quieras organizar ahora.' };
}

function renderHomeLoadError() {
  if (!homeDashboard) return;
  homeDashboard.querySelector('[data-home-focus-title]').textContent = 'No pudimos actualizar el resumen';
  homeDashboard.querySelector('[data-home-focus-detail]').textContent = 'Tus datos siguen guardados. Vuelve a Inicio para intentar cargarlos otra vez.';
  const focusAction = homeDashboard.querySelector('[data-home-focus-action]');
  if (focusAction) {
    focusAction.hidden = true;
    focusAction.dataset.module = '';
    focusAction.dataset.target = '';
  }
}

function renderHomeSummary(summary, context) {
  if (!homeDashboard) return;
  const guests = summary?.guests || {};
  const checklist = summary?.checklist || {};
  const budget = summary?.budget || {};
  const focus = homePriority(summary);
  homeDashboard.querySelector('[data-home-focus-title]').textContent = focus.title;
  homeDashboard.querySelector('[data-home-focus-detail]').textContent = focus.detail;
  const focusAction = homeDashboard.querySelector('[data-home-focus-action]');
  focusAction.hidden = !focus.module;
  focusAction.dataset.module = focus.module;
  focusAction.dataset.target = focus.target || '';

  homeDashboard.querySelector('[data-home-guests-ratio]').textContent = `${guests.confirmed ?? 0} / ${guests.total ?? 0}`;
  homeDashboard.querySelector('[data-home-guests-percent]').textContent = `${guests.confirmedPercent ?? 0}%`;
  homeDashboard.querySelector('[data-home-guests-confirmed]').textContent = String(guests.confirmed ?? 0);
  homeDashboard.querySelector('[data-home-guests-pending]').textContent = String(guests.pending ?? 0);
  setHomeRing('[data-home-guests-ring]', guests.confirmedPercent);

  homeDashboard.querySelector('[data-home-checklist-ratio]').textContent = `${checklist.completed ?? 0} / ${checklist.total ?? 0}`;
  homeDashboard.querySelector('[data-home-checklist-percent]').textContent = `${checklist.percent ?? 0}%`;
  homeDashboard.querySelector('[data-home-checklist-completed]').textContent = String(checklist.completed ?? 0);
  homeDashboard.querySelector('[data-home-checklist-pending]').textContent = String((checklist.pending ?? 0) + (checklist.progress ?? 0));
  setHomeRing('[data-home-checklist-ring]', checklist.percent);

  homeDashboard.querySelector('[data-home-budget-percent]').textContent = `${budget.percent ?? 0}%`;
  homeDashboard.querySelector('[data-home-budget-paid]').textContent = formatHomeMoney(budget.paid, budget.currency);
  homeDashboard.querySelector('[data-home-budget-total]').textContent = formatHomeMoney(budget.budget, budget.currency);
  homeDashboard.querySelector('[data-home-budget-balance]').textContent = formatHomeMoney(budget.balance, budget.currency);
  const budgetProgress = homeDashboard.querySelector('[data-home-budget-progress]');
  if (budgetProgress) budgetProgress.style.width = `${budget.percent ?? 0}%`;
  setHomeRing('[data-home-budget-ring]', budget.percent);

  homeDashboard.querySelector('[data-home-tables-ratio]').textContent = `${guests.seated ?? 0} / ${guests.total ?? 0} ubicadas`;
  homeDashboard.querySelector('[data-home-tables-seated]').textContent = String(guests.seated ?? 0);
  homeDashboard.querySelector('[data-home-tables-confirmed]').textContent = `${guests.confirmedSeated ?? 0} confirmados ubicados`;

  const tableGrid = homeDashboard.querySelector('[data-home-tables-grid]');
  const tableNote = homeDashboard.querySelector('[data-home-tables-note]');
  const tables = Array.isArray(guests.tables) ? guests.tables : [];
  if (tableGrid) {
    tableGrid.innerHTML = tables.map((table) => {
      const shape = ['round', 'square', 'rectangular'].includes(table.shape) ? table.shape : 'round';
      const confirmed = Number(table.confirmed) || 0;
      const capacity = Number(table.capacity) || 0;
      return `<article class="home-mini-table is-${shape}" aria-label="${escapeHtml(table.name)}: ${confirmed} confirmados de ${capacity}">
        <div class="home-mini-table-top">
          <strong>${escapeHtml(table.name)}</strong>
          <b>${confirmed}/${capacity}</b>
          <small>confirmados</small>
        </div>
      </article>`;
    }).join('');
  }
  if (tableNote) {
    tableNote.hidden = tables.length > 0;
    tableNote.textContent = 'Aún no hay mesas creadas';
  }
}

async function refreshHomeDashboard(context = weddingContext) {
  if (!homeDashboard || !context?.id || !auth.currentUser) return;
  const epoch = ++homeSummaryEpoch;
  const weddingId = context.id;
  homeDashboard.setAttribute('aria-busy', 'true');
  try {
    const values = await readPlannerStorageKeys(context, [
      GUEST_STORAGE_KEY,
      CHECKLIST_STORAGE_KEY,
      BUDGET_STORAGE_KEY
    ]);
    if (epoch !== homeSummaryEpoch || weddingContext?.id !== weddingId) return;
    renderHomeSummary({
      guests: summarizeInvitadosValue(values[GUEST_STORAGE_KEY]),
      checklist: summarizeChecklistValue(values[CHECKLIST_STORAGE_KEY]),
      budget: summarizeBudgetValue(values[BUDGET_STORAGE_KEY])
    }, context);
  } catch (error) {
    if (epoch === homeSummaryEpoch) {
      console.error('No se pudo cargar el resumen de la portada:', error);
      renderHomeLoadError();
    }
  } finally {
    if (epoch === homeSummaryEpoch) homeDashboard.setAttribute('aria-busy', 'false');
  }
}

homeDashboard?.querySelector('[data-home-focus-action]')?.addEventListener('click', (event) => {
  const module = event.currentTarget.dataset.module;
  if (!module || !MODULE_HASHES.has(`#${module}`)) return;
  void openModule(module, { focusTarget: event.currentTarget.dataset.target || '' });
});

function applyWeddingContext(context) {
  weddingContext = context;
  const name = context?.name || 'Mi boda';
  const capabilities = weddingCapabilities(context?.role);

  $('activeWeddingName').textContent = name;
  $('mainWeddingTitle').textContent = name;
  $('appNavWeddingName').textContent = name;
  const mobileWeddingName = $('appMobileWeddingName');
  if (mobileWeddingName) mobileWeddingName.textContent = context?.name ? `La boda de ${name}` : 'Mi boda';
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
  homeSummaryEpoch += 1;
  if (context?.id && auth.currentUser) void refreshHomeDashboard(context);
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
    const credential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    const weddings = await listWeddingContexts(credential.user);
    if (!weddings.length && discoverSeenThisSession) await finishOnboardingForNewUser(credential.user);
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
      status.textContent = 'Preparando tu boda…';
      try {
        const weddings = await listWeddingContexts(result.user);
        if (!weddings.length && discoverSeenThisSession) {
          await finishOnboardingForNewUser(result.user);
        }
        setAuth(false);
        setMenu(true);
      } catch (setupError) {
        status.textContent = setupError?.message || 'Ingresaste correctamente, pero no se pudo terminar la configuración.';
      }
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
    openDiscover();
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
    if (ACTIVE_MODULES.has(activeModule)) void openModule(activeModule);
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
const mobileShellMedia = window.matchMedia('(max-width: 980px)');

function setMobileShellMenu(open) {
  const next = Boolean(open) && mobileShellMedia.matches;
  moduleWorkspace.classList.toggle('is-mobile-menu-open', next);
  appMobileMenu?.setAttribute('aria-expanded', String(next));
  appMobileMenu?.setAttribute('aria-label', next ? 'Cerrar navegación' : 'Abrir navegación');
  appModuleNav?.setAttribute('aria-hidden', mobileShellMedia.matches ? String(!next) : 'false');
  appMobileNavBackdrop?.setAttribute('aria-hidden', String(!next));
  if (!next) {
    appNavAccountWrap.classList.remove('is-open');
    $('appNavAccountButton').setAttribute('aria-expanded', 'false');
  }
}

appMobileMenu?.addEventListener('click', () => {
  setMobileShellMenu(!moduleWorkspace.classList.contains('is-mobile-menu-open'));
});
appMobileNavBackdrop?.addEventListener('click', () => setMobileShellMenu(false));
mobileShellMedia.addEventListener?.('change', () => setMobileShellMenu(false));
setMobileShellMenu(false);

const moduleLoader = $('moduleLoader');
let moduleLoadEpoch = 0;
let moduleCacheWeddingId = '';
const mountedModules = new Set();
const mountedModuleExports = new Map();
const pendingModuleMounts = new Map();

const MODULES = Object.freeze({
  checklist: {
    load: () => import('../checklist/index.js?v=20'),
    mount: 'mountChecklist'
  },
  presupuesto: {
    load: () => import('../presupuesto/index.js?v=15'),
    mount: 'mountPresupuesto'
  },
  proveedores: {
    load: () => import('../proveedores/index.js?v=8'),
    mount: 'mountProveedores'
  },
  invitados: {
    load: () => import('../invitados/index.js?v=48-20261002'),
    mount: 'mountInvitados'
  },
  distribucion: {
    load: () => import('../distribucion/index.js?v=137'),
    mount: 'mountDistribucion'
  },
  cronograma: {
    load: () => import('../cronograma/index.js?v=7'),
    mount: 'mountCronograma'
  },
  invitaciones: {
    load: () => import('../invitaciones/index.js?v=4'),
    mount: 'mountInvitaciones',
    destroy: 'destroyInvitaciones'
  },
  musica: {
    load: () => import('../musica/index.js?v=15'),
    mount: 'mountMusica'
  },
  ideas: {
    load: () => import('../ideas/index.js?v=16'),
    mount: 'mountIdeas',
    destroy: 'destroyIdeas'
  }
});

const ACTIVE_MODULES = new Set(Object.keys(MODULES));

function resetModuleCache(weddingId = '') {
  moduleLoadEpoch += 1;
  for (const [moduleId, module] of mountedModuleExports) {
    try {
      const destroy = MODULES[moduleId]?.destroy;
      if (destroy && typeof module[destroy] === 'function') module[destroy]();
    } catch (error) {
      console.error(`No se pudo desmontar ${moduleId}:`, error);
    }
  }
  mountedModuleExports.clear();
  mountedModules.clear();
  pendingModuleMounts.clear();
  moduleCacheWeddingId = weddingId;
  setModuleLoading(false);
}

function ensureModuleCacheWedding(weddingId) {
  if (moduleCacheWeddingId === weddingId) return;
  resetModuleCache(weddingId);
}

function setModuleLoading(loading) {
  if (!moduleLoader) return;
  document.body.classList.toggle('is-module-loading', Boolean(loading));
  moduleLoader.classList.remove('is-leaving');
  moduleLoader.hidden = !loading;
}

async function mountModuleOnce(moduleId, context) {
  if (mountedModules.has(moduleId)) return;

  const pending = pendingModuleMounts.get(moduleId);
  if (pending) {
    await pending;
    return;
  }

  const definition = MODULES[moduleId];
  if (!definition) return;
  const weddingId = context.id;

  const mountPromise = (async () => {
    const module = await definition.load();
    const mount = module[definition.mount];
    if (typeof mount !== 'function') throw new Error(`El módulo ${moduleId} no expone ${definition.mount}.`);
    const mounted = await mount(context);
    if (mounted === false) return false;
    if (moduleCacheWeddingId !== weddingId) {
      const destroy = definition.destroy;
      if (destroy && typeof module[destroy] === 'function') module[destroy]();
      return false;
    }
    mountedModules.add(moduleId);
    mountedModuleExports.set(moduleId, module);
    return true;
  })();

  pendingModuleMounts.set(moduleId, mountPromise);
  try {
    return await mountPromise;
  } finally {
    if (pendingModuleMounts.get(moduleId) === mountPromise) pendingModuleMounts.delete(moduleId);
  }
}

function moduleFromHash() {
  const moduleId = location.hash.replace(/^#/, '');
  return ACTIVE_MODULES.has(moduleId) ? moduleId : '';
}

async function applyHomeFocusTarget(moduleId, target = '') {
  if (!target) return;
  if (moduleId === 'checklist') {
    const checklistModule = await MODULES.checklist.load();
    checklistModule.focusChecklist?.(target);
    return;
  }
  if (moduleId !== 'invitados') return;
  const root = document.querySelector('[data-module-view="invitados"]');
  if (!root) return;
  if (target === 'pending-rsvp') {
    root.querySelector('[data-guests-view="rsvp"]')?.click();
    return;
  }
  if (target === 'unseated') {
    root.querySelector('[data-guests-view="list"]')?.click();
    root.querySelector('[data-guests-filter="unseated"]')?.click();
  }
}

function openModuleFromHash() {
  if (!auth.currentUser || !weddingContext) return;
  const moduleId = moduleFromHash();
  if (moduleId) void openModule(moduleId, { updateHash: false });
}

async function openModule(moduleId, { updateHash = true, focusTarget = '' } = {}) {
  if (!auth.currentUser || !weddingContext || !ACTIVE_MODULES.has(moduleId)) return;

  ensureModuleCacheWedding(weddingContext.id);
  const loadEpoch = ++moduleLoadEpoch;
  const alreadyMounted = mountedModules.has(moduleId);

  document.documentElement.classList.add('module-route');
  heroVideo?.pause();
  setMenu(false);
  document.body.classList.add('module-open');
  moduleWorkspace.setAttribute('aria-hidden', 'false');

  document.querySelectorAll('[data-module-view]').forEach((view) => {
    view.hidden = view.dataset.moduleView !== moduleId;
  });
  document.querySelectorAll('[data-app-module]').forEach((button) => {
    const active = button.dataset.appModule === moduleId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });

  if (updateHash && location.hash !== '#' + moduleId) {
    history.replaceState(null, '', '#' + moduleId);
  }

  if (alreadyMounted) {
    setModuleLoading(false);
    await applyHomeFocusTarget(moduleId, focusTarget);
    return;
  }

  setModuleLoading(true);
  try {
    const mounted = await mountModuleOnce(moduleId, weddingContext);
    if (mounted !== false) await applyHomeFocusTarget(moduleId, focusTarget);
  } catch (error) {
    console.error(`No se pudo montar ${moduleId}:`, error);
    const view = document.querySelector(`[data-module-view="${moduleId}"]`);
    if (view) {
      view.innerHTML = '<div class="module-loading" role="alert">No se pudo cargar este módulo. Vuelve a tocarlo para reintentar.</div>';
    }
  } finally {
    if (loadEpoch === moduleLoadEpoch) setModuleLoading(false);
  }
}

function warmModuleCode() {
  const schedule = window.requestIdleCallback
    ? (callback) => window.requestIdleCallback(callback, { timeout: 2500 })
    : (callback) => window.setTimeout(callback, 1200);

  schedule(async () => {
    for (const definition of Object.values(MODULES)) {
      try {
        await definition.load();
      } catch (_) {
        // La precarga es opcional; la navegación hará un nuevo intento al abrir el módulo.
      }
    }
  });
}

warmModuleCode();

function closeModuleWorkspace() {
  setMobileShellMenu(false);
  resetModuleCache('');
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
    setMobileShellMenu(false);
    void openModule(moduleId);
  });
});

document.querySelectorAll('.module-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    if (ACTIVE_MODULES.has(link.dataset.module)) void openModule(link.dataset.module);
  });
});

window.addEventListener('hashchange', () => {
  syncEntrySurface();
  if (!auth.currentUser) return;
  const moduleId = moduleFromHash();
  if (moduleId) void openModule(moduleId, { updateHash: false });
  else if (document.body.classList.contains('module-open')) closeModuleWorkspace();
});

window.addEventListener('migrandia:datachange', (event) => {
  const detail = event.detail || {};
  if (!weddingContext?.id || detail.weddingId !== weddingContext.id) return;
  if (!['checklist', 'presupuesto', 'invitados'].includes(detail.module)) return;
  void refreshHomeDashboard(weddingContext);
});

syncEntrySurface();
applyWeddingContext(null);
tick();
setInterval(tick, 1000);
