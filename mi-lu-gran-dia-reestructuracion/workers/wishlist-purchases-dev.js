/**
 * Mi Gran Día — Wishlist guest purchase states (DEV only)
 *
 * Create a new isolated Cloudflare Worker named "migrandia-wishlist-gifts-dev".
 * Add a KV namespace binding named WISHLIST_PURCHASES.
 * No Firebase, no auth, no existing product metadata workers.
 *
 * Public shared list IDs are SHA-256 fingerprints of the share URL fragment.
 * Anyone with a shared link may irreversibly mark a gift bought; they cannot unmark it.
 * KV is eventually consistent; near-simultaneous purchases are not strongly serialized.
 */
const ALLOWED_ORIGINS = new Set(['https://avaldiviezoch.github.io']);
const HASH_RE = /^[a-f0-9]{64}$/;
function respond(body, status, origin, extra = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept';
    headers['Access-Control-Max-Age'] = '600';
  }
  return new Response(JSON.stringify(body), { status, headers });
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET') {
      return respond({ ok: true, service: 'Migrandia Wishlist Purchases DEV', storageReady: Boolean(env.WISHLIST_PURCHASES) }, 200, origin);
    }
    if (!ALLOWED_ORIGINS.has(origin)) return respond({ ok: false, error: 'Origin not allowed' }, 403, origin);
    if (request.method === 'OPTIONS') return respond({ ok: true }, 200, origin);
    if (!env.WISHLIST_PURCHASES) return respond({ ok: false, error: 'KV binding WISHLIST_PURCHASES missing' }, 503, origin);
    if (url.pathname === '/api/status' && request.method === 'GET') {
      const id = url.searchParams.get('list') || '';
      if (!HASH_RE.test(id)) return respond({ ok: false, error: 'Invalid list' }, 400, origin);
      try {
        const purchased = [];
        let cursor;
        do {
          const result = await env.WISHLIST_PURCHASES.list({ prefix: 'p:' + id + ':', limit: 1000, ...(cursor ? { cursor } : {}) });
          for (const record of result.keys) {
            const index = Number(record.name.split(':').pop());
            if (Number.isInteger(index) && index >= 0 && index < 100) purchased.push(index);
          }
          cursor = result.list_complete ? undefined : result.cursor;
        } while (cursor);
        return respond({ ok: true, purchased: [...new Set(purchased)].sort((a, b) => a - b) }, 200, origin);
      } catch {
        return respond({ ok: false, error: 'Unable to read purchases' }, 503, origin);
      }
    }
    if (url.pathname === '/api/purchase' && request.method === 'POST') {
      const size = Number(request.headers.get('Content-Length') || 0);
      if (size > 1024) return respond({ ok: false, error: 'Payload too large' }, 413, origin);
      let payload;
      try { payload = await request.json(); } catch { return respond({ ok: false, error: 'Invalid JSON' }, 400, origin); }
      const id = payload?.list;
      const index = payload?.index;
      if (typeof id !== 'string' || !HASH_RE.test(id) || !Number.isInteger(index) || index < 0 || index >= 100) {
        return respond({ ok: false, error: 'Invalid gift' }, 400, origin);
      }
      const key = 'p:' + id + ':' + index;
      try {
        const previous = await env.WISHLIST_PURCHASES.get(key);
        if (previous !== null) return respond({ ok: true, alreadyPurchased: true, purchased: true }, 200, origin);
        await env.WISHLIST_PURCHASES.put(key, JSON.stringify({ purchased: true, at: new Date().toISOString() }));
        return respond({ ok: true, alreadyPurchased: false, purchased: true }, 200, origin);
      } catch {
        return respond({ ok: false, error: 'Unable to save purchase' }, 503, origin);
      }
    }
    return respond({ ok: false, error: 'Not found' }, 404, origin);
  }
};
