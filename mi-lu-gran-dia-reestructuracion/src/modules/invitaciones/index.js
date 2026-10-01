import {
  subscribePersonalInvitations,
  addPersonalInvitation,
  deletePersonalInvitation
} from '../../services/personal-invitations.js';

const DEVICES = Object.freeze([
  { id: 'compact', label: 'Compacto', width: 360, height: 800 },
  { id: 'standard', label: 'Estándar', width: 390, height: 844 },
  { id: 'large', label: 'Grande', width: 430, height: 932 }
]);

let activeInvitationsCleanup = null;

function stopFrame(frame) {
  if (!frame) return;
  try {
    const doc = frame.contentDocument;
    doc?.querySelectorAll('audio,video').forEach((media) => {
      media.pause?.();
      media.muted = true;
    });
  } catch (_) {}
  try { frame.src = 'about:blank'; } catch (_) {}
}

function invitationButton(item, active) {
  return `<button class="invitations-option${active ? ' is-active' : ''}" type="button" data-invitation-id="${item.id}">
    <span class="invitations-number">↗</span>
    <span><strong>${item.name}</strong><small>Enlace guardado</small>${item.principal ? '<b>Principal</b>' : ''}</span>
  </button>`;
}

function deviceButton(device, active) {
  return `<button class="${active ? 'is-active' : ''}" type="button" data-invitation-device="${device.id}">${device.label} · ${device.width}×${device.height}</button>`;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function mountInvitaciones() {
  const root = document.querySelector('[data-module-view="invitaciones"]');
  if (!root) return false;

  activeInvitationsCleanup?.();
  const controller = new AbortController();
  const { signal } = controller;

  const response = await fetch('src/modules/invitaciones/index.html?v=3', { cache: 'no-store' });
  if (!response.ok) throw new Error('No se pudo cargar la vista de Invitaciones.');
  root.innerHTML = await response.text();

  const list = root.querySelector('[data-invitations-list]');
  const devices = root.querySelector('[data-invitations-devices]');
  const frame = root.querySelector('[data-invitations-frame]');
  const phone = root.querySelector('[data-invitations-phone]');
  const loading = root.querySelector('[data-invitations-loading]');
  const current = root.querySelector('[data-invitations-current]');
  const badge = root.querySelector('[data-invitations-badge]');
  const open = root.querySelector('[data-invitations-open]');
  const copy = root.querySelector('[data-invitations-copy]');
  const total = root.querySelector('[data-invitations-total]');
  const empty = root.querySelector('[data-invitations-empty]');
  const addForm = root.querySelector('[data-invitations-add-form]');
  const addName = root.querySelector('[data-invitations-add-name]');
  const addUrl = root.querySelector('[data-invitations-add-url]');
  const addStatus = root.querySelector('[data-invitations-add-status]');
  const createButton = root.querySelector('[data-invitations-create]');

  let invitations = [];
  let selected = null;
  let selectedDevice = DEVICES[1];
  let loadEpoch = 0;

  total.textContent = '0';
  devices.innerHTML = DEVICES.map((device) => deviceButton(device, device.id === selectedDevice.id)).join('');

  function renderList() {
    total.textContent = String(invitations.length);
    empty.hidden = invitations.length > 0;
    list.innerHTML = invitations.map((item) => invitationButton(item, selected?.id === item.id)).join('');

    if (!invitations.length) {
      selected = null;
      stopFrame(frame);
      frame.hidden = true;
      loading.hidden = true;
      current.textContent = 'Sin invitaciones';
      badge.textContent = 'Agrega una invitación para comenzar';
      badge.classList.remove('is-principal');
      open.removeAttribute('href');
      copy.disabled = true;
      return;
    }

    frame.hidden = false;
    copy.disabled = false;
    if (!selected || !invitations.some((item) => item.id === selected.id)) {
      loadInvitation(invitations[0]);
    } else {
      list.querySelectorAll('[data-invitation-id]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.invitationId === selected.id);
      });
    }
  }

  function applyDevice(device) {
    selectedDevice = device;
    phone.style.setProperty('--invitation-device-width', device.width + 'px');
    phone.style.setProperty('--invitation-device-height', device.height + 'px');
    devices.querySelectorAll('[data-invitation-device]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.invitationDevice === device.id);
    });
  }

  function loadInvitation(item) {
    if (!item) return;
    selected = item;
    const epoch = ++loadEpoch;
    stopFrame(frame);
    current.textContent = item.name;
    badge.textContent = item.principal ? 'Invitación principal' : 'Invitación personal';
    badge.classList.toggle('is-principal', Boolean(item.principal));
    open.href = item.url;
    loading.textContent = `Cargando ${item.name}…`;
    loading.hidden = false;
    frame.hidden = false;
    copy.disabled = false;
    list.querySelectorAll('[data-invitation-id]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.invitationId === item.id);
    });
    frame.title = `Vista previa de ${item.name}`;
    frame.onload = () => {
      if (epoch !== loadEpoch) return;
      loading.hidden = true;
    };
    frame.src = item.url;
  }

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-invitation-id]');
    if (!button) return;
    const item = invitations.find((candidate) => candidate.id === button.dataset.invitationId);
    if (item) loadInvitation(item);
  }, { signal });

  devices.addEventListener('click', (event) => {
    const button = event.target.closest('[data-invitation-device]');
    if (!button) return;
    const device = DEVICES.find((candidate) => candidate.id === button.dataset.invitationDevice);
    if (device) applyDevice(device);
  }, { signal });

  root.querySelector('[data-invitations-reload]').addEventListener('click', () => {
    if (selected) loadInvitation(selected);
  }, { signal });

  copy.addEventListener('click', async () => {
    if (!selected) return;
    const before = copy.innerHTML;
    try {
      await navigator.clipboard.writeText(selected.url);
      copy.innerHTML = '✓ <span>Copiado</span>';
    } catch (_) {
      copy.innerHTML = '× <span>No se pudo copiar</span>';
    }
    window.setTimeout(() => { if (copy.isConnected) copy.innerHTML = before; }, 1200);
  }, { signal });

  addForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    addStatus.textContent = 'Guardando…';
    addStatus.className = 'invitations-add-status is-loading';
    try {
      await addPersonalInvitation({ name: addName.value, url: addUrl.value });
      addForm.reset();
      addStatus.textContent = '✓ Invitación agregada a tu cuenta';
      addStatus.className = 'invitations-add-status is-success';
    } catch (error) {
      addStatus.textContent = error?.message || 'No se pudo guardar la invitación.';
      addStatus.className = 'invitations-add-status is-error';
    }
  }, { signal });

  createButton.addEventListener('click', () => {
    addStatus.textContent = 'El creador de invitaciones se habilitará en su módulo correspondiente.';
    addStatus.className = 'invitations-add-status';
    addUrl.focus();
  }, { signal });

  applyDevice(selectedDevice);

  const unsubscribe = subscribePersonalInvitations((items) => {
    invitations = items;
    renderList();
  }, (error) => {
    addStatus.textContent = error?.message || 'No se pudieron cargar tus invitaciones.';
    addStatus.className = 'invitations-add-status is-error';
  });

  activeInvitationsCleanup = () => {
    controller.abort();
    unsubscribe();
    stopFrame(frame);
    activeInvitationsCleanup = null;
  };

  return true;
}

export function destroyInvitaciones() {
  activeInvitationsCleanup?.();
  activeInvitationsCleanup = null;
}
