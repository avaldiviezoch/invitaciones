import { loadRsvpAdminSnapshot } from '../../services/rsvp-admin.js?v=5';

let cleanup = null;

const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const clean = (value, max = 180) => String(value ?? '').trim().slice(0, max);

const normalize = (value) => clean(value, 260)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es')
  .replace(/\s+/g, ' ');

function resolveCover(song = {}) {
  return clean(
    song.coverUrl ||
    song.image ||
    song.imageUrl ||
    song.thumbnail ||
    song.thumbnailUrl ||
    song.artwork ||
    song.artworkUrl ||
    '',
    1000
  );
}

function requestEntries(snapshot) {
  return (snapshot?.musicResponses || []).flatMap((response) => {
    let value = response?.customData?.mgdMusic;
    if (typeof value === 'string') {
      try { value = JSON.parse(value); } catch { value = null; }
    }

    const songs = Array.isArray(value?.songs) ? value.songs : [];
    const person = clean(value?.guestName || response?.name, 120) || 'Invitado';
    const message = clean(value?.message, 500);

    return songs.map((song, index) => ({
      key: [
        String(response?.id || ''),
        index,
        normalize(song?.title),
        normalize(song?.artist)
      ].join('|'),
      person,
      title: clean(song?.title) || 'Canción sin título',
      artist: clean(song?.artist, 140) || 'Artista no indicado',
      message,
      coverUrl: resolveCover(song)
    }));
  });
}

function fallbackCover(title, artist) {
  const titleText = clean(title, 80);
  const artistText = clean(artist, 80);
  return '<div class="music-request-cover music-request-cover-fallback" aria-hidden="true">' +
    '<span class="music-request-cover-note">♫</span>' +
    '<span class="music-request-cover-title">' + esc(titleText) + '</span>' +
    '<small>' + esc(artistText) + '</small>' +
  '</div>';
}

function coverMarkup(item) {
  if (!item.coverUrl) return fallbackCover(item.title, item.artist);
  return '<div class="music-request-cover">' +
    '<img src="' + esc(item.coverUrl) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' +
  '</div>';
}

function render(requests, search = '') {
  const needle = normalize(search);
  const visible = requests.filter((item) => {
    if (!needle) return true;
    return normalize([item.title, item.artist, item.person, item.message].join(' ')).includes(needle);
  });

  const list = document.querySelector('[data-music-list]');
  if (!list) return;

  list.innerHTML = visible.length
    ? visible.map((item) =>
      '<article class="music-request-card">' +
        coverMarkup(item) +
        '<div class="music-request-body">' +
          '<span class="music-request-kicker">SOLICITUD DE INVITADO</span>' +
          '<h3>' + esc(item.title) + '</h3>' +
          '<p class="music-request-artist">' + esc(item.artist) + '</p>' +
          '<div class="music-request-meta">' +
            '<span><b>Invitado</b>' + esc(item.person) + '</span>' +
            (item.message
              ? '<span><b>Dedicatoria</b>' + esc(item.message) + '</span>'
              : '<span class="is-muted"><b>Dedicatoria</b>Sin dedicatoria</span>') +
          '</div>' +
        '</div>' +
      '</article>'
    ).join('')
    : '<div class="music-empty">' +
        '<span aria-hidden="true">♫</span>' +
        '<strong>' + (needle ? 'No encontramos coincidencias' : 'Aún no hay solicitudes musicales') + '</strong>' +
        '<p>' + (needle ? 'Prueba con otro nombre de canción, artista o invitado.' : 'Cuando tus invitados envíen canciones desde la invitación, aparecerán aquí.') + '</p>' +
      '</div>';

  document.querySelector('[data-music-kpi-guests]').textContent =
    String(new Set(requests.map((item) => item.person)).size);
  document.querySelector('[data-music-kpi-requests]').textContent = String(requests.length);
  document.querySelector('[data-music-total]').textContent = String(requests.length);
}

export async function mountMusica(context) {
  const root = document.querySelector('[data-module-view="musica"]');
  if (!root || !context?.id) return false;

  cleanup?.();

  const controller = new AbortController();
  const { signal } = controller;

  const response = await fetch('src/modules/musica/index.html?v=5', { cache: 'no-store' });
  if (!response.ok) throw new Error('No se pudo cargar la interfaz de Música.');
  root.innerHTML = await response.text();

  const state = root.querySelector('[data-music-state]');
  const search = root.querySelector('[data-music-search]');

  try {
    const snapshot = await loadRsvpAdminSnapshot(context);
    const requests = requestEntries(snapshot);

    render(requests);

    search?.addEventListener('input', (event) => {
      render(requests, event.target.value);
    }, { signal });

    state.textContent = requests.length
      ? 'Solicitudes cargadas desde la invitación.'
      : '';
  } catch (error) {
    state.textContent = error?.message || 'No se pudieron cargar las solicitudes musicales.';
    render([]);
  }

  cleanup = () => {
    controller.abort();
    cleanup = null;
  };

  return true;
}

export function destroyMusica() {
  cleanup?.();
  cleanup = null;
}
