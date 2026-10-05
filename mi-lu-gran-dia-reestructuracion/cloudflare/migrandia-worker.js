const APP_ALLOWED_ORIGINS = new Set([
  "https://migrandiapp.com",
  "https://www.migrandiapp.com",
  "https://avaldiviezoch.github.io",
]);

const RSVP_ALLOWED_ORIGINS = APP_ALLOWED_ORIGINS;

const API_PATHS = new Set([
  "/api/link-preview",
  "/api/image-proxy",
  "/api/music-preview",
]);

const MAX_TARGET_URL_LENGTH = 2048;
const MAX_HTML_BYTES = 1_500_000;
const MAX_IMAGE_BYTES = 6_000_000;
const MAX_JSON_BYTES = 1_000_000;
const UPSTREAM_TIMEOUT_MS = 8_000;

function appCorsHeaders(origin = "") {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
  if (APP_ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function withAppCors(response, origin = "") {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(appCorsHeaders(origin))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function hostMatches(host, domain) {
  const normalized = String(host || "").toLowerCase();
  const target = String(domain || "").toLowerCase();
  return normalized === target || normalized.endsWith("." + target);
}

function clientIp(request) {
  return cleanSecurityValue(request.headers.get("CF-Connecting-IP"), 80) || "unknown";
}

async function applyApiGuards(request, env, pathname) {
  const origin = requestOrigin(request);
  if (origin && !APP_ALLOWED_ORIGINS.has(origin)) {
    return withAppCors(
      json({ ok: false, error: "Origen no permitido." }, 403),
      origin
    );
  }

  if (env.API_RATE_LIMIT?.limit) {
    const key = `api:${pathname}:${clientIp(request)}`;
    const { success } = await env.API_RATE_LIMIT.limit({ key });
    if (!success) {
      return withAppCors(
        json({ ok: false, error: "Demasiadas solicitudes. Inténtalo nuevamente en un momento." }, 429),
        origin
      );
    }
  }

  return null;
}

async function fetchWithTimeout(resource, options = {}, timeoutMs = UPSTREAM_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readBytesLimited(response, maxBytes) {
  const declared = Number(response.headers.get("Content-Length") || 0);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error("upstream-too-large");
  }
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("size-limit");
        throw new Error("upstream-too-large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function readTextLimited(response, maxBytes = MAX_HTML_BYTES) {
  const bytes = await readBytesLimited(response, maxBytes);
  return new TextDecoder("utf-8").decode(bytes);
}

async function readJsonLimited(response, maxBytes = MAX_JSON_BYTES) {
  const text = await readTextLimited(response, maxBytes);
  return JSON.parse(text);
}

function securityJson(data, status = 200, origin = "") {
  const headers = {
    "Content-Type": "application/json; charset=UTF-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };

  if (RSVP_ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return new Response(JSON.stringify(data), { status, headers });
}

function cleanSecurityValue(value = "", max = 256) {
  return String(value || "").trim().slice(0, max);
}

function requestOrigin(request) {
  return cleanSecurityValue(request.headers.get("Origin"), 300);
}

function rsvpOriginAllowed(request) {
  const origin = requestOrigin(request);
  return origin && RSVP_ALLOWED_ORIGINS.has(origin);
}

async function verifyTurnstile(turnstileToken, request, env) {
  const secret = cleanSecurityValue(env.TURNSTILE_SECRET_KEY, 256);
  if (!secret) {
    return { ok: false, status: 503, reason: "turnstile-not-configured" };
  }

  const remoteip = cleanSecurityValue(request.headers.get("CF-Connecting-IP"), 80);
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", turnstileToken);
  if (remoteip) body.set("remoteip", remoteip);

  const response = await fetchWithTimeout("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });

  if (!response.ok) {
    return { ok: false, status: 502, reason: "turnstile-upstream" };
  }

  const result = await readJsonLimited(response);
  if (!result?.success) {
    return {
      ok: false,
      status: 403,
      reason: "turnstile-rejected",
      codes: Array.isArray(result?.["error-codes"]) ? result["error-codes"].slice(0, 5) : [],
    };
  }

  if (result.action && result.action !== "rsvp_submit") {
    return { ok: false, status: 403, reason: "turnstile-action-mismatch" };
  }

  return { ok: true, hostname: cleanSecurityValue(result.hostname, 200) };
}

async function rsvpVerify(request, env) {
  const origin = requestOrigin(request);

  if (!rsvpOriginAllowed(request)) {
    return securityJson({ ok: false, error: "Origen no permitido." }, 403, origin);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return securityJson({ ok: false, error: "Solicitud inválida." }, 400, origin);
  }

  const turnstileToken = cleanSecurityValue(payload?.turnstileToken, 4096);
  const rsvpToken = cleanSecurityValue(payload?.rsvpToken, 180);
  const responseId = cleanSecurityValue(payload?.responseId, 180);
  const honeypot = cleanSecurityValue(payload?.website, 200);
  const elapsedMs = Number(payload?.elapsedMs || 0);

  if (!turnstileToken || !rsvpToken || !responseId) {
    return securityJson({ ok: false, error: "Faltan datos de verificación." }, 400, origin);
  }

  if (honeypot) {
    return securityJson({ ok: false, error: "Solicitud rechazada." }, 403, origin);
  }

  if (!Number.isFinite(elapsedMs) || elapsedMs < 1200 || elapsedMs > 3600000) {
    return securityJson({ ok: false, error: "Verificación de interacción inválida." }, 403, origin);
  }

  if (env.RSVP_RATE_LIMIT?.limit) {
    const key = `rsvp:${rsvpToken}:${responseId}`;
    const { success } = await env.RSVP_RATE_LIMIT.limit({ key });
    if (!success) {
      return securityJson({ ok: false, error: "Demasiados intentos. Espera un momento." }, 429, origin);
    }
  }

  const turnstile = await verifyTurnstile(turnstileToken, request, env);
  if (!turnstile.ok) {
    return securityJson(
      { ok: false, error: "No pudimos verificar que seas una persona.", reason: turnstile.reason },
      turnstile.status,
      origin
    );
  }

  return securityJson({ ok: true }, 200, origin);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": status >= 200 && status < 300
        ? "public, max-age=3600"
        : "no-store",
    },
  });
}

function decodeHtml(value = "") {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/g, "/");
}

function meta(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1].trim());
    }
  }

  return "";
}

