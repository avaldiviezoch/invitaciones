import { readPlannerStorageKey, subscribePlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js';
import { readUiPreference, writeUiPreference } from '../../services/ui-preferences.js?v=1';
import { normalizeWeddingRole } from '../../core/app/permissions.js';

const TEMPLATE_URL = new URL('./index.html?v=4', import.meta.url);
const STORAGE_KEY = 'planificador_bodas_ideas_v1';
const CARD_SIZE_PREFERENCE = 'ideas.cardSize';
const CARD_SIZES = new Set(['large','medium','compact','mini']);
let templatePromise = null;
let cleanup = () => {};
let lifecycleToken = 0;

const state = { items: [], filter: 'all', search: '', cardSize: 'large', context: null, editingId: '', usingId: '' };

function canManageIdeas() {
  return ['owner', 'admin'].includes(normalizeWeddingRole(state.context?.role));
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
}

function normalizeUrl(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    const url = new URL(text);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function previewProvider(value = '') {
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (host === 'pin.it' || host === 'pinterest.com' || host.endsWith('.pinterest.com')) return 'pinterest';
    if (host === 'temu.com' || host.endsWith('.temu.com')) return 'temu';
  } catch {}
  return '';
}

async function resolveRemotePreview(value = '') {
  const source = normalizeUrl(value);
  if (!source || !previewProvider(source)) return null;
  try {
    const endpoint = `https://migrandia-dev.avaldiviezoch.workers.dev/api/link-preview?url=${encodeURIComponent(source)}`;
    const response = await fetch(endpoint, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?.ok) return null;
    const originalImage = normalizeUrl(data.image);
    return {
      image: originalImage
        ? `https://migrandia-dev.avaldiviezoch.workers.dev/api/image-proxy?url=${encodeURIComponent(originalImage)}`
        : '',
      title: String(data.title || '').trim()
    };
  } catch {
    return null;
  }
}

async function resolveLinkPreview(value = '') {
  const source = normalizeUrl(value);
  if (!source) return null;

  const provider = previewProvider(source);
  if (provider) {
    const remote = await resolveRemotePreview(source);
    if (remote?.image || remote?.title) return remote;
  }

  const directImage = imageFromProductUrl(source);
  if (directImage) return { image: directImage, title: '' };
  return null;
}

function imageFromProductUrl(value = '') {
  const source = normalizeUrl(value);
  if (!source) return '';
  try {
    const url = new URL(source);
    const candidates = ['top_gallery_url', 'thumb_url', '_web_cover'];
    for (const key of candidates) {
      const candidate = normalizeUrl(url.searchParams.get(key));
      if (candidate) return candidate;
    }
  } catch {}
  return '';
}

function normalizeItems(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    id: String(item?.id || crypto.randomUUID()),
    title: String(item?.title || '').trim(),
    type: item?.type === 'purchase' ? 'purchase' : 'inspiration',
    category: String(item?.category || 'Otros'),
    price: Math.max(0, Number(item?.price || 0)),
    image: normalizeUrl(item?.image),
    url: normalizeUrl(item?.url),
    notes: String(item?.notes || '').trim()
  })).filter((item) => item.title);
}

async function loadTemplate() {
  if (!templatePromise) templatePromise = fetch(TEMPLATE_URL).then((response) => {
    if (!response.ok) throw new Error('No se pudo cargar Ideas.');
    return response.text();
  });
  return templatePromise;
}

