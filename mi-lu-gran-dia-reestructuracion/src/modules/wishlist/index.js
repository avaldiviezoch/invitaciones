import { readPlannerStorageKey, subscribePlannerStorageKey, writePlannerStorageKey } from '../../services/planner-cloud.js';
import { weddingCapabilities } from '../../core/app/permissions.js';
import { wishlistPublicId, wishlistFriendlySlug } from './share-link.js?v=3';
import { auth } from '../../services/firebase-client.js';
const STORAGE_KEY = 'planificador_bodas_wishlist_v1';
const PUBLIC_API = 'https://migrandia-wishlist-live-dev.avaldiviezoch.workers.dev';
async function publishWishlistPublic(context, gifts) {
  const user = auth.currentUser;
  if (!user || !context?.id || !canEditWishlist()) throw new Error('Se necesita acceso de edición.');
  const idToken = await user.getIdToken();
  const list = await wishlistPublicId(context.id);
  const response = await fetch(new URL('/api/list', PUBLIC_API), {
    method:'PUT',
    headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + idToken },
    body:JSON.stringify({ weddingId:context.id, list, event:context.name, gifts })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error || 'No se pudo publicar la lista compartida.');
}

const wishlistState = { items: [], context: null, saving: false };
let unsubscribeWishlist = () => {};
let lifecycleToken = 0;
function normalizeGifts(value) {
  if (!Array.isArray(value)) return [];
  return value.map((gift) => ({
    id: String(gift?.id || crypto.randomUUID()),
    name: String(gift?.name || '').trim().slice(0, 110),
    image: safeUrl(gift?.image),
    shop: String(gift?.shop || '').slice(0, 65),
    price: String(gift?.price || '').slice(0, 40),
    description: String(gift?.description || '').slice(0, 350),
    url: safeUrl(gift?.url)
  })).filter((gift) => gift.name && gift.url);
}
function canEditWishlist() {
  return weddingCapabilities(wishlistState.context?.role).canEdit;
}