function normalizedHttpUrl(value = "") {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.href;
  } catch {
    return "";
  }
}

/* =========================================================
   PINTEREST
   ========================================================= */

function isPinterestPage(value) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    const host = url.hostname.toLowerCase();

    return (
      host === "pin.it" ||
      host === "pinterest.com" ||
      host.endsWith(".pinterest.com")
    );
  } catch {
    return false;
  }
}

function isPinterestImage(value) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return false;
    }

    const host = url.hostname.toLowerCase();

    return (
      host === "pinimg.com" ||
      host.endsWith(".pinimg.com")
    );
  } catch {
    return false;
  }
}

async function pinterestPreview(target) {
  if (!isPinterestPage(target)) {
    return json(
      {
        ok: false,
        error: "URL de Pinterest no permitida.",
      },
      400
    );
  }

  try {
    const response = await fetchWithTimeout(target, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MigrandiaPreview/1.0)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-PE,es;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      return json(
        {
          ok: false,
          error: `Pinterest respondió ${response.status}.`,
        },
        502
      );
    }

    const finalUrl = response.url;

    if (!isPinterestPage(finalUrl)) {
      return json(
        {
          ok: false,
          error: "El enlace redirigió fuera de Pinterest.",
        },
        400
      );
    }

    const html = await readTextLimited(response);

    const image =
      meta(html, "og:image") ||
      meta(html, "twitter:image");

    const title =
      meta(html, "og:title") ||
      meta(html, "twitter:title");

    const description =
      meta(html, "og:description") ||
      meta(html, "description");

    if (!image) {
      return json(
        {
          ok: false,
          error: "Pinterest no entregó una miniatura.",
          finalUrl,
        },
        404
      );
    }

    return json({
      ok: true,
      provider: "pinterest",
      originalUrl: target,
      finalUrl,
      image,
      title,
      description,
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: "No se pudo resolver Pinterest.",
      },
      500
    );
  }
}

async function pinterestImageProxy(target) {
  if (!isPinterestImage(target)) {
    return json(
      {
        ok: false,
        error: "Imagen de Pinterest no permitida.",
      },
      400
    );
  }

  try {
    const response = await fetchWithTimeout(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MigrandiaPreview/1.0)",
        Accept:
          "image/avif,image/webp,image/*,*/*;q=0.8",
        Referer: "https://www.pinterest.com/",
      },
    });

    if (!response.ok) {
      return json(
        {
          ok: false,
          error: `La imagen respondió ${response.status}.`,
        },
        502
      );
    }

    const finalImageUrl = response.url;
    if (!isPinterestImage(finalImageUrl)) {
      return json(
        {
          ok: false,
          error: "La imagen de Pinterest redirigió a un dominio no permitido.",
        },
        400
      );
    }

    const contentType =
      response.headers.get("Content-Type") || "";

    if (!contentType.startsWith("image/")) {
      return json(
        {
          ok: false,
          error: "Pinterest no devolvió una imagen.",
        },
        502
      );
    }

    const imageBytes = await readBytesLimited(response, MAX_IMAGE_BYTES);
    return new Response(imageBytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: "No se pudo cargar la imagen.",
      },
      500
    );
  }
}