function render(root) {
  const board = root.querySelector('[data-ideas-board]');
  const empty = root.querySelector('[data-ideas-empty]');
  const total = root.querySelector('[data-ideas-total]');
  if (total) total.textContent = String(state.items.length);
  board.dataset.cardSize = state.cardSize;
  root.querySelectorAll('[data-ideas-size]').forEach((button) => {
    const active = button.dataset.ideasSize === state.cardSize;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const query = state.search.trim().toLowerCase();
  const items = state.items.filter((item) =>
    (state.filter === 'all' || item.type === state.filter)
    && (!query || [item.title, item.category, item.notes].join(' ').toLowerCase().includes(query))
  );

  const editable = canManageIdeas();
  board.innerHTML = items.map((item) => {
    const image = item.image ? `<img class="ideas-card-image" src="${escapeHtml(item.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<div class="ideas-card-placeholder" aria-hidden="true"></div>';
    const link = item.url ? `<a class="ideas-card-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Ver enlace</a>` : '';
    const use = editable ? `<button class="ideas-card-use" type="button" data-idea-use="${escapeHtml(item.id)}">Usar esta idea</button>` : '';
    const edit = editable ? `<button class="ideas-card-edit" type="button" data-idea-edit="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.title)}">Editar</button>` : '';
    const remove = editable ? `<button class="ideas-card-delete" type="button" data-idea-delete="${escapeHtml(item.id)}" aria-label="Eliminar ${escapeHtml(item.title)}">×</button>` : '';
    return `<article class="ideas-card" data-idea-id="${escapeHtml(item.id)}">${edit}${remove}${image}<div class="ideas-card-body"><div class="ideas-card-meta"><span>${escapeHtml(item.category)}</span><span>${item.type === 'purchase' ? 'Compra' : 'Inspiración'}</span></div><h3>${escapeHtml(item.title)}</h3>${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ''}${item.price ? `<strong class="ideas-card-price">S/ ${item.price.toFixed(2)}</strong>` : ''}${link}${use}</div></article>`;
  }).join('');
  empty.hidden = items.length > 0;
  board.querySelectorAll('[data-idea-use]').forEach((button) => {
    button.onclick = () => openUseDialog(root, button.dataset.ideaUse);
  });
  board.querySelectorAll('[data-idea-edit]').forEach((button) => {
    button.onclick = () => openEditor(root, button.dataset.ideaEdit);
  });
  board.querySelectorAll('[data-idea-delete]').forEach((button) => {
    button.onclick = async () => {
      if (!canManageIdeas()) return;
      const id = button.dataset.ideaDelete;
      const previous = state.items;
      state.items = state.items.filter((item) => item.id !== id);
      render(root);
      try {
        await persist(root);
      } catch {
        state.items = previous;
        render(root);
      }
    };
  });
}

function openUseDialog(root, id) {
  if (!canManageIdeas()) return;
  const item = state.items.find((current) => current.id === id);
  const dialog = root.querySelector('[data-ideas-use-dialog]');
  if (!item || !dialog) return;
  state.usingId = id;
  root.querySelector('[data-ideas-use-title]').textContent = item.title;
  dialog.showModal();
}

function closeUseDialog(root) {
  state.usingId = '';
  root.querySelector('[data-ideas-use-dialog]')?.close();
}

function useIdea(root, target) {
  if (!canManageIdeas()) return;
  const item = state.items.find((current) => current.id === state.usingId);
  if (!item || !['checklist', 'presupuesto', 'proveedores'].includes(target)) return;
  sessionStorage.setItem('migrandia:idea-draft', JSON.stringify({ target, title: item.title, category: item.category, price: item.price, url: item.url, notes: item.notes }));
  closeUseDialog(root);
  location.hash = target;
}

function openEditor(root, id) {
  if (!canManageIdeas()) return;
  const item = state.items.find((current) => current.id === id);
  if (!item) return;
  const form = root.querySelector('[data-ideas-form]');
  state.editingId = id;
  form.querySelector('[data-ideas-url]').value = item.url;
  form.querySelector('[data-ideas-title]').value = item.title;
  form.querySelector('[data-ideas-type]').value = item.type;
  form.querySelector('[data-ideas-category]').value = item.category;
  form.querySelector('[data-ideas-price]').value = item.price || '';
  form.querySelector('[data-ideas-image]').value = item.image;
  form.querySelector('[data-ideas-notes]').value = item.notes;
  root.querySelector('[data-ideas-dialog-label]').textContent = 'EDITAR IDEA';
  root.querySelector('[data-ideas-dialog-title]').textContent = 'Actualiza tu idea';
  root.querySelector('[data-ideas-submit]').textContent = 'Guardar cambios';
  root.querySelector('[data-ideas-dialog]').showModal();
}

function resetEditor(root) {
  state.editingId = '';
  root.querySelector('[data-ideas-form]').reset();
  root.querySelector('[data-ideas-dialog-label]').textContent = 'NUEVA IDEA';
  root.querySelector('[data-ideas-dialog-title]').textContent = 'Guarda algo que te inspire';
  root.querySelector('[data-ideas-submit]').textContent = 'Agregar al tablero';
}

async function persist(root) {
  if (!canManageIdeas()) throw new Error('Solo el propietario o un administrador pueden modificar Ideas.');
  const status = root.querySelector('[data-ideas-status]');
  try {
    if (status) status.textContent = 'Guardando…';
    await writePlannerStorageKey(state.context, STORAGE_KEY, state.items);
    if (status) status.textContent = 'Guardado';
  } catch (error) {
    if (status) status.textContent = error?.message || 'No se pudo guardar';
    throw error;
  }
}

export function destroyIdeas() {
  lifecycleToken += 1;
  cleanup();
  cleanup = () => {};
  state.items = [];
  state.filter = 'all';
  state.search = '';
  state.cardSize = 'large';
  state.context = null;
  state.editingId = '';
  state.usingId = '';
  const root = document.querySelector('[data-module-view="ideas"]');
  if (!root) return;
  root.innerHTML = '';
  delete root.dataset.mounted;
  delete root.dataset.weddingId;
}

export async function mountIdeas(context) {
  const root = document.querySelector('[data-module-view="ideas"]');
  if (!root || !context?.id) return false;
  if (root.dataset.mounted === 'true') {
    if (root.dataset.weddingId === String(context.id)) return true;
    destroyIdeas();
  }

  const token = ++lifecycleToken;
  root.innerHTML = await loadTemplate();
  if (token !== lifecycleToken) return false;
  root.dataset.mounted = 'true';
  root.dataset.weddingId = String(context.id);
  state.context = context;
  const savedCardSize = String(readUiPreference(CARD_SIZE_PREFERENCE, 'large'));
  state.cardSize = CARD_SIZES.has(savedCardSize) ? savedCardSize : 'large';
  try {
    state.items = normalizeItems(await readPlannerStorageKey(context, STORAGE_KEY));
  } catch (error) {
    if (token === lifecycleToken) destroyIdeas();
    throw error;
  }
  if (token !== lifecycleToken) return false;

  const dialog = root.querySelector('[data-ideas-dialog]');
  const form = root.querySelector('[data-ideas-form]');
  const editable = canManageIdeas();
  root.querySelectorAll('[data-ideas-open-form]').forEach((button) => { button.hidden = !editable; });
  const statusNode = root.querySelector('[data-ideas-status]');
  if (statusNode && !editable) statusNode.textContent = 'Solo lectura · únicamente propietario y administradores pueden modificar este tablero.';
  const urlInput = form.querySelector('[data-ideas-url]');
  const imageInput = form.querySelector('[data-ideas-image]');
  root.querySelector('[data-ideas-use-close]').onclick = () => closeUseDialog(root);
  root.querySelectorAll('[data-ideas-use]').forEach((button) => { button.onclick = () => useIdea(root, button.dataset.ideasUse); });

  root.querySelectorAll('[data-ideas-open-form]').forEach((button) => {
    button.onclick = () => {
      if (!canManageIdeas()) return;
      resetEditor(root);
      dialog.showModal();
    };
  });
  root.querySelectorAll('[data-ideas-close]').forEach((button) => {
    button.onclick = () => { dialog.close(); resetEditor(root); };
  });
  root.querySelectorAll('[data-ideas-filter]').forEach((button) => {
    button.onclick = () => {
      state.filter = button.dataset.ideasFilter;
      root.querySelectorAll('[data-ideas-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
      render(root);
    };
  });
  root.querySelector('[data-ideas-search]').oninput = (event) => {
    state.search = event.currentTarget.value;
    render(root);
  };
  root.querySelectorAll('[data-ideas-size]').forEach((button) => {
    button.onclick = () => {
      const nextSize = String(button.dataset.ideasSize || '');
      if (!CARD_SIZES.has(nextSize)) return;
      state.cardSize = nextSize;
      writeUiPreference(CARD_SIZE_PREFERENCE, nextSize);
      render(root);
      const control = root.querySelector('[data-ideas-size-control]');
      if (control) control.open = false;
    };
  });

  urlInput.onchange = async () => {
    if (!canManageIdeas() || imageInput.value.trim()) return;
    const preview = await resolveLinkPreview(urlInput.value);
    if (preview?.image) imageInput.value = preview.image;
    const titleInput = form.querySelector('[data-ideas-title]');
    if (!titleInput.value.trim() && preview?.title) titleInput.value = preview.title;
  };

  form.onsubmit = async (event) => {
    event.preventDefault();
    if (!canManageIdeas()) return;
    const titleInput = form.querySelector('[data-ideas-title]');
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return;
    }
    const url = normalizeUrl(urlInput.value);
    let image = normalizeUrl(imageInput.value) || imageFromProductUrl(url);
    if (!image && url) {
      const preview = await resolveLinkPreview(url);
      image = preview?.image || '';
      if (!titleInput.value.trim() && preview?.title) titleInput.value = preview.title;
    }
    const item = {
      id: crypto.randomUUID(),
      title,
      type: form.querySelector('[data-ideas-type]').value,
      category: form.querySelector('[data-ideas-category]').value,
      price: Math.max(0, Number(form.querySelector('[data-ideas-price]').value || 0)),
      image,
      url,
      notes: form.querySelector('[data-ideas-notes]').value.trim()
    };
    const previous = state.items;
    if (state.editingId) {
      item.id = state.editingId;
      state.items = state.items.map((current) => current.id === state.editingId ? item : current);
    } else {
      state.items.unshift(item);
    }
    render(root);
    dialog.close();
    resetEditor(root);
    try {
      await persist(root);
    } catch {
      state.items = previous;
      render(root);
    }
  };

  if (token !== lifecycleToken) return false;
  cleanup();
  cleanup = subscribePlannerStorageKey(context, STORAGE_KEY, (value) => {
    state.items = normalizeItems(value);
    render(root);
  });
  render(root);
  return true;
}
