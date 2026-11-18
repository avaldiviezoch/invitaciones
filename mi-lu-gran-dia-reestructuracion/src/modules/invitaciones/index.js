import { makeInvitationPackage } from './offline-package.js';
import { createInvitationCollaborationBridge } from './collaboration-bridge.js';
import { auth } from '../../services/firebase-client.js';
import { loadActiveWeddingContext } from '../../services/wedding-context.js';
import { renderOfflineInvitationDraft } from '../../core/app/invitation-offline-preview.js';
import { normalizeDraftInput, DRAFT_FIELDS } from '../../core/app/invitation-draft-contract.js';
import { getInvitationCopy } from '../../core/app/invitation-copy.js';
import { invitationEngineModel, hasStableInvitationEngineShape } from '../../core/app/invitation-engine.js';
import { getInvitationTemplate } from '../../core/app/invitation-templates.js';
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
  return `<button class="invitations-option${active ? ' is-active' : ''}" type="button" data-invitation-id="${escapeHtml(item.id)}">
    <span class="invitations-number">↗</span>
    <span><strong>${escapeHtml(item.name)}</strong><small>Enlace guardado</small>${item.principal ? '<b>Principal</b>' : ''}</span>
  </button>`;
}

function deviceButton(device, active) {
  return `<button class="${active ? 'is-active' : ''}" type="button" data-invitation-device="${device.id}">${device.label} · ${device.width}×${device.height}</button>`;
}