/* =========================================================
   TEMU
   ========================================================= */

function isTemuPage(value) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    const host = url.hostname.toLowerCase();

    return (
      host === "temu.com" ||
      host === "www.temu.com" ||
      host === "share.temu.com" ||
      host.endsWith(".temu.com")
    );
  } catch {
    return false;
  }
}

function isTemuImage(value) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return false;
    }

    const host = url.hostname.toLowerCase();

    return (
      host === "kwcdn.com" ||
      host.endsWith(".kwcdn.com") ||
      host === "temu.com" ||
      host.endsWith(".temu.com")
    );
  } catch {
    return false;
  }
}

function temuImageFromUrl(value = "") {
  try {
    const url = new URL(value);
    const candidates = [
      "top_gallery_url",
      "thumb_url",
      "_web_cover",
    ];

    for (const key of candidates) {
      const candidate = normalizedHttpUrl(
        url.searchParams.get(key)
      );

      if (candidate && isTemuImage(candidate)) {
        return candidate;
      }
    }
  } catch {}

  return "";
}

function normalizeTemuEmbeddedUrl(value = "") {
  return decodeHtml(String(value || ""))
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"')
    .trim();
}

function temuJsonLd(html = "") {
  const scripts = [
    ...String(html).matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];

  const visit = (value) => {
    if (!value) return null;

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = visit(item);
        if (found) return found;
      }
      return null;
    }

    if (typeof value !== "object") return null;

    const type = String(value["@type"] || "").toLowerCase();

    if (
      type === "product" ||
      value.image ||
      value.name
    ) {
      const rawImage = Array.isArray(value.image)
        ? value.image[0]
        : typeof value.image === "object"
          ? value.image?.url || value.image?.contentUrl
          : value.image;

      const image = normalizedHttpUrl(rawImage);

      if (image && isTemuImage(image)) {
        return {
          image,
          title: String(value.name || "").trim(),
          description: String(value.description || "").trim(),
        };
      }
    }

    for (const child of Object.values(value)) {
      const found = visit(child);
      if (found) return found;
    }

    return null;
  };

  for (const match of scripts) {
    try {
      const value = JSON.parse(
        decodeHtml(match[1].trim())
      );
      const found = visit(value);
      if (found) return found;
    } catch {}
  }

  return null;
}

function temuImageFromHtml(html = "") {
  const source = normalizeTemuEmbeddedUrl(html);

  const matches = source.match(
    /https:\/\/[a-z0-9.-]*kwcdn\.com\/[^\s"'<>\\]+/gi
  );

  if (!matches?.length) {
    return "";
  }

  for (const raw of matches) {
    const candidate = normalizedHttpUrl(
      raw.replace(/[),.;]+$/g, "")
    );

    if (candidate && isTemuImage(candidate)) {
      return candidate;
    }
  }

  return "";
}

async function temuPreview(target) {
  if (!isTemuPage(target)) {
    return json(
      {
        ok: false,
        error: "URL de Temu no permitida.",
      },
      400
    );
  }

  try {
    const response = await fetchWithTimeout(target, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language":
          "es-PE,es;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      return json(
        {
          ok: false,
          error: `Temu respondió ${response.status}.`,
        },
        502
      );
    }

    const finalUrl = response.url;

    if (!isTemuPage(finalUrl)) {
      return json(
        {
          ok: false,
          error: "El enlace redirigió fuera de Temu.",
          finalUrl,
        },
        400
      );
    }

    const html = await readTextLimited(response);

    const directImage =
      temuImageFromUrl(finalUrl) ||
      temuImageFromUrl(target);

    const jsonLd = temuJsonLd(html);

    const metaImage =
      normalizedHttpUrl(meta(html, "og:image")) ||
      normalizedHttpUrl(meta(html, "twitter:image"));

    const image =
      (directImage && isTemuImage(directImage)
        ? directImage
        : "") ||
      (jsonLd?.image && isTemuImage(jsonLd.image)
        ? jsonLd.image
        : "") ||
      (metaImage && isTemuImage(metaImage)
        ? metaImage
        : "") ||
      temuImageFromHtml(html);

    const title =
      meta(html, "og:title") ||
      meta(html, "twitter:title") ||
      jsonLd?.title ||
      "";

    const description =
      meta(html, "og:description") ||
      meta(html, "description") ||
      jsonLd?.description ||
      "";

    if (!image) {
      return json(
        {
          ok: false,
          provider: "temu",
          error:
            "Temu resolvió el enlace, pero no entregó una miniatura utilizable.",
          originalUrl: target,
          finalUrl,
          title,
          description,
        },
        404
      );
    }

    return json({
      ok: true,
      provider: "temu",
      originalUrl: target,
      finalUrl,
      image,
      title,
      description,
    });
  } catch (error) {
    return json(
      {
        ok: false,
        provider: "temu",
        error: "No se pudo resolver el enlace de Temu.",
      },
      500
    );
  }
}

