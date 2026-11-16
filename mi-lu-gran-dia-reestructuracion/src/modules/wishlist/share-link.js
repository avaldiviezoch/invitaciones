// Portable Wishlist snapshots: no wedding ID, auth, or private planner data in public URLs.
const MAX_SHARE_LENGTH = 32000;
const fields = ['name', 'image', 'shop', 'price', 'description', 'url'];
function safeLink(value) {
  try {
    const u = new URL(String(value || ''));
    return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : '';
  } catch { return ''; }
}
function giftData(items) {
  return (Array.isArray(items) ? items : []).slice(0, 100).map(item => ({
    name: String(item?.name || '').slice(0, 110),
    image: safeLink(item?.image),
    shop: String(item?.shop || '').slice(0, 65),
    price: String(item?.price || '').slice(0, 40),
    description: String(item?.description || '').slice(0, 350),
    url: safeLink(item?.url)
  })).filter(item => item.name && item.url);
}
function toBase64(bytes) {
  let result = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    result += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(result).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(decoded, char => char.charCodeAt(0));
}
async function compress(bytes) {
  if (typeof CompressionStream === 'undefined') return { bytes, prefix: 'u' };
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  return { bytes: new Uint8Array(await new Response(stream).arrayBuffer()), prefix: 'g' };
}
async function decompress(bytes) {
  if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no puede abrir el enlace comprimido.');
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
export async function encodeWishlistShare(items, eventName) {
  const gifts = giftData(items);
  if (!gifts.length) throw new Error('Agrega al menos un regalo para compartir tu lista.');
  if (Array.isArray(items) && items.length > gifts.length) throw new Error('No se pueden compartir todos los regalos. Revisa los enlaces.');
  const payload = { v: 1, event: String(eventName || 'Nuestra celebración').slice(0, 100), gifts };
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  const result = await compress(raw);
  const fragment = result.prefix + toBase64(result.bytes);
  if (fragment.length > MAX_SHARE_LENGTH) throw new Error('La lista supera el tamaño admitido para compartir como enlace. Se necesita publicación pública con identificador corto.');
  return fragment;
}
export async function decodeWishlistShare(fragment) {
  if (typeof fragment !== 'string' || fragment.length > MAX_SHARE_LENGTH + 2 || fragment.length < 4) throw new Error('Este enlace no contiene una lista válida.');
  const mode = fragment[0];
  if (!['g', 'u'].includes(mode) || !/^[A-Za-z0-9_-]+$/.test(fragment.slice(1))) throw new Error('Formato de enlace no válido.');
  let bytes = fromBase64(fragment.slice(1));
  if (mode === 'g') bytes = await decompress(bytes);
  if (bytes.length > 180000) throw new Error('La lista supera el tamaño permitido.');
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (data?.v !== 1 || !Array.isArray(data.gifts) || data.gifts.length > 100) throw new Error('Versión de lista no compatible.');
  return { event: String(data.event || 'Nuestra celebración').slice(0, 100), gifts: giftData(data.gifts) };
}
