// Prototipo visual de Wishlist. No escribe en Firebase ni en almacenamiento local.
const draftsByEvent = new Map();
let currentEventId = '';
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
function renderCards(root) {
  const container = root.querySelector('[data-wishlist-items]');
  const counter = root.querySelector('[data-wishlist-count]');
  if (!container || !counter) return;
  const items = draftsByEvent.get(currentEventId) || [];
  container.replaceChildren();
  counter.textContent = items.length + (items.length === 1 ? ' regalo de prueba' : ' regalos de prueba');
  if (!items.length) {
    const empty = element('div', 'wishlist-empty');
    empty.append(element('span', 'wishlist-empty-icon', '♡'), element('h3', '', 'Tu lista empieza aquí'), element('p', '', 'Pega el enlace de un regalo y completa sus datos para ver cómo quedaría la lista.'));
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
      img.onerror = () => { img.remove(); media.append(element('span', 'wishlist-image-fallback', '🎁')); };
      media.append(img);
    } else media.append(element('span', 'wishlist-image-fallback', '🎁'));
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
          <div class="wishlist-panel-top"><span>01 / AGREGAR</span><h2 id="wishlist-form-title">Nuevo regalo</h2><p>Pega el enlace de cualquier tienda y completa la información por ahora.</p></div>
          <form data-wishlist-form>
            <label>Enlace del producto <input type="url" name="url" placeholder="https://tienda.com/producto" required></label>
            <div class="wishlist-two-col"><label>Nombre del regalo <input name="name" maxlength="110" placeholder="Ej. Freidora de aire" required></label><label>Tienda <input name="shop" maxlength="65" placeholder="Ej. Falabella"></label></div>
            <div class="wishlist-two-col"><label>Precio referencial <input name="price" maxlength="40" placeholder="Ej. S/ 299.00"></label><label>URL de la fotografía <input type="url" name="image" placeholder="https://.../foto.jpg"></label></div>
            <label>Descripción <textarea name="description" maxlength="350" rows="3" placeholder="Color, modelo, tamaño o cualquier detalle importante"></textarea></label>
            <button type="submit" class="wishlist-submit">Agregar a mi lista <span>＋</span></button>
            <p class="wishlist-help">La lectura automática de fotografías y precios desde el enlace se incorporará en la siguiente etapa.</p>
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
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const url = safeUrl(data.get('url'));
    const image = String(data.get('image') || '').trim();
    const photo = image ? safeUrl(image) : '';
    const error = root.querySelector('[data-wishlist-error]');
    if (!url || (image && !photo)) {
      error.textContent = 'Revisa los enlaces: deben comenzar con http:// o https://.';
      error.hidden = false;
      return;
    }
    error.hidden = true;
    const item = {
      id: crypto.randomUUID(), url, image: photo,
      name: String(data.get('name') || '').trim().slice(0, 110),
      shop: String(data.get('shop') || '').trim().slice(0, 65),
      price: String(data.get('price') || '').trim().slice(0, 40),
      description: String(data.get('description') || '').trim().slice(0, 350)
    };
    if (!item.name) return;
    draftsByEvent.set(currentEventId, [item, ...(draftsByEvent.get(currentEventId) || [])]);
    form.reset();
    renderCards(root);
  });
  renderCards(root);
  return true;
}
export function destroyWishlist() {
  const root = document.querySelector(rootSelector);
  if (root) root.replaceChildren();
  currentEventId = '';
}