async function temuImageProxy(target) {
  if (!isTemuImage(target)) {
    return json(
      {
        ok: false,
        error: "Imagen de Temu no permitida.",
      },
      400
    );
  }

  try {
    const response = await fetchWithTimeout(target, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MigrandiaPreview/1.0)",
        Accept:
          "image/avif,image/webp,image/*,*/*;q=0.8",
        Referer: "https://www.temu.com/",
      },
    });

    if (!response.ok) {
      return json(
        {
          ok: false,
          error: `La imagen de Temu respondió ${response.status}.`,
        },
        502
      );
    }

    const finalImageUrl = response.url;

    if (!isTemuImage(finalImageUrl)) {
      return json(
        {
          ok: false,
          error:
            "La imagen de Temu redirigió a un dominio no permitido.",
        },
        400
      );
    }

    const contentType =
      response.headers.get("Content-Type") || "";

    if (!contentType.startsWith("image/")) {
      return json(
        {
          ok: false,
          error: "Temu no devolvió una imagen.",
        },
        502
      );
    }

    const imageBytes = await readBytesLimited(response, MAX_IMAGE_BYTES);
    return new Response(imageBytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: "No se pudo cargar la imagen de Temu.",
      },
      500
    );
  }
}

/* =========================================================
   LINK PREVIEW GENÉRICO
   ========================================================= */

async function linkPreview(target) {
  if (isPinterestPage(target)) {
    return pinterestPreview(target);
  }

  if (isTemuPage(target)) {
    return temuPreview(target);
  }

  return json(
    {
      ok: false,
      error:
        "La URL no corresponde a un proveedor compatible.",
      providers: ["pinterest", "temu"],
    },
    400
  );
}

async function imageProxy(target) {
  if (isPinterestImage(target)) {
    return pinterestImageProxy(target);
  }

  if (isTemuImage(target)) {
    return temuImageProxy(target);
  }

  return json(
    {
      ok: false,
      error: "Dominio de imagen no permitido.",
    },
    400
  );
}

/* =========================================================
   MÚSICA
   ========================================================= */

function isYouTubeHost(host) {
  return hostMatches(host, "youtube.com") || String(host || "").toLowerCase() === "youtu.be";
}

function isSpotifyHost(host) {
  return hostMatches(host, "spotify.com");
}

function isAppleMusicHost(host) {
  return hostMatches(host, "music.apple.com");
}

function isMusicUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    return isYouTubeHost(host) || isSpotifyHost(host) || isAppleMusicHost(host);
  } catch {
    return false;
  }
}

function musicPlatform(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (isYouTubeHost(host)) return "youtube";
    if (isSpotifyHost(host)) return "spotify";
    if (isAppleMusicHost(host)) return "apple";
  } catch {}
  return "";
}

function musicType(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (isYouTubeHost(host)) {
      if (url.searchParams.get("list")) return "playlist";
      if (url.searchParams.get("v") || host === "youtu.be") return "track";
    }

    if (isSpotifyHost(host)) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "playlist") return "playlist";
      if (parts[0] === "album") return "album";
      if (parts[0] === "track") return "track";
    }

    if (isAppleMusicHost(host)) {
      if (url.pathname.includes("/playlist/")) return "playlist";
      if (url.pathname.includes("/album/")) return "album";
      if (url.pathname.includes("/song/")) return "track";
    }
  } catch {}

  return "unknown";
}

/* =========================================================
   YOUTUBE — PLAYLIST REAL
   ========================================================= */