const wishlistSizes = new Set(['large', 'medium', 'compact', 'mini']);
let wishlistCardSize = 'large';
let currentEventId = '';
let metadataRequest = null;
let requestEpoch = 0;
const rootSelector = '[data-module-view="wishlist"]';
function safeUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
function element(tag, className = '', text = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}
function createGiftPlaceholder() {
  const image = document.createElement('img');
  image.className = 'wishlist-default-image';
  image.src = 'assets/icons/wishlist.svg';
  image.alt = 'Imagen genérica de regalo';
  image.loading = 'lazy';
  return image;
}
function renderCards(root) {
  const container = root.querySelector('[data-wishlist-items]');
  const counter = root.querySelector('[data-wishlist-count]');
  if (!container || !counter) return;
  const items = wishlistState.items;
  container.dataset.cardSize = wishlistCardSize;
  root.querySelectorAll('[data-wishlist-size]').forEach((button) => {
    const active = button.dataset.wishlistSize === wishlistCardSize;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  container.replaceChildren();
  counter.textContent = items.length + (items.length === 1 ? ' regalo' : ' regalos');
  const heroCount = root.querySelector('[data-wishlist-total]');
  if (heroCount) heroCount.textContent = String(items.length);
  if (!items.length) {
    const empty = element('div', 'wishlist-empty');
    empty.append(element('span', 'wishlist-empty-icon', '♡'), element('h3', '', 'Tu lista empieza aquí'), element('p', '', 'Pega el enlace de un regalo para intentar recuperar su información automáticamente.'));
    container.append(empty);
    return;
  }
  items.forEach((item) => {
    const card = element('article', 'wishlist-card');
    const media = element('div', 'wishlist-card-media');
    if (item.image) {
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.name;
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.onerror = () => { img.remove(); media.append(createGiftPlaceholder()); };
      media.append(img);
    } else media.append(createGiftPlaceholder());
    const body = element('div', 'wishlist-card-body');
    body.append(element('span', 'wishlist-shop', item.shop || 'Tienda por definir'), element('h3', '', item.name));
    if (item.description) body.append(element('p', 'wishlist-description', item.description));
    if (item.price) body.append(element('strong', 'wishlist-price', item.price));
    const actions = element('div', 'wishlist-card-actions');
    const link = element('a', 'wishlist-store-link', 'Ver en tienda ↗');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const remove = element('button', 'wishlist-remove', 'Quitar');
    remove.type = 'button';
    remove.disabled = wishlistState.saving;
    remove.addEventListener('click', async () => {
      if (wishlistState.saving || !canEditWishlist()) return;
      const previous = wishlistState.items;
      wishlistState.items = previous.filter((entry) => entry.id !== item.id);
      renderCards(root);
      try { await persistWishlist(root, previous); } catch {}
    });
    actions.append(link);
    if (canEditWishlist()) actions.append(remove);
    body.append(actions);
    card.append(media, body);
    container.append(card);
  });
}
function setSaveStatus(root, message) {
  const node = root.querySelector('[data-wishlist-save-status]');
  if (node) node.textContent = message;
}
async function persistWishlist(root, previous) {
  if (wishlistState.saving) throw new Error('Ya hay un guardado en curso.');
  if (!canEditWishlist()) throw new Error('Tu acceso es de solo lectura.');
  const context = wishlistState.context;
  const token = lifecycleToken;
  wishlistState.saving = true;
  setSaveStatus(root, 'Guardando…');
  renderCards(root);
  try {
    await writePlannerStorageKey(context, STORAGE_KEY, wishlistState.items);
    if (token === lifecycleToken) {
      setSaveStatus(root, 'Guardado en Mi Gran Día. Actualizando enlace público…');
      try {
        await publishWishlistPublic(context, wishlistState.items);
        if (token === lifecycleToken) setSaveStatus(root, 'Guardado y sincronizado');
      } catch {
        if (token === lifecycleToken) setSaveStatus(root, 'Guardado en Mi Gran Día; la lista pública aún no se pudo actualizar.');
      }
    }
  } catch (error) {
    if (token === lifecycleToken) {
      wishlistState.items = previous;
      renderCards(root);
      setSaveStatus(root, 'No se pudo guardar. Inténtalo nuevamente.');
    }
    throw error;
  } finally {
    if (token === lifecycleToken) {
      wishlistState.saving = false;
      renderCards(root);
    }
  }
}
export async function mountWishlist(context) {
  const root = document.querySelector(rootSelector);
  if (!root || !context?.id) return false;
  if (wishlistState.context?.id === context.id && root.dataset.wishlistLoaded === 'true') return true;
  destroyWishlist();
  const token = ++lifecycleToken;
  currentEventId = String(context.id);
  wishlistState.context = context;
  root.innerHTML = `
    <div class="wishlist-shell">
      <header class="wishlist-hero">
        <div>
          <p class="wishlist-eyebrow">Módulo · Planificación</p>
          <div class="wishlist-title-row">
            <div class="wishlist-title-icon" aria-hidden="true"><img src="assets/icons/wishlist.svg" width="34" height="34" alt=""></div>
            <div><h1>Wishlist</h1><p>Reúne los regalos que te gustaría recibir, de cualquier tienda, en una sola lista.</p></div>
          </div>
        </div>
        <div class="wishlist-hero-total"><span>Regalos en la lista</span><strong data-wishlist-total>0</strong></div>
      </header>
      <main class="wishlist-content">
        <div class="wishlist-actions-row"><div class="wishlist-main-actions"><button type="button" class="wishlist-add-button" data-wishlist-open>＋ Agregar regalo</button><button type="button" class="wishlist-share-button" data-wishlist-share>↗ Compartir lista</button></div><span class="wishlist-save-status" data-wishlist-save-status role="status"></span></div>
        <section class="wishlist-collection" aria-labelledby="wishlist-collection-title">
          <div class="wishlist-collection-head">
            <div><h2 id="wishlist-collection-title">Nuestra lista de regalos</h2><p>Los detalles que nos gustaría recibir.</p></div>
            <div class="wishlist-collection-tools">
              <span data-wishlist-count>0 regalos</span>
              <details class="wishlist-size-control" data-wishlist-size-control>
                <summary aria-label="Cambiar tamaño de las tarjetas" title="Tamaño de tarjetas">
                  <span class="wishlist-size-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
                </summary>
                <div class="wishlist-size-menu" role="group" aria-label="Tamaño de tarjetas">
                  <button type="button" data-wishlist-size="large"><span class="wishlist-size-preview is-large" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>Actual</b></button>
                  <button type="button" data-wishlist-size="medium"><span class="wishlist-size-preview is-medium" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>Medio</b></button>
                  <button type="button" data-wishlist-size="compact"><span class="wishlist-size-preview is-compact" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>Compacto</b></button>
                  <button type="button" data-wishlist-size="mini"><span class="wishlist-size-preview is-mini" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>Miniatura</b></button>
                </div>
              </details>
            </div>
          </div>
          <div class="wishlist-grid" data-wishlist-items></div>
        </section>
      </main>
      <dialog class="wishlist-dialog" data-wishlist-dialog aria-labelledby="wishlist-form-title">
        <div class="wishlist-dialog-frame">
          <header><div><span>NUEVO REGALO</span><h2 id="wishlist-form-title">Agregar a la lista</h2></div><button type="button" data-wishlist-close aria-label="Cerrar">×</button></header>
          <form data-wishlist-form>
            <label>Enlace del producto <input type="url" name="url" placeholder="https://tienda.com/producto" required></label>
            <p class="wishlist-help">Pega el enlace de cualquier tienda. Buscaremos nombre, precio e imagen automáticamente.</p>
            <button type="button" class="wishlist-analyze" data-wishlist-analyze>Analizar enlace <span>↗</span></button>
            <div data-wishlist-details hidden>
              <div class="wishlist-metadata-status" data-wishlist-status role="status"></div>
              <div class="wishlist-metadata-preview" data-wishlist-preview hidden></div>
              <div class="wishlist-missing-fields" data-wishlist-missing></div>
              <button type="submit" class="wishlist-submit">Agregar a mi lista <span>＋</span></button>
            </div>
            <p class="wishlist-form-error" data-wishlist-error role="alert" hidden></p>
          </form>
        </div>
      </dialog>
    </div>`;
  const shareButton = root.querySelector('[data-wishlist-share]');
  shareButton.addEventListener('click', async () => {
    if (wishlistState.saving) {
      setSaveStatus(root, 'Espera a que termine el guardado antes de compartir.');
      return;
    }
    shareButton.disabled = true;
    try {
      // Publicar únicamente datos propios de Wishlist, después de verificar el usuario.
      await publishWishlistPublic(wishlistState.context, wishlistState.items);
      const listId = await wishlistPublicId(wishlistState.context.id);
      const slug = wishlistFriendlySlug(wishlistState.context.name, listId);
      const target = new URL('regalos/', new URL('../../../', import.meta.url));
      target.searchParams.set('boda', slug);
      const link = target.href;
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Nuestra lista de regalos', url: link });
          setSaveStatus(root, 'Lista lista para compartir.');
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        setSaveStatus(root, 'Enlace copiado. Puedes enviarlo por WhatsApp.');
      } else {
        window.prompt('Copia el enlace para compartir la lista:', link);
      }
    } catch (error) {
      setSaveStatus(root, error?.message || 'No se pudo generar el enlace.');
    } finally {
      shareButton.disabled = false;
    }
  });
  const dialog = root.querySelector('[data-wishlist-dialog]');
  const form = root.querySelector('[data-wishlist-form]');
  const openButton = root.querySelector('[data-wishlist-open]');
  openButton.hidden = true;
  openButton.addEventListener('click', () => {
    if (!canEditWishlist() || wishlistState.saving) return;
    form.reset();
    resetAnalysis();
    dialog.showModal();
    form.elements.namedItem('url').focus();
  });
  function closeDialog() {
    resetAnalysis();
    dialog.close();
  }
  root.querySelector('[data-wishlist-close]').addEventListener('click', closeDialog);
  dialog.addEventListener('close', () => resetAnalysis());
  const analyze = root.querySelector('[data-wishlist-analyze]');
  const details = root.querySelector('[data-wishlist-details]');
  const missing = root.querySelector('[data-wishlist-missing]');
  const preview = root.querySelector('[data-wishlist-preview]');
  const status = root.querySelector('[data-wishlist-status]');
  const errorNode = root.querySelector('[data-wishlist-error]');
  const urlInput = form.elements.namedItem('url');
  root.querySelectorAll('[data-wishlist-size]').forEach((button) => {
    button.addEventListener('click', () => {
      const size = String(button.dataset.wishlistSize || '');
      if (!wishlistSizes.has(size)) return;
      wishlistCardSize = size;
      renderCards(root);
      root.querySelector('[data-wishlist-size-control]').open = false;
    });
  });
  const editableFields = [
    { key: 'name', title: 'Nombre del regalo', required: true, placeholder: 'Ej. Freidora de aire', max: 110 },
    { key: 'shop', title: 'Tienda', placeholder: 'Ej. Falabella', max: 65 },
    { key: 'price', title: 'Precio referencial', placeholder: 'Ej. S/ 299.00', max: 40 },
    { key: 'description', title: 'Descripción', placeholder: 'Color, modelo o detalle especial', max: 350 }
  ];
  let extracted = null;
  let analyzedUrl = '';
  function showError(message) { errorNode.textContent = message; errorNode.hidden = !message; }
  function resetAnalysis() {
    requestEpoch++;
    metadataRequest?.abort();
    metadataRequest = null;
    extracted = null;
    analyzedUrl = '';
    missing.replaceChildren();
    preview.replaceChildren();
    preview.hidden = true;
    details.hidden = true;
    analyze.disabled = false;
    analyze.firstChild.textContent = 'Analizar enlace ';
    status.textContent = '';
    showError('');
  }
  urlInput.addEventListener('input', resetAnalysis);
  analyze.addEventListener('click', async () => {
    const url = safeUrl(urlInput.value);
    if (!url) { showError('Pega un enlace válido que empiece con https:// o http://.'); return; }
    resetAnalysis();
    showError('');
    analyzedUrl = url;
    const epoch = ++requestEpoch;
    const controller = new AbortController();
    metadataRequest = controller;
    analyze.disabled = true;
    analyze.firstChild.textContent = 'Buscando información… ';
    // Extractor universal e independiente en Cloudflare DEV.
    // No hay lista de tiendas ni acceso a Firebase.
    let data = {};
    let failed = false;
    let failureReason = '';
    try {
      const endpoint = new URL('https://migrandia-product-metadata-dev.avaldiviezoch.workers.dev/api/product');
      endpoint.searchParams.set('url', url);
      const response = await fetch(endpoint, { signal: controller.signal, headers: { Accept: 'application/json' } });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(String(payload.error || 'metadata-unavailable'));
      data = payload.product || {};
    } catch (error) {
      if (controller.signal.aborted) return;
      failed = true;
      failureReason = error?.message || 'metadata-unavailable';
      console.warn('Wishlist: no se pudieron extraer metadatos del enlace', failureReason);
    }
    if (epoch !== requestEpoch || currentEventId !== String(context.id)) return;
    metadataRequest = null;
    analyze.disabled = false;
    analyze.firstChild.textContent = 'Analizar de nuevo ';
    let shop = '';
    try { shop = new URL(url).hostname.replace(/^www\./, ''); } catch (_) {}
    const image = safeUrl(data.image);
    const price = String(data.price || '').trim();
    const currency = String(data.currency || '').trim();
    extracted = {
      name: String(data.name || '').trim().slice(0, 110),
      image,
      shop: String(data.shop || shop).slice(0, 65),
      price: (price ? [currency, price].filter(Boolean).join(' ') : '').slice(0, 40),
      description: String(data.description || '').trim().slice(0, 350)
    };
    details.hidden = false;
    status.textContent = failed
      ? 'Esta tienda no entregó los metadatos en este intento. Puedes completar la información disponible manualmente.'
      : 'Análisis completado. Completa únicamente los datos pendientes.';
    preview.replaceChildren();
    const previewImage = element('img', 'wishlist-preview-image');
    if (extracted.image) {
      previewImage.src = extracted.image;
      previewImage.alt = 'Imagen del producto';
      previewImage.onerror = () => { previewImage.remove(); };
      preview.append(previewImage);
    }
    const summary = element('div', 'wishlist-preview-copy');
    if (extracted.name) summary.append(element('strong', '', extracted.name));
    if (extracted.shop) summary.append(element('small', '', extracted.shop));
    if (extracted.price) summary.append(element('b', '', extracted.price));
    preview.append(summary);
    preview.hidden = !(extracted.name || extracted.image);
    missing.replaceChildren();
    const remaining = editableFields.filter(({ key }) => !extracted[key]);
    if (remaining.length) missing.append(element('p', 'wishlist-missing-caption', 'Completa los datos que no se encontraron (la imagen será automática o genérica):'));
    else missing.append(element('p', 'wishlist-missing-caption', 'Los datos principales están listos.'));
    remaining.forEach(({ key, title, required, placeholder, max, type }) => {
      const label = element('label', '', title);
      const input = document.createElement(key === 'description' ? 'textarea' : 'input');
      input.name = key;
      input.placeholder = placeholder;
      input.maxLength = max;
      if (type) input.type = type;
      if (required) input.required = true;
      if (key === 'description') input.rows = 2;
      label.append(input);
      missing.append(label);
    });
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (wishlistState.saving || !canEditWishlist()) return;
    const url = safeUrl(urlInput.value);
    if (!extracted || url !== analyzedUrl || details.hidden) {
      showError('Primero analiza el enlace para continuar.');
      return;
    }
    const data = new FormData(form);
    const item = { ...extracted };
    editableFields.forEach(({ key, max }) => {
      if (!item[key]) item[key] = String(data.get(key) || '').trim().slice(0, max);
    });
    if (!item.name) { showError('Escribe el nombre del regalo.'); return; }
    const previous = wishlistState.items;
    wishlistState.items = [{ ...item, id: crypto.randomUUID(), url }, ...previous];
    const saveButton = form.querySelector('[type="submit"]');
    saveButton.disabled = true;
    renderCards(root);
    try {
      await persistWishlist(root, previous);
      if (token !== lifecycleToken) return;
      form.reset();
      resetAnalysis();
      dialog.close();
    } catch {
      if (token === lifecycleToken) showError('No se pudo guardar el regalo. Inténtalo nuevamente.');
    } finally {
      if (token === lifecycleToken) saveButton.disabled = false;
    }
  });
  setSaveStatus(root, 'Cargando regalos…');
  try {
    wishlistState.items = normalizeGifts(await readPlannerStorageKey(context, STORAGE_KEY));
  } catch {
    if (token === lifecycleToken) {
      setSaveStatus(root, 'No se pudieron cargar los regalos. Vuelve a abrir Wishlist.');
      openButton.hidden = true;
    }
    return false;
  }
  if (token !== lifecycleToken) return false;
  root.dataset.wishlistLoaded = 'true';
  setSaveStatus(root, '');
  openButton.hidden = !canEditWishlist();
  unsubscribeWishlist = subscribePlannerStorageKey(context, STORAGE_KEY, (value) => {
    if (token !== lifecycleToken || wishlistState.saving) return;
    wishlistState.items = normalizeGifts(value);
    renderCards(root);
  }, () => {
    if (token === lifecycleToken) setSaveStatus(root, 'No se pudieron sincronizar los regalos.');
  });
  renderCards(root);
  return true;
}
export function destroyWishlist() {
  lifecycleToken++;
  unsubscribeWishlist();
  unsubscribeWishlist = () => {};
  const root = document.querySelector(rootSelector);
  requestEpoch++;
  metadataRequest?.abort();
  metadataRequest = null;
  root?.querySelector('[data-wishlist-dialog]')?.close();
  if (root) {
    root.replaceChildren();
    delete root.dataset.wishlistLoaded;
  }
  wishlistState.items = [];
  wishlistState.context = null;
  wishlistState.saving = false;
  currentEventId = '';
}
