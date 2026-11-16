// Prototipo visual de Wishlist. No escribe en Firebase ni en almacenamiento local.
const draftsByEvent = new Map();
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
  const items = draftsByEvent.get(currentEventId) || [];
  container.replaceChildren();
  counter.textContent = items.length + (items.length === 1 ? ' regalo de prueba' : ' regalos de prueba');
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
    remove.addEventListener('click', () => {
      draftsByEvent.set(currentEventId, (draftsByEvent.get(currentEventId) || []).filter((entry) => entry.id !== item.id));
      renderCards(root);
    });
    actions.append(link, remove);
    body.append(actions);
    card.append(media, body);
    container.append(card);
  });
}
export function mountWishlist(context) {
  const root = document.querySelector(rootSelector);
  if (!root || !context?.id) return false;
  currentEventId = String(context.id);
  root.innerHTML = `
    <div class="wishlist-shell">
      <header class="wishlist-heading">
        <div><span class="wishlist-eyebrow">PLANIFICACIÓN · MI GRAN DÍA</span><h1>Wishlist <span>♡</span></h1>
        <p>Reúne los regalos que te gustaría recibir, de cualquier tienda, en una sola lista.</p></div>
        <span class="wishlist-prototype-tag">Vista de prueba</span>
      </header>
      <div class="wishlist-note" role="status">Esta primera versión es una maqueta funcional. Los regalos agregados no se guardan en Firebase, no se comparten y se perderán al recargar la página.</div>
      <div class="wishlist-layout">
        <section class="wishlist-panel" aria-labelledby="wishlist-form-title">
          <div class="wishlist-panel-top"><span>01 / AGREGAR</span><h2 id="wishlist-form-title">Nuevo regalo</h2><p>Solo pega el enlace del producto. Intentaremos completar sus datos por ti.</p></div>
          <form data-wishlist-form>
            <label>Enlace del producto <input type="url" name="url" placeholder="https://tienda.com/producto" required></label>
            <button type="button" class="wishlist-submit" data-wishlist-analyze>Analizar enlace <span>↗</span></button>
            <p class="wishlist-help">Buscaremos nombre, precio, tienda, descripción e imagen. Si la foto no está disponible, se mostrará una imagen genérica de regalo.</p>
            <div data-wishlist-details hidden>
              <div class="wishlist-metadata-status" data-wishlist-status role="status"></div>
              <div class="wishlist-metadata-preview" data-wishlist-preview hidden></div>
              <div class="wishlist-missing-fields" data-wishlist-missing></div>
              <button type="submit" class="wishlist-submit">Agregar a mi lista <span>＋</span></button>
            </div>
            <p class="wishlist-form-error" data-wishlist-error role="alert" hidden></p>
          </form>
        </section>
        <section class="wishlist-collection" aria-labelledby="wishlist-collection-title">
          <div class="wishlist-collection-head"><div><span>02 / VISTA PREVIA</span><h2 id="wishlist-collection-title">Nuestra lista de regalos</h2></div><span data-wishlist-count>0 regalos de prueba</span></div>
          <div class="wishlist-grid" data-wishlist-items></div>
        </section>
      </div>
    </div>`;
  const form = root.querySelector('[data-wishlist-form]');
  const analyze = root.querySelector('[data-wishlist-analyze]');
  const details = root.querySelector('[data-wishlist-details]');
  const missing = root.querySelector('[data-wishlist-missing]');
  const preview = root.querySelector('[data-wishlist-preview]');
  const status = root.querySelector('[data-wishlist-status]');
  const errorNode = root.querySelector('[data-wishlist-error]');
  const urlInput = form.elements.namedItem('url');
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
    // Consulta experimental a un servicio público de metadatos. No modifica Firebase.
    // Si la tienda bloquea el acceso o hay límite de servicio, se habilita completar manualmente.
    let data = {};
    let failed = false;
    try {
      const endpoint = 'https://api.microlink.io?data.price=true&url=' + encodeURIComponent(url);
      const response = await fetch(endpoint, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Metadata unavailable');
      const payload = await response.json();
      if (payload.status !== 'success') throw new Error('Metadata unavailable');
      data = payload.data || {};
    } catch (_) {
      if (controller.signal.aborted) return;
      failed = true;
    }
    if (epoch !== requestEpoch || currentEventId !== String(context.id)) return;
    metadataRequest = null;
    analyze.disabled = false;
    analyze.firstChild.textContent = 'Analizar de nuevo ';
    let shop = '';
    try { shop = new URL(url).hostname.replace(/^www\./, ''); } catch (_) {}
    const image = safeUrl(typeof data.image === 'string' ? data.image : data.image?.url);
    const price = data.price && typeof data.price === 'object'
      ? [data.price.currency, data.price.value ?? data.price.amount].filter((v) => v != null && v !== '').join(' ')
      : typeof data.price === 'string' ? data.price : '';
    extracted = {
      name: String(data.title || '').trim().slice(0, 110),
      image,
      shop: String(data.publisher || shop).slice(0, 65),
      price: String(price).slice(0, 40),
      description: String(data.description || '').trim().slice(0, 350)
    };
    details.hidden = false;
    status.textContent = failed
      ? 'No pudimos leer los datos de esta tienda. Puedes completarlos manualmente.'
      : 'Encontramos información del enlace. Completa únicamente los datos pendientes.';
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
  form.addEventListener('submit', (event) => {
    event.preventDefault();
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
    draftsByEvent.set(currentEventId, [{ ...item, id: crypto.randomUUID(), url }, ...(draftsByEvent.get(currentEventId) || [])]);
    form.reset();
    resetAnalysis();
    renderCards(root);
  });
  renderCards(root);
  return true;
}
export function destroyWishlist() {
  const root = document.querySelector(rootSelector);
  requestEpoch++;
  metadataRequest?.abort();
  metadataRequest = null;
  if (root) root.replaceChildren();
  currentEventId = '';
}