function youtubePlaylistId(value) {
  try {
    const url = new URL(value);
    return url.searchParams.get("list") || "";
  } catch {
    return "";
  }
}

async function youtubePlaylistPreview(target, apiKey) {
  const playlistId = youtubePlaylistId(target);

  if (!playlistId) {
    return null;
  }

  if (!apiKey) {
    return {
      ok: false,
      error:
        "No se pudo consultar YouTube en este momento.",
      provider: "youtube",
      type: "playlist",
    };
  }

  const apiUrl =
    "https://www.googleapis.com/youtube/v3/playlists" +
    "?part=snippet" +
    "&id=" +
    encodeURIComponent(playlistId) +
    "&key=" +
    encodeURIComponent(apiKey);

  const response = await fetchWithTimeout(apiUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return {
      ok: false,
      error: "No se pudo consultar YouTube en este momento.",
      provider: "youtube",
      type: "playlist",
    };
  }

  const data = await readJsonLimited(response);
  const playlist = data?.items?.[0];

  if (!playlist) {
    return {
      ok: false,
      error:
        "YouTube no encontró la playlist indicada.",
      provider: "youtube",
      type: "playlist",
    };
  }

  const snippet = playlist.snippet || {};
  const thumbnails = snippet.thumbnails || {};

  const image =
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    "";

  return {
    ok: true,
    provider: "youtube",
    type: "playlist",
    originalUrl: target,
    playlistId,
    title: snippet.title || "",
    description: snippet.description || "",
    image,
  };
}

/* =========================================================
   MÚSICA — PREVIEW
   ========================================================= */

async function musicPreview(target, env) {
  if (!isMusicUrl(target)) {
    return json(
      {
        ok: false,
        error:
          "La URL no corresponde a Spotify, YouTube Music o Apple Music.",
      },
      400
    );
  }

  const provider = musicPlatform(target);
  const type = musicType(target);

  try {
    // YouTube / YouTube Music — playlist
    if (
      provider === "youtube" &&
      type === "playlist"
    ) {
      const result =
        await youtubePlaylistPreview(
          target,
          env.YOUTUBE_API_KEY
        );

      if (result?.ok) {
        return json(result);
      }

      try {
        const response = await fetchWithTimeout(target, {
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; MigrandiaMusic/1.0)",
            Accept:
              "text/html,application/xhtml+xml",
            "Accept-Language":
              "es-PE,es;q=0.9,en;q=0.8",
          },
        });

        if (response.ok) {
          if (!isMusicUrl(response.url) || musicPlatform(response.url) !== "youtube") {
            return json({ ok: false, error: "YouTube redirigió a un dominio no permitido." }, 400);
          }
          const html = await readTextLimited(response);

          const image =
            meta(html, "og:image") ||
            meta(html, "twitter:image");

          const title =
            meta(html, "og:title") ||
            meta(html, "twitter:title");

          if (image) {
            return json({
              ok: true,
              provider: "youtube",
              type: "playlist",
              originalUrl: target,
              finalUrl: response.url,
              title,
              image,
              source: "youtube-page-fallback",
            });
          }
        }
      } catch {}

      return json(
        result || {
          ok: false,
          error:
            "No se pudo obtener la portada de la playlist.",
          provider: "youtube",
          type: "playlist",
        },
        404
      );
    }

    // YouTube / YouTube Music — video
    if (
      provider === "youtube" &&
      type === "track"
    ) {
      try {
        const response = await fetchWithTimeout(target, {
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; MigrandiaMusic/1.0)",
            Accept:
              "text/html,application/xhtml+xml",
            "Accept-Language":
              "es-PE,es;q=0.9,en;q=0.8",
          },
        });

        if (response.ok) {
          if (!isMusicUrl(response.url) || musicPlatform(response.url) !== "youtube") {
            return json({ ok: false, error: "YouTube redirigió a un dominio no permitido." }, 400);
          }
          const html = await readTextLimited(response);

          const image =
            meta(html, "og:image") ||
            meta(html, "twitter:image");

          const title =
            meta(html, "og:title") ||
            meta(html, "twitter:title");

          if (image) {
            return json({
              ok: true,
              provider: "youtube",
              type: "track",
              originalUrl: target,
              finalUrl: response.url,
              title,
              image,
            });
          }
        }
      } catch {}

      try {
        const url = new URL(target);

        let videoId =
          url.searchParams.get("v");

        if (
          !videoId &&
          url.hostname.toLowerCase() ===
            "youtu.be"
        ) {
          videoId =
            url.pathname
              .split("/")
              .filter(Boolean)[0];
        }

        if (videoId) {
          return json({
            ok: true,
            provider: "youtube",
            type: "track",
            originalUrl: target,
            title: "",
            image:
              `https://i.ytimg.com/vi/${encodeURIComponent(
                videoId
              )}/hqdefault.jpg`,
          });
        }
      } catch {}
    }

    // Spotify
    if (provider === "spotify") {
      const response = await fetchWithTimeout(
        "https://open.spotify.com/oembed?url=" +
          encodeURIComponent(target)
      );

      if (response.ok) {
        const data = await readJsonLimited(response);

        return json({
          ok: true,
          provider: "spotify",
          type,
          originalUrl: target,
          title: data.title || "",
          image: data.thumbnail_url || "",
          author: data.author_name || "",
        });
      }
    }

    // Apple Music
    if (provider === "apple") {
      const response = await fetchWithTimeout(target, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; MigrandiaMusic/1.0)",
          Accept:
            "text/html,application/xhtml+xml",
          "Accept-Language":
            "es-PE,es;q=0.9,en;q=0.8",
        },
      });

      if (response.ok) {
        if (!isMusicUrl(response.url) || musicPlatform(response.url) !== "apple") {
          return json({ ok: false, error: "Apple Music redirigió a un dominio no permitido." }, 400);
        }
        const html = await readTextLimited(response);

        const image =
          meta(html, "og:image") ||
          meta(html, "twitter:image");

        const title =
          meta(html, "og:title") ||
          meta(html, "twitter:title");

        if (image) {
          return json({
            ok: true,
            provider: "apple",
            type,
            originalUrl: target,
            finalUrl: response.url,
            title,
            image,
          });
        }
      }
    }

    return json(
      {
        ok: false,
        error:
          "No se pudieron obtener los datos de la música.",
        provider,
        type,
      },
      404
    );
  } catch (error) {
    return json(
      {
        ok: false,
        error: "No se pudo resolver la referencia musical.",
        provider,
        type,
      },
      500
    );
  }
}

