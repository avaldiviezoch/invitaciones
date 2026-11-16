import { decodeWishlistShare } from './share-link.js?v=1';
const byId = (id) => document.getElementById(id);
function node(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text) item.textContent = text;
  return item;
}
function card(item) {
  const root = node('article');
  const media = node('div', 'media');
  if (item.image) {
    const image = node('img');
    image.src = item.image;
    image.alt = item.name;
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => image.replaceWith(node('span', 'placeholder', '♡')), { once: true });
    media.append(image);
  } else {
    media.append(node('span', 'placeholder', '♡'));
  }
  const body = node('div', 'body');
  body.append(node('span', 'shop', item.shop || 'Tienda'), node('h3', '', item.name));
  if (item.description) body.append(node('div', 'description', item.description));
  if (item.price) body.append(node('strong', 'price', item.price));
  const link = node('a', 'link', 'Ver en tienda');
  link.href = item.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  body.append(link);
  root.append(media, body);
  return root;
}
async function main() {
  const encoded = window.location.hash.slice(1);
  const errorNode = byId('error');
  try {
    const data = await decodeWishlistShare(encoded);
    byId('eventName').textContent = data.event;
    document.title = 'Regalos de ' + data.event + ' · Mi Gran Día';
    byId('count').textContent = data.gifts.length + (data.gifts.length === 1 ? ' regalo' : ' regalos');
    if (data.gifts.length) byId('cards').append(...data.gifts.map(card));
    else byId('cards').append(node('p', 'empty', 'Esta lista todavía no tiene regalos.'));
  } catch (error) {
    errorNode.hidden = false;
    errorNode.textContent = error.message || 'No se pudo abrir esta lista.';
  }
}
main();