function safeHttpUrl(value = '') {
  try {
    const url = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (_) {
    return '';
  }
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

  const editor = root.querySelector('[data-invitations-editor]');
  const editorForm = root.querySelector('[data-invitations-editor-form]');
  const editorPreview = root.querySelector('[data-invitations-editor-preview]');
  const draftStatus = root.querySelector('[data-invitations-draft-status]');
  // Puente preparado sin sesiones reales ni lecturas o escrituras.
  const collaboration = createInvitationCollaborationBridge();
  let dirtyDraft = false;
  let editorChangeVersion = 0;
  let importVersion = 0;
  const updateDraftStatus = (dirty) => {
    dirtyDraft = dirty;
    draftStatus.textContent = dirty
      ? 'Cambios sin guardar en tu cuenta. Descarga el archivo JSON antes de salir.'
      : 'Borrador temporal: no se guarda en tu cuenta.';
  };
  updateDraftStatus(false);
  // Advertencia nativa solo ante pérdida de cambios del editor local.
  // El navegador decide cómo mostrar el diálogo; no guarda datos.
  const warnOnUnsavedDraft = (event) => {
    if (editor.hidden || !dirtyDraft) return;
    event.preventDefault();
    event.returnValue = '';
  };
  window.addEventListener('beforeunload', warnOnUnsavedDraft, { signal });
  const typeLabels = Object.freeze({
    wedding: 'Boda', birthday: 'Cumpleaños', quince: 'Quinceañero',
    baby_shower: 'Baby shower', religious: 'Bautizo / Comunión',
    graduation: 'Graduación', corporate: 'Evento corporativo', custom: 'Celebración'
  });
  function renderEditorPreview() {
    const values = new FormData(editorForm);
    const type = String(values.get('eventType') || 'wedding');
    const label = typeLabels[type] || 'Celebración';
    const copy = getInvitationCopy(type);
    const template = getInvitationTemplate(values.get('templateId'));
    const model = invitationEngineModel({
      event: { eventType: type, name: String(values.get('eventName') || '').trim() },
      date: String(values.get('date') || '').trim() || null,
      location: { name: String(values.get('location') || '').trim() },
      guest: { name: String(values.get('guestName') || '').trim() },
      status: 'draft'
    });
    if (!hasStableInvitationEngineShape(model)) return;
    const name = model.event.name || copy.heading;
    const date = model.date || 'Fecha por definir';
    const place = model.location.name || 'Lugar por definir';
    const guest = model.guest.name;
    const message = String(values.get('message') || '').trim() || copy.greeting;
    const fontStyle = String(values.get('fontStyle') || 'serif') === 'sans' ? 'sans' : 'serif';
    const paletteChoice = String(values.get('colorPalette') || 'auto');
    const eventPalettes = { wedding: 'ivory', birthday: 'rose', quince: 'rose', baby_shower: 'sage', religious: 'ivory', graduation: 'navy', corporate: 'navy', custom: 'sage' };
    const allowedPalettes = ['ivory', 'sage', 'rose', 'navy'];
    editorPreview.dataset.palette = allowedPalettes.includes(paletteChoice) ? paletteChoice : eventPalettes[type] || 'ivory';
    editorPreview.dataset.fontStyle = fontStyle;
    editorPreview.dataset.template = template.id;
    editorPreview.dataset.eventType = type;
    editorPreview.innerHTML = `<article class="invitations-editor-card"><p class="invitations-editor-kicker">${escapeHtml(label)}</p><h2 class="invitations-editor-title">${escapeHtml(name)}</h2><div class="invitations-editor-rule" aria-hidden="true"></div>${message ? `<p class="invitations-editor-message">${escapeHtml(message)}</p>` : ''}<p class="invitations-editor-text">${guest ? 'Para ' + escapeHtml(guest) : 'Te esperamos'}</p><p class="invitations-editor-text">${escapeHtml(copy.dateLabel)} ${escapeHtml(date)}</p><p class="invitations-editor-text">${escapeHtml(place)}</p><small class="invitations-editor-foot">${escapeHtml(template.label)} · Borrador sin publicar</small></article>`;
  }
  root.querySelectorAll('[data-editor-viewport]').forEach((button) => {
    button.addEventListener('click', () => {
      const viewport = button.dataset.editorViewport === 'desktop' ? 'desktop' : 'mobile';
      editorPreview.dataset.viewport = viewport;
      root.querySelectorAll('[data-editor-viewport]').forEach((item) => {
        item.setAttribute('aria-pressed', String(item === button));
      });
    }, { signal });
  });
  root.querySelector('[data-invitations-export-draft]').addEventListener('click', () => {
    const fields = new FormData(editorForm);
    const allowedTypes = new Set(Object.keys(typeLabels));
    const type = String(fields.get('eventType') || '');
    if (!allowedTypes.has(type)) return;
    const draft = normalizeDraftInput({
      schema: 'migrandia-invitation-draft-v1',
      eventType: type,
      eventName: String(fields.get('eventName') || '').slice(0, 100),
      date: String(fields.get('date') || ''),
      location: String(fields.get('location') || '').slice(0, 140),
      guestName: String(fields.get('guestName') || '').slice(0, 100),
      message: String(fields.get('message') || '').slice(0, 240),
      templateId: getInvitationTemplate(fields.get('templateId')).id,
      fontStyle: fields.get('fontStyle') === 'sans' ? 'sans' : 'serif',
      colorPalette: ['auto', 'ivory', 'sage', 'rose', 'navy'].includes(fields.get('colorPalette')) ? fields.get('colorPalette') : 'auto'
    });
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'migrandia-borrador-invitacion.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    updateDraftStatus(false);
  }, { signal });
  root.querySelector('[data-invitations-export-package]').addEventListener('click', () => {
    try {
      const fields=new FormData(editorForm);
      const draft=normalizeDraftInput(Object.fromEntries([
        ['schema','migrandia-invitation-draft-v1'],
        ...DRAFT_FIELDS.map(field=>[field,String(fields.get(field)||'')])
      ]));
      const html=renderOfflineInvitationDraft(draft);
      const blob=makeInvitationPackage({draft,html});
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download='migrandia-paquete-invitacion.zip';link.click();
      window.setTimeout(()=>URL.revokeObjectURL(url),3000);
      // El ZIP incluye JSON editable: permite recuperar el borrador sin guardar en Firebase.
      updateDraftStatus(false);
      draftStatus.textContent='Paquete descargado: conserva el ZIP para recuperar el JSON cuando lo necesites.';
    } catch {
      draftStatus.textContent='No se pudo crear el paquete. Revisa los campos de tu invitación.';
    }
  }, { signal });
  root.querySelector('[data-invitations-export-html]').addEventListener('click', () => {
    try {
      const fields = new FormData(editorForm);
      const draft = normalizeDraftInput(Object.fromEntries([
        ['schema', 'migrandia-invitation-draft-v1'],
        ...DRAFT_FIELDS.map((field) => [field, String(fields.get(field) || '')])
      ]));
      const html = renderOfflineInvitationDraft(draft);
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'migrandia-vista-previa-sin-publicar.html';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      // Exportar HTML no guarda el borrador editable JSON.
    } catch {
      draftStatus.textContent = 'No se pudo generar la vista previa. Revisa los campos del borrador.';
    }
  }, { signal });
  root.querySelector('[data-invitations-preview-full]').addEventListener('click', () => {
    try {
      const fields = new FormData(editorForm);
      const draft = normalizeDraftInput(Object.fromEntries([
        ['schema', 'migrandia-invitation-draft-v1'],
        ...DRAFT_FIELDS.map((field) => [field, String(fields.get(field) || '')])
      ]));
      const url = URL.createObjectURL(new Blob([renderOfflineInvitationDraft(draft)], { type: 'text/html;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      // Vista temporal: no publica enlaces ni guarda los cambios del editor.
    } catch {
      draftStatus.textContent = 'No se pudo abrir la vista completa. Revisa los campos del borrador.';
    }
  }, { signal });
  root.querySelector('[data-invitations-import-draft]').addEventListener('change', async (event) => {
    const input = event.currentTarget;
    const status = root.querySelector('[data-invitations-import-status]');
    const file = input.files?.[0];
    if (!file) return;
    const currentImport = ++importVersion;
    input.value = '';
    if (file.size > 32 * 1024) {
      status.textContent = 'El archivo supera el límite de 32 KB.';
      return;
    }
    const currentEdit = editorChangeVersion;
    if (dirtyDraft && !window.confirm('Tienes cambios sin descargar. ¿Quieres reemplazarlos con el archivo importado?')) {
      status.textContent = 'Importación cancelada. Se conservaron tus cambios.';
      return;
    }
    try {
      const record = JSON.parse(await file.text());
      const draft = normalizeDraftInput(record);
      if (signal.aborted || editor.hidden || currentImport !== importVersion || currentEdit !== editorChangeVersion) {
        status.textContent = 'El editor cambió durante la lectura. No se reemplazó el borrador.';
        return;
      }
      for (const key of DRAFT_FIELDS) editorForm.elements[key].value = draft[key];
      renderEditorPreview();
      updateDraftStatus(true);
      status.textContent = 'Borrador recuperado en el editor local. Aún no se ha guardado en tu cuenta.';
    } catch {
      status.textContent = 'No se pudo abrir el borrador. Verifica que sea un JSON exportado por Migrandia.';
    }
  }, { signal });
  root.querySelector('[data-invitations-use-active-event]').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const status = root.querySelector('[data-invitations-active-event-status]');
    const userUid = auth.currentUser?.uid;
    if (!userUid) {
      status.textContent = 'Inicia sesión para utilizar los datos de tu evento.';
      return;
    }
    if (dirtyDraft && !window.confirm('Esto reemplazará el nombre, fecha y tipo de evento actuales. ¿Deseas continuar?')) {
      status.textContent = 'Se conservaron los datos que estabas editando.';
      return;
    }
    const expectedImport = ++importVersion;
    const expectedEdit = editorChangeVersion;
    button.disabled = true;
    status.textContent = 'Consultando el evento activo…';
    try {
      const active = await loadActiveWeddingContext();
      if (signal.aborted || editor.hidden || expectedImport !== importVersion
        || expectedEdit !== editorChangeVersion || auth.currentUser?.uid !== userUid) return;
      if (!active?.id) {
        status.textContent = 'No se encontró un evento activo para esta cuenta.';
        return;
      }
      // Solo copia campos que ya existen en el contexto autorizado; jamás escribe en Firebase.
      editorForm.elements.eventType.value = active.eventType || 'wedding';
      editorForm.elements.eventName.value = String(active.name || '').slice(0, 100);
      editorForm.elements.date.value = /^\\d{4}-\\d{2}-\\d{2}$/.test(active.date || '') ? active.date : '';
      editorChangeVersion++;
      renderEditorPreview();
      updateDraftStatus(true);
      status.textContent = 'Datos del evento activo aplicados. Puedes seguir personalizando el borrador.';
    } catch {
      if (!signal.aborted) status.textContent = 'No se pudieron consultar los datos del evento activo.';
    } finally {
      if (!signal.aborted && button.isConnected) button.disabled = false;
    }
  }, { signal });
  const markChanged = () => { editorChangeVersion++; collaboration.edit(); renderEditorPreview(); updateDraftStatus(true); };
  editorForm.addEventListener('input', markChanged, { signal });
  editorForm.addEventListener('change', markChanged, { signal });
  const openLocalEditor = () => {
    editor.hidden = false;
    renderEditorPreview();
    editor.scrollIntoView({ block: 'start', behavior: 'smooth' });
    editorForm.elements.eventName.focus();
  };
  root.querySelector('[data-invitations-editor-close]').addEventListener('click', () => {
    if (dirtyDraft && !window.confirm('Este borrador tiene cambios que no has descargado. ¿Quieres cerrarlo y descartarlos?')) return;
    importVersion++;
    editorChangeVersion++;
    updateDraftStatus(false);
    editor.hidden = true;
    editorForm.reset();
    editorPreview.replaceChildren();
  }, { signal });

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
    const safeUrl = safeHttpUrl(item.url);
    if (!safeUrl) {
      open.removeAttribute('href');
      frame.hidden = true;
      loading.textContent = 'El enlace guardado no es válido.';
      loading.hidden = false;
      copy.disabled = true;
      return;
    }
    open.href = safeUrl;
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
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = safeUrl;
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

  createButton.addEventListener('click', openLocalEditor, { signal });
  root.querySelector('[data-invitations-create-empty]')?.addEventListener('click', openLocalEditor, { signal });
  root.querySelector('[data-invitations-empty-focus]')?.addEventListener('click', () => {
    addUrl.focus();
    addUrl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    importVersion++;
    collaboration.close();
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
