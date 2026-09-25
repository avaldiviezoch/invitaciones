const INVITATIONS = Object.freeze([
  { id: 0, name: 'Invitación 0', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_0/', principal: true },
  { id: 1, name: 'Invitación 1', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_1/' },
  { id: 2, name: 'Invitación 2', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_2/' },
  { id: 3, name: 'Invitación 3', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_3/' },
  { id: 4, name: 'Invitación 4', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_4/' },
  { id: 5, name: 'Invitación 5', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_5/' },
  { id: 6, name: 'Invitación 6', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_6/' },
  { id: 7, name: 'Invitación 7', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_7/' }
]);

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
    <span class="invitations-number">${item.id}</span>
    <span><strong>${item.name}</strong><small>Vista publicada</small>${item.principal ? '<b>Principal</b>' : ''}</span>
  </button>`;
}

function deviceButton(device, active) {
  return `<button class="${active ? 'is-active' : ''}" type="button" data-invitation-device="${device.id}">${device.label} · ${device.width}×${device.height}</button>`;
}

export async function mountInvitaciones() {
  const root = document.querySelector('[data-module-view="invitaciones"]');
  if (!root) return false;

  activeInvitationsCleanup?.();
  const controller = new AbortController();
  const { signal } = controller;

  const response = await fetch('src/modules/invitaciones/index.html?v=1', { cache: 'no-store' });
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
  let selected = INVITATIONS[0];
  let selectedDevice = DEVICES[1];
  let loadEpoch = 0;

  root.querySelector('[data-invitations-total]').textContent = String(INVITATIONS.length);
  list.innerHTML = INVITATIONS.map((item) => invitationButton(item, item.id === selected.id)).join('');
  devices.innerHTML = DEVICES.map((device) => deviceButton(device, device.id === selectedDevice.id)).join('');

  function applyDevice(device) {
    selectedDevice = device;
    phone.style.setProperty('--invitation-device-width', device.width + 'px');
    phone.style.setProperty('--invitation-device-height', device.height + 'px');
    devices.querySelectorAll('[data-invitation-device]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.invitationDevice === device.id);
    });
  }

  function loadInvitation(item) {
    selected = item;
    const epoch = ++loadEpoch;
    stopFrame(frame);
    current.textContent = item.name;
    badge.textContent = item.principal ? 'Invitación principal' : 'Modelo publicado';
    badge.classList.toggle('is-principal', Boolean(item.principal));
    open.href = item.url;
    loading.textContent = `Cargando ${item.name}…`;
    loading.hidden = false;
    list.querySelectorAll('[data-invitation-id]').forEach((button) => {
      button.classList.toggle('is-active', Number(button.dataset.invitationId) === item.id);
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
    const item = INVITATIONS.find((candidate) => candidate.id === Number(button.dataset.invitationId));
    if (item) loadInvitation(item);
  }, { signal });

  devices.addEventListener('click', (event) => {
    const button = event.target.closest('[data-invitation-device]');
    if (!button) return;
    const device = DEVICES.find((candidate) => candidate.id === button.dataset.invitationDevice);
    if (device) applyDevice(device);
  }, { signal });

  root.querySelector('[data-invitations-reload]').addEventListener('click', () => loadInvitation(selected), { signal });
  copy.addEventListener('click', async () => {
    const before = copy.innerHTML;
    try {
      await navigator.clipboard.writeText(selected.url);
      copy.innerHTML = '✓ <span>Copiado</span>';
    } catch (_) {
      copy.innerHTML = '× <span>No se pudo copiar</span>';
    }
    window.setTimeout(() => { if (copy.isConnected) copy.innerHTML = before; }, 1200);
  }, { signal });

  applyDevice(selectedDevice);
  loadInvitation(selected);

  activeInvitationsCleanup = () => {
    controller.abort();
    stopFrame(frame);
    activeInvitationsCleanup = null;
  };
  return true;
}
