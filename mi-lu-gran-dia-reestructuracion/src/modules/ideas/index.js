import { readPlannerStorageKey, subscribePlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js';

const TEMPLATE_URL = new URL('./index.html?v=2', import.meta.url);
const STORAGE_KEY = 'planificador_bodas_ideas_v1';
let templatePromise = null;
let cleanup = () => {};

const state = { items: [], filter: 'all', search: '', context: null, editingId: '' };

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

async function resolvePinterestPreview(value = '') {
  const source = normalizeUrl(value);
  if (!source) return null;
  let host = '';
  try { host = new URL(source).hostname.toLowerCase(); } catch { return null; }
  if (!['pin.it', 'www.pinterest.com', 'pinterest.com'].includes(host)) return null;
  const endpoints = [
    `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(source)}`,
    `https://www.pinterest.com/oembed.json?url=${source}`
  ];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) continue;
      const data = await response.json();
      const image = normalizeUrl(data?.thumbnail_url);
      if (image) return { image, title: String(data?.title || '').trim() };
    } catch {}
  }
  return null;
}

async function resolveLinkPreview(value = '') {
  const source = normalizeUrl(value);
  if (!source) return null;
  const directImage = imageFromProductUrl(source);
  if (directImage) return { image: directImage, title: '' };
  return resolvePinterestPreview(source);
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
  const query = state.search.trim().toLowerCase();
  const items = state.items.filter((item) =>
    (state.filter === 'all' || item.type === state.filter)
    && (!query || [item.title, item.category, item.notes].join(' ').toLowerCase().includes(query))
  );

  board.innerHTML = items.map((item) => {
    const image = item.image ? `<img class="ideas-card-image" src="${escapeHtml(item.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<div class="ideas-card-placeholder" aria-hidden="true"></div>';
    const link = item.url ? `<a class="ideas-card-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Ver enlace</a>` : '';
    return `<article class="ideas-card" data-idea-id="${escapeHtml(item.id)}"><button class="ideas-card-edit" type="button" data-idea-edit="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.title)}">Editar</button><button class="ideas-card-delete" type="button" data-idea-delete="${escapeHtml(item.id)}" aria-label="Eliminar ${escapeHtml(item.title)}">×</button>${image}<div class="ideas-card-body"><div class="ideas-card-meta"><span>${escapeHtml(item.category)}</span><span>${item.type === 'purchase' ? 'Compra' : 'Inspiración'}</span></div><h3>${escapeHtml(item.title)}</h3>${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ''}${item.price ? `<strong class="ideas-card-price">S/ ${item.price.toFixed(2)}</strong>` : ''}${link}</div></article>`;
  }).join('');
  empty.hidden = items.length > 0;
  board.querySelectorAll('[data-idea-edit]').forEach((button) => {
    button.onclick = () => openEditor(root, button.dataset.ideaEdit);
  });
  board.querySelectorAll('[data-idea-delete]').forEach((button) => {
    button.onclick = async () => {
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

function openEditor(root, id) {
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

export async function mountIdeas(context) {
  const root = document.querySelector('[data-module-view="ideas"]');
  if (!root || root.dataset.mounted === 'true') return false;
  root.innerHTML = await loadTemplate();
  root.dataset.mounted = 'true';
  state.context = context;
  state.items = normalizeItems(await readPlannerStorageKey(context, STORAGE_KEY));

  const dialog = root.querySelector('[data-ideas-dialog]');
  const form = root.querySelector('[data-ideas-form]');
  const urlInput = form.querySelector('[data-ideas-url]');
  const imageInput = form.querySelector('[data-ideas-image]');

  root.querySelectorAll('[data-ideas-open-form]').forEach((button) => {
    button.onclick = () => { resetEditor(root); dialog.showModal(); };
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

  urlInput.onchange = async () => {
    if (imageInput.value.trim()) return;
    const preview = await resolveLinkPreview(urlInput.value);
    if (preview?.image) imageInput.value = preview.image;
    const titleInput = form.querySelector('[data-ideas-title]');
    if (!titleInput.value.trim() && preview?.title) titleInput.value = preview.title;
  };

  form.onsubmit = async (event) => {
    event.preventDefault();
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
    try {
      await persist(root);
      dialog.close();
      resetEditor(root);
    } catch {
      state.items = previous;
      render(root);
    }
  };

  cleanup();
  cleanup = subscribePlannerStorageKey(context, STORAGE_KEY, (value) => {
    state.items = normalizeItems(value);
    render(root);
  });
  render(root);
  return true;
}
