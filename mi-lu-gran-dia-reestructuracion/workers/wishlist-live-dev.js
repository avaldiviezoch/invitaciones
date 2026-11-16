/**
 * NEW isolated DEV Worker: migrandia-wishlist-live-dev
 * Cloudflare KV binding: WISHLIST_LIVE
 * Does NOT change Firebase Storage, Firestore rules, other Workers or collections.
 *
 * Authenticated publication checks Firebase ID token with Identity Toolkit and the
 * wedding membership document via Firestore REST under the user's credentials.
 * Public read/purchase needs only a shared list id, never a wedding id or login.
 * KV purchase writes are eventually consistent, not an atomic reservation system.
 */
const ORIGINS = new Set(['https://avaldiviezoch.github.io']);
const FIREBASE_PROJECT = 'migrandia';
const FIREBASE_WEB_KEY = 'AIzaSyDCRuQgMjnm7KcAN_qo8AHPD3ueyis4-LY'; // public Firebase browser API key
const HEX = /^[a-f0-9]{64}$/;
const GIFT_ID = /^[A-Za-z0-9_-]{1,100}$/;
const EDIT_ROLES = new Set(['owner', 'admin', 'editor']);
const SIZE_LIMIT = 62000;
const textEncoder = new TextEncoder();
function json(body, status, origin) {
  const headers = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' };
  if (ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept';
    headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, OPTIONS';
    headers['Access-Control-Max-Age'] = '600';
    headers.Vary = 'Origin';
  }
  return new Response(JSON.stringify(body), { status, headers });
}
function safeUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href.slice(0, 2048) : '';
  } catch { return ''; }
}
function giftsFrom(value) {
  if (!Array.isArray(value) || value.length > 100) throw new Error('Invalid gifts');
  const ids = new Set();
  return value.map(raw => {
    const id = String(raw?.id || '');
    if (!GIFT_ID.test(id) || ids.has(id)) throw new Error('Invalid gift id');
    ids.add(id);
    const item = {
      id, name:String(raw.name || '').slice(0,110),
      shop:String(raw.shop || '').slice(0,65), price:String(raw.price || '').slice(0,40),
      description:String(raw.description || '').slice(0,350),
      image:safeUrl(raw.image), url:safeUrl(raw.url)
    };
    if (!item.name.trim() || !item.url) throw new Error('Invalid gift');
    return item;
  });
}
async function publicId(weddingId) {
  const hash = await crypto.subtle.digest('SHA-256', textEncoder.encode('migrandia:wishlist:live:v1:' + weddingId));
  return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
async function authorize(request, weddingId) {
  const match = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(request.headers.get('Authorization') || '');
  if (!match || !weddingId || weddingId.length > 160 || !/^[A-Za-z0-9_-]+$/.test(weddingId)) return false;
  const idToken = match[1];
  // Identity Toolkit validates issuer, signature, revocation/expiry requirements
  // for current user ID token before any membership lookup.
  const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_WEB_KEY, {
    method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ idToken })
  });
  if (!response.ok) return false;
  const verified = await response.json();
  const uid = verified.users?.[0]?.localId;
  if (typeof uid !== 'string' || !uid || !/^[A-Za-z0-9:_-]+$/.test(uid)) return false;
  const path = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT +
    '/databases/(default)/documents/weddings/' + encodeURIComponent(weddingId) + '/members/' + encodeURIComponent(uid);
  const membershipResponse = await fetch(path, {
    headers: { Authorization:'Bearer ' + idToken, Accept:'application/json' }
  });
  if (!membershipResponse.ok) return false;
  const member = await membershipResponse.json();
  const role = member.fields?.role?.stringValue || '';
  const status = member.fields?.status?.stringValue || 'active';
  return EDIT_ROLES.has(role) && status === 'active';
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const path = new URL(request.url).pathname;
    if (path === '/health' && request.method === 'GET') return json({ ok:true, service:'Wishlist Live DEV', storageReady: Boolean(env.WISHLIST_LIVE) },200,origin);
    if (!ORIGINS.has(origin)) return json({ ok:false, error:'Origin not allowed' },403,origin);
    if (request.method === 'OPTIONS') return json({ ok:true },200,origin);
    if (!env.WISHLIST_LIVE) return json({ ok:false, error:'KV binding missing' },503,origin);
    const url = new URL(request.url);
    if (path === '/api/list' && request.method === 'GET') {
      const id = url.searchParams.get('list') || '';
      if (!HEX.test(id)) return json({ ok:false, error:'Invalid list id' },400,origin);
      let listing;
      try { listing = await env.WISHLIST_LIVE.get('list:' + id, 'json'); }
      catch { return json({ ok:false, error:'List temporarily unavailable' },503,origin); }
      if (!listing) return json({ ok:false, error:'List not published' },404,origin);
      const purchased = [];
      let cursor;
      try {
        do {
          const result = await env.WISHLIST_LIVE.list({ prefix:'p:' + id + ':', limit:1000, ...(cursor ? { cursor } : {}) });
          const ids = new Set(listing.gifts.map(g=>g.id));
          for (const key of result.keys) {
            const giftId = key.name.slice(('p:' + id + ':').length);
            if (ids.has(giftId)) purchased.push(giftId);
          }
          cursor = result.list_complete ? null : result.cursor;
        } while (cursor);
      } catch { return json({ ok:false, error:'Purchase state unavailable' },503,origin); }
      return json({ok:true,event:listing.event,gifts:listing.gifts,purchased:[...new Set(purchased)]},200,origin);
    }
    if (path === '/api/list' && request.method === 'PUT') {
      const headerSize = Number(request.headers.get('Content-Length') || 0);
      if (headerSize > SIZE_LIMIT) return json({ok:false,error:'List too large'},413,origin);
      let raw;
      try { raw = await request.text(); } catch { return json({ok:false,error:'Invalid payload'},400,origin); }
      if (raw.length > SIZE_LIMIT) return json({ok:false,error:'List too large'},413,origin);
      let body;
      try { body = JSON.parse(raw); } catch { return json({ok:false,error:'Invalid JSON'},400,origin); }
      const weddingId = String(body?.weddingId || '');
      const listId = String(body?.list || '');
      if (!HEX.test(listId) || !weddingId || listId !== await publicId(weddingId)) return json({ok:false,error:'Invalid list'},400,origin);
      let allowed = false;
      try { allowed = await authorize(request, weddingId); } catch { allowed = false; }
      if (!allowed) return json({ok:false,error:'Only authorized editors can publish'},403,origin);
      let gifts;
      try { gifts = giftsFrom(body.gifts); } catch { return json({ok:false,error:'Invalid gifts'},400,origin); }
      const value = {event:String(body.event || 'Nuestra celebración').slice(0,100),gifts};
      try { await env.WISHLIST_LIVE.put('list:' + listId, JSON.stringify(value)); }
      catch { return json({ok:false,error:'Unable to publish list'},503,origin); }
      return json({ok:true,count:gifts.length},200,origin);
    }
    if (path === '/api/purchase' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ok:false,error:'Invalid JSON'},400,origin); }
      const listId = String(body?.list || '');
      const giftId = String(body?.id || '');
      if (!HEX.test(listId) || !GIFT_ID.test(giftId)) return json({ok:false,error:'Invalid purchase'},400,origin);
      const current = await env.WISHLIST_LIVE.get('list:' + listId,'json');
      if (!current || !current.gifts.some(g => g.id === giftId)) return json({ok:false,error:'Gift not found'},404,origin);
      const key = 'p:' + listId + ':' + giftId;
      try {
        const previous = await env.WISHLIST_LIVE.get(key);
        if (previous !== null) return json({ok:true,alreadyPurchased:true},200,origin);
        await env.WISHLIST_LIVE.put(key, JSON.stringify({at:new Date().toISOString()}));
        return json({ok:true,alreadyPurchased:false},200,origin);
      } catch { return json({ok:false,error:'Unable to register purchase'},503,origin); }
    }
    return json({ok:false,error:'Not found'},404,origin);
  }
};