/* =========================================================
   WORKER
   ========================================================= */

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const pathname = requestUrl.pathname;
    const origin = requestOrigin(request);

    if (request.method === "OPTIONS") {
      if (pathname === "/api/rsvp/verify") {
        if (!RSVP_ALLOWED_ORIGINS.has(origin)) {
          return new Response(null, { status: 403 });
        }
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Cache-Control": "no-store",
            "Vary": "Origin",
          },
        });
      }

      if (API_PATHS.has(pathname)) {
        if (!APP_ALLOWED_ORIGINS.has(origin)) {
          return new Response(null, { status: 403 });
        }
        return new Response(null, { headers: appCorsHeaders(origin) });
      }

      return new Response(null, { status: 404 });
    }

    if (pathname === "/api/rsvp/verify") {
      if (request.method !== "POST") {
        return securityJson({ ok: false, error: "Método no permitido." }, 405, origin);
      }
      return rsvpVerify(request, env);
    }

    if (pathname === "/" || pathname === "/health") {
      if (request.method !== "GET") {
        return json({ ok: false, error: "Método no permitido." }, 405);
      }
      return withAppCors(
        json({
          ok: true,
          service: "Migrandia API",
          providers: {
            linkPreview: ["pinterest", "temu"],
            music: ["youtube", "spotify", "apple"],
          },
        }),
        origin
      );
    }

    if (!API_PATHS.has(pathname)) {
      return withAppCors(
        json({ ok: false, error: "Ruta no encontrada." }, 404),
        origin
      );
    }

    if (request.method !== "GET") {
      return withAppCors(
        json({ ok: false, error: "Método no permitido." }, 405),
        origin
      );
    }

    const guardResponse = await applyApiGuards(request, env, pathname);
    if (guardResponse) return guardResponse;

    const target = requestUrl.searchParams.get("url") || "";
    if (!target) {
      return withAppCors(
        json({ ok: false, error: "Falta el parámetro url." }, 400),
        origin
      );
    }

    if (target.length > MAX_TARGET_URL_LENGTH) {
      return withAppCors(
        json({ ok: false, error: "La URL excede el tamaño permitido." }, 400),
        origin
      );
    }

    let response;
    if (pathname === "/api/link-preview") {
      response = await linkPreview(target);
    } else if (pathname === "/api/image-proxy") {
      response = await imageProxy(target);
    } else {
      response = await musicPreview(target, env);
    }

    return withAppCors(response, origin);
  },
};
