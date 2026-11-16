import { decodeWishlistShare } from './share-link.js?v=1';

const API_BASE = 'https://migrandia-wishlist-gifts-dev.avaldiviezoch.workers.dev';
const byId = (id) => document.getElementById(id);
const node = (tag, className = '', text = '') => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
};

async function listFingerprint(snapshot) {
  const bytes = new TextEncoder().encode(snapshot);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function applyPurchaseState(card, button, purchased) {
  card.classList.toggle('is-purchased', purchased);
  button.disabled = purchased;
  button.textContent = purchased ? '✓ Regalo comprado' : 'Marcar como comprado';
  button.setAttribute('aria-label', purchased ? 'Este regalo ya fue comprado' : 'Marcar regalo como comprado');
}

function renderCard(item, index, listId, apiReady) {
  const root = node('article', 'gift-card');
  const media = node('div', 'media');
  if (item.image) {
    const image = node('img');
    image.src = item.image;
    image.alt = item.name;
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => image.replaceWith(node('span', 'placeholder', '♡')), { once: true });
    media.append(image);
  } else media.append(node('span', 'placeholder', '♡'));

  const body = node('div', 'body');
  body.append(node('span', 'shop', item.shop || 'Tienda'), node('h3', '', item.name));
  if (item.description) body.append(node('div', 'description', item.description));
  if (item.price) body.append(node('strong', 'price', item.price));

  const actions = node('div', 'gift-actions');
  const link = node('a', 'link', 'Ir al regalo ↗');
  link.href = item.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  const purchased = node('button', 'purchase-button', 'Marcar como comprado');
  purchased.type = 'button';
  purchased.disabled = !apiReady;
  purchased.dataset.giftIndex = String(index);
  if (!apiReady) purchased.title = 'Comprobando disponibilidad de reservas';
  actions.append(link, purchased);
  body.append(actions);
  root.append(media, body);
  return { root, purchased, index, listId };
}

async function fetchStatus(listId) {
  const url = new URL('/api/status', API_BASE);
  url.searchParams.set('list', listId);
  const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || !payload.ok || !Array.isArray(payload.purchased)) {
    throw new Error('El estado de regalos no está disponible.');
  }
  return new Set(payload.purchased.map(Number));
}

async function markPurchased(listId, index) {
  const response = await fetch(new URL('/api/purchase', API_BASE), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ list: listId, index })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) throw new Error(payload.error || 'No se pudo registrar la compra.');
  return payload;
}

async function main() {
  const snapshot = location.hash.slice(1);
  const errorNode = byId('error');
  const notice = byId('purchaseNotice');
  try {
    const data = await decodeWishlistShare(snapshot);
    const listId = await listFingerprint(snapshot);
    byId('eventName').textContent = data.event;
    document.title = 'Regalos de ' + data.event + ' · Mi Gran Día';
    byId('count').textContent = data.gifts.length + (data.gifts.length === 1 ? ' regalo' : ' regalos');

    const views = data.gifts.map((gift, index) => renderCard(gift, index, listId, false));
    if (views.length) byId('cards').append(...views.map(view => view.root));
    else byId('cards').append(node('p', 'empty', 'Esta lista todavía no tiene regalos.'));

    let purchased = new Set();
    let apiReady = false;
    const refresh = async () => {
      const latest = await fetchStatus(listId);
      purchased = latest;
      apiReady = true;
      views.forEach(({ root, purchased: button, index }) => applyPurchaseState(root, button, purchased.has(index)));
      notice.textContent = '';
    };
    try {
      await refresh();
    } catch {
      notice.textContent = 'No se pudo conectar con el registro de compras. Los botones estarán disponibles cuando el servicio esté activo.';
    }
    for (const view of views) {
      const { root, purchased: button, index } = view;
      button.disabled = !apiReady || purchased.has(index);
      button.addEventListener('click', async () => {
        if (!apiReady || purchased.has(index)) return;
        if (!window.confirm('¿Confirmas que ya compraste este regalo? Se marcará como comprado para los demás invitados.')) return;
        button.disabled = true;
        button.textContent = 'Registrando compra…';
        try {
          const result = await markPurchased(listId, index);
          purchased.add(index);
          applyPurchaseState(root, button, true);
          notice.textContent = result.alreadyPurchased ? 'Este regalo ya había sido marcado como comprado.' : '¡Gracias! Tu compra se ha registrado.';
        } catch {
          button.disabled = false;
          button.textContent = 'Marcar como comprado';
          notice.textContent = 'No se pudo registrar. Inténtalo nuevamente.';
        }
      });
    }
    window.addEventListener('focus', () => { void refresh().catch(() => {}); });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void refresh().catch(() => {});
    });
  } catch (error) {
    errorNode.hidden = false;
    errorNode.textContent = error.message || 'No se pudo abrir esta lista.';
  }
}
void main();
